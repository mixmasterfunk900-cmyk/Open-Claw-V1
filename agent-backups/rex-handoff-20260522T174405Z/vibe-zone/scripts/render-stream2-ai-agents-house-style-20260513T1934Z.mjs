#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildShortWordEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const logoPath = 'media/assets/logos/openclaw-title-card.png'
const startSec = 10 * 60 + 14
const duration = 28
const id = 'stream-2-ai-agents-real-work-house-style-20260513T1934Z'
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const reviewDir = 'media/reviews'
const postReadyDir = `media/post-ready-review/${id}`
const exportDir = `media/exports/clip_stream2_ai_agents_real_work_house_style_20260513T1934Z`
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
const events = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: startSec + duration })
const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`Short caption QA failed: ${qa.failures.join('; ')}`)
await writeFile(path.join(root, assPath), buildAss(events, { mode: 'short', font: 'DejaVu Sans' }))
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

// House style: black field, white title, source screen as the main context,
// small Vibe Zone/OpenClaw branding below the video, one-word captions. No blue card.
const vf = [
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[0:v]scale=992:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[1:v]scale=176:-1,format=rgba[logo]',
  `[base]drawtext=fontfile=${fontBold}:text='${esc('AI AGENTS')}':x=(w-text_w)/2:y=92:fontcolor=white:fontsize=86:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('DO REAL WORK')}':x=(w-text_w)/2:y=184:fontcolor=white:fontsize=78:borderw=5:bordercolor=black[headline]`,
  '[headline]drawbox=x=44:y=330:w=992:h=700:color=black@0.62:t=fill,drawbox=x=44:y=330:w=992:h=700:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=400:format=auto[withscreen]',
  '[withscreen][logo]overlay=x=(W-w)/2:y=1074:format=auto[branded]',
  `[branded]subtitles='${filterPath(assPath)}'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '12'], ['proof-frame-03.jpg', '24']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(postReadyDir, name)])
  await copyFile(path.join(root, postReadyDir, name), path.join(root, exportDir, name))
}
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=7x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, postReadyDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, postReadyDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, readyDir, 'short-ai-agents-real-work-house-style.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'short-ai-agents-real-work-contact-sheet.jpg'))

const seo = `# Upload Bundle — AI Agents Do Real Work\n\n## Files\n- Render: ${id}.mp4\n- Proof frames: proof-frame-01.jpg, proof-frame-02.jpg, proof-frame-03.jpg\n- Contact sheet: contact-sheet.jpg\n- Caption QA: caption-qa.json\n- ffprobe: ffprobe.json\n\n## YouTube Shorts\nTitle: AI Agents That Actually Do Real Work\nDescription: Building the clip machine live: the goal is simple — AI agents should keep the project moving even when the streamer is offline. Local-first, stream-safe, and built in public.\nHashtags: #AIagents #BuildInPublic #VibeCoding #CreatorTools #Shorts\nPinned comment: Should agents just draft ideas, or should they be trusted to ship local review-ready clips?\n\n## TikTok\nCaption: AI agents should not just chat — they should move the build forward while you sleep. #aiagents #buildinpublic #vibecoding #creatortools\nOn-screen hook: AI AGENTS DO REAL WORK\n\n## Stream-safety notes\n- Local render/export only; no external posting or account/API use.\n- Screen context is intentionally visible but small enough for a final human privacy spot-check before upload.\n- House-style check target: black background, clean white headline/captions, source screen primary, OpenClaw/Vibe Zone branding below video, no blue-card regression.\n`
await writeFile(path.join(root, exportDir, 'upload-copy.md'), seo)
await writeFile(path.join(root, postReadyDir, 'review-notes.md'), `# Review Notes — AI Agents Do Real Work house-style rerender\n\n- Replaces suspended/older blue-card/square-face variants with current house style.\n- Title above, centered source screen, logo below video, one-word captions.\n- No external posting/API/cookie/login work.\n- Needs final human privacy spot-check because source screen context is visible.\n`)
console.log(JSON.stringify({ id, out, exportDir, readyCopy: `${readyDir}/short-ai-agents-real-work-house-style.mp4`, assPath, captionQa: qa, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
