#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const id = 'day3-product-content-machine-v2-20260513T1100Z'
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const out = `media/renders/long-form/${id}.mp4`
const work = `media/renders/long-form/.tmp-${id}`
const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
const beats = [
  { card: 'WHY THIS BUILD MATTERS', start: '00:11:58.4', end: '00:12:12.4' },
  { card: 'THE PRODUCT PROMISE', start: '00:14:56.4', end: '00:15:38.4' },
  { card: 'THE ROUGH PART', start: '00:24:00.4', end: '00:24:52.4' },
  { card: 'SHIP IT LIVE ANYWAY', start: '00:26:11.4', end: '00:26:28.4' },
  { card: 'PRODUCT OR CONTENT MACHINE?', start: '00:30:10.4', end: '00:30:49.4' },
  { card: 'THE AGENT LOOP', start: '00:44:48.4', end: '00:46:14.4' },
  { card: 'NEXT BOTTLENECK: FACE TRACKING', start: '00:47:13.4', end: '00:47:46.4' },
]
function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function esc(s) { return s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'") }
await mkdir(path.join(root, work), { recursive: true })
const concat = []
let n = 1
for (const beat of beats) {
  const cardPath = `${work}/${String(n++).padStart(2, '0')}-card.mp4`
  const segPath = `${work}/${String(n++).padStart(2, '0')}-seg.mp4`
  run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=#101014:s=1920x1080:r=30:d=3.5', '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-vf', `drawtext=fontfile=${font}:text='${esc(beat.card)}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2,drawtext=fontfile=${font}:text='VIBE ZONE STORY DRAFT':fontcolor=#ff3b6b:fontsize=30:x=(w-text_w)/2:y=h-140`, '-t', '3.5', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', cardPath])
  run('ffmpeg', ['-y', '-v', 'error', '-ss', beat.start, '-to', beat.end, '-i', source, '-map', '0:v:0', '-map', '0:a:0', '-vf', 'fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1', '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5,aresample=48000', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', segPath])
  concat.push(cardPath, segPath)
}
const concatPath = `${work}/concat.txt`
await writeFile(path.join(root, concatPath), concat.map((p) => `file '${path.resolve(root, p).replace(/'/g, "'\\''")}'`).join('\n') + '\n')
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatPath, '-c', 'copy', out])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:02:12', '-i', out, '-frames:v', '1', '-q:v', '2', `media/reviews/long-form/${id}-screenshot.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out])
await mkdir(path.join(root, 'media/reviews/long-form'), { recursive: true })
await writeFile(path.join(root, `media/reviews/long-form/${id}.ffprobe.json`), probe.stdout)
console.log(JSON.stringify({ id, out, screenshot: `media/reviews/long-form/${id}-screenshot.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
