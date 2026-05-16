#!/usr/bin/env node
import { mkdir, copyFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const input = 'media/exports/READY_TO_SHIP_NOW/day3-top10-strict-word-template/01-day3-one-stream-many-clips.mp4'
const id = 'day3-one-stream-border-shine-test-v2-20260514T1540Z'
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

// Same video container as the approved template, but the test border extends outward.
const x = 22
const y = 568
const w = 1036
const h = 642
const rightX = x + w - 18
const bottomY = y + h - 18
const lightLen = 300
const lightThick = 22
const runs = [0.8, 5.6, 10.9, 15.4]
const filters = [
  // louder discussion-test frame: visible but still outside the clip content
  `drawbox=x=${x - 8}:y=${y - 8}:w=${w + 16}:h=${h + 16}:color=black@0.62:t=18`,
  `drawbox=x=${x - 2}:y=${y - 2}:w=${w + 4}:h=${h + 4}:color=0xffd400@0.72:t=10`,
  `drawbox=x=${x + 8}:y=${y + 8}:w=${w - 16}:h=${h - 16}:color=0x66ff00@0.55:t=5`,
  `drawbox=x=${x + 16}:y=${y + 16}:w=${w - 32}:h=${h - 32}:color=white@0.20:t=3`,
]
for (const start of runs) {
  const q = (n) => Number(n.toFixed(2))
  const a = start
  const b = start + 0.55
  const c = start + 1.10
  const d = start + 1.65
  const e = start + 2.20
  filters.push(
    // top edge comet: big white head + gold glow + green core
    `drawbox=x='${x}+((t-${a})/${b - a})*${w}':y=${y - 7}:w=${lightLen}:h=${lightThick}:color=white@1.0:t=fill:enable='between(t,${q(a)},${q(b)})'`,
    `drawbox=x='${x}+((t-${a})/${b - a})*${w - 20}':y=${y - 3}:w=${lightLen + 70}:h=14:color=0xffd400@0.96:t=fill:enable='between(t,${q(a)},${q(b)})'`,
    `drawbox=x='${x}+((t-${a})/${b - a})*${w - 20}':y=${y + 2}:w=${lightLen - 40}:h=7:color=0x66ff00@1.0:t=fill:enable='between(t,${q(a)},${q(b)})'`,
    // right edge
    `drawbox=x=${rightX + 2}:y='${y}+((t-${b})/${c - b})*${h}':w=${lightThick}:h=${lightLen}:color=white@1.0:t=fill:enable='between(t,${q(b)},${q(c)})'`,
    `drawbox=x=${rightX + 7}:y='${y}+((t-${b})/${c - b})*${h - 20}':w=14:h=${lightLen + 70}:color=0xffd400@0.96:t=fill:enable='between(t,${q(b)},${q(c)})'`,
    `drawbox=x=${rightX + 12}:y='${y}+((t-${b})/${c - b})*${h - 20}':w=7:h=${lightLen - 40}:color=0x66ff00@1.0:t=fill:enable='between(t,${q(b)},${q(c)})'`,
    // bottom edge
    `drawbox=x='${x + w}-((t-${c})/${d - c})*${w}':y=${bottomY + 2}:w=${lightLen}:h=${lightThick}:color=white@1.0:t=fill:enable='between(t,${q(c)},${q(d)})'`,
    `drawbox=x='${x + w}-((t-${c})/${d - c})*${w}':y=${bottomY + 7}:w=${lightLen + 70}:h=14:color=0xffd400@0.96:t=fill:enable='between(t,${q(c)},${q(d)})'`,
    `drawbox=x='${x + w}-((t-${c})/${d - c})*${w}':y=${bottomY + 12}:w=${lightLen - 40}:h=7:color=0x66ff00@1.0:t=fill:enable='between(t,${q(c)},${q(d)})'`,
    // left edge
    `drawbox=x=${x - 7}:y='${y + h}-((t-${d})/${e - d})*${h}':w=${lightThick}:h=${lightLen}:color=white@1.0:t=fill:enable='between(t,${q(d)},${q(e)})'`,
    `drawbox=x=${x - 3}:y='${y + h}-((t-${d})/${e - d})*${h}':w=14:h=${lightLen + 70}:color=0xffd400@0.96:t=fill:enable='between(t,${q(d)},${q(e)})'`,
    `drawbox=x=${x + 2}:y='${y + h}-((t-${d})/${e - d})*${h}':w=7:h=${lightLen - 40}:color=0x66ff00@1.0:t=fill:enable='between(t,${q(d)},${q(e)})'`,
  )
}

const vf = filters.join(',')
run('ffmpeg', ['-y', '-v', 'error', '-i', input, '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', review])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'notes.md'), `# Border shine test v2\n\nInput: ${input}\nOutput: ${out}\n\nMore obvious retention frame: thicker extended border, white/gold/green comet head, longer tail, four visible loops. Discussion-only; no permanent template files changed.\n`)
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, review), path.join(root, exportDir, 'contact-sheet.jpg'))
// Intentionally do not copy border-shine experiments into READY_TO_SHIP_NOW.
console.log(JSON.stringify({ id, input, out, review, exportDir, ready: false, ffprobe: JSON.parse(probe.stdout) }, null, 2))
