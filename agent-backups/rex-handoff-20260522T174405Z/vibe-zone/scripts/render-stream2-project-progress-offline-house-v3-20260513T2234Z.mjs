#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildShortWordEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const logoPath = 'media/assets/logos/openclaw-title-card.png'
const startSec = 192
const duration = 20
const id = 'stream-2-project-progress-offline-house-v3-20260513T2234Z'
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const reviewDir = 'media/reviews'
const postReadyDir = `media/post-ready-review/${id}`
const exportDir = `media/exports/clip_stream2_project_progress_offline_house_v3_20260513T2234Z`
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,') }
function filterPath(p) { return p.replace(/:/g, '\\:').replace(/'/g, "'\\''") }

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, postReadyDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const events = buildShortWordEvents({
  segments: transcript.segments || [],
  sourceStart: startSec,
  sourceEnd: startSec + duration,
  minDuration: 0.18,
  maxDuration: 0.62,
  gap: 0.015,
})
const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`Short caption QA failed: ${qa.failures.join('; ')}`)
await writeFile(path.join(root, assPath), buildAss(events, { mode: 'short', font: 'DejaVu Sans' }))
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

// Current house style: source screen remains the hero, clean white title/captions,
// dim blurred source underlay fills the lower half, and branding sits below video.
const vf = [
  '[0:v]split=2[srcmain][srcbg]',
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:1,eq=brightness=-0.13:saturation=0.66[bg]',
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[base][bg]overlay=0:0:format=auto,drawbox=x=0:y=0:w=1080:h=308:color=black@0.72:t=fill,drawbox=x=0:y=1035:w=1080:h=885:color=black@0.10:t=fill[underlay]',
  '[srcmain]scale=992:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[1:v]scale=230:-1,format=rgba[logo]',
  `[underlay]drawtext=fontfile=${fontBold}:text='${esc('PROJECT MOVES')}':x=(w-text_w)/2:y=88:fontcolor=white:fontsize=82:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('WITHOUT ME')}':x=(w-text_w)/2:y=178:fontcolor=white:fontsize=86:borderw=5:bordercolor=black[headline]`,
  '[headline]drawbox=x=44:y=330:w=992:h=700:color=black@0.62:t=fill,drawbox=x=44:y=330:w=992:h=700:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=400:format=auto[withscreen]',
  `[withscreen][logo]overlay=x=(W-w)/2:y=1082:format=auto,drawtext=fontfile=${fontBold}:text='${esc('FULL-TIME JOB')}':x=(w-text_w)/2:y=1242:fontcolor=white@0.96:fontsize=72:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('24/7 AGENT WORKFLOW')}':x=(w-text_w)/2:y=1322:fontcolor=white@0.94:fontsize=62:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('BUILD WHILE OFF-STREAM')}':x=(w-text_w)/2:y=1398:fontcolor=white@0.94:fontsize=58:borderw=5:bordercolor=black[branded]`,
  `[branded]subtitles='${filterPath(assPath)}'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '9'], ['proof-frame-03.jpg', '17']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(postReadyDir, name)])
  await copyFile(path.join(root, postReadyDir, name), path.join(root, exportDir, name))
}
run('ffmpeg', ['-y', '-v', 'error', '-ss', '9', '-i', out, '-frames:v', '1', '-q:v', '2', path.join(exportDir, 'thumbnail-project-moves-without-me.jpg')])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=5x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, postReadyDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, postReadyDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, readyDir, 'short-project-moves-without-me-house-v3.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'short-project-moves-without-me-contact-sheet.jpg'))
await copyFile(path.join(root, exportDir, 'thumbnail-project-moves-without-me.jpg'), path.join(root, readyDir, 'short-project-moves-without-me-thumbnail.jpg'))

const seo = `# Upload Bundle — Project Moves Without Me\n\n## Files\n- Render: ${id}.mp4\n- Ready copy: media/exports/READY_TO_SHIP_NOW/short-project-moves-without-me-house-v3.mp4\n- Thumbnail: thumbnail-project-moves-without-me.jpg\n- Proof frames: proof-frame-01.jpg, proof-frame-02.jpg, proof-frame-03.jpg\n- Contact sheet: contact-sheet.jpg\n- Caption QA: caption-qa.json\n- ffprobe: ffprobe.json\n\n## YouTube Shorts\nTitle: Project Moves Without Me | AI Agent Workflow\nDescription: Masala explains the real constraint behind Vibe Zone: he works full-time and can only stream in the evenings, so the build needs a local-first agent workflow that keeps progress moving off-stream.\n\nManual upload draft only. Owner approval required before posting.\n\n#AIAgents #BuildInPublic #VibeCoding #CreatorTools #Shorts\nPinned comment: Would you trust an AI agent to keep your project moving while you are offline?\n\n## TikTok\nCaption: The real test: can the project keep progressing when the stream is over? #aiagents #buildinpublic #vibecoding #creatortools\nOn-screen hook: PROJECT MOVES WITHOUT ME\n\n## Stream-safety notes\n- Local render/export only; no external posting, login, cookie, or account/API use.\n- Source screen context is visible but intentionally scaled; final human privacy spot-check still recommended before upload.\n- House-style target: white title/captions, centered source screen, OpenClaw/Vibe Zone branding below video, dim blurred underlay, no blue-card or square-face regression.\n`
await writeFile(path.join(root, exportDir, 'upload-copy.md'), seo)
await writeFile(path.join(root, postReadyDir, 'review-notes.md'), `# Review Notes — Project Moves Without Me house-style v3\n\n- Fresh Stream 2 candidate from 03:12–03:32, adjacent to but not duplicating the later “Build While I Sleep” cut.\n- Strong creator-ops thesis: full-time job + evening streams + project should progress off-stream.\n- Uses current house style: source screen centered, white headline/captions, OpenClaw/Vibe Zone branding below video, dim blurred source underlay filling the lower half.\n- No blue-card/square-face regression.\n- No external posting/API/cookie/login work.\n- Needs final human privacy spot-check because source screen context is visible.\n`)
console.log(JSON.stringify({ id, out, exportDir, readyCopy: `${readyDir}/short-project-moves-without-me-house-v3.mp4`, thumbnail: `${exportDir}/thumbnail-project-moves-without-me.jpg`, assPath, captionQa: qa, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
