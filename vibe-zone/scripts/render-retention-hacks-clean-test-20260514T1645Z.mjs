#!/usr/bin/env node
import { mkdir, copyFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const input = 'media/exports/READY_TO_SHIP_NOW/thumbnail-looks-mid-solid-template-20260514T1615Z.mp4'
const id = 'thumbnail-looks-mid-clean-retention-test-20260514T1645Z'
const out = `media/renders/${id}.mp4`
const review = `media/reviews/${id}-contact-sheet.jpg`
const exportDir = `media/exports/clip_${id}`
const ready = `media/exports/READY_TO_SHIP_NOW/${id}.mp4`
const thumb = `media/exports/READY_TO_SHIP_NOW/${id}-thumbnail.jpg`

await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, 'media/exports/READY_TO_SHIP_NOW'), { recursive: true })

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 120 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
const q = (n) => Number(n.toFixed(2))
const duration = 18
const frameX = 32
const frameY = 582
const frameW = 1016
const frameH = 614
const chains = []

// Clean retention test:
// - no progress bar
// - no random caption boxes
// - no arrow/punch clutter
// - slow subtle push only, not pop zoom
// - rare visible shine, not constant
// - soft start/end cue

// Slow 0→1.8% push-in across the entire clip. This is intentionally subtle.
chains.push(`[0:v]scale=w='1080*(1+0.018*t/${duration})':h='1920*(1+0.018*t/${duration})':eval=frame,crop=1080:1920:(iw-1080)/2:(ih-1920)/2[base]`)

// Soft hook pulse at the start: title area breathes once, not a flash loop.
chains.push(`[base]drawbox=x=58:y=92:w=964:h=344:color=0xffd400@0.18:t=7:enable='between(t,0.25,1.15)'[v1]`)

// Very subtle ambient edge glow so the frame feels alive without adding new UI.
chains.push(`color=c=0x66ff00@0.08:s=180x180:r=30:d=${duration},format=rgba[ambient1]`)
chains.push(`[v1][ambient1]overlay=x='30+22*sin(t*0.32)':y='560+16*cos(t*0.27)'[v2]`)
chains.push(`color=c=0xffd400@0.07:s=220x220:r=30:d=${duration},format=rgba[ambient2]`)
chains.push(`[v2][ambient2]overlay=x='830+18*cos(t*0.25)':y='1110+26*sin(t*0.31)'[v3]`)

let current = 'v3'
let idx = 0
function overlayMoving({ label, sw, sh, color, xExpr, yExpr, start, end }) {
  const colorLabel = `${label}c${idx}`
  const next = `${label}o${idx}`
  chains.push(`color=c=${color}:s=${sw}x${sh}:r=30:d=${duration},format=rgba[${colorLabel}]`)
  chains.push(`[${current}][${colorLabel}]overlay=x='${xExpr}':y='${yExpr}':enable='between(t,${q(start)},${q(end)})'[${next}]`)
  current = next
  idx += 1
}

// Rare shine only twice: visible enough to notice, spaced enough to not feel constant.
for (const start of [2.2, 11.4]) {
  const a = start, b = start + 0.74, c = start + 1.48, d = start + 2.22, e = start + 2.96
  overlayMoving({ label: 'topGlow', sw: 330, sh: 22, color: '0xfff3a0@0.50', xExpr: `${frameX}-165+((t-${a})/${b - a})*${frameW + 330}`, yExpr: `${frameY - 10}`, start: a, end: b })
  overlayMoving({ label: 'topHead', sw: 92, sh: 12, color: 'white@0.88', xExpr: `${frameX}-46+((t-${a})/${b - a})*${frameW + 92}`, yExpr: `${frameY - 5}`, start: a, end: b })
  overlayMoving({ label: 'rightGlow', sw: 22, sh: 330, color: '0xfff3a0@0.50', xExpr: `${frameX + frameW - 11}`, yExpr: `${frameY}-165+((t-${b})/${c - b})*${frameH + 330}`, start: b, end: c })
  overlayMoving({ label: 'rightHead', sw: 12, sh: 92, color: 'white@0.88', xExpr: `${frameX + frameW - 6}`, yExpr: `${frameY}-46+((t-${b})/${c - b})*${frameH + 92}`, start: b, end: c })
  overlayMoving({ label: 'bottomGlow', sw: 330, sh: 22, color: '0xfff3a0@0.50', xExpr: `${frameX + frameW}-165-((t-${c})/${d - c})*${frameW + 330}`, yExpr: `${frameY + frameH - 11}`, start: c, end: d })
  overlayMoving({ label: 'bottomHead', sw: 92, sh: 12, color: 'white@0.88', xExpr: `${frameX + frameW}-46-((t-${c})/${d - c})*${frameW + 92}`, yExpr: `${frameY + frameH - 6}`, start: c, end: d })
  overlayMoving({ label: 'leftGlow', sw: 22, sh: 330, color: '0xfff3a0@0.50', xExpr: `${frameX - 11}`, yExpr: `${frameY + frameH}-165-((t-${d})/${e - d})*${frameH + 330}`, start: d, end: e })
  overlayMoving({ label: 'leftHead', sw: 12, sh: 92, color: 'white@0.88', xExpr: `${frameX - 6}`, yExpr: `${frameY + frameH}-46-((t-${d})/${e - d})*${frameH + 92}`, start: d, end: e })
}

// End-loop cue: one subtle final border glow, not a flash.
chains.push(`[${current}]drawbox=x=${frameX - 5}:y=${frameY - 5}:w=${frameW + 10}:h=${frameH + 10}:color=0x66ff00@0.24:t=7:enable='between(t,16.85,17.85)',format=yuv420p[vout]`)

run('ffmpeg', ['-y', '-v', 'error', '-i', input, '-filter_complex', chains.join(';'), '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', review])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '3.0', '-i', out, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', thumb])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'notes.md'), `# Clean retention hacks test\n\nInput: ${input}\n\nThis is a restrained correction after the all-hacks test failed. It removes the useless top progress bar, random caption boxes, arrow clutter, and pop zooms. It keeps only:\n- slow continuous 1.8% push-in\n- one soft hook/title pulse at the start\n- two rare travelling shine passes\n- subtle ambient edge glow\n- gentle end-loop border cue\n\nConfirmed Template #1 remains unchanged.\n`)
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, review), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, ready))
console.log(JSON.stringify({ id, input, out, ready, review, thumb, exportDir, ffprobe: JSON.parse(probe.stdout) }, null, 2))
