#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildShortWordEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const startSec = 158
const duration = 22
const id = 'stream-2-build-the-clip-machine-one-word-captions-20260513T1908Z'
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const reviewDir = 'media/reviews'
const bundleDir = `media/post-ready-review/${id}`
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const fontRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 80 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,') }
function filterPath(p) { return p.replace(/:/g, '\\:').replace(/'/g, "'\\''") }

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, bundleDir), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const events = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: startSec + duration })
const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`Short caption QA failed: ${qa.failures.join('; ')}`)
await writeFile(path.join(root, assPath), buildAss(events, { mode: 'short', font: 'DejaVu Sans' }))
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

const vf = [
  'color=c=0x050505:s=1080x1920:r=30:d=22[base]',
  '[0:v]scale=1030:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[base]drawbox=x=44:y=286:w=992:h=660:color=black@0.62:t=fill,drawbox=x=44:y=286:w=992:h=660:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=314:format=auto[withscreen]',
  `[withscreen]drawtext=fontfile=${fontBold}:text='${esc('BUILD THE')}':x=(w-text_w)/2:y=96:fontcolor=white:fontsize=78:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('CLIP MACHINE')}':x=(w-text_w)/2:y=178:fontcolor=white:fontsize=84:borderw=5:bordercolor=black,drawtext=fontfile=${fontRegular}:text='VIBE ZONE':x=(w-text_w)/2:y=984:fontcolor=white:fontsize=62:borderw=4:bordercolor=black,subtitles='${filterPath(assPath)}'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', out])
for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '10'], ['proof-frame-03.jpg', '19']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)])
}
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
await writeFile(path.join(root, bundleDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, bundleDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await writeFile(path.join(root, bundleDir, 'upload-card.md'), `# Upload Card — Build The Clip Machine Live\n\nRender: \`${out}\`\n\nStatus: one-word short-form caption proof. Uses the new reusable caption normalizer and QA gate. Manual upload only; no external posting.\n`)
console.log(JSON.stringify({ id, out, assPath, captionQa: qa, bundleDir, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
