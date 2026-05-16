#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/stream-2.mp4'
const startSec = 158
const duration = 22
const id = 'stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1902Z'
const out = `media/renders/${id}.mp4`
const reviewDir = 'media/reviews'
const bundleDir = `media/post-ready-review/${id}`
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const fontRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

// Hand-corrected transcript-backed captions. White text only; no blue cards.
const captions = [
  [0.0, 2.7, 'SO TODAY WE WANT TO'],
  [2.7, 5.0, 'BUILD THE CLIP MACHINE'],
  [5.0, 6.6, 'EASY ONE'],
  [6.6, 8.0, 'FIRST STEP'],
  [8.0, 9.1, 'SET UP TWITTER'],
  [9.1, 11.0, 'SET UP TIKTOK'],
  [11.0, 14.0, 'START POSTING THESE CLIPS'],
  [14.0, 17.0, 'SO PEOPLE CAN FIND IT'],
  [17.0, 20.0, 'THEN SET UP A VPS'],
  [20.0, 22.0, 'VIRTUAL PRIVATE SERVER'],
]

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 80 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function esc(s) { return s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,') }
function drawCaption([s, e, text], i) {
  const y = i % 2 === 0 ? 1240 : 1312
  const size = text.length > 23 ? 54 : 60
  return `drawtext=fontfile=${fontBold}:text='${esc(text)}':x=(w-text_w)/2:y=${y}:fontcolor=white:fontsize=${size}:borderw=5:bordercolor=black:enable='between(t\\,${s}\\,${e})'`
}

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, bundleDir), { recursive: true })

const vf = [
  '[0:v]split=2[bgsrc][screensrc]',
  // Context-first house base: blurred/dimmed source fills the whole vertical frame, so no empty black lower half.
  '[bgsrc]scale=-2:1920,crop=1080:1920:0:0,boxblur=10:1,eq=brightness=-0.30:saturation=0.72[base]',
  // Main readable screen stays prominent and follows the live context.
  '[screensrc]scale=1030:-2:force_original_aspect_ratio=decrease,setsar=1,eq=saturation=0.18:brightness=-0.03[screenfit]',
  '[base]drawbox=x=44:y=286:w=992:h=660:color=black@0.46:t=fill,drawbox=x=44:y=286:w=992:h=660:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=314:format=auto[withscreen]',
  `[withscreen]drawtext=fontfile=${fontBold}:text='${esc('BUILD THE')}':x=(w-text_w)/2:y=96:fontcolor=white:fontsize=78:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('CLIP MACHINE')}':x=(w-text_w)/2:y=178:fontcolor=white:fontsize=84:borderw=5:bordercolor=black,drawtext=fontfile=${fontRegular}:text='VIBE ZONE':x=(w-text_w)/2:y=984:fontcolor=white:fontsize=62:borderw=4:bordercolor=black,drawtext=fontfile=${fontRegular}:text='SCREEN-FIRST HOUSE STYLE':x=(w-text_w)/2:y=1070:fontcolor=white@0.68:fontsize=30:borderw=3:bordercolor=black,drawtext=fontfile=${fontRegular}:text='LIVE BUILD  •  CLIPS  •  VPS  •  SHIP':x=(w-text_w)/2:y=1508:fontcolor=white@0.42:fontsize=34:borderw=3:bordercolor=black,drawtext=fontfile=${fontRegular}:text='FOLLOW THE BUILD':x=(w-text_w)/2:y=1628:fontcolor=white@0.38:fontsize=42:borderw=3:bordercolor=black,drawbox=x=184:y=1710:w=712:h=3:color=white@0.22:t=fill,${captions.map(drawCaption).join(',')}[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', out])

for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '10'], ['proof-frame-03.jpg', '19']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)])
}
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
await writeFile(path.join(root, bundleDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, bundleDir, 'upload-card.md'), `# Upload Card — Build The Clip Machine Live\n\nRender: \`${out}\`\n\nStatus: corrected local candidate. Fixes blue-box style regression, restores screen-first VIBE ZONE house style, and uses full white caption coverage. Manual upload only; no external posting.\n`)
await writeFile(path.join(root, bundleDir, 'review-notes.md'), `# Review Notes — Build The Clip Machine Live House Fixed Captions v2\n\nOwner feedback fixed:\n\n- Removed blue box/card style.\n- Avoided square-face-default layout.\n- Kept VIBE ZONE branding and white text.\n- Screen/context remains the main visual, with a dim source backdrop so proof frames are not empty black.\n- Captions cover the full spoken beat from 2:38 to 3:00.\n\nStatus: corrected local candidate pending final Masala visual approval.\n`)
console.log(JSON.stringify({ id, out, bundleDir, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
