import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const prep = path.resolve('projects/dog-paw-psychology/full_video_prep')
const plan = JSON.parse(fs.readFileSync(path.join(prep, 'visual_plan.json'), 'utf8'))
const beats = plan.beats || plan
const approvedDir = path.join(prep, 'approved_frames')
const voiceover = path.join(prep, 'voiceover_drop', 'final_voiceover.wav.wav')
const output = path.join(prep, 'dog_paw_full_preview.mp4')
const concatFile = path.join(prep, 'frames_concat.txt')

const missing = beats.filter((beat) => !fs.existsSync(path.join(approvedDir, beat.frame_filename)))
if (missing.length) {
  console.error(`Missing ${missing.length} frames; next ${missing[0].id} ${missing[0].frame_filename}`)
  process.exit(1)
}
if (!fs.existsSync(voiceover)) {
  console.error(`Missing voiceover: ${voiceover}`)
  process.exit(1)
}

const lines = []
for (const beat of beats) {
  const frame = path.join(approvedDir, beat.frame_filename).replaceAll("'", "'\\''")
  const duration = Number(beat.duration_seconds_est) || Math.max(0.1, Number(beat.end_seconds_est) - Number(beat.start_seconds_est)) || 5
  lines.push(`file '${frame}'`)
  lines.push(`duration ${duration.toFixed(3)}`)
}
const lastFrame = path.join(approvedDir, beats.at(-1).frame_filename).replaceAll("'", "'\\''")
lines.push(`file '${lastFrame}'`)
fs.writeFileSync(concatFile, lines.join('\n'))

const args = [
  '-y',
  '-f', 'concat', '-safe', '0', '-i', concatFile,
  '-i', voiceover,
  '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
  '-r', '30',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
  '-c:a', 'aac', '-b:a', '192k',
  '-shortest',
  output,
]
const result = spawnSync('ffmpeg', args, { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status ?? 1)
console.log(JSON.stringify({ output }, null, 2))
