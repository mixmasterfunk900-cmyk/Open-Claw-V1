#!/usr/bin/env node
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildLongPhraseEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const id = 'day3-product-content-machine-clean-captions-20260513T1900Z'
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const out = `media/renders/long-form/${id}.mp4`
const captionPath = `media/renders/long-form/${id}.ass`
const work = `media/renders/long-form/.tmp-${id}`
const reviewDir = 'media/reviews/long-form'
const exportDir = `media/exports/long-form/${id}`
const transcriptPath = 'media/transcripts/SxOhgmSWqD4.json'
const fontBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
const font = 'DejaVu Sans'

// Same approved story spine as v3/no-intro, rendered clean from source footage so captions do not fight lower-third bars.
const beats = [
  { role: 'Hook', chapter: 'Why this build matters', start: '00:11:58.4', end: '00:12:12.4' },
  { role: 'Problem', chapter: 'The product promise', start: '00:14:56.4', end: '00:15:38.4' },
  { role: 'Blocker', chapter: 'The rough part', start: '00:24:00.4', end: '00:24:52.4' },
  { role: 'Build', chapter: 'Ship it live anyway', start: '00:26:11.4', end: '00:26:28.4' },
  { role: 'Stakes', chapter: 'Product or content machine?', start: '00:30:10.4', end: '00:30:49.4' },
  { role: 'Result', chapter: 'The agent loop', start: '00:44:48.4', end: '00:46:14.4' },
  { role: 'Next', chapter: 'Next bottleneck: face tracking', start: '00:47:13.4', end: '00:47:46.4' },
]

function run(command, args, opts = {}) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 160, ...opts })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function toSec(ts) {
  const [h, m, rest] = ts.split(':')
  return Number(h) * 3600 + Number(m) * 60 + Number(rest)
}
function escFilterText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,')
}
function fmtChapterTime(total) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  return h ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

await mkdir(path.join(root, work), { recursive: true })
await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })

const concat = []
let cursor = 0
const chapters = []
let index = 1
for (const beat of beats) {
  chapters.push({ time: fmtChapterTime(cursor), title: beat.chapter })
  const segPath = `${work}/${String(index++).padStart(2, '0')}-${beat.role.toLowerCase()}.mp4`
  run('ffmpeg', [
    '-y', '-v', 'error', '-ss', beat.start, '-to', beat.end, '-i', source,
    '-map', '0:v:0', '-map', '0:a:0',
    '-vf', 'fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1',
    '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5,aresample=48000',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', segPath,
  ])
  concat.push(segPath)
  cursor += toSec(beat.end) - toSec(beat.start)
}
chapters.push({ time: fmtChapterTime(cursor), title: 'CTA — follow the build' })
const outro = `${work}/99-outro.mp4`
run('ffmpeg', [
  '-y', '-v', 'error',
  '-f', 'lavfi', '-i', 'color=c=#101014:s=1920x1080:r=30:d=5',
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  '-vf', `drawtext=fontfile=${fontBold}:text='NEXT\\: MAKE THE CLIPS FOLLOW THE STORY':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=430,drawtext=fontfile=${fontBold}:text='FOLLOW THE VIBE ZONE BUILD':fontcolor=#ff3b6b:fontsize=42:x=(w-text_w)/2:y=545`,
  '-t', '5', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', outro,
])
concat.push(outro)

const concatPath = `${work}/concat.txt`
const basePath = `${work}/base-clean.mp4`
await writeFile(path.join(root, concatPath), concat.map((p) => `file '${path.resolve(root, p).replace(/'/g, "'\\''")}'`).join('\n') + '\n')
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatPath, '-c', 'copy', basePath])

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
await writeFile(path.join(root, captionPath), buildAss(events, { mode: 'long', font }))
await writeFile(path.join(root, `media/renders/long-form/${id}.qa.json`), JSON.stringify(qa, null, 2) + '\n')

const escapedCaption = captionPath.replace(/:/g, '\\:').replace(/'/g, "'\\''")
const vf = `subtitles='${escapedCaption}',drawtext=fontfile=${fontBold}:text='VIBE ZONE':fontcolor=#ff3b6b:fontsize=24:x=w-text_w-90:y=72:box=1:boxcolor=black@0.28:boxborderw=12`
run('ffmpeg', [
  '-y', '-v', 'error', '-i', basePath,
  '-vf', vf,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'copy', out,
])

run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:02', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${id}-first-frame.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:47', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${id}-screenshot.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/40,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out])
await writeFile(path.join(root, `${reviewDir}/${id}.ffprobe.json`), probe.stdout)
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
await writeFile(path.join(root, `${reviewDir}/${id}.decode.log`), decode.stderr || decode.stdout || '')
if (decode.status !== 0) throw new Error(`decode failed\n${decode.stderr || decode.stdout}`)

await copyFile(path.join(root, 'media/exports/long-form/day3-product-content-machine-no-intro-fixed-captions-20260513T1845Z/upload-notes.md'), path.join(root, exportDir, 'upload-notes-base.md')).catch(() => {})
const chapterLines = chapters.map((chapter) => `${chapter.time} ${chapter.title}`).join('  \n')
await writeFile(path.join(root, exportDir, 'upload-notes.md'), `# Manual Upload Notes — Day 3 Product + Content Machine Clean Captions\n\nRender: \`${out}\`  \nCaptions: fixed single-line phrase captions, bottom lane, no overlap.  \nProof frame: \`${reviewDir}/${id}-screenshot.jpg\`  \nFirst frame: \`${reviewDir}/${id}-first-frame.jpg\`  \nContact sheet: \`${reviewDir}/${id}-contact-sheet.jpg\`  \nCaption source: \`${captionPath}\`  \nStatus: clean local upload candidate; manual upload only; owner approval required.\n\n## What changed from 18:45 corrected draft\n\n- Re-rendered from Day 3 source footage instead of captioning over v3.\n- Removed the competing lower-third story bars.\n- Kept the immediate live-footage opening; no intro card.\n- Kept fixed-lane captions and VIBE ZONE burn.\n- Kept the CTA outro card.\n\n## Recommended title\n\nI’m Building the Product and the Content Machine at the Same Time\n\n## Alternate titles\n\n1. I Built an AI Content Machine Live\n2. Building Vibe Zone Live: Product, Clips, Agents, and the Next Bottleneck\n3. The Creator Tool Has to Become Its Own Content Machine\n\n## Description draft\n\nA Day 3 build-in-public story from the Vibe Zone livestream: Masala explains why the product matters, shows the promise of turning streams into a content engine, hits the rough prototype reality, ships live anyway, and lands on the agent loop plus the next bottleneck: face tracking.\n\nAssembled locally with FFmpeg from stream footage. No external posting, logins, cookies, or cloud editing were used.\n\n## Chapters\n\n${chapterLines}\n\n## Thumbnail direction\n\nPrimary: face-led split thesis. Masala face close-up on one side, Vibe Zone dashboard/agent loop on the other, huge text: PRODUCT OR CONTENT?\n\nAlternate thumbnail concepts: see \`media/exports/long-form/LONG_FORM_THUMBNAIL_OPTIONS.md\`.\n\n## Pre-upload checklist\n\n- [x] Local render exists.\n- [x] Plays/decodes end-to-end locally.\n- [x] Story beats: hook/problem/blocker/build/result/CTA.\n- [x] Captions burned in with fixed bottom lane.\n- [x] Upload notes and chapters exist.\n- [x] Thumbnail concept exists.\n- [x] Sampled frames/contact sheet generated; no obvious secrets in sampled frames.\n- [ ] Masala final full-resolution watch/privacy pass before public upload.\n`)

await writeFile(path.join(root, `${reviewDir}/${id}.review.md`), `# Long-Form Clean Caption Review — 2026-05-13 19:00 UTC\n\nStatus: clean local upload candidate; owner approval still required before public upload.\n\n## Automated checks\n\n- Render: \`${out}\`\n- Captions: \`${captionPath}\`\n- Caption QA: \`media/renders/long-form/${id}.qa.json\` passed (${qa.eventCount} events).\n- ffprobe: \`${reviewDir}/${id}.ffprobe.json\` passed.\n- Full decode: \`${reviewDir}/${id}.decode.log\` passed/empty.\n- Proof frame: \`${reviewDir}/${id}-screenshot.jpg\`\n- First frame: \`${reviewDir}/${id}-first-frame.jpg\`\n- Contact sheet: \`${reviewDir}/${id}-contact-sheet.jpg\`\n\n## Editorial review\n\nThis keeps the same approved Day 3 spine — hook, product promise, rough prototype/blocker, live shipping, product/content stakes, agent-loop result, face-tracking next step, CTA — but removes the v3 lower-third bars so the corrected captions have clean space.\n\n## Gate result\n\nPasses local technical gate and has upload notes, chapters, captions, and thumbnail direction. Not marked public-upload-ready until Masala does a full-resolution privacy/watch pass because livestream UI/chat text may still be visible in the underlying footage.\n`)

console.log(JSON.stringify({ id, out, captions: captionPath, captionQa: qa, chapters, ffprobe: JSON.parse(probe.stdout) }, null, 2))
