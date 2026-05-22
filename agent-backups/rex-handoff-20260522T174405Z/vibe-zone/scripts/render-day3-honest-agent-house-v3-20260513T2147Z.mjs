#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildShortWordEvents, qaCaptionEvents, secondsFromStamp } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptPath = 'media/transcripts/SxOhgmSWqD4.json'
const logoPath = 'media/assets/logos/openclaw-logo-text.png'
const stamp = '20260513T2147Z'
const reviewDir = 'media/reviews'
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const fontSans = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

const clips = [
  {
    key: 'honest-ai-chat-house-v3',
    start: '00:33:24.0',
    end: '00:33:50.0',
    title1: 'HONEST AI',
    title2: 'NOT FAKE CHAT',
    context: 'TRANSPARENT AGENT UX, BUILT LIVE',
    readyName: 'short-honest-ai-not-fake-chat-house-v3.mp4',
    suggested: 'AI chat should feel useful, not fake. Building transparent agent UX live. #AIAgents #UXDesign #BuildInPublic #CreatorTools',
  },
  {
    key: 'agent-loop-keeps-building-house-v3',
    start: '00:44:48.4',
    end: '00:45:16.4',
    title1: 'AGENTS KEEP',
    title2: 'THE BUILD MOVING',
    context: 'PLAN · BUILD · REVIEW · KEEP MOVING',
    readyName: 'short-agents-keep-the-build-moving-house-v3.mp4',
    suggested: 'The real unlock is the loop: plan, build, review, keep moving. #AIAgents #BuildInPublic #Automation #VibeCoding',
  },
]

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 160 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,') }
function filterPath(p) { return p.replace(/:/g, '\\:').replace(/'/g, "'\\''") }
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const outputs = []

for (const spec of clips) {
  const id = `day3-${spec.key}-${stamp}`
  const startSec = secondsFromStamp(spec.start)
  const endSec = secondsFromStamp(spec.end)
  const duration = endSec - startSec
  const assPath = `media/transcripts/${id}.ass`
  const out = `media/renders/${id}.mp4`
  const bundleDir = `media/exports/clip_${id}`
  await mkdir(path.join(root, bundleDir), { recursive: true })

  let events = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: endSec, minDuration: 0.18, maxDuration: 0.62, gap: 0.015 })
  events = events.map((event) => ({ ...event, text: event.text.replace(/[^\p{L}\p{N}'-]/gu, '').toUpperCase() })).filter((event) => event.text)
  const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
  if (!qa.ok) throw new Error(`${id} caption QA failed: ${qa.failures.join('; ')}`)
  await writeFile(path.join(root, assPath), buildAss(events, { mode: 'short', font: 'DejaVu Sans' }))
  await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

  // House-style default: source screen/context first, white title/captions,
  // real OpenClaw/VIBE ZONE branding, no colored card/blue box, no square-face default.
  // The dim blurred source underlay keeps the lower half alive without becoming a card.
  const vf = [
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=-0.34:saturation=0.55[bg]`,
    `[0:v]scale=1000:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]`,
    `[1:v]scale=520:-1,format=rgba[logo]`,
    `[bg]drawbox=x=0:y=0:w=1080:h=1920:color=black@0.34:t=fill[base]`,
    `[base]drawtext=fontfile=${fontBold}:text='${esc(spec.title1)}':x=(w-text_w)/2:y=82:fontcolor=white:fontsize=84:borderw=6:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc(spec.title2)}':x=(w-text_w)/2:y=172:fontcolor=white:fontsize=80:borderw=6:bordercolor=black[title]`,
    `[title]drawbox=x=40:y=320:w=1000:h=704:color=black@0.62:t=fill,drawbox=x=40:y=320:w=1000:h=704:color=white@0.24:t=4[panel]`,
    `[panel][screenfit]overlay=x=(W-w)/2:y=388:format=auto[withscreen]`,
    `[withscreen]drawtext=fontfile=${fontSans}:text='${esc(spec.context)}':x=(w-text_w)/2:y=1098:fontcolor=white@0.92:fontsize=34:borderw=4:bordercolor=black[context]`,
    `[context]drawtext=fontfile=${fontBold}:text='${esc('VIBE ZONE')}':x=(w-text_w)/2:y=1378:fontcolor=white:fontsize=58:borderw=5:bordercolor=black[vibezone]`,
    `[vibezone][logo]overlay=x=(W-w)/2:y=1470:format=auto[branded]`,
    `[branded]subtitles='${filterPath(assPath)}':force_style='Alignment=2,MarginV=675'[vout]`,
  ].join(';')

  run('ffmpeg', ['-y', '-v', 'error', '-ss', spec.start, '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
  for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', String(Math.max(4, Math.floor(duration / 2)))], ['proof-frame-03.jpg', String(Math.max(6, Math.floor(duration - 3)))]] ) {
    run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)])
  }
  const contactSheet = `${reviewDir}/${id}-contact-sheet.jpg`
  run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=7x1', '-frames:v', '1', '-q:v', '3', contactSheet])
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
  run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
  await writeFile(path.join(root, bundleDir, 'ffprobe.json'), probe.stdout)
  await writeFile(path.join(root, bundleDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
  await writeFile(path.join(root, bundleDir, 'upload-copy.md'), `# Upload Bundle — ${spec.title1} ${spec.title2}\n\nRender: \`${out}\`\nContact sheet: \`${contactSheet}\`\n\nSuggested caption:\n${spec.suggested}\n\n## Safety/review notes\nLocal-only export. Manual upload only after owner approval. House-style v3 uses screen-first layout, visible VIBE ZONE + OpenClaw branding, white captions, and no blue/square-face default.\n`)
  const readyVideo = `${readyDir}/${spec.readyName}`
  const readySheet = `${readyDir}/${slug(spec.readyName.replace(/\.mp4$/, ''))}-contact-sheet.jpg`
  await copyFile(path.join(root, out), path.join(root, readyVideo))
  await copyFile(path.join(root, contactSheet), path.join(root, readySheet))
  outputs.push({ id, out, readyVideo, readySheet, bundleDir, assPath, captionQa: qa, contactSheet, ffprobe: JSON.parse(probe.stdout), suggested: spec.suggested })
}

console.log(JSON.stringify({ stamp, outputs }, null, 2))
