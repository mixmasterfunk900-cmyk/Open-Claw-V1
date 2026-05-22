#!/usr/bin/env node
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const input = 'media/exports/READY_TO_SHIP_NOW/thumbnail-looks-mid-clean-retention-test-20260514T1645Z.mp4'
const seedSource = '/root/.openclaw/media/tool-image-generation/thumbnail-looks-mid-masala-face-seed-frame---e1766f8c-c4e8-4fc0-83df-8a0878b345be.jpg'
const id = 'thumbnail-looks-mid-masala-face-seed-test-20260514T1708Z'
const seed = `media/renders/${id}-seed-frame.jpg`
const seedVideo = `media/renders/${id}-seed-frames.mp4`
const concatList = `media/renders/${id}-concat.txt`
const out = `media/renders/${id}.mp4`
// Test-only seed renders must never be copied into READY_TO_SHIP_NOW.
const review = `media/reviews/${id}-contact-sheet.jpg`
const exportDir = `media/exports/clip_${id}`
const seedDuration = 4 / 30

await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
run('ffmpeg', ['-y', '-v', 'error', '-i', seedSource, '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', '-q:v', '2', seed])
run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-t', String(seedDuration), '-i', seed, '-f', 'lavfi', '-t', String(seedDuration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-shortest', seedVideo])
await writeFile(path.join(root, concatList), `file '${path.resolve(root, seedVideo).replaceAll("'", "'\\''")}'\nfile '${path.resolve(root, input).replaceAll("'", "'\\''")}'\n`)
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', review])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'notes.md'), `# Gotham seed frames test\n\nAdds a visible 4-frame Masala-face (${seedDuration.toFixed(3)}s) Gotham-style thumbnail seed frame at the start of the short. Test only; Confirmed Template #1 unchanged.\n`)
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, seed), path.join(root, exportDir, 'seed-frame.jpg'))
await copyFile(path.join(root, review), path.join(root, exportDir, 'contact-sheet.jpg'))
console.log(JSON.stringify({ id, seed, seedDuration, out, ready: null, review, exportDir, ffprobe: JSON.parse(probe.stdout) }, null, 2))
