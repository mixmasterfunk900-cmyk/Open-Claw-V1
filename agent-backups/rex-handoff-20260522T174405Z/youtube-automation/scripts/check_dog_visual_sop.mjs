import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const usage = `Usage:
  node scripts/check_dog_visual_sop.mjs <project-or-approved-frames-dir> [expected-count]

Hard visual SOP gate for Dog Psychology Automation. Blocks contact-sheet/multi-panel frames, batch/provenance drift, and missing visual QA audits.`

const [targetArg, expectedArg] = process.argv.slice(2)
if (!targetArg) {
  console.error(usage)
  process.exit(1)
}

const target = path.resolve(targetArg)
const dir = fs.existsSync(path.join(target, 'full_video_prep', 'approved_frames'))
  ? path.join(target, 'full_video_prep', 'approved_frames')
  : fs.existsSync(path.join(target, 'approved_frames'))
    ? path.join(target, 'approved_frames')
    : target
const prep = path.dirname(dir)
const expectedCount = expectedArg ? Number(expectedArg) : null
const failures = []
const warnings = []

if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`Dog visual SOP gate failed: missing approved frame directory ${dir}`)
  process.exit(1)
}

const files = fs.readdirSync(dir)
  .filter((name) => /\.(png|jpg|jpeg|webp)$/i.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((name) => path.join(dir, name))

if (!files.length) failures.push('no approved frames found')
if (expectedCount !== null && Number.isFinite(expectedCount) && files.length !== expectedCount) failures.push(`frame count ${files.length} does not match expected beat count ${expectedCount}`)

const manifestPath = path.join(prep, 'frame_generation_manifest.json')
let manifest = null
if (fs.existsSync(manifestPath)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) } catch (error) { failures.push(`frame_generation_manifest.json is not valid JSON: ${error.message}`) }
} else {
  failures.push('missing frame_generation_manifest.json')
}

if (manifest) {
  if (manifest.styleContract && manifest.styleContract !== 'dog-psychology-v1') failures.push(`unexpected styleContract ${manifest.styleContract}`)
  if (!manifest.styleContract) failures.push('manifest missing styleContract="dog-psychology-v1"')
  const sourceFiles = Array.isArray(manifest.sourceFiles) ? manifest.sourceFiles.map(String) : []
  const batchSources = sourceFiles.filter((file) => /batch[-_]?\d+[-_]\d+/i.test(file))
  if (batchSources.length) failures.push(`manifest source files look like multi-beat batch generations (${batchSources.length}); generate and map one single-scene image per beat instead`)
  if (!Array.isArray(manifest.beats) && !manifest.perBeat && !manifest.beatSources) failures.push('manifest missing per-beat provenance map (beats/perBeat/beatSources)')
}

function ffprobeSize(file) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], { encoding: 'utf8' })
  if (probe.status !== 0) return null
  const [width, height] = probe.stdout.trim().split(',').map(Number)
  return { width, height }
}

function rawScaled(file) {
  const result = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'scale=320:180,format=rgb24', '-f', 'rawvideo', '-'], { encoding: null, maxBuffer: 320 * 180 * 3 + 4096 })
  if (result.status !== 0) return null
  return result.stdout
}

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b
function whiteBandRatio(buf, kind) {
  const width = 320
  const height = 180
  let bright = 0
  let total = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (kind === 'vertical' && Math.abs(x - width / 2) > 6) continue
      if (kind === 'horizontal' && Math.abs(y - height / 2) > 6) continue
      const index = (y * width + x) * 3
      const r = buf[index]
      const g = buf[index + 1]
      const b = buf[index + 2]
      const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 35
      if (lum(r, g, b) > 232 && neutral) bright += 1
      total += 1
    }
  }
  return total ? bright / total : 0
}

const non16x9 = []
const multiPanel = []
for (const file of files) {
  const size = ffprobeSize(file)
  if (!size) {
    failures.push(`could not inspect frame ${path.basename(file)}`)
    continue
  }
  const aspect = size.width / size.height
  if (Math.abs(aspect - (16 / 9)) > 0.015) non16x9.push(`${path.basename(file)}:${size.width}x${size.height}`)
  const raw = rawScaled(file)
  if (!raw) continue
  const vertical = whiteBandRatio(raw, 'vertical')
  const horizontal = whiteBandRatio(raw, 'horizontal')
  if (vertical > 0.14 && horizontal > 0.14) multiPanel.push({ file: path.basename(file), vertical: Number(vertical.toFixed(3)), horizontal: Number(horizontal.toFixed(3)) })
}

if (non16x9.length) failures.push(`frames are not 16:9: ${non16x9.slice(0, 10).join(', ')}${non16x9.length > 10 ? ` (+${non16x9.length - 10} more)` : ''}`)
if (multiPanel.length) failures.push(`detected ${multiPanel.length} likely contact-sheet / 2x2 / multi-panel frames: ${multiPanel.slice(0, 12).map((item) => item.file).join(', ')}${multiPanel.length > 12 ? ` (+${multiPanel.length - 12} more)` : ''}`)

const visualAuditPath = path.join(prep, 'visual_sop_audit.json')
let visualAudit = null
if (fs.existsSync(visualAuditPath)) {
  try { visualAudit = JSON.parse(fs.readFileSync(visualAuditPath, 'utf8')) } catch (error) { failures.push(`visual_sop_audit.json is not valid JSON: ${error.message}`) }
} else {
  failures.push('missing visual_sop_audit.json; contact-sheet/script-progression SOP review is required before production')
}
if (visualAudit) {
  if (visualAudit.status !== 'pass') failures.push(`visual_sop_audit status is ${visualAudit.status || 'missing'}, not pass`)
  const required = ['singleSceneFrames', 'styleMatchesBible', 'characterContinuity', 'scriptMatchedProgression', 'noForbiddenGraphics']
  for (const key of required) if (visualAudit[key] !== true) failures.push(`visual_sop_audit.${key} must be true`)
}

const projectSlug = path.basename(path.dirname(prep))
const thumbnailDirCandidates = [
  path.join(path.dirname(prep), 'thumbnails'),
  path.join(process.cwd(), 'media/practice/youtube-automation/dog-content', projectSlug, 'thumbnails'),
  path.join(path.resolve(process.cwd(), '..'), 'vibe-zone/media/practice/youtube-automation/dog-content', projectSlug, 'thumbnails'),
]
const thumbnailDir = thumbnailDirCandidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory())
if (thumbnailDir) {
  const thumbnails = fs.readdirSync(thumbnailDir).filter((name) => /\.(png|jpg|jpeg|webp)$/i.test(name))
  if (thumbnails.length) {
    const thumbAuditPath = path.join(thumbnailDir, 'thumbnail_sop_audit.json')
    if (!fs.existsSync(thumbAuditPath)) failures.push(`missing thumbnail_sop_audit.json in ${thumbnailDir}; thumbnails must be checked against Dog Content thumbnail style`)
    else {
      try {
        const audit = JSON.parse(fs.readFileSync(thumbAuditPath, 'utf8'))
        if (audit.status !== 'pass') failures.push(`thumbnail_sop_audit status is ${audit.status || 'missing'}, not pass`)
        for (const key of ['singleThumbnailImages', 'styleMatchesBible', 'coherentDogIdentity', 'readableIntentionalText', 'noContactSheets']) {
          if (audit[key] !== true) failures.push(`thumbnail_sop_audit.${key} must be true`)
        }
      } catch (error) { failures.push(`thumbnail_sop_audit.json is not valid JSON: ${error.message}`) }
    }
  } else warnings.push(`thumbnail directory exists but no image thumbnails found: ${thumbnailDir}`)
}

const report = {
  status: failures.length ? 'fail' : 'pass',
  dir,
  frames: files.length,
  expectedCount,
  multiPanelFrames: multiPanel,
  non16x9,
  manifestPath,
  visualAuditPath,
  thumbnailDir: thumbnailDir || null,
  failures,
  warnings,
}

if (failures.length) {
  console.error('Dog visual SOP gate FAIL')
  console.error(JSON.stringify(report, null, 2))
  process.exit(1)
}
console.log('Dog visual SOP gate PASS')
console.log(JSON.stringify(report, null, 2))
