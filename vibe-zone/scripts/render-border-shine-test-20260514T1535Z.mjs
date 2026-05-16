#!/usr/bin/env node
import { mkdir, copyFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const input = 'media/exports/READY_TO_SHIP_NOW/day3-top10-strict-word-template/01-day3-one-stream-many-clips.mp4'
const id = 'day3-one-stream-border-shine-test-20260514T1535Z'
const out = `media/renders/${id}.mp4`
const review = `media/reviews/${id}-contact-sheet.jpg`
const exportDir = `media/exports/clip_${id}`

await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}

const x = 32
const y = 586
const w = 1016
const h = 606
const rightX = x + w - 8
const bottomY = y + h - 8
const lightLen = 170
const lightThick = 10
const runs = [1.0, 8.4, 16.7]
const filters = [
  // subtle shadow and slightly extended retention border around the existing video container
  `drawbox=x=${x - 5}:y=${y - 5}:w=${w + 10}:h=${h + 10}:color=black@0.44:t=10`,
  `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=0x66ff00@0.56:t=5`,
  `drawbox=x=${x + 9}:y=${y + 9}:w=${w - 18}:h=${h - 18}:color=white@0.18:t=2`,
]
for (const start of runs) {
  const q = (n) => Number(n.toFixed(2))
  const a = start
  const b = start + 0.48
  const c = start + 0.96
  const d = start + 1.44
  const e = start + 1.92
  filters.push(
    `drawbox=x='${x}+((t-${a})/${b - a})*${w}':y=${y}:w=${lightLen}:h=${lightThick}:color=white@0.96:t=fill:enable='between(t,${q(a)},${q(b)})'`,
    `drawbox=x='${x}+((t-${a})/${b - a})*${w}':y=${y + 2}:w=${lightLen}:h=5:color=0x66ff00@0.95:t=fill:enable='between(t,${q(a)},${q(b)})'`,
    `drawbox=x=${rightX}:y='${y}+((t-${b})/${c - b})*${h}':w=${lightThick}:h=${lightLen}:color=white@0.96:t=fill:enable='between(t,${q(b)},${q(c)})'`,
    `drawbox=x=${rightX + 2}:y='${y}+((t-${b})/${c - b})*${h}':w=5:h=${lightLen}:color=0x66ff00@0.95:t=fill:enable='between(t,${q(b)},${q(c)})'`,
    `drawbox=x='${x + w}-((t-${c})/${d - c})*${w}':y=${bottomY}:w=${lightLen}:h=${lightThick}:color=white@0.96:t=fill:enable='between(t,${q(c)},${q(d)})'`,
    `drawbox=x='${x + w}-((t-${c})/${d - c})*${w}':y=${bottomY + 2}:w=${lightLen}:h=5:color=0x66ff00@0.95:t=fill:enable='between(t,${q(c)},${q(d)})'`,
    `drawbox=x=${x}:y='${y + h}-((t-${d})/${e - d})*${h}':w=${lightThick}:h=${lightLen}:color=white@0.96:t=fill:enable='between(t,${q(d)},${q(e)})'`,
    `drawbox=x=${x + 2}:y='${y + h}-((t-${d})/${e - d})*${h}':w=5:h=${lightLen}:color=0x66ff00@0.95:t=fill:enable='between(t,${q(d)},${q(e)})'`,
  )
}

const vf = filters.join(',')
run('ffmpeg', ['-y', '-v', 'error', '-i', input, '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', review])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'notes.md'), `# Border shine test\n\nInput: ${input}\nOutput: ${out}\n\nAdds a slightly extended green/white border around the existing video container. A short shine travels around the border at ~1s, ~8.4s, and ~16.7s. No permanent template files changed.\n`)
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, review), path.join(root, exportDir, 'contact-sheet.jpg'))
// Intentionally do not copy border-shine experiments into READY_TO_SHIP_NOW.
console.log(JSON.stringify({ id, input, out, review, exportDir, ready: false, ffprobe: JSON.parse(probe.stdout) }, null, 2))
