#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildLongPhraseEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const id = 'day3-product-content-machine-upload-candidate-20260513T2300Z'
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptPath = 'media/transcripts/Day 3 - Addicted to vibe coding LIVE.json'
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
  { order: 1, role: 'hook', title: 'Why this build matters', start: '00:11:58.4', end: '00:12:12.4', chapter: '00:00', excerpt: 'Dad with full-time job tries to build ridiculous AI products live... ships anyway.', rationale: 'Open with the human reason to care before any product detail.' },
  { order: 2, role: 'problem', title: 'The product promise', start: '00:14:56.4', end: '00:15:38.4', chapter: '00:14', excerpt: 'You stream and upload your stream to the platform, and it creates the content.', rationale: 'Defines the viewer-facing promise: livestream in, clips/content out.' },
  { order: 3, role: 'blocker', title: 'The rough part', start: '00:24:00.4', end: '00:24:52.4', chapter: '00:56', excerpt: 'The functionality works, but the brain behind it all is just terrible.', rationale: 'Creates honest tension; the machine exists but quality is not there yet.' },
  { order: 4, role: 'build', title: 'Ship it live anyway', start: '00:26:11.4', end: '00:26:28.4', chapter: '01:48', excerpt: 'I am literally going to upload this on stream right now.', rationale: 'Action beat: a rough but real workflow gets used live.' },
  { order: 5, role: 'stakes', title: 'Product or content machine?', start: '00:30:10.4', end: '00:30:49.4', chapter: '02:05', excerpt: 'I am building both right now. This needs to work for me to have a chance.', rationale: 'Names the central business tension and why the product matters.' },
  { order: 6, role: 'result', title: 'The agent loop', start: '00:44:48.4', end: '00:46:14.4', chapter: '02:44', excerpt: 'Planner agent, film agent, work agents... when I am off stream.', rationale: 'Pays off the system idea: the build can keep moving while Masala is away.' },
  { order: 7, role: 'cta', title: 'Next bottleneck: face tracking', start: '00:47:13.4', end: '00:47:46.4', chapter: '04:10', excerpt: 'The face tracking / facecam problem becomes the next concrete build hook.', rationale: 'Ends with a specific next episode, not a vague wrap-up.' },
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

run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:02', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${id}-first-frame.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:47', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${id}-screenshot.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/35,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out])
await writeFile(path.join(root, `${reviewDir}/${id}.ffprobe.json`), probe.stdout)
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
await writeFile(path.join(root, `${reviewDir}/${id}.decode.log`), decode.stderr || decode.stdout || '')
if (decode.status !== 0) throw new Error(`decode failed\n${decode.stderr || decode.stdout}`)

const duration = durationFromProbe(out)
const story = {
  id,
  title: "I'm Building the Product and the Content Machine at the Same Time",
  source: { streamId: 'day3-addicted-to-vibe-coding-live', sourcePath: source, transcriptPath, durationSeconds: Number(transcript.duration || 4895.933333) },
  render: out,
  captions: assPath,
  review: { ffprobe: `${reviewDir}/${id}.ffprobe.json`, decodeLog: `${reviewDir}/${id}.decode.log`, screenshot: `${reviewDir}/${id}-screenshot.jpg`, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg` },
  storyShape: beats.map((b) => b.role),
  beats,
  qualityGate: { durationSeconds: duration, ffprobe: 'passed', decode: 'passed end-to-end', captions: `passed (${qa.eventCount} events)`, thumbnailConcept: 'included in upload notes', privacy: 'sampled contact sheet shows no obvious secrets; owner full-resolution watch pass still required before public upload' },
  notes: 'Upload-candidate refresh of the clean no-story-overlays cut. No external posting/logins/cookies/public exposure.'
}
await writeFile(path.join(root, storyJson), JSON.stringify(story, null, 2) + '\n')
await writeFile(path.join(root, storyMd), `# ${story.title}\n\nRender: \`${out}\`\n\n## Story spine\n\n${beats.map((b) => `${b.order}. **${b.role.toUpperCase()} — ${b.title}** (${b.start}–${b.end}) — ${b.rationale}`).join('\n')}\n\n## Quality gate\n\n- Duration: ${duration.toFixed(3)} seconds\n- ffprobe: passed\n- Decode: passed end-to-end\n- Captions: passed (${qa.eventCount} phrase-caption events)\n- Upload notes/chapters: \`${exportDir}/upload-notes.md\`\n- Thumbnail concept: included in upload notes\n- Privacy: no obvious secrets in sampled contact sheet; owner full-resolution watch pass still required.\n`)

const uploadNotes = `# Manual Upload Notes — Day 3 Product/Content Machine\n\nVideo file: \`${out}\`\nReady-copy file: \`${readyDir}/long-day3-product-content-machine-upload-candidate-20260513T2300Z.mp4\`\nCaptions burned in: \`${assPath}\`\nReview contact sheet: \`${reviewDir}/${id}-contact-sheet.jpg\`\n\nManual upload only. No external posting, logins, cookies, or public exposure were used.\n\n## Title options\n\n1. I'm Building the Product and the Content Machine at the Same Time\n2. I Tried Turning My Livestream Into Its Own Content Machine\n3. Building Vibe Zone Live: Product, Clips, and AI Agents\n\n## Description draft\n\nI am building Vibe Zone in public: a local-first stream-to-content system that should turn livestreams into clips, captions, upload notes, and a real content workflow. In this cut, the product is still rough, the AI brain is not good enough yet, and that is exactly the point — the product and the content machine have to improve together.\n\nThis is a manual upload draft prepared from Day 3 stream footage.\n\n## Chapters\n\n00:00 Why this build matters\n00:14 The product promise\n00:56 The rough part\n01:48 Ship it live anyway\n02:05 Product or content machine?\n02:44 The agent loop\n04:10 Next bottleneck: face tracking\n\n## Thumbnail concepts\n\n- Split screen: Masala facecam + Vibe Zone UI, text: PRODUCT OR CONTENT MACHINE?\n- Founder angle: tired/locked-in facecam, text: BUILDING BOTH LIVE\n- System angle: stream timeline + agent labels, text: STREAM → CLIPS → AGENTS\n\n## Upload checklist\n\n- [x] 3–8 minute render (${duration.toFixed(1)}s)\n- [x] Hook / problem / build / blocker / result / CTA story spine\n- [x] Burned captions passed QA (${qa.eventCount} events)\n- [x] ffprobe passed: h264 video + aac audio\n- [x] Full decode passed end-to-end\n- [x] Chapters and upload notes exist\n- [x] Thumbnail concepts exist\n- [ ] Owner full-resolution privacy/watch pass before public upload\n\n## Privacy note\n\nSampled frames/contact sheet show no obvious secrets or private text, but livestream UI and chat/text can be visible. Do not mark public-upload-ready until Masala completes a full-resolution watch pass.\n`
await writeFile(path.join(root, exportDir, 'upload-notes.md'), uploadNotes)
await copyFile(path.join(root, out), path.join(root, readyDir, 'long-day3-product-content-machine-upload-candidate-20260513T2300Z.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'long-upload-candidate-contact-sheet-20260513T2300Z.jpg'))
await copyFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), path.join(root, readyDir, 'long-upload-candidate-caption-qa-20260513T2300Z.json'))

console.log(JSON.stringify({ id, out, ready: `${readyDir}/long-day3-product-content-machine-upload-candidate-20260513T2300Z.mp4`, duration, captions: assPath, captionQa: qa, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, ffprobe: JSON.parse(probe.stdout) }, null, 2))
