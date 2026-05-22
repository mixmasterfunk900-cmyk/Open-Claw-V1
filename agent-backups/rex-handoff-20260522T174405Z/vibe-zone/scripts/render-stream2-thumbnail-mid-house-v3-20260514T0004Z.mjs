#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildShortWordEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const logoPath = 'media/assets/logos/openclaw-logo-text.png'
const startSec = 320
const duration = 18
const stamp = '20260514T0004Z'
const id = `stream-2-thumbnail-looks-mid-house-v3-${stamp}`
const title1 = 'THUMBNAIL'
const title2 = 'LOOKS MID'
const context = 'QUALITY CHECK BEFORE POSTING'
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const reviewDir = 'media/reviews'
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const bundleDir = `media/exports/clip_${id}`
const postReadyDir = `media/post-ready-review/${id}`
const readyName = 'short-thumbnail-looks-mid-house-v3.mp4'
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
await mkdir(path.join(root, postReadyDir), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const events = buildShortWordEvents({
  segments: transcript.segments || [],
  sourceStart: startSec,
  sourceEnd: startSec + duration,
  minDuration: 0.18,
  maxDuration: 0.62,
  gap: 0.015,
}).map((event) => ({ ...event, text: event.text.replace(/[^\p{L}\p{N}'-]/gu, '').toUpperCase() })).filter((event) => event.text)
const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`${id} caption QA failed: ${qa.failures.join('; ')}`)
await writeFile(path.join(root, assPath), buildAss(events, { mode: 'short', font: 'DejaVu Sans' }))
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

// House-style v3 correction for the old thumbnail-quality family: source screen is the hero,
// white title/captions, visible VIBE ZONE/OpenClaw branding, and blurred source underlay fills
// the lower half. No external posting/API/account work.
const vf = [
  '[0:v]split=2[srcmain][srcbg]',
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=22:2,eq=brightness=-0.30:saturation=0.58[bg]',
  '[srcmain]scale=1000:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[1:v]scale=500:-1,format=rgba[logo]',
  '[bg]drawbox=x=0:y=0:w=1080:h=1920:color=black@0.30:t=fill[base]',
  `[base]drawtext=fontfile=${fontBold}:text='${esc(title1)}':x=(w-text_w)/2:y=84:fontcolor=white:fontsize=92:borderw=6:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc(title2)}':x=(w-text_w)/2:y=180:fontcolor=white:fontsize=88:borderw=6:bordercolor=black[title]`,
  '[title]drawbox=x=40:y=320:w=1000:h=704:color=black@0.60:t=fill,drawbox=x=40:y=320:w=1000:h=704:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=386:format=auto[withscreen]',
  `[withscreen]drawtext=fontfile=${fontSans}:text='${esc(context)}':x=(w-text_w)/2:y=1096:fontcolor=white@0.92:fontsize=36:borderw=4:bordercolor=black[context]`,
  `[context]drawtext=fontfile=${fontBold}:text='${esc('VIBE ZONE')}':x=(w-text_w)/2:y=1376:fontcolor=white:fontsize=58:borderw=5:bordercolor=black[vibezone]`,
  '[vibezone][logo]overlay=x=(W-w)/2:y=1468:format=auto[branded]',
  `[branded]subtitles='${filterPath(assPath)}':force_style='Alignment=2,MarginV=670'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])

for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '9'], ['proof-frame-03.jpg', '16']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)])
  await copyFile(path.join(root, bundleDir, name), path.join(root, postReadyDir, name))
}
const contactSheet = `${reviewDir}/${id}-contact-sheet.jpg`
const thumbnail = `${bundleDir}/thumbnail-thumbnail-looks-mid.jpg`
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', contactSheet])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '9', '-i', out, '-frames:v', '1', '-q:v', '2', thumbnail])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, bundleDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, postReadyDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, bundleDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await writeFile(path.join(root, postReadyDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')

const review = run('node', ['scripts/review-render.mjs', out])
const reviewPath = `media/reviews/${path.basename(out, '.mp4')}.review.md`
const readyVideo = `${readyDir}/${readyName}`
const readySheet = `${readyDir}/short-thumbnail-looks-mid-house-v3-contact-sheet.jpg`
const readyThumbnail = `${readyDir}/short-thumbnail-looks-mid-house-v3-thumbnail.jpg`
await copyFile(path.join(root, out), path.join(root, readyVideo))
await copyFile(path.join(root, contactSheet), path.join(root, readySheet))
await copyFile(path.join(root, contactSheet), path.join(root, bundleDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, contactSheet), path.join(root, postReadyDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, thumbnail), path.join(root, readyThumbnail))
await copyFile(path.join(root, thumbnail), path.join(root, postReadyDir, 'thumbnail-thumbnail-looks-mid.jpg'))
await copyFile(path.join(root, out), path.join(root, bundleDir, `${id}.mp4`))

const uploadCopy = `# Upload Bundle — Thumbnail Looks Mid\n\nRender: \`${out}\`\nReady copy: \`${readyVideo}\`\nThumbnail: \`${thumbnail}\`\nContact sheet: \`${contactSheet}\`\nReview: \`${reviewPath}\`\n\n## YouTube Shorts\nTitle: My Thumbnail Looked Mid, So I Fixed the Pipeline\nDescription: A very real build-in-public moment: before touching the VPS or AI workflow, Masala catches the thumbnail and quality checks that make clips look worse than the build. Local proof first, posting later.\n\nManual upload draft only. Owner approval required before posting.\n\n#BuildInPublic #VibeCoding #CreatorTools #YouTubeShorts #AIAgents\nPinned comment: Do you check thumbnails before you ship, or just post and learn?\n\n## TikTok\nCaption: The thumbnail looked mid, so the pipeline had to get sharper before posting. #buildinpublic #vibecoding #creatortools #aiautomation\nOn-screen hook: THUMBNAIL LOOKS MID\n\n## Safety/review notes\n- Local render/export only; no external posting, login, cookies, or account/API use.\n- House-style v3: centered source screen, clean white title/captions, VIBE ZONE + OpenClaw branding below video, dim blurred source underlay filling the lower half.\n- No blue-card/square-face regression. Final owner privacy spot-check still required before any public upload.\n`
await writeFile(path.join(root, bundleDir, 'upload-copy.md'), uploadCopy)
await writeFile(path.join(root, postReadyDir, 'upload-copy.md'), uploadCopy)
await writeFile(path.join(root, bundleDir, 'review-notes.md'), `# Review Notes — Thumbnail Looks Mid house-style v3\n\n- Fresh corrected Stream 2 candidate from 05:20–05:38 about catching weak thumbnail/clip quality before shipping.\n- Restores current house style for a legacy thumbnail-quality family: centered source screen, white hook/captions, VIBE ZONE + OpenClaw branding, dim blurred underlay, no blue-card or square-face default.\n- Local-only export; no external posting, login, cookies, or public exposure.\n- Final owner privacy/watch pass recommended because stream UI is visible.\n`)
await copyFile(path.join(root, bundleDir, 'review-notes.md'), path.join(root, postReadyDir, 'review-notes.md'))

console.log(JSON.stringify({ stamp, id, out, readyVideo, readySheet, readyThumbnail, bundleDir, postReadyDir, assPath, captionQa: qa, contactSheet, reviewPath, reviewStdout: JSON.parse(review.stdout), ffprobe: JSON.parse(probe.stdout) }, null, 2))
