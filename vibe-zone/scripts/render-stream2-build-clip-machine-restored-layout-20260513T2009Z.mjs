#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildShortWordEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const logoPath = 'media/assets/logos/openclaw-logo-text.png'
const startSec = 158
const duration = 22
const id = 'stream-2-build-clip-machine-restored-layout-20260513T2009Z'
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const reviewDir = 'media/reviews'
const bundleDir = `media/post-ready-review/${id}`
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
await mkdir(path.join(root, bundleDir), { recursive: true })
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

// Restored shot layout from Masala's correction:
// 1) White title block at the top.
// 2) Actual stream video centered.
// 3) Captions below video but above logo, high enough to clear YouTube title/UI.
// 4) Big logo underneath captions.
const vf = [
  'color=c=0x050505:s=1080x1920:r=30:d=22[base]',
  '[0:v]scale=1000:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[1:v]scale=520:-1,format=rgba[logo]',
  // Title block: white text only, no blue/colored card.
  `[base]drawtext=fontfile=${fontBold}:text='${esc('BUILD THE')}':x=(w-text_w)/2:y=86:fontcolor=white:fontsize=86:borderw=6:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('CLIP MACHINE')}':x=(w-text_w)/2:y=178:fontcolor=white:fontsize=92:borderw=6:bordercolor=black[title]`,
  // Centered video panel.
  '[title]drawbox=x=40:y=320:w=1000:h=704:color=black@0.60:t=fill,drawbox=x=40:y=320:w=1000:h=704:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=388:format=auto[withscreen]',
  // Big logo underneath the video, below caption lane.
  '[withscreen][logo]overlay=x=(W-w)/2:y=1374:format=auto[branded]',
  // Captions are fixed one-word flashes, above the logo and high enough for platform UI.
  `[branded]subtitles='${filterPath(assPath)}':force_style='Alignment=2,MarginV=520'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '10'], ['proof-frame-03.jpg', '19']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)])
}
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, bundleDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, bundleDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await writeFile(path.join(root, bundleDir, 'review-notes.md'), `# Review Notes — restored short layout\n\nRestores Masala's intended shot setup:\n\n- White title block at the top.\n- Source video centered.\n- Big logo underneath the video.\n- One-word captions above the logo, high enough to avoid YouTube title/UI overlap.\n- No plain VIBE ZONE text and no blue card.\n\nCaption QA, ffprobe, and decode pass. Manual upload only; owner visual approval required.\n`)
await copyFile(path.join(root, out), path.join(root, readyDir, 'short-build-the-clip-machine-restored-layout.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'short-restored-layout-contact-sheet.jpg'))
console.log(JSON.stringify({ id, out, ready: `${readyDir}/short-build-the-clip-machine-restored-layout.mp4`, assPath, captionQa: qa, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
