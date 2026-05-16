#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildShortWordEvents, qaCaptionEvents, secondsFromStamp } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptPath = 'media/transcripts/SxOhgmSWqD4.json'
const stamp = '20260513T2020Z'
const reviewDir = 'media/reviews/day3-originals'
const readyDir = 'media/exports/READY_TO_SHIP_NOW/day3-originals'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const fontSans = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

const clips = [
  {
    key: 'platform-creates-content',
    start: '00:11:58.4',
    end: '00:12:20.4',
    title1: 'STREAM ONCE',
    title2: 'CLIP FOREVER',
    brand: 'VZ',
    brandSub: 'CONTENT ENGINE',
    accent: '0xff3b6b',
    panelY: 322,
    screenY: 390,
    logoY: 1452,
    captionMarginV: 675,
    description: 'Fresh Day 3 clip about the product promise: stream once, turn it into content assets.',
    suggested: 'Stream once. Clip forever. Building the creator content engine live. #BuildInPublic #CreatorTools #AIAgents #VibeCoding',
  },
  {
    key: 'honest-ai-chat',
    start: '00:33:24.0',
    end: '00:33:50.0',
    title1: 'HONEST AI',
    title2: 'NOT FAKE CHAT',
    brand: 'REX',
    brandSub: 'TRANSPARENT AGENTS',
    accent: '0x7c3aed',
    panelY: 330,
    screenY: 402,
    logoY: 1450,
    captionMarginV: 675,
    description: 'Fresh Day 3 clip about transparent AI chat/agent UX instead of tricking viewers.',
    suggested: 'AI chat should feel useful, not fake. Building transparent agent UX live. #AIAgents #UXDesign #BuildInPublic #CreatorTools',
  },
  {
    key: 'agent-loop-keeps-building',
    start: '00:44:48.4',
    end: '00:45:16.4',
    title1: 'AGENTS KEEP',
    title2: 'THE BUILD MOVING',
    brand: 'LOOP',
    brandSub: 'PLAN · BUILD · REVIEW',
    accent: '0x22c55e',
    panelY: 328,
    screenY: 398,
    logoY: 1450,
    captionMarginV: 675,
    description: 'Fresh Day 3 clip about agent loops keeping Vibe Zone moving after stream.',
    suggested: 'The real unlock is the loop: plan, build, review, keep moving. #AIAgents #BuildInPublic #Automation #VibeCoding',
  },
]

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 120 })
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
  const bundleDir = `media/post-ready-review/${id}`
  await mkdir(path.join(root, bundleDir), { recursive: true })

  const events = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: endSec, minDuration: 0.18, maxDuration: 0.62, gap: 0.015 })
  const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
  if (!qa.ok) throw new Error(`${id} caption QA failed: ${qa.failures.join('; ')}`)
  await writeFile(path.join(root, assPath), buildAss(events, { mode: 'short', font: 'DejaVu Sans' }))
  await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

  const vf = [
    'color=c=0x050505:s=1080x1920:r=30:d=' + duration.toFixed(3) + '[base]',
    '[0:v]scale=1000:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
    `[base]drawtext=fontfile=${fontBold}:text='${esc(spec.title1)}':x=(w-text_w)/2:y=82:fontcolor=white:fontsize=84:borderw=6:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc(spec.title2)}':x=(w-text_w)/2:y=172:fontcolor=white:fontsize=88:borderw=6:bordercolor=black[title]`,
    `[title]drawbox=x=40:y=${spec.panelY}:w=1000:h=704:color=black@0.60:t=fill,drawbox=x=40:y=${spec.panelY}:w=1000:h=704:color=white@0.24:t=4[panel]`,
    `[panel][screenfit]overlay=x=(W-w)/2:y=${spec.screenY}:format=auto[withscreen]`,
    // Different logo/brand treatment per clip: big custom mark underneath the video.
    `[withscreen]drawbox=x=(w-520)/2:y=${spec.logoY}:w=520:h=168:color=${spec.accent}@0.18:t=fill,drawbox=x=(w-520)/2:y=${spec.logoY}:w=520:h=168:color=white@0.32:t=4,drawtext=fontfile=${fontBold}:text='${esc(spec.brand)}':x=(w-text_w)/2:y=${spec.logoY + 22}:fontcolor=white:fontsize=88:borderw=5:bordercolor=black,drawtext=fontfile=${fontSans}:text='${esc(spec.brandSub)}':x=(w-text_w)/2:y=${spec.logoY + 112}:fontcolor=white:fontsize=26:borderw=3:bordercolor=black[branded]`,
    `[branded]subtitles='${filterPath(assPath)}':force_style='Alignment=2,MarginV=${spec.captionMarginV}'[vout]`,
  ].join(';')

  run('ffmpeg', ['-y', '-v', 'error', '-ss', spec.start, '-i', source, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', out])
  for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', String(Math.max(4, Math.floor(duration / 2)))], ['proof-frame-03.jpg', String(Math.max(6, Math.floor(duration - 3)))]] ) {
    run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)])
  }
  const contact = `${reviewDir}/${id}-contact-sheet.jpg`
  run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/4,scale=320:-1,tile=7x1', '-frames:v', '1', '-q:v', '3', contact])
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
  run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
  await writeFile(path.join(root, bundleDir, 'ffprobe.json'), probe.stdout)
  await writeFile(path.join(root, bundleDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
  await writeFile(path.join(root, bundleDir, 'upload-card.md'), `# Upload Card — ${spec.title1} ${spec.title2}\n\nRender: \`${out}\`\n\n${spec.description}\n\nSuggested caption:\n${spec.suggested}\n\nStatus: local proof candidate. Manual upload only; owner approval required.\n`)
  const readyVideo = `${readyDir}/${slug(spec.title1 + ' ' + spec.title2)}.mp4`
  const readySheet = `${readyDir}/${slug(spec.title1 + ' ' + spec.title2)}-contact-sheet.jpg`
  await copyFile(path.join(root, out), path.join(root, readyVideo))
  await copyFile(path.join(root, contact), path.join(root, readySheet))
  outputs.push({ id, out, readyVideo, readySheet, assPath, captionQa: qa, ffprobe: JSON.parse(probe.stdout), suggested: spec.suggested })
}

await writeFile(path.join(root, readyDir, 'README.md'), `# Day 3 Original Clip Batch — ${stamp}\n\nThree fresh original Day 3 short clips. Different title/brand treatments. No external posting.\n\n${outputs.map((o, i) => `${i + 1}. ${o.readyVideo}\n   Proof: ${o.readySheet}\n   Caption events: ${o.captionQa.eventCount}\n   Suggested: ${o.suggested}`).join('\n\n')}\n`)
console.log(JSON.stringify({ stamp, readyDir, outputs }, null, 2))
