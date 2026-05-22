import { readdir, stat } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const workspace = path.resolve(root, '..')
const laneRoot = path.join(root, 'media/practice/youtube-automation/dog-content')
const youtubeProjects = path.join(workspace, 'youtube-automation/projects')
const frameGate = path.join(workspace, 'youtube-automation/scripts/check_dog_frame_quality.mjs')
const visualSopGate = path.join(workspace, 'youtube-automation/scripts/check_dog_visual_sop.mjs')
const failures = []
const rows = []

const exists = async (file) => {
  try { return (await stat(file)).isFile() } catch { return false }
}

const walk = async (dir) => {
  const out = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) out.push(...await walk(full))
      else out.push(full)
    }
  } catch {}
  return out
}

const visibleReviewVideos = (await walk(laneRoot))
  .filter((file) => /audio-truth-captioned.*\.mp4$/i.test(file))
  .filter((file) => !file.includes('/_') && !file.includes('/debug') && !file.includes('/archive'))

const laneEntries = await readdir(laneRoot, { withFileTypes: true })
const projectSlugs = laneEntries
  .filter((entry) => entry.isDirectory() && entry.name !== 'transcripts' && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .sort()
const videosBySlug = new Map()
for (const video of visibleReviewVideos) {
  const rel = path.relative(laneRoot, video)
  const slug = rel.split(path.sep)[0]
  if (!videosBySlug.has(slug)) videosBySlug.set(slug, video)
}

for (const slug of projectSlugs) {
  const video = videosBySlug.get(slug)
  if (!video) {
    failures.push(`${slug}: missing visible audio-truth captioned review video`)
    continue
  }
  const prep = path.join(youtubeProjects, slug, 'full_video_prep')
  const audit = path.join(prep, 'audio_truth_render_audit.json')
  const frames = path.join(prep, 'approved_frames')
  if (!await exists(audit)) {
    failures.push(`${slug}: missing audio_truth_render_audit.json`)
    continue
  }
  const auditJson = JSON.parse(await import('node:fs/promises').then((fs) => fs.readFile(audit, 'utf8')))
  if (auditJson.timingMethod !== 'exact-token-walk-from-whisper-word-timestamps') failures.push(`${slug}: wrong timing method ${auditJson.timingMethod}`)
  if (auditJson.captionMode !== 'soft-mp4-mov_text-subtitle-track-no-burned-captions') failures.push(`${slug}: captions are not soft subtitle track / no-burn mode (${auditJson.captionMode || 'missing'})`)
  const productionVideo = auditJson.output || path.join(prep, `${slug}-audio-truth-captioned.mp4`)
  const slugReviewFiles = (await walk(path.join(laneRoot, slug))).filter((file) => /site-visible-captions\.mp4$/i.test(file))
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 's', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', productionVideo], { encoding: 'utf8' })
  if (probe.status !== 0 || !probe.stdout.includes('mov_text')) failures.push(`${slug}: clean production master missing mov_text subtitle stream`)
  if (!slugReviewFiles.length) failures.push(`${slug}: missing browser/site-visible burned-caption review copy`)
  if (!(auditJson.captions > auditJson.beats * 1.35)) failures.push(`${slug}: caption count looks beat/image-based (${auditJson.captions} captions for ${auditJson.beats} beats)`)
  if (auditJson.wordRatio < 0.92 || auditJson.wordRatio > 1.08) failures.push(`${slug}: wordRatio out of range ${auditJson.wordRatio}`)
  if (auditJson.avgBeatAlignmentScore !== undefined && auditJson.avgBeatAlignmentScore < 0.86) failures.push(`${slug}: avgBeatAlignmentScore too low ${auditJson.avgBeatAlignmentScore}`)
  const gate = spawnSync(process.execPath, [frameGate, frames, String(auditJson.beats)], { encoding: 'utf8' })
  if (gate.status !== 0) failures.push(`${slug}: frame quality gate failed\n${gate.stderr || gate.stdout}`)
  const visualGate = spawnSync(process.execPath, [visualSopGate, frames, String(auditJson.beats)], { encoding: 'utf8' })
  if (visualGate.status !== 0) failures.push(`${slug}: visual SOP gate failed\n${visualGate.stderr || visualGate.stdout}`)
  rows.push({ slug, video: path.relative(root, video), beats: auditJson.beats, captions: auditJson.captions, frameGate: gate.status === 0 ? 'pass' : 'fail', visualSopGate: visualGate.status === 0 ? 'pass' : 'fail' })
}

console.log('Dog Content production-ready gate')
for (const row of rows) console.log(`- ${row.slug}: ${row.beats} beats, ${row.captions} captions, frameGate=${row.frameGate}, visualSopGate=${row.visualSopGate}, ${row.video}`)
if (!rows.length) console.log('- no visible audio-truth review videos found')
if (failures.length) {
  console.error('\nFAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('PASS')
