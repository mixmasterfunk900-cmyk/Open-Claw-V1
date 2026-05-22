import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const usage = `Usage:
  node scripts/render_dog_audio_truth_video.mjs <prep-dir> <plan-json> <alignment-json> <voiceover-wav> <output-mp4> [vibe-zone-copy]

Requires Whisper JSON with word_timestamps=True. This script makes audio timing the source of truth for frame durations and captions.`

const [prepArg, planArg, alignmentArg, voiceoverArg, outputArg, copyArg] = process.argv.slice(2)
if (!prepArg || !planArg || !alignmentArg || !voiceoverArg || !outputArg) {
  console.error(usage)
  process.exit(1)
}

const prep = path.resolve(prepArg)
const resolveInPrep = (file) => path.isAbsolute(file) ? file : path.resolve(prep, file)
const planPath = resolveInPrep(planArg)
const alignmentPath = resolveInPrep(alignmentArg)
const voiceover = resolveInPrep(voiceoverArg)
const output = resolveInPrep(outputArg)
const copyOut = copyArg ? path.resolve(copyArg) : null
const approvedDir = path.join(prep, 'approved_frames')
const concatFile = path.join(prep, 'frames_concat_audio_truth.txt')
const captionsFile = path.join(prep, 'audio_truth_one_line_captions.ass')
const auditFile = path.join(prep, 'audio_truth_render_audit.json')
const frameGateScript = path.resolve('scripts/check_dog_frame_quality.mjs')
const visualSopGateScript = path.resolve('scripts/check_dog_visual_sop.mjs')

const mustExist = (file, label) => {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${label}: ${file}`)
    process.exit(1)
  }
}
mustExist(planPath, 'plan JSON')
mustExist(alignmentPath, 'Whisper alignment JSON')
mustExist(voiceover, 'voiceover audio')
mustExist(approvedDir, 'approved_frames directory')

const planRaw = JSON.parse(fs.readFileSync(planPath, 'utf8'))
const beats = planRaw.beats || planRaw
const alignment = JSON.parse(fs.readFileSync(alignmentPath, 'utf8'))
const normalizeWords = (text) => String(text || '').toLowerCase().match(/[a-z0-9']+/g) || []
const words = alignment.segments.flatMap((segment) => (segment.words || []).map((word) => ({
  text: word.word.trim(),
  token: normalizeWords(word.word)[0] || '',
  start: Number(word.start),
  end: Number(word.end),
  probability: word.probability,
}))).filter((word) => word.text && word.token && Number.isFinite(word.start) && Number.isFinite(word.end))

const planTokensByBeat = beats.map((beat) => normalizeWords(beat.narration || beat.text || ''))
const planWordCounts = planTokensByBeat.map((tokens) => tokens.length)
const planWords = planWordCounts.reduce((sum, count) => sum + count, 0)
const audioWords = words.length
const ratio = planWords / Math.max(1, audioWords)
const failures = []
if (!beats.length) failures.push('plan has no beats')
if (!words.length) failures.push('alignment has no word timestamps')
if (ratio < 0.92 || ratio > 1.08) failures.push(`plan/audio word count drift too high: plan=${planWords}, audio=${audioWords}, ratio=${ratio.toFixed(3)}`)
for (const beat of beats) {
  if (!fs.existsSync(path.join(approvedDir, beat.frame_filename))) failures.push(`missing approved frame ${beat.frame_filename}`)
}
if (failures.length) {
  console.error('Audio-truth render gate failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

const frameGate = spawnSync(process.execPath, [frameGateScript, approvedDir, String(beats.length)], { stdio: 'inherit' })
if (frameGate.status !== 0) {
  console.error('Render blocked: approved_frames did not pass real image-generation quality gate.')
  process.exit(frameGate.status ?? 1)
}

const visualSopGate = spawnSync(process.execPath, [visualSopGateScript, approvedDir, String(beats.length)], { stdio: 'inherit' })
if (visualSopGate.status !== 0) {
  console.error('Render blocked: approved_frames did not pass Dog Content visual SOP/style gate.')
  process.exit(visualSopGate.status ?? 1)
}

const audioDuration = Math.max(...alignment.segments.map((segment) => Number(segment.end) || 0), words.at(-1)?.end || 0)

const scoreWindow = (beatTokens, startIndex) => {
  if (!beatTokens.length) return 0
  const max = Math.min(beatTokens.length, words.length - startIndex)
  let matched = 0
  for (let i = 0; i < max; i += 1) {
    if (beatTokens[i] === words[startIndex + i]?.token) matched += 1
  }
  return matched / beatTokens.length
}

let cursor = 0
const alignmentRows = []
const timedBeats = beats.map((beat, index) => {
  const beatTokens = planTokensByBeat[index]
  const expected = cursor
  const searchStart = Math.max(0, cursor - 8)
  const searchEnd = Math.min(words.length - 1, cursor + 50)
  let bestIndex = cursor
  let bestScore = -1
  for (let candidate = searchStart; candidate <= searchEnd; candidate += 1) {
    const score = scoreWindow(beatTokens, candidate)
    const distancePenalty = Math.abs(candidate - expected) * 0.002
    const adjusted = score - distancePenalty
    if (adjusted > bestScore) {
      bestScore = adjusted
      bestIndex = candidate
    }
  }
  const endIndex = Math.min(words.length - 1, bestIndex + Math.max(1, beatTokens.length) - 1)
  const start = index === 0 ? 0 : words[bestIndex]?.start ?? 0
  const end = index === beats.length - 1 ? audioDuration : Math.max(words[endIndex]?.end ?? start + 0.25, words[endIndex + 1]?.start ?? start + 0.25)
  const rawScore = scoreWindow(beatTokens, bestIndex)
  alignmentRows.push({ id: beat.id, frame: beat.frame_filename, words: beatTokens.length, startIndex: bestIndex, endIndex, score: Number(rawScore.toFixed(3)), start, end })
  cursor = endIndex + 1
  return { ...beat, start_audio_truth: start, end_audio_truth: Math.max(start + 0.25, end), duration_audio_truth: Math.max(start + 0.25, end) - start }
})

const avgBeatAlignmentScore = alignmentRows.reduce((sum, row) => sum + row.score, 0) / Math.max(1, alignmentRows.length)
const weakBeatMatches = alignmentRows.filter((row) => row.score < 0.72)
if (avgBeatAlignmentScore < 0.86 || weakBeatMatches.length > Math.ceil(beats.length * 0.18)) {
  console.error('Audio-truth exact beat alignment failed:')
  console.error(`average beat match score ${avgBeatAlignmentScore.toFixed(3)}, weak beats ${weakBeatMatches.length}/${beats.length}`)
  for (const row of weakBeatMatches.slice(0, 12)) console.error(`- ${row.id} score=${row.score} frame=${row.frame}`)
  process.exit(1)
}

const concatLines = []
for (const beat of timedBeats) {
  const frame = path.join(approvedDir, beat.frame_filename).replaceAll("'", "'\\''")
  concatLines.push(`file '${frame}'`)
  concatLines.push(`duration ${beat.duration_audio_truth.toFixed(3)}`)
}
concatLines.push(`file '${path.join(approvedDir, timedBeats.at(-1).frame_filename).replaceAll("'", "'\\''")}'`)
fs.writeFileSync(concatFile, concatLines.join('\n'))

const assTime = (seconds) => {
  const clamped = Math.max(0, seconds)
  const h = Math.floor(clamped / 3600)
  const m = Math.floor((clamped % 3600) / 60)
  const s = Math.floor(clamped % 60)
  const cs = Math.floor((clamped - Math.floor(clamped)) * 100)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}
const cleanCaption = (text) => text.replace(/[{}\\]/g, '').replace(/\s+/g, ' ').trim()
const captionGroups = []
let group = []
const flush = () => {
  if (!group.length) return
  const start = group[0].start
  const end = Math.max(group.at(-1).end, start + 0.35)
  captionGroups.push({ start, end, text: cleanCaption(group.map((word) => word.text).join(' ')) })
  group = []
}
for (const word of words) {
  const wouldDuration = group.length ? word.end - group[0].start : 0
  const sentenceBreak = group.length && /[.!?]$/.test(group.at(-1).text)
  if (group.length >= 7 || wouldDuration > 2.9 || sentenceBreak) flush()
  group.push(word)
}
flush()

const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: DogContentWhite,Arial,46,&H00FFFFFF,&H00FFFFFF,&HCC000000,&H00000000,0,0,0,0,100,100,0,0,1,1.8,1.2,2,170,170,78,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${captionGroups.map((caption) => `Dialogue: 0,${assTime(caption.start)},${assTime(caption.end)},DogContentWhite,,0,0,0,,${caption.text}`).join('\n')}
`
fs.writeFileSync(captionsFile, ass)

const cleanOutput = output.replace(/\.mp4$/i, '.clean-video-no-burned-captions.mp4')
const args = [
  '-y',
  '-f', 'concat', '-safe', '0', '-i', concatFile,
  '-i', voiceover,
  '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
  '-r', '30',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
  '-c:a', 'aac', '-b:a', '192k',
  '-shortest',
  cleanOutput,
]
const result = spawnSync('ffmpeg', args, { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status ?? 1)

// Keep captions as a timed subtitle stream instead of burning them into the video frames.
// This preserves clean generated artwork and makes the audio-timed captions a separate track.
const muxArgs = [
  '-y',
  '-i', cleanOutput,
  '-i', captionsFile,
  '-map', '0:v:0', '-map', '0:a:0', '-map', '1:0',
  '-c:v', 'copy', '-c:a', 'copy', '-c:s', 'mov_text',
  '-metadata:s:s:0', 'language=eng',
  '-disposition:s:0', 'default',
  output,
]
const muxResult = spawnSync('ffmpeg', muxArgs, { stdio: 'inherit' })
if (muxResult.status !== 0) process.exit(muxResult.status ?? 1)
if (copyOut) {
  fs.mkdirSync(path.dirname(copyOut), { recursive: true })
  fs.copyFileSync(output, copyOut)
}

const captionLooksPerBeat = captionGroups.length <= beats.length * 1.35
if (captionLooksPerBeat) {
  console.error(`Caption gate failed: only ${captionGroups.length} captions for ${beats.length} beats. This looks image/beat-based, not audio-word based.`)
  process.exit(1)
}

const audit = {
  planPath,
  alignmentPath,
  voiceover,
  output,
  copyOut,
  beats: beats.length,
  captions: captionGroups.length,
  planWords,
  audioWords,
  wordRatio: Number(ratio.toFixed(4)),
  timingMethod: 'exact-token-walk-from-whisper-word-timestamps',
  captionMode: 'soft-mp4-mov_text-subtitle-track-no-burned-captions',
  avgBeatAlignmentScore: Number(avgBeatAlignmentScore.toFixed(4)),
  weakBeatMatches: weakBeatMatches.length,
  audioDuration,
  maxFrameDuration: Math.max(...timedBeats.map((beat) => beat.duration_audio_truth)),
  avgFrameDuration: timedBeats.reduce((sum, beat) => sum + beat.duration_audio_truth, 0) / timedBeats.length,
}
fs.writeFileSync(auditFile, JSON.stringify({ ...audit, alignmentRows }, null, 2))
console.log(JSON.stringify(audit, null, 2))
