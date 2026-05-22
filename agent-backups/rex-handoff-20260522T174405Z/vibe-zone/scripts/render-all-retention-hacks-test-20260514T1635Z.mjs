#!/usr/bin/env node
import { mkdir, copyFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const input = 'media/exports/READY_TO_SHIP_NOW/thumbnail-looks-mid-solid-template-20260514T1615Z.mp4'
const id = 'thumbnail-looks-mid-all-retention-hacks-test-20260514T1635Z'
const out = `media/renders/${id}.mp4`
const review = `media/reviews/${id}-contact-sheet.jpg`
const exportDir = `media/exports/clip_${id}`
const ready = `media/exports/READY_TO_SHIP_NOW/${id}.mp4`
const thumb = `media/exports/READY_TO_SHIP_NOW/${id}-thumbnail.jpg`
const font = 'media/assets/fonts/LilitaOne-Regular.ttf'

await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, 'media/exports/READY_TO_SHIP_NOW'), { recursive: true })

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 120 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
const q = (n) => Number(n.toFixed(2))

const duration = 18
const frameX = 32
const frameY = 582
const frameW = 1016
const frameH = 614
const captionY = 1408
const progressY = 54
const chains = []

// Base plus retention hack #1: micro zoom pulses on the whole composed short at key beats.
chains.push('[0:v]split=2[base][zoomsrc]')
chains.push('[zoomsrc]scale=1124:1998,crop=1080:1920:(iw-1080)/2:(ih-1920)/2[zoomed]')
chains.push(`[base][zoomed]overlay=0:0:enable='between(t,3.4,3.72)+between(t,8.2,8.52)+between(t,13.1,13.42)'[v1]`)

// Hack #6: subtle background/edge motion feel via slow vignette drift glows.
chains.push(`color=c=0x66ff00@0.10:s=220x220:r=30:d=${duration},format=rgba[driftGlow]`)
chains.push(`[v1][driftGlow]overlay=x='-80+60*sin(t*0.45)':y='220+50*cos(t*0.38)'[v2]`)
chains.push(`color=c=0xffd400@0.09:s=260x260:r=30:d=${duration},format=rgba[driftGlow2]`)
chains.push(`[v2][driftGlow2]overlay=x='900+50*cos(t*0.35)':y='1220+70*sin(t*0.42)'[v3]`)

// Hack #4: progress/retention bar near the top.
chains.push(`[v3]drawbox=x=70:y=${progressY}:w=940:h=10:color=black@0.42:t=fill,drawbox=x=70:y=${progressY}:w='940*t/${duration}':h=10:color=0x66ff00@0.94:t=fill[v4]`)

// Hack #5: first-second hook countdown flash/ping around title.
chains.push(`[v4]drawbox=x=42:y=82:w=996:h=366:color=0xffd400@0.42:t=10:enable='between(t,0.08,0.24)+between(t,0.52,0.66)+between(t,0.98,1.12)'[v5]`)

// Hack #2 + #3: caption emphasis pops / bounce cue as glow bursts behind the caption lane.
chains.push(`[v5]drawbox=x=330:y=${captionY}:w=420:h=118:color=0xffd400@0.34:t=fill:enable='between(t,2.7,2.95)+between(t,6.6,6.86)+between(t,10.4,10.68)+between(t,14.4,14.68)'[v6]`)
chains.push(`[v6]drawbox=x=360:y=${captionY + 18}:w=360:h=80:color=0x66ff00@0.30:t=fill:enable='between(t,2.78,3.04)+between(t,6.72,6.98)+between(t,10.55,10.82)+between(t,14.55,14.82)'[v7]`)

// Hack #8: scene-change punch frames / outline pulses.
chains.push(`[v7]drawbox=x=${frameX - 14}:y=${frameY - 14}:w=${frameW + 28}:h=${frameH + 28}:color=white@0.80:t=12:enable='between(t,4.95,5.06)+between(t,9.95,10.06)+between(t,14.95,15.06)'[v8]`)
chains.push(`[v8]drawbox=x=0:y=0:w=1080:h=1920:color=white@0.10:t=fill:enable='between(t,4.98,5.03)+between(t,9.98,10.03)+between(t,14.98,15.03)'[v9]`)

// Hack #9: rare attention ping, arrow pointing at main video.
chains.push(`[v9]drawtext=fontfile='${font}':text='${esc('↘')}':x=78:y=510:fontsize=112:fontcolor=0xffd400:borderw=6:bordercolor=black@0.80:enable='between(t,5.6,6.3)+between(t,12.2,12.9)'[v10]`)
chains.push(`[v10]drawbox=x=136:y=602:w=120:h=10:color=0xffd400@0.92:t=fill:enable='between(t,5.6,6.3)+between(t,12.2,12.9)'[v11]`)

// Hack #7: stronger shine variation around the already confirmed border.
let current = 'v11'
let idx = 0
function overlayMoving({ label, sw, sh, color, xExpr, yExpr, start, end }) {
  const colorLabel = `${label}c${idx}`
  const next = `${label}o${idx}`
  chains.push(`color=c=${color}:s=${sw}x${sh}:r=30:d=${duration},format=rgba[${colorLabel}]`)
  chains.push(`[${current}][${colorLabel}]overlay=x='${xExpr}':y='${yExpr}':enable='between(t,${q(start)},${q(end)})'[${next}]`)
  current = next
  idx += 1
}
for (const start of [1.1, 7.1, 13.6]) {
  const a = start, b = start + 0.58, c = start + 1.16, d = start + 1.74, e = start + 2.32
  overlayMoving({ label: 'topGlow', sw: 400, sh: 30, color: '0xfff3a0@0.66', xExpr: `${frameX}-200+((t-${a})/${b - a})*${frameW + 400}`, yExpr: `${frameY - 13}`, start: a, end: b })
  overlayMoving({ label: 'topHead', sw: 130, sh: 18, color: 'white@1.0', xExpr: `${frameX}-65+((t-${a})/${b - a})*${frameW + 130}`, yExpr: `${frameY - 7}`, start: a, end: b })
  overlayMoving({ label: 'rightGlow', sw: 30, sh: 400, color: '0xfff3a0@0.66', xExpr: `${frameX + frameW - 15}`, yExpr: `${frameY}-200+((t-${b})/${c - b})*${frameH + 400}`, start: b, end: c })
  overlayMoving({ label: 'rightHead', sw: 18, sh: 130, color: 'white@1.0', xExpr: `${frameX + frameW - 9}`, yExpr: `${frameY}-65+((t-${b})/${c - b})*${frameH + 130}`, start: b, end: c })
  overlayMoving({ label: 'bottomGlow', sw: 400, sh: 30, color: '0xfff3a0@0.66', xExpr: `${frameX + frameW}-200-((t-${c})/${d - c})*${frameW + 400}`, yExpr: `${frameY + frameH - 15}`, start: c, end: d })
  overlayMoving({ label: 'bottomHead', sw: 130, sh: 18, color: 'white@1.0', xExpr: `${frameX + frameW}-65-((t-${c})/${d - c})*${frameW + 130}`, yExpr: `${frameY + frameH - 9}`, start: c, end: d })
  overlayMoving({ label: 'leftGlow', sw: 30, sh: 400, color: '0xfff3a0@0.66', xExpr: `${frameX - 15}`, yExpr: `${frameY + frameH}-200-((t-${d})/${e - d})*${frameH + 400}`, start: d, end: e })
  overlayMoving({ label: 'leftHead', sw: 18, sh: 130, color: 'white@1.0', xExpr: `${frameX - 9}`, yExpr: `${frameY + frameH}-65-((t-${d})/${e - d})*${frameH + 130}`, start: d, end: e })
}

// Hack #10: end-loop retention cue — re-energize the title/frame in final second.
chains.push(`[${current}]drawbox=x=42:y=82:w=996:h=366:color=0xffd400@0.34:t=8:enable='between(t,16.95,17.92)',drawbox=x=${frameX - 8}:y=${frameY - 8}:w=${frameW + 16}:h=${frameH + 16}:color=0x66ff00@0.55:t=10:enable='between(t,16.95,17.92)',format=yuv420p[vout]`)

run('ffmpeg', ['-y', '-v', 'error', '-i', input, '-filter_complex', chains.join(';'), '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', review])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '5.8', '-i', out, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', thumb])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'notes.md'), `# All retention hacks test\n\nInput: ${input}\n\nThis is intentionally an everything-on test, not a confirmed-template replacement. Includes:\n1. micro zoom pulses\n2. caption emphasis pops\n3. caption bounce-style glow cue\n4. progress bar\n5. hook countdown flash\n6. subtle background drift glows\n7. shine timing variation\n8. scene-change punch frame\n9. rare attention ping arrow\n10. end-loop cue\n`)
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, review), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, ready))
console.log(JSON.stringify({ id, input, out, ready, review, thumb, exportDir, ffprobe: JSON.parse(probe.stdout) }, null, 2))
