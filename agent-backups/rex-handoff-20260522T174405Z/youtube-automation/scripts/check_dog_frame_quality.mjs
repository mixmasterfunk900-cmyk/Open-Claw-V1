import fs from 'node:fs'
import path from 'node:path'

const usage = `Usage:
  node scripts/check_dog_frame_quality.mjs <approved-frames-dir> [expected-count]

Fails placeholder/storyboard frame sets before render. This is intentionally conservative: Dog Content review videos must use real image-generation frames, not tiny programmatic vector placeholders.`

const [dirArg, expectedArg] = process.argv.slice(2)
if (!dirArg) {
  console.error(usage)
  process.exit(1)
}

const dir = path.resolve(dirArg)
const expectedCount = expectedArg ? Number(expectedArg) : null
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`Frame quality gate failed: missing approved frame directory ${dir}`)
  process.exit(1)
}

const files = fs.readdirSync(dir)
  .filter((name) => /\.(png|jpg|jpeg|webp)$/i.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((name) => ({ name, path: path.join(dir, name), size: fs.statSync(path.join(dir, name)).size }))

const failures = []
if (!files.length) failures.push('no approved image frames found')
if (expectedCount !== null && Number.isFinite(expectedCount) && files.length !== expectedCount) failures.push(`frame count ${files.length} does not match expected beat count ${expectedCount}`)

const sizes = files.map((file) => file.size)
const avgSize = sizes.reduce((sum, size) => sum + size, 0) / Math.max(1, sizes.length)
const minSize = Math.min(...sizes)
const tinyFrames = files.filter((file) => file.size < 300_000)
const likelyStoryboard = avgSize < 500_000 || tinyFrames.length > Math.ceil(files.length * 0.05)

if (likelyStoryboard) {
  failures.push(`frames look like storyboard/placeholders, not real image-gen frames: avg=${Math.round(avgSize)} bytes, min=${minSize} bytes, tinyFrames=${tinyFrames.length}/${files.length}`)
}

const manifestPath = path.join(path.dirname(dir), 'frame_generation_manifest.json')
let manifest = null
if (fs.existsSync(manifestPath)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) } catch {}
}
if (!manifest) {
  failures.push(`missing frame_generation_manifest.json next to approved_frames; real image-gen provider/model must be recorded`)
} else {
  const provider = String(manifest.provider || manifest.model || '').toLowerCase()
  const source = String(manifest.source || manifest.generator || '').toLowerCase()
  if (!/(openai|gpt-image|chatgpt|google|gemini)/.test(provider + ' ' + source)) failures.push(`frame manifest does not record a real image-generation provider/model`)
  if (manifest.frameCount !== undefined && Number(manifest.frameCount) !== files.length) failures.push(`manifest frameCount ${manifest.frameCount} does not match approved frames ${files.length}`)
  const uniqueGenerated = Number(manifest.uniqueGeneratedSourceFrames ?? manifest.frameCount ?? files.length)
  const minUnique = Math.max(20, Math.ceil(files.length * 0.75))
  if (uniqueGenerated < minUnique) failures.push(`not enough unique real image-generation frames: uniqueGeneratedSourceFrames=${uniqueGenerated}, required>=${minUnique} for ${files.length} beats`)
  if (manifest.sourceFrameReuse && uniqueGenerated < files.length) failures.push(`manifest reports frame reuse: ${manifest.sourceFrameReuse}`)
  if (manifest.storyboard === true || manifest.placeholder === true) failures.push('manifest marks frames as storyboard/placeholder')
}

const report = {
  dir,
  frames: files.length,
  expectedCount,
  avgSize: Math.round(avgSize),
  minSize,
  maxSize: Math.max(...sizes),
  tinyFrames: tinyFrames.length,
  manifestPath,
  provider: manifest?.provider || manifest?.model || null,
  status: failures.length ? 'fail' : 'pass',
  failures,
}

if (failures.length) {
  console.error('Dog frame quality gate FAIL')
  console.error(JSON.stringify(report, null, 2))
  process.exit(1)
}

console.log('Dog frame quality gate PASS')
console.log(JSON.stringify(report, null, 2))
