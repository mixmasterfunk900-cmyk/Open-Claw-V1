#!/usr/bin/env node
import { mkdir, copyFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const input = 'media/exports/READY_TO_SHIP_NOW/day3-top10-strict-word-template/01-day3-one-stream-many-clips.mp4'
const id = 'day3-one-stream-border-shine-test-v3-20260514T1548Z'
const out = `media/renders/${id}.mp4`
const review = `media/reviews/${id}-contact-sheet.jpg`
const exportDir = `media/exports/clip_${id}`
const proof = `media/reviews/${id}-shine-proof.jpg`

await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}

// Back to the preferred thin green frame, slightly extended vertically from the video.
const x = 32
const y = 582
const w = 1016
const h = 614
const duration = 20
const runs = [0.7, 6.2, 12.4, 17.0]
const q = (n) => Number(n.toFixed(2))

const chains = []
chains.push(`[0:v]drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=0x66ff00@0.70:t=5,drawbox=x=${x + 7}:y=${y + 7}:w=${w - 14}:h=${h - 14}:color=white@0.20:t=2[base0]`)
let current = 'base0'
let idx = 0
function overlayMoving({ label, sw, sh, color, xExpr, yExpr, start, end }) {
  const colorLabel = `${label}c${idx}`
  const next = `${label}o${idx}`
  chains.push(`color=c=${color}:s=${sw}x${sh}:r=30:d=${duration},format=rgba[${colorLabel}]`)
  chains.push(`[${current}][${colorLabel}]overlay=x='${xExpr}':y='${yExpr}':enable='between(t,${q(start)},${q(end)})'[${next}]`)
  current = next
  idx += 1
}
for (const start of runs) {
  const a = start
  const b = start + 0.62
  const c = start + 1.24
  const d = start + 1.86
  const e = start + 2.48
  // Two-layer comet: a large translucent glow plus a smaller white/yellow head.
  overlayMoving({ label: 'topGlow', sw: 360, sh: 26, color: '0xfff3a0@0.62', xExpr: `${x}-180+((t-${a})/${b - a})*${w + 360}`, yExpr: `${y - 11}`, start: a, end: b })
  overlayMoving({ label: 'topHead', sw: 120, sh: 16, color: 'white@0.96', xExpr: `${x}-60+((t-${a})/${b - a})*${w + 120}`, yExpr: `${y - 6}`, start: a, end: b })
  overlayMoving({ label: 'rightGlow', sw: 26, sh: 360, color: '0xfff3a0@0.62', xExpr: `${x + w - 13}`, yExpr: `${y}-180+((t-${b})/${c - b})*${h + 360}`, start: b, end: c })
  overlayMoving({ label: 'rightHead', sw: 16, sh: 120, color: 'white@0.96', xExpr: `${x + w - 8}`, yExpr: `${y}-60+((t-${b})/${c - b})*${h + 120}`, start: b, end: c })
  overlayMoving({ label: 'bottomGlow', sw: 360, sh: 26, color: '0xfff3a0@0.62', xExpr: `${x + w}-180-((t-${c})/${d - c})*${w + 360}`, yExpr: `${y + h - 13}`, start: c, end: d })
  overlayMoving({ label: 'bottomHead', sw: 120, sh: 16, color: 'white@0.96', xExpr: `${x + w}-60-((t-${c})/${d - c})*${w + 120}`, yExpr: `${y + h - 8}`, start: c, end: d })
  overlayMoving({ label: 'leftGlow', sw: 26, sh: 360, color: '0xfff3a0@0.62', xExpr: `${x - 13}`, yExpr: `${y + h}-180-((t-${d})/${e - d})*${h + 360}`, start: d, end: e })
  overlayMoving({ label: 'leftHead', sw: 16, sh: 120, color: 'white@0.96', xExpr: `${x - 8}`, yExpr: `${y + h}-60-((t-${d})/${e - d})*${h + 120}`, start: d, end: e })
}
chains.push(`[${current}]format=yuv420p[vout]`)
const filterComplex = chains.join(';')
run('ffmpeg', ['-y', '-v', 'error', '-i', input, '-filter_complex', filterComplex, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', review])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '1.10', '-i', out, '-frames:v', '1', '-vf', 'scale=540:960', '-q:v', '2', proof])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'notes.md'), `# Border shine test v3\n\nInput: ${input}\nOutput: ${out}\n\nRestores the preferred thin green frame. Rebuilds shine as real moving overlay layers: translucent gold glow + white head travelling around the border. Discussion-only; no permanent template files changed.\n`)
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, review), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, proof), path.join(root, exportDir, 'shine-proof.jpg'))
// Intentionally do not copy border-shine experiments into READY_TO_SHIP_NOW.
console.log(JSON.stringify({ id, input, out, review, proof, exportDir, ready: false, ffprobe: JSON.parse(probe.stdout) }, null, 2))
