#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync, execFileSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dataPath = path.join(root, 'data/vibe-zone.json')
const stamp = '20260515T0712Z'
const seedHold = 0.55
const frameX = 32, frameY = 582, frameW = 1016, frameH = 614
const rejected = /screen-card|facecam-smart|facecam-tracked|smart-pip|lowerfill|centered-logo-fix|title-top-logo-below|logo-below-video|one-word-captions/i
const approved = /gotham-seed|confirmed-template-01|house-v3|house-v4|permanent-template|fixed-template|template-trial|thumbnail-looks-mid-template|socials-to-vps-template|restored-layout-v2|clean-no-story-overlays|upload-candidate/i
const sourceFallbacks = new Map([
  ['clip_stream2_clips_first_vps_next_house_v4b_20260515T0650Z', 'media/renders/stream-2-clips-first-vps-next-house-v4-20260515T0442Z.mp4'],
])
function run(command, args) { const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 }); if (r.status !== 0) throw new Error(`${command} failed: ${r.stderr || r.stdout}`); return r }
function q(n) { return Number(n.toFixed(2)) }
function duration(file) { return Number(run('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1', file]).stdout.trim()) || 0 }
function stats(file, at) {
  const raw = execFileSync('ffmpeg', ['-v','error','-ss',String(at),'-i',path.join(root,file),'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'], { maxBuffer: 1080 * 1920 * 3 + 1024 })
  const width = 1080; let green = 0, bright = 0, total = 0
  const pix = (x,y) => { const i = (y * width + x) * 3; return [raw[i], raw[i+1], raw[i+2]] }
  for (let x = frameX; x < frameX + frameW; x++) {
    for (let y = frameY; y < frameY + 6; y++) { const [r,g,b] = pix(x,y); total++; if (g>120 && g>r*1.25 && g>b*1.25) green++; if (r>210 && g>200 && b>120) bright++ }
    for (let y = frameY + frameH - 6; y < frameY + frameH; y++) { const [r,g,b] = pix(x,y); total++; if (g>120 && g>r*1.25 && g>b*1.25) green++; if (r>210 && g>200 && b>120) bright++ }
  }
  for (let y = frameY; y < frameY + frameH; y++) {
    for (let x = frameX; x < frameX + 6; x++) { const [r,g,b] = pix(x,y); total++; if (g>120 && g>r*1.25 && g>b*1.25) green++; if (r>210 && g>200 && b>120) bright++ }
    for (let x = frameX + frameW - 6; x < frameX + frameW; x++) { const [r,g,b] = pix(x,y); total++; if (g>120 && g>r*1.25 && g>b*1.25) green++; if (r>210 && g>200 && b>120) bright++ }
  }
  return { green, bright, total }
}
function filter(d) {
  const chains = []
  chains.push(`[0:v]drawbox=x=${frameX}:y=${frameY}:w=${frameW}:h=${frameH}:color=0x66ff00@0.70:t=5:enable='gte(t,${seedHold})',drawbox=x=${frameX+7}:y=${frameY+7}:w=${frameW-14}:h=${frameH-14}:color=white@0.20:t=2:enable='gte(t,${seedHold})',format=yuv420p[v0]`)
  let current = 0
  function moving({ sw, sh, color, xExpr, yExpr, start, end }) {
    const c = `c${current}`, next = current + 1
    chains.push(`color=c=${color}:s=${sw}x${sh}:r=30:d=${d},format=rgba[${c}]`)
    chains.push(`[v${current}][${c}]overlay=x='${xExpr}':y='${yExpr}':enable='between(t,${q(start)},${q(end)})'[v${next}]`)
    current = next
  }
  for (const start of [0.85,5.7,11.8,15.6,21.2,27,33,39].filter(t => t < d - 0.8)) {
    const a=start,b=start+0.62,c=start+1.24,dd=start+1.86,e=start+2.48
    moving({ sw:360, sh:26, color:'0xfff3a0@0.62', xExpr:`${frameX}-180+((t-${a})/${b-a})*${frameW+360}`, yExpr:`${frameY-11}`, start:a, end:b })
    moving({ sw:120, sh:16, color:'white@0.96', xExpr:`${frameX}-60+((t-${a})/${b-a})*${frameW+120}`, yExpr:`${frameY-6}`, start:a, end:b })
    moving({ sw:26, sh:360, color:'0xfff3a0@0.62', xExpr:`${frameX+frameW-13}`, yExpr:`${frameY}-180+((t-${b})/${c-b})*${frameH+360}`, start:b, end:c })
    moving({ sw:16, sh:120, color:'white@0.96', xExpr:`${frameX+frameW-8}`, yExpr:`${frameY}-60+((t-${b})/${c-b})*${frameH+120}`, start:b, end:c })
    moving({ sw:360, sh:26, color:'0xfff3a0@0.62', xExpr:`${frameX+frameW}-180-((t-${c})/${dd-c})*${frameW+360}`, yExpr:`${frameY+frameH-13}`, start:c, end:dd })
    moving({ sw:120, sh:16, color:'white@0.96', xExpr:`${frameX+frameW}-60-((t-${c})/${dd-c})*${frameW+120}`, yExpr:`${frameY+frameH-8}`, start:c, end:dd })
    moving({ sw:26, sh:360, color:'0xfff3a0@0.62', xExpr:`${frameX-13}`, yExpr:`${frameY+frameH}-180-((t-${dd})/${e-dd})*${frameH+360}`, start:dd, end:e })
    moving({ sw:16, sh:120, color:'white@0.96', xExpr:`${frameX-8}`, yExpr:`${frameY+frameH}-60-((t-${dd})/${e-dd})*${frameH+120}`, start:dd, end:e })
  }
  return { vf: chains.join(';'), label: `[v${current}]` }
}
await mkdir(path.join(root, 'media/reviews/retention-clean-seed-20260515T0712Z'), { recursive: true })
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const clips = (data.clips || []).filter(c => c.renderPath && !['uploaded','archived','superseded'].includes(String(c.status || '')) && approved.test(c.renderPath) && !rejected.test(c.renderPath)).slice(0, 24)
const report = []
for (const clip of clips) {
  const src = clip.retentionFix?.previousRenderPath || clip.previousRenderPath || sourceFallbacks.get(clip.id) || clip.renderPath
  if (!existsSync(path.join(root, src))) { report.push({ id: clip.id, title: clip.title, action: 'missing-source', src }); continue }
  const parsed = path.parse(clip.renderPath)
  const out = path.join(parsed.dir, `${parsed.name.replace(/-retention-fixed-\d{8}T\d{4}Z$/, '')}-retention-cleanseed-${stamp}${parsed.ext}`)
  const d = duration(src)
  const { vf, label } = filter(d)
  run('ffmpeg', ['-y','-v','error','-i',src,'-filter_complex',vf,'-map',label,'-map','0:a?','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',out])
  const first = stats(out, 0.1), post = stats(out, 1.2), steady = stats(out, 8)
  if (first.green > 9000) throw new Error(`seed still has border for ${clip.title}: ${JSON.stringify(first)}`)
  if (post.green < 9000 || Math.max(post.bright, steady.bright) < 120) throw new Error(`post-seed retention missing for ${clip.title}: ${JSON.stringify({ post, steady })}`)
  run('ffmpeg', ['-y','-v','error','-i',out,'-vf','fps=1/6,scale=320:-1,tile=8x1','-frames:v','1','-q:v','3',`media/reviews/retention-clean-seed-20260515T0712Z/${clip.id}-contact-sheet.jpg`])
  clip.previousRenderPath ||= src
  clip.renderPath = out
  clip.renderUrl = `/${out}`
  clip.renderPreset = `${String(clip.renderPreset || 'unknown').replace(/\+confirmed-template-retention-border-shine/g, '')}+clean-seed+confirmed-template-retention-border-shine`
  clip.retentionFix = { fixedAt: new Date().toISOString(), previousRenderPath: src, seedClean: first, postSeed: post, steady }
  for (const dispatch of data.dispatchItems || []) if (dispatch.clipId === clip.id) { dispatch.renderPath = out; dispatch.updatedAt = new Date().toISOString(); dispatch.lastAuditAction = 'clean-seed-retention-border-after-thumbnail' }
  report.push({ id: clip.id, title: clip.title, action: 'clean-seed-fixed', src, out, first, post, steady })
}
data.mediaJobs = [{ id: `job_retention_clean_seed_${stamp}`, type:'render-audit', step:'Keep thumbnail seed clean; start retention border after seed', status:'done', detail:`Cleaned seed thumbnail area for ${report.length} live clip(s); border+shine starts after ${seedHold}s.`, command:'node scripts/fix-live-retention-clean-seed-20260515T0712Z.mjs', createdAt:new Date().toISOString(), reportPath:'media/reviews/retention-clean-seed-20260515T0712Z/report.json' }, ...(data.mediaJobs || [])].slice(0,160)
await writeFile(dataPath, JSON.stringify(data,null,2)+'\n')
await writeFile(path.join(root,'media/reviews/retention-clean-seed-20260515T0712Z/report.json'), JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({ fixed: report.length, reportPath:'media/reviews/retention-clean-seed-20260515T0712Z/report.json', items: report.map(r => ({ title:r.title, firstGreen:r.first.green, postGreen:r.post.green, out:r.out })) }, null, 2))
