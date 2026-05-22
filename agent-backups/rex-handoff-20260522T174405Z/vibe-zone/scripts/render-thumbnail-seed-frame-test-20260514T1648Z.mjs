#!/usr/bin/env node
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const input = 'media/exports/READY_TO_SHIP_NOW/thumbnail-looks-mid-clean-retention-test-20260514T1645Z.mp4'
const id = 'thumbnail-looks-mid-thumbnail-seed-frame-test-20260514T1648Z'
const seed = `media/renders/${id}-seed-frame.jpg`
const seedVideo = `media/renders/${id}-seed-frame.mp4`
const concatList = `media/renders/${id}-concat.txt`
const out = `media/renders/${id}.mp4`
const ready = `media/exports/READY_TO_SHIP_NOW/${id}.mp4`
const review = `media/reviews/${id}-contact-sheet.jpg`
const exportDir = `media/exports/clip_${id}`
const font = 'media/assets/fonts/LilitaOne-Regular.ttf'
const seedDuration = 1 / 30

await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, 'media/exports/READY_TO_SHIP_NOW'), { recursive: true })

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }

// Build a vertical thumbnail seed frame: same vibe, more thumbnail-like, no captions.
// Uses an actual frame from the clip as blurred/source background so it stays related.
const vfSeed = [
  'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:2,eq=brightness=-0.03:saturation=1.15',
  'drawbox=x=0:y=0:w=1080:h=1920:color=black@0.20:t=fill',
  `drawtext=fontfile='${font}':text='${esc('THUMBNAIL')}':x=(w-text_w)/2:y=150:fontsize=146:fontcolor=0xFFD400:borderw=8:bordercolor=black@0.86`,
  `drawtext=fontfile='${font}':text='${esc('LOOKS MID')}':x=(w-text_w)/2:y=302:fontsize=148:fontcolor=0xFFD400:borderw=8:bordercolor=black@0.86`,
  'drawbox=x=40:y=580:w=1000:h=620:color=0x66ff00@0.82:t=7',
  'drawbox=x=54:y=594:w=972:h=592:color=white@0.22:t=3',
  `drawtext=fontfile='${font}':text='${esc('FIX THIS?')}':x=(w-text_w)/2:y=1255:fontsize=118:fontcolor=white:borderw=7:bordercolor=black@0.82`,
  `drawtext=fontfile='${font}':text='${esc('WATCH THE BUILD')}':x=(w-text_w)/2:y=1392:fontsize=76:fontcolor=0x66ff00:borderw=5:bordercolor=black@0.78`,
].join(',')
run('ffmpeg', ['-y', '-v', 'error', '-ss', '3.2', '-i', input, '-frames:v', '1', '-vf', vfSeed, '-q:v', '2', seed])

// Make exactly one 30fps frame as a tiny video segment with silent audio, then concat.
run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-t', String(seedDuration), '-i', seed, '-f', 'lavfi', '-t', String(seedDuration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-shortest', seedVideo])
await writeFile(path.join(root, concatList), `file '${path.resolve(root, seedVideo).replaceAll("'", "'\\''")}'\nfile '${path.resolve(root, input).replaceAll("'", "'\\''")}'\n`)
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', review])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'notes.md'), `# Thumbnail seed frame test\n\nInput: ${input}\nOutput: ${out}\n\nAdds a single 1/30s still frame at the very start so upload platforms may expose it as a selectable thumbnail. This is a test only. If platforms do not detect one-frame thumbnails reliably, use 0.25–0.5s instead.\n`)
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, seed), path.join(root, exportDir, 'seed-frame.jpg'))
await copyFile(path.join(root, review), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, ready))
console.log(JSON.stringify({ id, input, seed, seedDuration, out, ready, review, exportDir, ffprobe: JSON.parse(probe.stdout) }, null, 2))
