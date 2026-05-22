#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync, execFileSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dataPath = path.join(root, 'data/vibe-zone.json')
const stamp = '20260515T0910Z'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const seedHold = 0.55
const coverH = 560
const frameX = 32, frameY = 582, frameW = 1016, frameH = 614
const videoX = 44, videoY = 610, videoW = 992, videoH = 558
const reviewDir = `media/reviews/title-clean-layer-${stamp}`

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 120 })
  if (r.status !== 0) throw new Error(`${command} failed: ${r.stderr || r.stdout}`)
  return r
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
function cleanHook(clip) {
  const explicit = String(clip.hook || '').toUpperCase().trim()
  if (explicit.includes('\n')) return explicit.split(/\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 2)
  const raw = String(clip.hook || clip.title || '').toUpperCase().replace(/\s+/g, ' ').trim()
  const words = raw.split(' ').filter(Boolean)
  if (words.length >= 4) return [words.slice(0, 2).join(' '), words.slice(2).join(' ')]
  if (raw.length > 15 && words.length >= 3) return [words.slice(0, 2).join(' '), words.slice(2).join(' ')]
  return [raw]
}
function titleParams(lines) {
  const longest = Math.max(...lines.map((line) => line.length))
  if (lines.length > 1) return { fontSize: longest > 14 ? 72 : 78, y: longest > 14 ? 134 : 126, lineSpacing: -6 }
  return { fontSize: longest > 16 ? 74 : 84, y: 188, lineSpacing: 0 }
}
function titleFilter(clip) {
  const lines = cleanHook(clip)
  const text = lines.join('\n')
  const p = titleParams(lines)
  // Critical: DO NOT blur the existing title area. That keeps ghost text.
  // Build a fresh clean header plate from the main video container, heavily blurred/dimmed,
  // then overlay that only after the seed frame. This removes old burned titles completely.
  return [
    `[0:v]split=2[base][src]`,
    `[src]crop=${videoW}:${videoH}:${videoX}:${videoY},scale=1080:${coverH}:force_original_aspect_ratio=increase,crop=1080:${coverH},boxblur=34:2,eq=brightness=-0.03:saturation=0.88[cleanplate]`,
    `[base][cleanplate]overlay=0:0:enable='gte(t,${seedHold})'[cleantop]`,
    `[cleantop]drawtext=fontfile='${fontBold}':text='${esc(text)}':x=(w-text_w)/2:y=${p.y}:fontcolor=white:fontsize=${p.fontSize}:line_spacing=${p.lineSpacing}:borderw=8:bordercolor=black@0.90:enable='gte(t,${seedHold})'[vout]`,
  ].join(';')
}
function greenStats(file, at) {
  const raw = execFileSync('ffmpeg', ['-v','error','-ss',String(at),'-i',path.join(root,file),'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'], { maxBuffer: 1080 * 1920 * 3 + 1024 })
  const width = 1080; let green = 0, bright = 0
  const pix = (x,y) => { const i = (y * width + x) * 3; return [raw[i], raw[i+1], raw[i+2]] }
  for (let x = frameX; x < frameX + frameW; x++) {
    for (let y = frameY; y < frameY + 6; y++) { const [r,g,b] = pix(x,y); if (g>120 && g>r*1.25 && g>b*1.25) green++; if (r>210 && g>200 && b>120) bright++ }
    for (let y = frameY + frameH - 6; y < frameY + frameH; y++) { const [r,g,b] = pix(x,y); if (g>120 && g>r*1.25 && g>b*1.25) green++; if (r>210 && g>200 && b>120) bright++ }
  }
  for (let y = frameY; y < frameY + frameH; y++) {
    for (let x = frameX; x < frameX + 6; x++) { const [r,g,b] = pix(x,y); if (g>120 && g>r*1.25 && g>b*1.25) green++; if (r>210 && g>200 && b>120) bright++ }
    for (let x = frameX + frameW - 6; x < frameX + frameW; x++) { const [r,g,b] = pix(x,y); if (g>120 && g>r*1.25 && g>b*1.25) green++; if (r>210 && g>200 && b>120) bright++ }
  }
  return { green, bright }
}
function maybeStripSuffix(name) {
  return name
    .replace(/-title-clean-layer-\d{8}T\d{4}Z$/, '')
    .replace(/-title-safe-\d{8}T\d{4}Z$/, '')
}

await mkdir(path.join(root, reviewDir), { recursive: true })
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const live = (data.clips || []).filter((clip) => clip.renderPath && !['uploaded','archived','superseded'].includes(String(clip.status || ''))).slice(0, 60)
const report = []
for (const clip of live) {
  if (!existsSync(path.join(root, clip.renderPath))) { report.push({ id: clip.id, title: clip.title, action: 'missing-file', path: clip.renderPath }); continue }
  const input = clip.renderPath
  const parsed = path.parse(input)
  const output = path.join(parsed.dir, `${maybeStripSuffix(parsed.name)}-title-clean-layer-${stamp}${parsed.ext}`)
  run('ffmpeg', ['-y','-v','error','-i',input,'-filter_complex',titleFilter(clip),'-map','[vout]','-map','0:a?','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',output])
  const first = greenStats(output, 0.1)
  const post = greenStats(output, 1.2)
  const seedBorderWarning = first.green > 9000
  if (post.green < 9000 && post.bright < 120) throw new Error(`post-title-clean border missing on ${clip.title}: ${JSON.stringify(post)}`)
  const proof = `${reviewDir}/${clip.id}-title-clean-proof.jpg`
  const sheet = `${reviewDir}/${clip.id}-contact-sheet.jpg`
  run('ffmpeg', ['-y','-v','error','-ss','1.2','-i',output,'-frames:v','1','-q:v','2',proof])
  run('ffmpeg', ['-y','-v','error','-i',output,'-vf','fps=1/6,scale=320:-1,tile=8x1','-frames:v','1','-q:v','3',sheet])
  clip.previousTitleCleanInputPath = input
  clip.renderPath = output
  clip.renderUrl = `/${output}`
  clip.renderPreset = `${String(clip.renderPreset || 'unknown').replace(/\+title-safe-zone/g, '').replace(/\+title-clean-layer/g, '')}+title-clean-layer`
  clip.titleCleanLayerFix = { fixedAt: new Date().toISOString(), previousRenderPath: input, lines: cleanHook(clip), seedClean: first, postSeedBorder: post, seedBorderWarning, method: 'fresh clean header plate from video container; no old-title blur overlay' }
  delete clip.titleSafeFix
  for (const dispatch of data.dispatchItems || []) if (dispatch.clipId === clip.id) { dispatch.renderPath = output; dispatch.updatedAt = new Date().toISOString(); dispatch.lastAuditAction = 'title-clean-layer-fixed' }
  report.push({ id: clip.id, title: clip.title, action: 'fixed', from: input, to: output, lines: cleanHook(clip), first, post, seedBorderWarning, proof, sheet })
}
data.mediaJobs = [{ id: `job_title_clean_layer_${stamp}`, type: 'render-audit', step: 'Replace broken live clip title zones with clean template layer', status: 'done', detail: `Fixed ${report.filter((r) => r.action === 'fixed').length} active clip title zones using a fresh clean header plate, removing ghosted old titles from the library.`, command: 'node scripts/fix-live-title-clean-layer-20260515T0910Z.mjs', createdAt: new Date().toISOString(), reportPath: `${reviewDir}/report.json` }, ...(data.mediaJobs || [])].slice(0, 160)
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')
await writeFile(path.join(root, `${reviewDir}/report.json`), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ fixed: report.filter((r) => r.action === 'fixed').length, reportPath: `${reviewDir}/report.json`, items: report.map((r) => ({ title: r.title, lines: r.lines, to: r.to, postGreen: r.post?.green, postBright: r.post?.bright })) }, null, 2))
