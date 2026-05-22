#!/usr/bin/env node
throw new Error('Superseded unsafe repair script. Do not blur/crop existing title zones; it leaves ghost titles. Use scripts/fix-live-title-clean-layer-20260515T0910Z.mjs or the canonical template renderer instead.')
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync, execFileSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dataPath = path.join(root, 'data/vibe-zone.json')
const stamp = '20260515T0802Z'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const seedHold = 0.55
const headerH = 310
const frameX = 32, frameY = 582, frameW = 1016, frameH = 614

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (r.status !== 0) throw new Error(`${command} failed: ${r.stderr || r.stdout}`)
  return r
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
function cleanHook(clip) {
  const raw = String(clip.hook || clip.title || '').toUpperCase().replace(/\s+/g, ' ').trim()
  const words = raw.split(' ').filter(Boolean)
  if (String(clip.hook || '').includes('\n')) return String(clip.hook).toUpperCase().split(/\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 2)
  if (words.length >= 4) return [words.slice(0, 2).join(' '), words.slice(2).join(' ')]
  if (raw.length > 15 && words.length >= 3) return [words.slice(0, 2).join(' '), words.slice(2).join(' ')]
  return [raw]
}
function titleFilter(clip) {
  const lines = cleanHook(clip)
  const text = lines.join('\n')
  const fontSize = lines.length > 1 ? 72 : (text.length > 16 ? 68 : 76)
  const y = lines.length > 1 ? 74 : 104
  const lineSpacing = lines.length > 1 ? -8 : 0
  return [
    `[0:v]split=2[base][topsrc]`,
    `[topsrc]crop=1080:${headerH}:0:0,boxblur=30:2,eq=brightness=0.03:saturation=0.92[topclean]`,
    `[base][topclean]overlay=0:0:enable='gte(t,${seedHold})'[cleantop]`,
    `[cleantop]drawtext=fontfile='${fontBold}':text='${esc(text)}':x=(w-text_w)/2:y=${y}:fontcolor=white:fontsize=${fontSize}:line_spacing=${lineSpacing}:borderw=7:bordercolor=black@0.84:enable='gte(t,${seedHold})'[vout]`,
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

await mkdir(path.join(root, 'media/reviews/title-safe-zone-20260515T0802Z'), { recursive: true })
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const live = (data.clips || []).filter((clip) => clip.renderPath && !['uploaded','archived','superseded'].includes(String(clip.status || ''))).slice(0, 24)
const report = []
for (const clip of live) {
  if (!existsSync(path.join(root, clip.renderPath))) { report.push({ id: clip.id, title: clip.title, action: 'missing-file', path: clip.renderPath }); continue }
  const input = clip.renderPath
  const parsed = path.parse(input)
  const baseName = parsed.name.replace(/-title-safe-\d{8}T\d{4}Z$/, '')
  const output = path.join(parsed.dir, `${baseName}-title-safe-${stamp}${parsed.ext}`)
  const vf = titleFilter(clip)
  run('ffmpeg', ['-y','-v','error','-i',input,'-filter_complex',vf,'-map','[vout]','-map','0:a?','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',output])
  const first = greenStats(output, 0.1)
  const post = greenStats(output, 1.2)
  if (first.green > 9000) throw new Error(`thumbnail seed got retention border on ${clip.title}: ${JSON.stringify(first)}`)
  if (post.green < 9000 && post.bright < 120) throw new Error(`post-title-fix border missing on ${clip.title}: ${JSON.stringify(post)}`)
  run('ffmpeg', ['-y','-v','error','-ss','1.2','-i',output,'-frames:v','1','-q:v','2',`media/reviews/title-safe-zone-20260515T0802Z/${clip.id}-title-proof.jpg`])
  run('ffmpeg', ['-y','-v','error','-i',output,'-vf','fps=1/6,scale=320:-1,tile=8x1','-frames:v','1','-q:v','3',`media/reviews/title-safe-zone-20260515T0802Z/${clip.id}-contact-sheet.jpg`])
  clip.previousTitleRenderPath = input
  clip.renderPath = output
  clip.renderUrl = `/${output}`
  clip.renderPreset = `${String(clip.renderPreset || 'unknown').replace(/\+title-safe-zone/g, '')}+title-safe-zone`
  clip.titleSafeFix = { fixedAt: new Date().toISOString(), previousRenderPath: input, lines: cleanHook(clip), seedClean: first, postSeedBorder: post }
  for (const dispatch of data.dispatchItems || []) if (dispatch.clipId === clip.id) { dispatch.renderPath = output; dispatch.updatedAt = new Date().toISOString(); dispatch.lastAuditAction = 'top-title-safe-zone-fixed' }
  report.push({ id: clip.id, title: clip.title, action: 'fixed', from: input, to: output, lines: cleanHook(clip), first, post })
}
data.mediaJobs = [{ id: `job_title_safe_zone_${stamp}`, type: 'render-audit', step: 'Fix live clip top title safe zone', status: 'done', detail: `Redrew smaller safe-margin top titles for ${report.filter((r) => r.action === 'fixed').length} live clip(s); seed thumbnails and retention border verified.`, command: 'node scripts/fix-live-title-safe-zone-20260515T0802Z.mjs', createdAt: new Date().toISOString(), reportPath: 'media/reviews/title-safe-zone-20260515T0802Z/report.json' }, ...(data.mediaJobs || [])].slice(0, 160)
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')
await writeFile(path.join(root, 'media/reviews/title-safe-zone-20260515T0802Z/report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ fixed: report.filter((r) => r.action === 'fixed').length, reportPath: 'media/reviews/title-safe-zone-20260515T0802Z/report.json', items: report.map((r) => ({ title: r.title, lines: r.lines, to: r.to, postGreen: r.post?.green })) }, null, 2))
