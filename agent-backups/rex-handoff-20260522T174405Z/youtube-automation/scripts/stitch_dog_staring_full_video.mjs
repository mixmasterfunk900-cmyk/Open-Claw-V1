import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const prep = path.resolve('projects/dog-staring-psychology/full_video_prep')
const plan = JSON.parse(fs.readFileSync(path.join(prep, 'visual_plan_v2_132.json'), 'utf8'))
const beats = plan.beats || plan
const approvedDir = path.join(prep, 'approved_frames')
const voiceover = path.join(prep, 'voiceover_drop', 'dog-staring-final-voiceover.wav')
const output = path.join(prep, 'dog_staring_full_preview.mp4')
const concatFile = path.join(prep, 'frames_concat_audio_aligned.txt')

const missing = beats.filter((beat) => !fs.existsSync(path.join(approvedDir, beat.frame_filename)))
if (missing.length) {
  console.error(`Missing ${missing.length} frame(s); first missing ${missing[0].id} ${missing[0].frame_filename}`)
  process.exit(1)
}
if (!fs.existsSync(voiceover)) {
  console.error(`Missing voiceover: ${voiceover}`)
  process.exit(1)
}

const lines = []
for (const beat of beats) {
  const frame = path.join(approvedDir, beat.frame_filename).replaceAll("'", "'\\''")
  const duration = Number(beat.duration_audio_est) || Math.max(0.1, Number(beat.end_audio_est) - Number(beat.start_audio_est)) || 5
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
const vibeZoneCopy = path.resolve('../vibe-zone/media/practice/youtube-automation/dog-content/dog-staring-psychology/dog-staring-full-preview.mp4')
fs.mkdirSync(path.dirname(vibeZoneCopy), { recursive: true })
fs.copyFileSync(output, vibeZoneCopy)
console.log(JSON.stringify({ output, vibeZoneCopy, frames: beats.length }, null, 2))
