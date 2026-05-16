#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync, execFileSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dataPath = path.join(root, 'data/vibe-zone.json')
const stamp = '20260515T0700Z'
const frameX = 32
const frameY = 582
const frameW = 1016
const frameH = 614
const rejectedRenderPattern = /screen-card|facecam-smart|facecam-tracked|smart-pip|lowerfill|centered-logo-fix|title-top-logo-below|logo-below-video|one-word-captions/i
const approvedRenderPattern = /gotham-seed|confirmed-template-01|house-v3|house-v4|permanent-template|fixed-template|template-trial|thumbnail-looks-mid-template|socials-to-vps-template|restored-layout-v2|clean-no-story-overlays|upload-candidate/i

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function q(n) { return Number(n.toFixed(2)) }
function filterPath(value) { return String(value).replaceAll("'", "'\\''") }
function outputPathFor(input) {
  const parsed = path.parse(input)
  if (parsed.name.includes('retention-fixed')) return input
  return path.join(parsed.dir, `${parsed.name}-retention-fixed-${stamp}${parsed.ext}`)
}
function probeDuration(file) {
  const out = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).stdout.trim()
  return Number(out) || 0
}
function sampleStats(file, at = 1.2) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(at), '-i', path.join(root, file), '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1080 * 1920 * 3 + 1024 })
  const width = 1080
  let green = 0, bright = 0, total = 0
  const pix = (x, y) => {
    const i = (y * width + x) * 3
    return [raw[i], raw[i + 1], raw[i + 2]]
  }
  for (let x = frameX; x < frameX + frameW; x += 1) {
    for (let y = frameY; y < frameY + 6; y += 1) { const [r,g,b] = pix(x,y); total += 1; if (g > 120 && g > r * 1.25 && g > b * 1.25) green += 1; if (r > 210 && g > 200 && b > 120) bright += 1 }
    for (let y = frameY + frameH - 6; y < frameY + frameH; y += 1) { const [r,g,b] = pix(x,y); total += 1; if (g > 120 && g > r * 1.25 && g > b * 1.25) green += 1; if (r > 210 && g > 200 && b > 120) bright += 1 }
  }
  for (let y = frameY; y < frameY + frameH; y += 1) {
    for (let x = frameX; x < frameX + 6; x += 1) { const [r,g,b] = pix(x,y); total += 1; if (g > 120 && g > r * 1.25 && g > b * 1.25) green += 1; if (r > 210 && g > 200 && b > 120) bright += 1 }
    for (let x = frameX + frameW - 6; x < frameX + frameW; x += 1) { const [r,g,b] = pix(x,y); total += 1; if (g > 120 && g > r * 1.25 && g > b * 1.25) green += 1; if (r > 210 && g > 200 && b > 120) bright += 1 }
  }
  return { green, bright, total }
}
function hasRetention(file) {
  try {
    const steady = sampleStats(file, 8.0)
    const shine = sampleStats(file, 1.2)
    return { ok: steady.green > 9000 && (shine.bright > 120 || steady.bright > 120), steady, shine }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}
function retentionFilter(duration) {
  const chains = []
  chains.push(`drawbox=x=${frameX}:y=${frameY}:w=${frameW}:h=${frameH}:color=0x66ff00@0.70:t=5`)
  chains.push(`drawbox=x=${frameX + 7}:y=${frameY + 7}:w=${frameW - 14}:h=${frameH - 14}:color=white@0.20:t=2`)
  const overlays = []
  let idx = 0
  function moving({ sw, sh, color, xExpr, yExpr, start, end }) {
    const label = `ret${idx++}`
    overlays.push(`color=c=${color}:s=${sw}x${sh}:r=30:d=${duration},format=rgba[${label}]`)
    overlays.push(`[v${idx - 1}][${label}]overlay=x='${xExpr}':y='${yExpr}':enable='between(t,${q(start)},${q(end)})'[v${idx}]`)
  }
  for (const start of [0.6, 5.7, 11.8, 15.6, 21.2, 27.0, 33.0, 39.0].filter((t) => t < duration - 0.8)) {
    const a = start, b = start + 0.62, c = start + 1.24, d = start + 1.86, e = start + 2.48
    moving({ sw: 360, sh: 26, color: '0xfff3a0@0.62', xExpr: `${frameX}-180+((t-${a})/${b - a})*${frameW + 360}`, yExpr: `${frameY - 11}`, start: a, end: b })
    moving({ sw: 120, sh: 16, color: 'white@0.96', xExpr: `${frameX}-60+((t-${a})/${b - a})*${frameW + 120}`, yExpr: `${frameY - 6}`, start: a, end: b })
    moving({ sw: 26, sh: 360, color: '0xfff3a0@0.62', xExpr: `${frameX + frameW - 13}`, yExpr: `${frameY}-180+((t-${b})/${c - b})*${frameH + 360}`, start: b, end: c })
    moving({ sw: 16, sh: 120, color: 'white@0.96', xExpr: `${frameX + frameW - 8}`, yExpr: `${frameY}-60+((t-${b})/${c - b})*${frameH + 120}`, start: b, end: c })
    moving({ sw: 360, sh: 26, color: '0xfff3a0@0.62', xExpr: `${frameX + frameW}-180-((t-${c})/${d - c})*${frameW + 360}`, yExpr: `${frameY + frameH - 13}`, start: c, end: d })
    moving({ sw: 120, sh: 16, color: 'white@0.96', xExpr: `${frameX + frameW}-60-((t-${c})/${d - c})*${frameW + 120}`, yExpr: `${frameY + frameH - 8}`, start: c, end: d })
    moving({ sw: 26, sh: 360, color: '0xfff3a0@0.62', xExpr: `${frameX - 13}`, yExpr: `${frameY + frameH}-180-((t-${d})/${e - d})*${frameH + 360}`, start: d, end: e })
    moving({ sw: 16, sh: 120, color: 'white@0.96', xExpr: `${frameX - 8}`, yExpr: `${frameY + frameH}-60-((t-${d})/${e - d})*${frameH + 120}`, start: d, end: e })
  }
  if (!overlays.length) return chains.join(',')
  return `[0:v]${chains.join(',')},format=yuv420p[v0];${overlays.join(';')}`
}

await mkdir(path.join(root, 'media/reviews/retention-fix-20260515T0700Z'), { recursive: true })
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const visible = (data.clips || [])
  .filter((clip) => clip.renderPath && clip.status !== 'uploaded' && clip.status !== 'archived' && clip.status !== 'superseded' && String(clip.renderStatus || '') !== 'superseded')
  .filter((clip) => approvedRenderPattern.test(clip.renderPath) && !rejectedRenderPattern.test(clip.renderPath))
  .slice(0, 24)
const report = []
for (const clip of visible) {
  if (!existsSync(path.join(root, clip.renderPath))) { report.push({ id: clip.id, title: clip.title, action: 'missing-file', path: clip.renderPath }); continue }
  const before = hasRetention(clip.renderPath)
  if (before.ok) { report.push({ id: clip.id, title: clip.title, action: 'already-ok', path: clip.renderPath, before }); continue }
  const input = clip.renderPath
  const output = outputPathFor(input)
  const duration = probeDuration(input)
  const vf = retentionFilter(duration)
  const args = vf.startsWith('[0:v]')
    ? ['-y', '-v', 'error', '-i', input, '-filter_complex', vf, '-map', `[v${(vf.match(/\[v\d+\]/g) || ['[v0]']).map((m) => Number(m.slice(2, -1))).reduce((a,b)=>Math.max(a,b),0)}]`, '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', output]
    : ['-y', '-v', 'error', '-i', input, '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', output]
  run('ffmpeg', args)
  const after = hasRetention(output)
  if (!after.ok) throw new Error(`retention verification failed for ${clip.title}: ${JSON.stringify(after)}`)
  run('ffmpeg', ['-y', '-v', 'error', '-i', output, '-vf', 'fps=1/6,scale=320:-1,tile=8x1', '-frames:v', '1', '-q:v', '3', `media/reviews/retention-fix-20260515T0700Z/${clip.id}-contact-sheet.jpg`])
  clip.previousRenderPath = input
  clip.renderPath = output
  clip.renderUrl = `/${output}`
  clip.renderPreset = `${clip.renderPreset || 'unknown'}+confirmed-template-retention-border-shine`
  clip.retentionFix = { fixedAt: new Date().toISOString(), previousRenderPath: input, verified: after }
  for (const dispatch of data.dispatchItems || []) {
    if (dispatch.clipId === clip.id || dispatch.renderPath === input) {
      dispatch.previousRenderPath = input
      dispatch.renderPath = output
      dispatch.lastAuditAction = 'retention-border-shine-fixed'
      dispatch.updatedAt = new Date().toISOString()
    }
  }
  report.push({ id: clip.id, title: clip.title, action: 'fixed', from: input, to: output, before, after })
}
data.mediaJobs = [{ id: `job_retention_fix_${stamp}`, type: 'render-audit', step: 'Fix live clips missing retention border + shine', status: 'done', detail: `Audited ${report.length} live clips; fixed ${report.filter((item) => item.action === 'fixed').length}.`, command: `node scripts/fix-live-retention-border-20260515T0700Z.mjs`, createdAt: new Date().toISOString(), reportPath: `media/reviews/retention-fix-20260515T0700Z/report.json` }, ...(data.mediaJobs || [])].slice(0, 160)
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')
await writeFile(path.join(root, 'media/reviews/retention-fix-20260515T0700Z/report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ audited: report.length, fixed: report.filter((item) => item.action === 'fixed').length, alreadyOk: report.filter((item) => item.action === 'already-ok').length, reportPath: 'media/reviews/retention-fix-20260515T0700Z/report.json', fixedItems: report.filter((item) => item.action === 'fixed').map((item) => ({ title: item.title, to: item.to })) }, null, 2))
