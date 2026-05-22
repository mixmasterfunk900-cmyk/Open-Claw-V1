#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildShortWordEvents, qaCaptionEvents, secondsFromStamp } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptPath = 'media/transcripts/SxOhgmSWqD4.json'
const logoPath = 'media/assets/logos/openclaw-logo-text.png'
const stamp = '20260513T2317Z'
const id = `day3-no-sleep-shipping-house-v3-${stamp}`
const start = '00:26:47.0'
const end = '00:27:17.0'
const title1 = 'SHIP LIVE'
const title2 = 'FIX LATER'
const context = 'MOMENTUM FIRST · POLISH AFTER PROOF'
const reviewDir = 'media/reviews'
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const bundleDir = `media/exports/clip_${id}`
const assPath = `media/transcripts/${id}.ass`
const out = `media/renders/${id}.mp4`
const readyName = 'short-ship-live-fix-later-house-v3.mp4'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const fontSans = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 180 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,') }
function filterPath(p) { return p.replace(/:/g, '\\:').replace(/'/g, "'\\''") }

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
await mkdir(path.join(root, bundleDir), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const startSec = secondsFromStamp(start)
const endSec = secondsFromStamp(end)
const duration = endSec - startSec
let events = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: endSec, minDuration: 0.18, maxDuration: 0.62, gap: 0.015 })
events = events.map((event) => ({ ...event, text: event.text.replace(/[^\p{L}\p{N}'-]/gu, '').toUpperCase() })).filter((event) => event.text)
const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`${id} caption QA failed: ${qa.failures.join('; ')}`)
await writeFile(path.join(root, assPath), buildAss(events, { mode: 'short', font: 'DejaVu Sans' }))
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

// House-style correction for the suspended 1512Z blue-card/face-box variant:
// source context first, clean white title/captions, VIBE ZONE + OpenClaw branding,
// blurred source underlay in the lower half, no saturated blue card, no square-face default.
const vf = [
  `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=-0.36:saturation=0.54[bg]`,
  `[0:v]scale=1000:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]`,
  `[1:v]scale=520:-1,format=rgba[logo]`,
  `[bg]drawbox=x=0:y=0:w=1080:h=1920:color=black@0.34:t=fill[base]`,
  `[base]drawtext=fontfile=${fontBold}:text='${esc(title1)}':x=(w-text_w)/2:y=82:fontcolor=white:fontsize=90:borderw=6:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc(title2)}':x=(w-text_w)/2:y=176:fontcolor=white:fontsize=86:borderw=6:bordercolor=black[title]`,
  `[title]drawbox=x=40:y=320:w=1000:h=704:color=black@0.62:t=fill,drawbox=x=40:y=320:w=1000:h=704:color=white@0.24:t=4[panel]`,
  `[panel][screenfit]overlay=x=(W-w)/2:y=388:format=auto[withscreen]`,
  `[withscreen]drawtext=fontfile=${fontSans}:text='${esc(context)}':x=(w-text_w)/2:y=1098:fontcolor=white@0.92:fontsize=34:borderw=4:bordercolor=black[context]`,
  `[context]drawtext=fontfile=${fontBold}:text='${esc('VIBE ZONE')}':x=(w-text_w)/2:y=1378:fontcolor=white:fontsize=58:borderw=5:bordercolor=black[vibezone]`,
  `[vibezone][logo]overlay=x=(W-w)/2:y=1470:format=auto[branded]`,
  `[branded]subtitles='${filterPath(assPath)}':force_style='Alignment=2,MarginV=675'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', start, '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])

for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '15'], ['proof-frame-03.jpg', '27']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)])
}
const contactSheet = `${reviewDir}/${id}-contact-sheet.jpg`
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=8x1', '-frames:v', '1', '-q:v', '3', contactSheet])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, bundleDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, bundleDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')

const review = run('node', ['scripts/review-render.mjs', out])
const reviewPath = `media/reviews/${path.basename(out, '.mp4')}.review.md`

const readyVideo = `${readyDir}/${readyName}`
const readySheet = `${readyDir}/short-ship-live-fix-later-house-v3-contact-sheet.jpg`
await copyFile(path.join(root, out), path.join(root, readyVideo))
await copyFile(path.join(root, contactSheet), path.join(root, readySheet))
await copyFile(path.join(root, contactSheet), path.join(root, bundleDir, 'contact-sheet.jpg'))

await writeFile(path.join(root, bundleDir, 'upload-copy.md'), `# Upload Bundle — Ship Live, Fix Later\n\nRender: \`${out}\`\nReady copy: \`${readyVideo}\`\nContact sheet: \`${contactSheet}\`\nReview: \`${reviewPath}\`\n\nSuggested caption:\nShip live. Fix later. Momentum first, polish after the proof exists. #BuildInPublic #VibeCoding #CreatorTools #ShipIt #AIAgents\n\n## Safety/review notes\nLocal-only export. Manual upload only after owner approval. House-style v3 uses screen/context-first layout, visible VIBE ZONE + OpenClaw branding, white captions, and no blue-card/square-face default. Supersedes suspended blue-card/square-face variants \`day3-no-sleep-shipping-live-safe-caption-rerender-20260513T1512Z.mp4\` and \`day3-no-sleep-shipping-constantly-facecam-smart-20260513T1417Z.mp4\`.\n`)
await writeFile(path.join(root, bundleDir, 'review-notes.md'), `# Review Notes — Ship Live, Fix Later house-style v3\n\n- Corrects the suspended 1512Z/1417Z no-sleep-shipping family.\n- Restores house style: source screen/context first, white title/captions, VIBE ZONE text plus OpenClaw logo, and a dim blurred source underlay filling the lower half.\n- Removes the unwanted saturated blue card and square-face default treatment.\n- Local-only render/export; no external posting, login, cookies, or public exposure.\n- Final owner privacy spot-check still recommended because stream UI is visible.\n`)

console.log(JSON.stringify({ stamp, id, out, readyVideo, readySheet, bundleDir, assPath, captionQa: qa, contactSheet, reviewPath, reviewStdout: review.stdout, ffprobe: JSON.parse(probe.stdout) }, null, 2))
