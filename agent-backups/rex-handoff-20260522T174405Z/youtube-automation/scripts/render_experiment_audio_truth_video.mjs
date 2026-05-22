import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const usage = `Usage:
  node scripts/render_experiment_audio_truth_video.mjs <prep-dir> <plan-json> <alignment-json> <voiceover-wav> <output-mp4> [vibe-zone-copy]

Renders a 16:9 long-form experiment video from real generated frames. Audio/Whisper word timestamps are the source of truth for beat durations and soft captions.`

const [prepArg, planArg, alignmentArg, voiceoverArg, outputArg, copyArg] = process.argv.slice(2)
if (!prepArg || !planArg || !alignmentArg || !voiceoverArg || !outputArg) {
  console.error(usage)
  process.exit(2)
}

const prep = path.resolve(prepArg)
const resolveInPrep = (file) => path.isAbsolute(file) ? file : path.resolve(prep, file)
const planPath = resolveInPrep(planArg)
const alignmentPath = resolveInPrep(alignmentArg)
const voiceover = resolveInPrep(voiceoverArg)
const output = resolveInPrep(outputArg)
const copyOut = copyArg ? path.resolve(copyArg) : null
const approvedDir = fs.existsSync(path.join(prep, 'approved_frames')) ? path.join(prep, 'approved_frames') : path.join(prep, 'approved_frames_draft')
const workDir = path.join(prep, 'render_work_audio_truth')
const segmentDir = path.join(workDir, 'segments')
const concatFile = path.join(workDir, 'segments_concat.txt')
const captionsFile = path.join(workDir, 'audio_truth_captions.ass')
const auditFile = path.join(workDir, 'audio_truth_render_audit.json')
const cleanOutput = output.replace(/\.mp4$/i, '.clean-video-no-burned-captions.mp4')

const mustExist = (file, label) => {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${label}: ${file}`)
    process.exit(1)
  }
}
mustExist(planPath, 'plan JSON')
mustExist(alignmentPath, 'Whisper alignment JSON')
mustExist(voiceover, 'voiceover audio')
mustExist(approvedDir, 'approved frames directory')
fs.mkdirSync(segmentDir, { recursive: true })
fs.mkdirSync(path.dirname(output), { recursive: true })

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
const planWords = planTokensByBeat.reduce((sum, tokens) => sum + tokens.length, 0)
const audioWords = words.length
const failures = []
if (!beats.length) failures.push('plan has no beats')
if (!words.length) failures.push('alignment has no word timestamps')
for (const beat of beats) {
  const frame = path.join(approvedDir, beat.frame_filename)
  if (!fs.existsSync(frame)) failures.push(`missing generated frame ${beat.frame_filename}`)
}
if (failures.length) {
  console.error('Experiment render gate failed:')
  for (const failure of failures.slice(0, 80)) console.error(`- ${failure}`)
  if (failures.length > 80) console.error(`...and ${failures.length - 80} more`)
  process.exit(1)
}

const audioDuration = Math.max(...alignment.segments.map((segment) => Number(segment.end) || 0), words.at(-1)?.end || 0)
const scoreWindow = (beatTokens, startIndex) => {
  if (!beatTokens.length) return 1
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
  const searchStart = Math.max(0, cursor - 10)
  const searchEnd = Math.min(words.length - 1, cursor + 70)
  let bestIndex = cursor
  let bestScore = -1
  for (let candidate = searchStart; candidate <= searchEnd; candidate += 1) {
    const score = scoreWindow(beatTokens, candidate)
    const distancePenalty = Math.abs(candidate - expected) * 0.0018
    const adjusted = score - distancePenalty
    if (adjusted > bestScore) {
      bestScore = adjusted
      bestIndex = candidate
    }
  }
  const endIndex = Math.min(words.length - 1, bestIndex + Math.max(1, beatTokens.length) - 1)
  const start = index === 0 ? 0 : words[bestIndex]?.start ?? 0
  const nextStart = words[endIndex + 1]?.start
  const end = index === beats.length - 1 ? audioDuration : Math.max(words[endIndex]?.end ?? start + 0.3, nextStart ?? start + 0.3)
  const rawScore = scoreWindow(beatTokens, bestIndex)
  alignmentRows.push({ id: beat.id, frame: beat.frame_filename, words: beatTokens.length, startIndex: bestIndex, endIndex, score: Number(rawScore.toFixed(3)), start, end })
  cursor = endIndex + 1
  return { ...beat, start_audio_truth: start, end_audio_truth: Math.max(start + 0.35, end), duration_audio_truth: Math.max(start + 0.35, end) - start }
})

const avgBeatAlignmentScore = alignmentRows.reduce((sum, row) => sum + row.score, 0) / Math.max(1, alignmentRows.length)
const weakBeatMatches = alignmentRows.filter((row) => row.score < 0.68)
if (avgBeatAlignmentScore < 0.82 || weakBeatMatches.length > Math.ceil(beats.length * 0.22)) {
  console.error('Audio-truth beat alignment looks weak:')
  console.error(`average beat match score ${avgBeatAlignmentScore.toFixed(3)}, weak beats ${weakBeatMatches.length}/${beats.length}`)
  for (const row of weakBeatMatches.slice(0, 18)) console.error(`- ${row.id} score=${row.score} frame=${row.frame}`)
  process.exit(1)
}

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
  if (group.length >= 8 || wouldDuration > 3.0 || sentenceBreak) flush()
  group.push(word)
}
flush()
const ass = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nScaledBorderAndShadow: yes\nWrapStyle: 2\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: ExperimentCaption,Arial,46,&H00FFFFFF,&H00FFFFFF,&HD0000000,&H00000000,0,0,0,0,100,100,0,0,1,2.0,1.0,2,180,180,74,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${captionGroups.map((caption) => `Dialogue: 0,${assTime(caption.start)},${assTime(caption.end)},ExperimentCaption,,0,0,0,,${caption.text}`).join('\n')}\n`
fs.writeFileSync(captionsFile, ass)

const segmentLines = []
for (let i = 0; i < timedBeats.length; i += 1) {
  const beat = timedBeats[i]
  const frame = path.join(approvedDir, beat.frame_filename)
  const segment = path.join(segmentDir, `${String(i + 1).padStart(3, '0')}-${beat.id}.mp4`)
  const frames = Math.max(12, Math.round(beat.duration_audio_truth * 30))
  const transitionIn = i === 0 ? 0 : Math.min(0.16 + (i % 3) * 0.035, Math.max(0, beat.duration_audio_truth / 6))
  const transitionOut = i === timedBeats.length - 1 ? 0 : Math.min(0.18 + (i % 4) * 0.03, Math.max(0, beat.duration_audio_truth / 5))
  const fadeFilters = [
    transitionIn > 0 ? `fade=t=in:st=0:d=${transitionIn.toFixed(3)}` : '',
    transitionOut > 0 ? `fade=t=out:st=${Math.max(0, beat.duration_audio_truth - transitionOut).toFixed(3)}:d=${transitionOut.toFixed(3)}` : '',
  ].filter(Boolean).join(',')
  const vf = `scale=2048:1152:force_original_aspect_ratio=increase,crop=2048:1152,zoompan=z='min(1.035,1+0.035*on/${Math.max(1, frames - 1)})':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30${fadeFilters ? `,${fadeFilters}` : ''},format=yuv420p`
  const args = ['-y', '-loop', '1', '-i', frame, '-t', beat.duration_audio_truth.toFixed(3), '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-movflags', '+faststart', segment]
  const result = spawnSync('ffmpeg', args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
  segmentLines.push(`file '${segment.replaceAll("'", "'\\''")}'`)
}
fs.writeFileSync(concatFile, segmentLines.join('\n'))

const concatResult = spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-i', voiceover, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', cleanOutput], { stdio: 'inherit' })
if (concatResult.status !== 0) process.exit(concatResult.status ?? 1)

const muxResult = spawnSync('ffmpeg', ['-y', '-i', cleanOutput, '-i', captionsFile, '-map', '0:v:0', '-map', '0:a:0', '-map', '1:0', '-c:v', 'copy', '-c:a', 'copy', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-disposition:s:0', 'default', output], { stdio: 'inherit' })
if (muxResult.status !== 0) process.exit(muxResult.status ?? 1)
if (copyOut) {
  fs.mkdirSync(path.dirname(copyOut), { recursive: true })
  fs.copyFileSync(output, copyOut)
}

const audit = {
  planPath,
  alignmentPath,
  voiceover,
  output,
  copyOut,
  approvedDir,
  beats: beats.length,
  captions: captionGroups.length,
  planWords,
  audioWords,
  wordRatio: Number((planWords / Math.max(1, audioWords)).toFixed(4)),
  timingMethod: 'exact-token-walk-from-whisper-word-timestamps',
  visualMotion: 'per-beat 3.5% slow zoompan with subtle varied fade transitions',
  captionMode: 'soft-mp4-mov_text-subtitle-track-no-burned-captions',
  avgBeatAlignmentScore: Number(avgBeatAlignmentScore.toFixed(4)),
  weakBeatMatches: weakBeatMatches.length,
  audioDuration,
  maxFrameDuration: Math.max(...timedBeats.map((beat) => beat.duration_audio_truth)),
  avgFrameDuration: timedBeats.reduce((sum, beat) => sum + beat.duration_audio_truth, 0) / timedBeats.length,
}
fs.writeFileSync(auditFile, JSON.stringify({ ...audit, alignmentRows }, null, 2))
console.log(JSON.stringify(audit, null, 2))
