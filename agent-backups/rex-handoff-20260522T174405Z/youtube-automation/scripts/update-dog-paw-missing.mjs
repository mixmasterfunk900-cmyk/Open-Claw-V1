import fs from 'node:fs'
import path from 'node:path'

const prep = path.resolve('projects/dog-paw-psychology/full_video_prep')
const plan = JSON.parse(fs.readFileSync(path.join(prep, 'visual_plan.json'), 'utf8'))
const beats = plan.beats || plan
const approvedDir = path.join(prep, 'approved_frames')
const missing = beats.filter((beat) => !fs.existsSync(path.join(approvedDir, beat.frame_filename)))
const rows = [
  'id,start,end,frame_filename,narration',
  ...missing.map((beat) => [beat.id, beat.start, beat.end, beat.frame_filename, JSON.stringify(beat.narration)].join(',')),
]
fs.writeFileSync(path.join(prep, 'missing_frames_remaining.csv'), rows.join('\n'))
console.log(JSON.stringify({ total: beats.length, approved: beats.length - missing.length, missing: missing.length, next: missing[0]?.id ?? null, nextNarration: missing[0]?.narration ?? null }, null, 2))
