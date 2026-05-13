#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260513T1247Z'
const clipId = 'clip_1778603919030_f17815'
const renderPath = `media/renders/stream-2-ai-agents-actually-work-blur-pulse-underlay-${stamp}.mp4`
const bundleDir = `media/exports/clip_stream2_ai_agents_actually_work_blur_pulse_${stamp}`
const reviewPath = `media/reviews/${path.basename(renderPath, '.mp4')}.review.md`
const source = 'media/downloads/stream-2.mp4'
const captions = 'media/transcripts/stream-2-clip_1778603919030_f17815-spoken.ass'
const dbPath = path.join(root, 'data/vibe-zone.json')

function run(command, args, opts = {}) {
  const res = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 80, ...opts })
  if (res.stdout) process.stdout.write(res.stdout)
  if (res.stderr) process.stderr.write(res.stderr)
  return res
}
function must(command, args, label) {
  console.log(`\n[blur-pulse] ${label}`)
  const res = run(command, args)
  if (res.status !== 0) throw new Error(`${label} failed (${res.status})`)
  return res
}

const filter = `[0:v]split=2[main][cam];` +
  `[main]scale=-2:1920,crop=1080:1920:2333:0,boxblur=18:1,eq=brightness='-0.21+0.025*sin(2*PI*t/4)':saturation=0.72[base];` +
  `[cam]crop=390:368:19:64,scale=560:-2,setsar=1,drawbox=x=0:y=0:w=iw:h=ih:color=white@0.34:t=3[face];` +
  `[base]drawbox=x=0:y=0:w=42:h=ih:color=0x35F3FF@0.13:t=fill,drawbox=x=1038:y=0:w=42:h=ih:color=0x7C3AED@0.13:t=fill,drawbox=x=0:y=0:w=iw:h=58:color=0xFFFFFF@0.045:t=fill[underlay];` +
  `[underlay][face]overlay=x=(W-w)/2:y=74:format=auto[withface];` +
  `[withface]drawbox=x=70:y=930:w=940:h=560:color=0x111827@0.91:t=fill,drawbox=x=70:y=930:w=940:h=560:color=0x35F3FF@0.24:t=4,drawtext=text='AI AGENTS THAT ACTUALLY DO WORK':x=(w-text_w)/2:y=1058:fontcolor=white:fontsize=56:fontfile='media/assets/fonts/LilitaOne-Regular.ttf',drawtext=text='while the founder sleeps':x=(w-text_w)/2:y=1238:fontcolor=white@0.88:fontsize=36:font='DejaVu Sans'[card];` +
  `[card]subtitles='${captions}'[vout]`

must('ffmpeg', ['-y', '-ss', '609', '-i', source, '-ss', '5', '-t', '28', '-filter_complex', filter, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '32', '-c:a', 'aac', renderPath], 'render local blur-pulse underlay variant')

const probe = must('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,codec_type,width,height,duration:format=duration,size', '-of', 'json', renderPath], 'ffprobe render')
const ffprobe = JSON.parse(probe.stdout || '{}')

must('node', ['scripts/review-render.mjs', renderPath], 'automated render review')

await mkdir(path.join(root, bundleDir), { recursive: true })
for (const [ss, name] of [['2', 'proof-frame.jpg'], ['9', 'proof-frame-mid.jpg'], ['20', 'proof-frame-late.jpg']]) {
  must('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', renderPath, '-frames:v', '1', '-q:v', '2', path.join(bundleDir, name)], `extract ${name}`)
}
await copyFile(path.join(root, reviewPath), path.join(root, bundleDir, 'automated-review.md')).catch(() => {})

const uploadCard = `# Manual Upload Bundle — AI Agents Actually Do Work (Blur Pulse A/B)\n\n- Source clip: ${clipId}\n- Source timecode: 10:14–10:42, Stream 2\n- Render: ${renderPath}\n- Automated review: ${reviewPath}\n- Local visual layer: blur-pulse underlay, \`aiGeneratedVisuals=false\`, license \`local-generated\`\n- External posting: none; owner approval required.\n\n## YouTube Shorts draft\nTitle: AI agents that actually do work while you sleep\n\nDescription:\nMasala shows the core Vibe Zone promise: agents keep pushing the clip factory forward while the founder is away. This A/B render uses a subtler blur-pulse underlay so the proof card and captions stay readable.\n\n#AIAgents #BuildInPublic #VibeCoding #CreatorTools #YouTubeShorts\n\n## TikTok draft\nAI agents that actually do work while the founder sleeps. Local-first clip factory proof. #AIAgents #BuildInPublic #VibeCoding #CreatorTools\n\n## Manual QA checklist\n- [x] ffprobe passed\n- [x] Automated render review passed\n- [x] Proof frames generated\n- [x] No external assets, posting, logins, cookies, or public exposure\n- [ ] Owner final watch/approval before upload\n`;
await writeFile(path.join(root, bundleDir, 'upload-card.md'), uploadCard)
await writeFile(path.join(root, bundleDir, 'youtube-upload.md'), uploadCard.split('## TikTok draft')[0])
await writeFile(path.join(root, bundleDir, 'tiktok-upload.md'), uploadCard.split('## TikTok draft')[1].split('## Manual QA checklist')[0].trim() + '\n')
await writeFile(path.join(root, bundleDir, 'thumbnail-brief.md'), `# Thumbnail Brief — AI Agents Actually Do Work\n\n- Big text: AGENTS WORK WHILE I SLEEP\n- Visual: Masala facecam + dark blurred product proof card, cyan/purple side glow.\n- Avoid: readable terminal secrets, login screens, tiny UI text, external-posting claims.\n- Use proof-frame-mid.jpg as the safest source frame.\n`)
await writeFile(path.join(root, bundleDir, 'review-notes.md'), `# Review Notes\n\nA/B variant for the Stream 2 AI agents clip. Compared with terminal-grid v1, this keeps the local generated visual layer subtler: blurred source underlay, gentle brightness pulse, cyan/purple side glow, proof card and captions preserved in Shorts safe zones.\n\nAutomated review passed; proof frames look reasonable by generated frame extraction. Manual upload only.\n`)
await writeFile(path.join(root, bundleDir, 'metadata.json'), JSON.stringify({
  id: `clip_stream2_ai_agents_actually_work_blur_pulse_${stamp}`,
  title: 'AI Agents Actually Do Work (Blur Pulse A/B)',
  sourceClipId: clipId,
  sourceTimecode: '10:14-10:42',
  renderPath,
  reviewPath,
  bundleDir,
  createdAt: new Date().toISOString(),
  platforms: ['youtube_shorts', 'tiktok'],
  ownerApprovalRequired: true,
  externalPostingPerformed: false,
  underlay: {
    kind: 'procedural-blur-pulse',
    templateId: 'blur-pulse-v1',
    seed: `stream-2-ai-agents-actually-work-${stamp}`,
    palette: ['#070712', '#35F3FF', '#7C3AED', '#FFFFFF'],
    motionIntensity: 0.06,
    aiGenerated: false,
    license: 'local-generated',
    reviewNotes: 'Safe local FFmpeg-only blur/pulse layer from source footage; no external assets or secrets.'
  },
  ffprobe
}, null, 2))

const db = JSON.parse(await readFile(dbPath, 'utf8'))
const clip = db.clips.find((item) => item.id === clipId)
if (clip) {
  clip.status = 'exported'
  clip.exportedAt = new Date().toISOString()
  clip.renderStatus = 'done'
  clip.renderPath = renderPath
  clip.preferredRenderPath = renderPath
  clip.reviewPath = reviewPath
  clip.exportBundleDir = bundleDir
  clip.localRenderVariants = clip.localRenderVariants || []
  clip.localRenderVariants.push({
    id: `blur-pulse-underlay-${stamp}`,
    label: 'Blur Pulse Underlay A/B',
    renderPath,
    reviewPath,
    bundleDir,
    status: 'ready',
    createdAt: new Date().toISOString(),
    underlay: { kind: 'procedural-blur-pulse', templateId: 'blur-pulse-v1', aiGenerated: false, license: 'local-generated' }
  })
  clip.seo = { ...(clip.seo || {}), fileName: path.basename(renderPath) }
}
await writeFile(dbPath, JSON.stringify(db, null, 2))

await writeFile(path.join(root, 'media', 'exports', `stream-2-ai-agents-blur-pulse-${stamp}.json`), JSON.stringify({ stamp, results: [{ status: 'ready', renderPath, reviewPath, bundleDir, ffprobe }] }, null, 2))
console.log('\n[blur-pulse] ready')
console.log(JSON.stringify({ renderPath, reviewPath, bundleDir }, null, 2))
