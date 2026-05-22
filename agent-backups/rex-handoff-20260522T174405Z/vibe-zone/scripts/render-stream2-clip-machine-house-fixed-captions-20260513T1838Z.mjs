#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/stream-2.mp4'
const startSec = 158
const duration = 22
const id = 'stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1838Z'
const out = `media/renders/${id}.mp4`
const reviewDir = 'media/reviews'
const bundleDir = `media/post-ready-review/${id}`
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const fontRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

const captions = [
  [0.0, 3.0, 'SO TODAY WE WANT TO'],
  [5.0, 6.1, 'EASY ONE'],
  [8.0, 9.1, 'WE SET UP TWITTER'],
  [9.1, 11.0, 'WE SET UP TIKTOK'],
  [11.0, 14.0, 'START POSTING THESE CLIPS'],
  [14.0, 17.0, 'SO PEOPLE CAN FIND IT'],
  [18.0, 20.0, 'THEN SET UP A VPS'],
  [20.0, 22.0, 'VIRTUAL PRIVATE SERVER'],
]

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 80 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function esc(s) { return s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,') }
function drawCaption([s, e, text], i) {
  const y = i % 2 === 0 ? 1238 : 1310
  return `drawtext=fontfile=${fontBold}:text='${esc(text)}':x=(w-text_w)/2:y=${y}:fontcolor=white:fontsize=58:borderw=5:bordercolor=black:enable='between(t\\,${s}\\,${e})'`
}

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, bundleDir), { recursive: true })

const vf = [
  'color=c=0x050505:s=1080x1920:r=30:d=22[base]',
  '[0:v]scale=1030:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[base]drawbox=x=44:y=286:w=992:h=660:color=black@0.62:t=fill,drawbox=x=44:y=286:w=992:h=660:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=314:format=auto[withscreen]',
  `[withscreen]drawtext=fontfile=${fontBold}:text='${esc('BUILD THE')}':x=(w-text_w)/2:y=96:fontcolor=white:fontsize=78:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('CLIP MACHINE')}':x=(w-text_w)/2:y=178:fontcolor=white:fontsize=84:borderw=5:bordercolor=black,drawtext=fontfile=${fontRegular}:text='VIBE ZONE':x=(w-text_w)/2:y=984:fontcolor=white:fontsize=62:borderw=4:bordercolor=black,${captions.map(drawCaption).join(',')}[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', out])

for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '10'], ['proof-frame-03.jpg', '19']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)])
}
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
await writeFile(path.join(root, bundleDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, bundleDir, 'upload-card.md'), `# Upload Card — Build The Clip Machine Live\n\nRender: \`${out}\`\n\nStatus: corrected proof candidate. Fixes blue-box style regression and restores fuller caption coverage from transcript. Needs Masala approval before READY.\n`)
await writeFile(path.join(root, bundleDir, 'review-notes.md'), `# Review Notes — Build The Clip Machine Live Fixed Captions\n\nOwner feedback fixed:\n\n- Removed blue box/card style.\n- Avoided square-face-default layout.\n- Kept VIBE ZONE branding and white text.\n- Screen/context remains main visual.\n- Captions now cover the full spoken beat from 2:38 to 3:00 instead of sparse placeholders.\n\nStatus: proof candidate pending Masala visual approval.\n`)
console.log(JSON.stringify({ id, out, bundleDir, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
