#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildLongPhraseEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const id = 'stream2-founder-story-upload-candidate-20260514T0300Z'
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const logoPath = 'media/assets/logos/openclaw-title-card.png'
const out = `media/renders/long-form/${id}.mp4`
const assPath = `media/renders/long-form/${id}.ass`
const work = `media/renders/long-form/.tmp-${id}`
const reviewDir = 'media/reviews/long-form'
const exportDir = `media/exports/long-form/${id}`
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const storyJson = `media/story-plans/${id}.json`
const storyMd = `media/story-plans/${id}.md`

const beats = [
  { order: 1, role: 'hook', title: 'A ridiculous thesis', start: '01:21:32.0', end: '01:22:02.0', chapter: '00:00', excerpt: 'The first day we are going to make a billion dollar company from scratch with no experience.', rationale: 'Open with the biggest promise so the audience understands the ambition before the setup.' },
  { order: 2, role: 'problem', title: 'The real constraint', start: '00:02:12.0', end: '00:03:32.0', chapter: '00:30', excerpt: 'Set up social accounts, VPS, OpenClaw, and make the project progress when I am not here.', rationale: 'Rewind to the practical problem: he has limited stream time and needs agents/content workflows to keep moving off-stream.' },
  { order: 3, role: 'blocker', title: 'The first clips failed', start: '00:04:58.0', end: '00:05:31.0', chapter: '01:50', excerpt: 'Tests were a total flop: black screen, mid thumbnail, low quality.', rationale: 'Adds vulnerability and proves this is not a fake victory lap.' },
  { order: 4, role: 'build', title: 'Build live, do not leak', start: '00:06:00.0', end: '00:07:42.0', chapter: '02:23', excerpt: 'AI agents, 24/7 work, VPS setup, OpenClaw, and live-stream safety.', rationale: 'Shows the actual build attempt and the privacy/safety constraint that makes it harder.' },
  { order: 5, role: 'blocker', title: 'The livestream tax', start: '00:10:16.0', end: '00:12:32.0', chapter: '04:05', excerpt: 'Mic/setup failures interrupt the build until the stream finally works.', rationale: 'Turns messy troubleshooting into the middle tension of the story.' },
  { order: 6, role: 'result', title: 'Phase one works', start: '00:20:10.8', end: '00:20:48.0', chapter: '06:21', excerpt: 'Phase 1 is done.', rationale: 'Gives the audience a concrete progress marker after the chaos.' },
  { order: 7, role: 'cta', title: 'Follow the off-stream build', start: '00:03:24.0', end: '00:03:32.0', chapter: '06:58', excerpt: 'I still want the project to progress when I am not here.', rationale: 'Ends on the series promise: the system keeps building between streams.' },
]

function run(command, args, opts = {}) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 160, ...opts })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function filterPath(p) { return p.replace(/:/g, '\\:').replace(/'/g, "'\\''") }
function durationFromProbe(p) {
  return Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', p]).stdout.trim())
}

await mkdir(path.join(root, work), { recursive: true })
await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
await mkdir(path.join(root, 'media/story-plans'), { recursive: true })

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
  const segPath = `${work}/${String(index++).padStart(2, '0')}-${beat.role}.mp4`
  const vf = ['fps=30', 'scale=1920:1080:force_original_aspect_ratio=decrease', 'pad=1920:1080:(ow-iw)/2:(oh-ih)/2', 'setsar=1'].join(',')
  run('ffmpeg', ['-y', '-v', 'error', '-ss', beat.start, '-to', beat.end, '-i', source, '-map', '0:v:0', '-map', '0:a:0', '-vf', vf, '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5,aresample=48000', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', segPath])
  concat.push(segPath)
}

const concatPath = `${work}/concat.txt`
await writeFile(path.join(root, concatPath), concat.map((p) => `file '${path.resolve(root, p).replace(/'/g, "'\\''")}'`).join('\n') + '\n')
const baseOut = `${work}/base-clean.mp4`
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatPath, '-c', 'copy', baseOut])

const vfFinal = `[0:v]subtitles='${filterPath(assPath)}'[subbed];[1:v]scale=118:-1,format=rgba[logo];[subbed][logo]overlay=x=w-overlay_w-62:y=54:format=auto[vout]`
run('ffmpeg', ['-y', '-v', 'error', '-i', baseOut, '-loop', '1', '-i', logoPath, '-filter_complex', vfFinal, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', out])

run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:03', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${id}-first-frame.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:02:30', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${id}-screenshot.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/55,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out])
await writeFile(path.join(root, `${reviewDir}/${id}.ffprobe.json`), probe.stdout)
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
await writeFile(path.join(root, `${reviewDir}/${id}.decode.log`), decode.stderr || decode.stdout || '')
if (decode.status !== 0) throw new Error(`decode failed\n${decode.stderr || decode.stdout}`)

const duration = durationFromProbe(out)
const story = {
  id,
  title: 'I Tried Building a Company Live With AI Agents',
  source: { streamId: 'stream-2', sourcePath: source, transcriptPath, durationSeconds: 5409.034 },
  render: out,
  captions: assPath,
  review: { ffprobe: `${reviewDir}/${id}.ffprobe.json`, decodeLog: `${reviewDir}/${id}.decode.log`, screenshot: `${reviewDir}/${id}-screenshot.jpg`, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg` },
  storyShape: beats.map((b) => b.role),
  beats,
  qualityGate: { durationSeconds: duration, ffprobe: 'passed', decode: 'passed end-to-end', captions: `passed (${qa.eventCount} events)`, thumbnailConcept: 'included in upload notes', privacy: 'sampled screenshots/contact sheet show no obvious secrets; owner full-resolution watch pass still required before public upload' },
  notes: 'Clean-caption Stream 2 upload-candidate refinement. Reordered story beats from source stream. No external posting/logins/cookies/public exposure.'
}
await writeFile(path.join(root, storyJson), JSON.stringify(story, null, 2) + '\n')
await writeFile(path.join(root, storyMd), `# ${story.title}\n\nRender: \`${out}\`\n\n## Story spine\n\n${beats.map((b) => `${b.order}. **${b.role.toUpperCase()} — ${b.title}** (${b.start}–${b.end}) — ${b.rationale}`).join('\n')}\n\n## Quality gate\n\n- Duration: ${duration.toFixed(3)} seconds\n- ffprobe: passed\n- Decode: passed end-to-end\n- Captions: passed (${qa.eventCount} phrase-caption events)\n- Upload notes/chapters: \`${exportDir}/upload-notes.md\`\n- Thumbnail concept: included in upload notes\n- Privacy: no obvious secrets in sampled frames/contact sheet; owner full-resolution watch pass still required.\n`)

const uploadNotes = `# Manual Upload Notes — Stream 2 Founder Story\n\nVideo file: \`${out}\`\nReady-copy file: \`${readyDir}/long-stream2-founder-story-upload-candidate-20260514T0300Z.mp4\`\nCaptions burned in: \`${assPath}\`\nReview screenshot: \`${reviewDir}/${id}-screenshot.jpg\`\nReview contact sheet: \`${reviewDir}/${id}-contact-sheet.jpg\`\n\nManual upload only. No external posting, logins, cookies, or public exposure were used.\n\n## Title options\n\n1. I Tried Building a Company Live With AI Agents\n2. Building a Startup on Stream With No Experience\n3. Can AI Agents Build While I Sleep?\n\n## Description draft\n\nThis is the early Vibe Zone founder story: a messy live build where the goal is bigger than one stream. I need social accounts, a secure VPS, OpenClaw, clips, and AI agents that can keep the project moving while I am away — but the first tests are rough, the stream setup fights back, and the only way forward is to ship the workflow live.\n\nThis is a manual upload draft prepared from Stream 2 footage.\n\n## Chapters\n\n00:00 A ridiculous thesis\n00:30 The real constraint\n01:50 The first clips failed\n02:23 Build live, do not leak\n04:05 The livestream tax\n06:21 Phase one works\n06:58 Follow the off-stream build\n\n## Thumbnail concepts\n\n- Facecam + terminal/UI, text: AI AGENTS BUILD WHILE I SLEEP?\n- Big founder promise, text: $1B COMPANY, NO EXPERIENCE\n- Messy build angle, text: LIVE BUILD WENT WRONG\n\n## Upload checklist\n\n- [x] 3–8 minute render (${duration.toFixed(1)}s)\n- [x] Hook / problem / build / blocker / result / CTA story spine\n- [x] Burned captions passed QA (${qa.eventCount} events)\n- [x] ffprobe passed: h264 video + aac audio\n- [x] Full decode passed end-to-end\n- [x] Chapters and upload notes exist\n- [x] Thumbnail concepts exist\n- [ ] Owner full-resolution privacy/watch pass before public upload\n\n## Privacy note\n\nSampled frames/contact sheet show no obvious secrets or private text, but livestream UI, terminal/browser text, and chat can be visible. Do not mark public-upload-ready until Masala completes a full-resolution watch pass.\n`
await writeFile(path.join(root, exportDir, 'upload-notes.md'), uploadNotes)
await copyFile(path.join(root, out), path.join(root, readyDir, 'long-stream2-founder-story-upload-candidate-20260514T0300Z.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'long-stream2-founder-story-contact-sheet-20260514T0300Z.jpg'))
await copyFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), path.join(root, readyDir, 'long-stream2-founder-story-caption-qa-20260514T0300Z.json'))

console.log(JSON.stringify({ id, out, ready: `${readyDir}/long-stream2-founder-story-upload-candidate-20260514T0300Z.mp4`, duration, captions: assPath, captionQa: qa, screenshot: `${reviewDir}/${id}-screenshot.jpg`, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
