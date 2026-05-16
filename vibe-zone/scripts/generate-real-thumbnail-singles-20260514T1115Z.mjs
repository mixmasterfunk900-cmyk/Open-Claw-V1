#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data/vibe-zone.json')
const outDir = 'media/thumbnails/generated-single-20260514T1115Z'
const font = 'media/assets/fonts/LilitaOne-Regular.ttf'
await mkdir(path.join(root, outDir), { recursive: true })
const db = JSON.parse(await readFile(dbPath, 'utf8'))
const concepts = db.thumbnailConcepts || []
const groups = new Map()
for (const concept of concepts) {
  const key = `${concept.sourceTitle || 'video'}|${concept.sourceVideoPath || ''}`
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(concept)
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 50 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function slug(value) { return String(value || 'thumb').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'thumb' }
function esc(value) { return String(value || '').replaceAll('\\', '\\\\').replaceAll(':', '\\:').replaceAll("'", "\\'") }
function duration(file) {
  const r = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file])
  return Number(r.stdout.trim()) || 60
}
function lines(text) {
  const words = String(text || 'THUMBNAIL').trim().split(/\s+/).filter(Boolean)
  if (words.length <= 2) return [words.join(' ')]
  if (words.length === 3) return [words.slice(0, 2).join(' '), words[2]]
  return [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
}
function palette(index) {
  const sets = [
    { accent: '0x66ff00', dark: '0x050505', text: 'white' },
    { accent: '0xff2d55', dark: '0x090014', text: 'white' },
    { accent: '0x00d4ff', dark: '0x03111f', text: 'white' },
    { accent: '0xffcc00', dark: '0x160b00', text: 'black' },
  ]
  return sets[index % sets.length]
}
const updated = []
for (const [, group] of groups) {
  const video = group[0].sourceVideoPath
  if (!video) continue
  const dur = duration(video)
  group.forEach((concept, index) => {
    const p = palette(index)
    const ss = Math.max(2, Math.min(dur - 2, dur * ((index + 1) / (group.length + 1))))
    const titleLines = lines(concept.thumbnailText || concept.title)
    const y0 = titleLines.length > 1 ? 84 : 138
    const drawLines = titleLines.map((line, lineIndex) => `drawtext=fontfile='${font}':text='${esc(line.toUpperCase())}':x=56:y=${y0 + lineIndex * 118}:fontsize=${titleLines.length > 1 ? 106 : 122}:fontcolor=${p.text}:borderw=7:bordercolor=black@0.72`).join(',')
    const output = `${outDir}/${slug(concept.sourceTitle)}-${String(index + 1).padStart(2, '0')}-${slug(concept.thumbnailText)}.jpg`
    const vf = `scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,boxblur=8:2,eq=brightness=-0.04:saturation=1.2,drawbox=x=0:y=0:w=1280:h=720:color=black@0.18:t=fill,drawbox=x=34:y=56:w=720:h=330:color=${p.dark}@0.58:t=fill,drawbox=x=34:y=56:w=720:h=330:color=${p.accent}@0.95:t=8,${drawLines},drawbox=x=792:y=430:w=390:h=130:color=black@0.32:t=fill,drawtext=fontfile='${font}':text='${esc((concept.emotion || 'BIG REACTION').toUpperCase().slice(0, 18))}':x=820:y=462:fontsize=48:fontcolor=${p.accent}:borderw=4:bordercolor=black@0.7`
    run('ffmpeg', ['-y', '-v', 'error', '-ss', String(ss), '-i', video, '-frames:v', '1', '-vf', vf, '-q:v', '2', output])
    concept.imageUrl = output
    concept.updatedAt = new Date().toISOString()
    updated.push({ id: concept.id, imageUrl: output })
  })
}
db.mediaJobs = db.mediaJobs || []
db.mediaJobs.unshift({ id: `media_job_${Date.now()}_real_single_thumbnails`, step: 'Generate single-thumbnail assets', status: 'done', detail: `Generated ${updated.length} individual 16:9 thumbnail images so Thumbnail Lab no longer uses four-up/contact-sheet images.`, command: 'node scripts/generate-real-thumbnail-singles-20260514T1115Z.mjs', createdAt: new Date().toISOString() })
db.mediaJobs = db.mediaJobs.slice(0, 100)
await writeFile(dbPath, JSON.stringify(db, null, 2))
console.log(JSON.stringify({ updated: updated.length, outDir, samples: updated.slice(0, 4) }, null, 2))
