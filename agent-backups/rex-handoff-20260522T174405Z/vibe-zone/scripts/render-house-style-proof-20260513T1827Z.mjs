#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const fontRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
const source = 'media/downloads/stream-2.mp4'
const start = '2:38'
const duration = '17'
const id = 'stream-2-build-the-clip-machine-live-house-style-clean-20260513T1827Z'
const out = `media/renders/${id}.mp4`
const reviewDir = 'media/reviews'
const bundleDir = `media/post-ready-review/${id}`

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 80 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function esc(s) { return s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,') }

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, bundleDir), { recursive: true })

const vf = [
  // Keep screen context visible without source-color artifacts behind the text.
  'color=c=0x050505:s=1080x1920:r=30:d=17[base]',
  '[0:v]scale=1030:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[base]drawbox=x=44:y=314:w=992:h=630:color=black@0.62:t=fill,drawbox=x=44:y=314:w=992:h=630:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=336:format=auto[withscreen]',
  `[withscreen]drawtext=fontfile=${fontBold}:text='${esc('BUILD THE')}':x=(w-text_w)/2:y=116:fontcolor=white:fontsize=78:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('CLIP MACHINE')}':x=(w-text_w)/2:y=198:fontcolor=white:fontsize=84:borderw=5:bordercolor=black,drawtext=fontfile=${fontRegular}:text='VIBE ZONE':x=(w-text_w)/2:y=986:fontcolor=white:fontsize=62:borderw=4:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('SET UP TIKTOK')}':x=(w-text_w)/2:y=1248:fontcolor=white:fontsize=60:borderw=5:bordercolor=black:enable='between(t\\,0\\,5.2)',drawtext=fontfile=${fontBold}:text='${esc('SHIP THE CLIPS')}':x=(w-text_w)/2:y=1324:fontcolor=white:fontsize=66:borderw=5:bordercolor=black:enable='between(t\\,0\\,5.2)',drawtext=fontfile=${fontBold}:text='${esc('THEN BUILD THE VPS')}':x=(w-text_w)/2:y=1248:fontcolor=white:fontsize=56:borderw=5:bordercolor=black:enable='between(t\\,5.2\\,11.5)',drawtext=fontfile=${fontBold}:text='${esc('LIVE ON STREAM')}':x=(w-text_w)/2:y=1324:fontcolor=white:fontsize=66:borderw=5:bordercolor=black:enable='between(t\\,5.2\\,11.5)',drawtext=fontfile=${fontBold}:text='${esc('NO EXPERIENCE YET')}':x=(w-text_w)/2:y=1248:fontcolor=white:fontsize=58:borderw=5:bordercolor=black:enable='between(t\\,11.5\\,17)',drawtext=fontfile=${fontBold}:text='${esc('STILL SHIPPING')}':x=(w-text_w)/2:y=1324:fontcolor=white:fontsize=68:borderw=5:bordercolor=black:enable='between(t\\,11.5\\,17)'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', start, '-i', source, '-t', duration, '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', out])

for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '8'], ['proof-frame-03.jpg', '14']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)])
}
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=5x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
await writeFile(path.join(root, bundleDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, bundleDir, 'review-notes.md'), `# Review Notes — House Style Proof\n\nRender: \`${out}\`\n\nPurpose: fixes Masala's style-regression feedback. This proof keeps the screen/context as the main visual, restores the house style with VIBE ZONE branding and white text, and avoids the blue-card/square-face-only look.\n\nStatus: proof candidate, needs Masala visual approval before promoting this as the new default.\n`)
await writeFile(path.join(root, bundleDir, 'upload-card.md'), `# Upload Card — House Style Proof\n\nRender: \`${out}\`\n\nDo not publish yet. This is a visual proof for the corrected default clip style.\n`)
console.log(JSON.stringify({ id, out, bundleDir, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
