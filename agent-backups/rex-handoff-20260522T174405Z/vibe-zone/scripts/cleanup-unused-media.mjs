import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const manifestPath = path.join(root, 'POST_READY_REVIEW_MANIFEST.md')
const apply = process.argv.includes('--apply')
const includeLongForm = process.argv.includes('--include-long-form')
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
const archiveRoot = path.join(root, 'media', 'archive', `cleanup-${timestamp}`)

function unique(items) { return [...new Set(items)] }
function isSafeRelative(value) {
  return value && !value.startsWith('/') && !value.includes('..') && value.startsWith('media/')
}
function isLongFormRender(value) {
  return value === 'media/renders/long-form' || value.startsWith('media/renders/long-form/')
}

const manifest = await readFile(manifestPath, 'utf8')
const skipSection = manifest.split('## SKIP / DUPLICATE / TEMP')[1] || ''
const manifestPaths = unique([...skipSection.matchAll(/`([^`]+)`/g)].map((match) => match[1]).filter(isSafeRelative))
const excluded = includeLongForm ? [] : manifestPaths.filter(isLongFormRender)
const paths = includeLongForm ? manifestPaths : manifestPaths.filter((rel) => !isLongFormRender(rel))
const moved = []
const missing = []
const errors = []

if (apply) await mkdir(archiveRoot, { recursive: true })

for (const rel of paths) {
  const source = path.join(root, rel)
  const info = await stat(source).catch(() => null)
  if (!info) { missing.push(rel); continue }
  const dest = path.join(archiveRoot, rel)
  if (apply) {
    try {
      await mkdir(path.dirname(dest), { recursive: true })
      await rename(source, dest)
      moved.push({ path: rel, bytes: info.size, archivedTo: path.relative(root, dest) })
    } catch (error) {
      errors.push({ path: rel, error: error.message })
    }
  } else {
    moved.push({ path: rel, bytes: info.size, archivedTo: path.relative(root, dest) })
  }
}

const totalBytes = moved.reduce((sum, item) => sum + (item.bytes || 0), 0)
const report = {
  generatedAt: new Date().toISOString(),
  mode: apply ? 'apply' : 'dry-run',
  manifest: path.relative(root, manifestPath),
  archiveRoot: path.relative(root, archiveRoot),
  includeLongForm,
  movedCount: moved.length,
  missingCount: missing.length,
  excludedCount: excluded.length,
  errorCount: errors.length,
  totalBytes,
  moved,
  missing,
  excluded,
  errors,
}
const reportPath = apply ? path.join(archiveRoot, 'cleanup-report.json') : path.join(root, 'media', 'archive', `cleanup-${timestamp}-dry-run.json`)
await mkdir(path.dirname(reportPath), { recursive: true })
await writeFile(reportPath, JSON.stringify(report, null, 2))
console.log(`${apply ? 'Archived' : 'Would archive'} ${moved.length} unused media artifacts (${(totalBytes / 1024 / 1024).toFixed(1)} MB).`)
console.log(`Report: ${path.relative(root, reportPath)}`)
if (missing.length) console.log(`Missing/skipped already absent: ${missing.length}`)
if (excluded.length) console.log(`Excluded long-form render paths: ${excluded.length} (use --include-long-form to opt in)`)
if (errors.length) {
  console.error(`Errors: ${errors.length}`)
  process.exitCode = 1
}
