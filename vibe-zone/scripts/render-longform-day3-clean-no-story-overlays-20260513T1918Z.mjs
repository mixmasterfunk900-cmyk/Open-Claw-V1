#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildLongPhraseEvents, qaCaptionEvents, secondsFromStamp } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const id = 'day3-product-content-machine-clean-no-story-overlays-20260513T1918Z'
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptPath = 'media/transcripts/SxOhgmSWqD4.json'
const logoPath = 'media/assets/logos/openclaw-title-card.png'
const out = `media/renders/long-form/${id}.mp4`
const assPath = `media/renders/long-form/${id}.ass`
const work = `media/renders/long-form/.tmp-${id}`
const reviewDir = 'media/reviews/long-form'
const exportDir = `media/exports/long-form/${id}`
const readyDir = 'media/exports/READY_TO_SHIP_NOW'

const beats = [
  { role: 'Hook', start: '00:11:58.4', end: '00:12:12.4' },
  { role: 'Problem', start: '00:14:56.4', end: '00:15:38.4' },
  { role: 'Blocker', start: '00:24:00.4', end: '00:24:52.4' },
  { role: 'Build', start: '00:26:11.4', end: '00:26:28.4' },
  { role: 'Stakes', start: '00:30:10.4', end: '00:30:49.4' },
  { role: 'Result', start: '00:44:48.4', end: '00:46:14.4' },
  { role: 'Next', start: '00:47:13.4', end: '00:47:46.4' },
]

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 140 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function filterPath(p) { return p.replace(/:/g, '\\:').replace(/'/g, "'\\''") }

await mkdir(path.join(root, work), { recursive: true })
await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const events = buildLongPhraseEvents({
  segments: transcript.segments || [],
  beats,
  maxWords: 6,
  maxChars: 42,
  minDuration: 0.72,
  maxDuration: 2.6,
  gap: 0.035,
})
const qa = qaCaptionEvents(events, { mode: 'long', maxWords: 7, maxChars: 46, minDuration: 0.65, maxDuration: 2.8 })
if (!qa.ok) throw new Error(`Long-form caption QA failed: ${qa.failures.slice(0, 8).join('; ')}`)
await writeFile(path.join(root, assPath), buildAss(events, { mode: 'long', font: 'DejaVu Sans' }))
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

const concat = []
let index = 1
for (const beat of beats) {
  const segPath = `${work}/${String(index++).padStart(2, '0')}-${beat.role.toLowerCase()}.mp4`
  // No intro cards. No story labels. No lower-third bars. Keep the stream itself as the content,
  // with only a small real logo mark and our normalized bottom captions added after concat.
  const vf = [
    'fps=30',
    'scale=1920:1080:force_original_aspect_ratio=decrease',
    'pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
    'setsar=1',
  ].join(',')
  run('ffmpeg', [
    '-y', '-v', 'error', '-ss', beat.start, '-to', beat.end, '-i', source,
    '-map', '0:v:0', '-map', '0:a:0',
    '-vf', vf,
    '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5,aresample=48000',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', segPath,
  ])
  concat.push(segPath)
}

const concatPath = `${work}/concat.txt`
await writeFile(path.join(root, concatPath), concat.map((p) => `file '${path.resolve(root, p).replace(/'/g, "'\\''")}'`).join('\n') + '\n')
const baseOut = `${work}/base-clean.mp4`
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatPath, '-c', 'copy', baseOut])

// Burn only our fixed Netflix-style captions and a small logo. Nothing else.
const vfFinal = `[0:v]subtitles='${filterPath(assPath)}'[subbed];[1:v]scale=118:-1,format=rgba[logo];[subbed][logo]overlay=x=w-overlay_w-62:y=54:format=auto[vout]`
run('ffmpeg', [
  '-y', '-v', 'error', '-i', baseOut, '-loop', '1', '-i', logoPath,
  '-filter_complex', vfFinal,
  '-map', '[vout]', '-map', '0:a?',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'copy', '-shortest', out,
])

run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:02', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${id}-first-frame.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:47', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${id}-screenshot.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/40,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out])
await writeFile(path.join(root, `${reviewDir}/${id}.ffprobe.json`), probe.stdout)
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
await writeFile(path.join(root, `${reviewDir}/${id}.decode.log`), decode.stderr || decode.stdout || '')
if (decode.status !== 0) throw new Error(`decode failed\n${decode.stderr || decode.stdout}`)

await writeFile(path.join(root, exportDir, 'upload-notes.md'), `# Manual Upload Notes — Day 3 Clean Long-form\n\nRender: \`${out}\`\nCaptions: \`${assPath}\`\nCaption QA: pass, ${qa.eventCount} events.\n\nFixes:\n- No intro title card.\n- No story lower-thirds.\n- No random role labels.\n- Only fixed Netflix-style captions plus a small logo mark.\n\nManual upload only. Owner visual approval required.\n`)
await copyFile(path.join(root, out), path.join(root, readyDir, 'long-day3-product-content-machine-clean-no-story-overlays.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'long-clean-no-story-overlays-contact-sheet.jpg'))
await copyFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), path.join(root, readyDir, 'long-clean-no-story-overlays-caption-qa.json'))

console.log(JSON.stringify({ id, out, ready: `${readyDir}/long-day3-product-content-machine-clean-no-story-overlays.mp4`, captions: assPath, captionQa: qa, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
