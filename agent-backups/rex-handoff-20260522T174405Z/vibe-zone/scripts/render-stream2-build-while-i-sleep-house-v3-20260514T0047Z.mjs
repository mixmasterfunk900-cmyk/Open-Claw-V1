#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260514T0047Z'
const id = `stream-2-build-while-i-sleep-house-v3-${stamp}`
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const reviewDir = 'media/reviews'
const exportDir = `media/exports/clip_${id}`
const postReadyDir = `media/post-ready-review/${id}`
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const logoPath = 'media/assets/logos/openclaw-logo-text.png'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const startSec = 216
const endSec = 232
const duration = endSec - startSec

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
function filterPath(value) { return String(value).replaceAll("'", "'\\\\''") }

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, postReadyDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const events = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: endSec, minDuration: 0.18, maxDuration: 0.62, gap: 0.015 })
const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`Caption QA failed: ${qa.failures.join('; ')}`)
await writeFile(path.join(root, assPath), buildAss(events, { mode: 'short', font: 'DejaVu Sans' }))
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

const vf = [
  '[0:v]split=2[srcmain][srcbg]',
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:1,eq=brightness=-0.15:saturation=0.62[bg]',
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[base][bg]overlay=0:0:format=auto,drawbox=x=0:y=0:w=1080:h=308:color=black@0.72:t=fill,drawbox=x=0:y=1035:w=1080:h=885:color=black@0.10:t=fill[underlay]',
  '[srcmain]scale=992:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[1:v]scale=230:-1,format=rgba[logo]',
  `[underlay]drawtext=fontfile=${fontBold}:text='${esc('BUILD WHILE')}':x=(w-text_w)/2:y=88:fontcolor=white:fontsize=86:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('I SLEEP')}':x=(w-text_w)/2:y=178:fontcolor=white:fontsize=92:borderw=5:bordercolor=black[headline]`,
  '[headline]drawbox=x=44:y=330:w=992:h=700:color=black@0.62:t=fill,drawbox=x=44:y=330:w=992:h=700:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=400:format=auto[withscreen]',
  `[withscreen][logo]overlay=x=(W-w)/2:y=1082:format=auto,drawtext=fontfile=${fontBold}:text='${esc('VIBE ZONE')}':x=(w-text_w)/2:y=1190:fontcolor=white@0.98:fontsize=62:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('PROJECT MOVES OFF-STREAM')}':x=(w-text_w)/2:y=1264:fontcolor=white@0.96:fontsize=60:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('LOCAL AGENTS KEEP BUILDING')}':x=(w-text_w)/2:y=1340:fontcolor=white@0.94:fontsize=52:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('NO BLUE CARD DEFAULT')}':x=(w-text_w)/2:y=1408:fontcolor=white@0.86:fontsize=44:borderw=5:bordercolor=black[branded]`,
  `[branded]subtitles='${filterPath(assPath)}'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '8'], ['proof-frame-03.jpg', '14']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(postReadyDir, name)])
  await copyFile(path.join(root, postReadyDir, name), path.join(root, exportDir, name))
}
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=4x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
const review = run('node', ['scripts/review-render.mjs', out])
await writeFile(path.join(root, postReadyDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, postReadyDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, readyDir, 'short-build-while-i-sleep-house-v3.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'short-build-while-i-sleep-house-v3-contact-sheet.jpg'))
await writeFile(path.join(root, exportDir, 'upload-copy.md'), `# Upload Bundle — Build While I Sleep\n\nRender: \`${out}\`\nReady copy: \`${readyDir}/short-build-while-i-sleep-house-v3.mp4\`\nContact sheet: \`${reviewDir}/${id}-contact-sheet.jpg\`\n\nManual upload only after owner approval. House-style v3: source screen/context first, white title/captions, VIBE ZONE + OpenClaw branding, dim blurred underlay, no blue-card/square-face default. Supersedes suspended screen-card/facecam variants for this clip family.\n`)
await writeFile(path.join(root, postReadyDir, 'review-notes.md'), `# Review Notes — Build While I Sleep house-style v3\n\n- Corrects the suspended Build While I Sleep family, especially screen-card variants that visually read as blue-card artifacts.\n- Restores house style: screen/context first, clean white hook/captions, visible OpenClaw/VIBE ZONE branding, dim blurred source underlay.\n- Local-only render/export; no external posting, login, cookies, public exposure, or site restart.\n- Final owner privacy/watch pass still recommended because stream UI is visible.\n`)
console.log(JSON.stringify({ id, out, readyCopy: `${readyDir}/short-build-while-i-sleep-house-v3.mp4`, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, review: JSON.parse(review.stdout), captionQa: qa, ffprobe: JSON.parse(probe.stdout) }, null, 2))
