#!/usr/bin/env node
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const baseId = 'day3-product-content-machine-v3-20260513T1500Z'
const finalId = 'day3-product-content-machine-final-captioned-20260513T1730Z'
const source = `media/renders/long-form/${baseId}.mp4`
const out = `media/renders/long-form/${finalId}.mp4`
const captionPath = `media/renders/long-form/${finalId}.ass`
const reviewDir = 'media/reviews/long-form'
const exportDir = `media/exports/long-form/${finalId}`
const transcriptPath = 'media/transcripts/SxOhgmSWqD4.json'
const font = 'DejaVu Sans'

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
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 120 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function toSec(ts) {
  const [h, m, rest] = ts.split(':')
  return Number(h) * 3600 + Number(m) * 60 + Number(rest)
}
function assTime(sec) {
  sec = Math.max(0, sec)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const cs = Math.floor((sec - Math.floor(sec)) * 100)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}
function cleanText(s) {
  return String(s || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[{}]/g, '')
    .trim()
}
function escAss(s) {
  return s.replace(/\\/g, '\\\\').replace(/\{/g, '').replace(/\}/g, '')
}
function chunkWords(words, max = 9) {
  const chunks = []
  let current = []
  for (const word of words) {
    current.push(word)
    if (current.length >= max || /[.!?]$/.test(word)) {
      chunks.push(current)
      current = []
    }
  }
  if (current.length) chunks.push(current)
  return chunks
}

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
let timeline = 5 // intro card duration in the source edit
const mapped = []
for (const beat of beats) {
  const srcStart = toSec(beat.start)
  const srcEnd = toSec(beat.end)
  const beatDuration = srcEnd - srcStart
  for (const seg of transcript.segments || []) {
    const start = Math.max(seg.start, srcStart)
    const end = Math.min(seg.end, srcEnd)
    const text = cleanText(seg.text)
    if (end <= start || !text) continue
    mapped.push({ start: timeline + (start - srcStart), end: timeline + (end - srcStart), text })
  }
  timeline += beatDuration
}

const events = []
for (const seg of mapped) {
  const words = seg.text.split(/\s+/).filter(Boolean)
  if (!words.length) continue
  const chunks = chunkWords(words, 9)
  let offsetWords = 0
  for (const chunk of chunks) {
    const chunkStart = seg.start + (seg.end - seg.start) * (offsetWords / words.length)
    const chunkEnd = seg.start + (seg.end - seg.start) * ((offsetWords + chunk.length) / words.length)
    const perWord = Math.max(0.16, (chunkEnd - chunkStart) / chunk.length)
    for (let i = 0; i < chunk.length; i++) {
      const start = chunkStart + i * perWord
      const end = i === chunk.length - 1 ? chunkEnd + 0.18 : chunkStart + (i + 1) * perWord
      const visible = chunk.slice(0, i + 1).join(' ')
      events.push(`Dialogue: 0,${assTime(start)},${assTime(end)},Caption,,0,0,0,,${escAss(visible)}`)
    }
    offsetWords += chunk.length
  }
}

const ass = `[Script Info]\nTitle: Vibe Zone long form sentence reveal captions\nScriptType: v4.00+\nWrapStyle: 2\nScaledBorderAndShadow: yes\nPlayResX: 1920\nPlayResY: 1080\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Caption,${font},54,&H00FFFFFF,&H00FF3B6B,&H00200A18,&HAA000000,-1,0,0,0,100,100,0,0,1,5,1.5,2,190,190,66,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${events.join('\n')}\n`
await writeFile(path.join(root, captionPath), ass)

const escapedCaption = captionPath.replace(/:/g, '\\:').replace(/'/g, "'\\''")
const vf = `subtitles='${escapedCaption}',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='VIBE ZONE':fontcolor=#ff3b6b:fontsize=24:x=w-text_w-90:y=72:box=1:boxcolor=black@0.28:boxborderw=12`
run('ffmpeg', [
  '-y', '-v', 'error', '-i', source,
  '-vf', vf,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'copy', out,
])

run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:52', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${finalId}-screenshot.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/45,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${finalId}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out])
await writeFile(path.join(root, `${reviewDir}/${finalId}.ffprobe.json`), probe.stdout)
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
await writeFile(path.join(root, `${reviewDir}/${finalId}.decode.log`), decode.stderr || decode.stdout || '')
if (decode.status !== 0) throw new Error(`decode failed\n${decode.stderr || decode.stdout}`)

await copyFile(path.join(root, 'media/exports/long-form/day3-product-content-machine-v3-20260513T1500Z/upload-notes.md'), path.join(root, exportDir, 'upload-notes-base.md'))
await writeFile(path.join(root, exportDir, 'upload-notes.md'), `# Manual Upload Notes — Day 3 Product + Content Machine Final Captioned\n\nRender: \`${out}\`  \nCaptions: sentence reveal, same visual family as shorts, words reveal progressively across each sentence.  \nScreenshot/proof frame: \`${reviewDir}/${finalId}-screenshot.jpg\`  \nContact sheet: \`${reviewDir}/${finalId}-contact-sheet.jpg\`  \nCaption source: \`${captionPath}\`  \nStatus: final local upload candidate; manual upload only; owner approval required.\n\n## Recommended title\n\nI’m Building the Product and the Content Machine at the Same Time\n\n## Alternate titles\n\n1. Building Vibe Zone Live: Product, Clips, Agents, and the Next Bottleneck\n2. The Creator Tool Has to Become Its Own Content Machine\n3. I Built an AI Content Machine Live\n\n## Description draft\n\nA Day 3 build-in-public story from the Vibe Zone livestream: Masala frames why the product matters, explains the promise of turning streams into a content engine, hits the rough prototype reality, ships live anyway, and lands on the agent loop plus the next bottleneck: face tracking.\n\nAssembled locally with FFmpeg from stream footage. No external posting, logins, cookies, or cloud editing were used.\n\n## Chapters\n\n00:00 Intro — product + content machine  \n00:05 Why this build matters  \n00:19 The product promise  \n01:01 The rough part  \n01:53 Ship it live anyway  \n02:10 Product or content machine?  \n02:49 The agent loop  \n04:15 Next bottleneck: face tracking  \n04:48 CTA — follow the build\n\n## Thumbnail direction\n\nPrimary: face-led GothamChess-inspired split thesis. Masala face close-up on one side, Vibe Zone dashboard/agent loop on the other, strong contrast, huge text: PRODUCT OR CONTENT?\n\nAlternates live in \`media/exports/long-form/LONG_FORM_THUMBNAIL_OPTIONS.md\`.\n\n## Pre-upload checklist\n\n- [x] Local render exists.\n- [x] Captions burned in with sentence reveal style.\n- [x] VIBE ZONE logo burn present.\n- [x] ffprobe passed.\n- [x] Full decode passed.\n- [x] Proof frame and contact sheet generated.\n- [ ] Masala final full-resolution watch/privacy pass before public upload.\n`)

console.log(JSON.stringify({ finalId, out, captions: captionPath, events: events.length, exportDir, ffprobe: JSON.parse(probe.stdout) }, null, 2))
