#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data', 'vibe-zone.json')
const stamp = '20260513T0947Z'
const videoId = 'SxOhgmSWqD4'
const inputPath = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptId = 'tx_1778654489042_25b369'

const clips = [
  {
    id: 'clip_day3_iphone_for_streamers_20260513T0947Z',
    platform: 'youtube',
    start: '31:55',
    end: '32:18',
    title: 'An iPhone For Streamers',
    hook: 'The product should feel like an iPhone for streamers: start the stream, and the hard parts disappear.',
    caption: 'Masala turns the Vibe Zone roadmap into one clean product promise: make stream repurposing intuitive enough that creators can just stream and keep moving.',
    hashtags: ['#CreatorTools', '#BuildInPublic', '#AIWorkflow', '#StreamerTools', '#VibeCoding'],
    score: 87,
    reason: 'Fresh Day 3 manual pick: strong product positioning with a memorable analogy, not duplicated by prior exports.',
    preset: 'facecam-smart',
  },
  {
    id: 'clip_day3_continuous_agent_pipeline_20260513T0947Z',
    platform: 'tiktok',
    start: '44:48',
    end: '45:29',
    title: 'Continuous Agent Pipeline',
    hook: 'Planner, builder, scout: each agent finishes, checks the gaps, and kicks off the next task.',
    caption: 'A concise explanation of the multi-agent production loop behind Vibe Zone: planning work, doing work, finding gaps, and continuing without a manual reset.',
    hashtags: ['#AIAgents', '#BuildInPublic', '#VibeCoding', '#Automation', '#CreatorTools'],
    score: 85,
    reason: 'Fresh Day 3 manual pick: unique architecture/agent workflow angle, high relevance to Masala’s current all-day production loop.',
    preset: 'centered-screen',
  },
  {
    id: 'clip_day3_build_the_face_tracker_live_20260513T0947Z',
    platform: 'youtube',
    start: '55:33',
    end: '56:49',
    title: 'Build The Face Tracker Live',
    hook: 'We are taking simple tracked frames and turning them into a face tracker for better clips.',
    caption: 'A behind-the-scenes build moment: Masala pushes the clip system toward smarter face tracking so the vertical crop follows the creator instead of guessing.',
    hashtags: ['#BuildInPublic', '#AIVideo', '#CreatorTools', '#VibeCoding', '#YouTubeShorts'],
    score: 82,
    reason: 'Fresh Day 3 manual pick: directly supports the latest facecam-tracking preset work and creates a useful proof clip.',
    preset: 'facecam-smart',
  },
]

const slug = (value = 'clip') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'clip'
function run(command, args) { return spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 }) }
async function api(pathname, body) {
  const res = await fetch(`http://127.0.0.1:8787${pathname}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${pathname} ${res.status}: ${text}`)
  return JSON.parse(text)
}
async function ensureClips() {
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  for (const spec of clips) {
    const existing = db.clips.find((clip) => clip.id === spec.id)
    const payload = {
      id: spec.id,
      transcriptId,
      platform: spec.platform,
      status: 'idea',
      exportedAt: null,
      score: spec.score,
      start: spec.start,
      end: spec.end,
      title: spec.title,
      hook: spec.hook,
      caption: spec.caption,
      hashtags: spec.hashtags,
      reason: spec.reason,
      createdAt: new Date().toISOString(),
      seo: {
        youtubeTitle: `${spec.title} | Building Vibe Zone Live`,
        description: `${spec.caption}\n\nManual upload draft from Day 3 (SxOhgmSWqD4).`,
        tiktokDescription: `${spec.hook} ${spec.hashtags.join(' ')}`,
        tags: ['build in public', 'vibe coding', 'creator tools', 'AI agents', 'Vibe Zone'],
        titleVariants: [spec.title, spec.hook, `${spec.title} — Day 3 Live Build`],
        pinnedComment: 'Should creator tools automate clips after every livestream?',
        primaryKeyword: spec.title.includes('Agent') ? 'AI agents' : 'AI creator tools',
        fileName: `${slug(spec.title)}-${stamp}.mp4`,
      },
    }
    if (existing) Object.assign(existing, payload, { createdAt: existing.createdAt || payload.createdAt })
    else db.clips.unshift(payload)
  }
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}
async function proofAndExtras(bundleDir, renderPath, spec) {
  const absBundle = path.join(root, bundleDir)
  await mkdir(absBundle, { recursive: true })
  run('ffmpeg', ['-y', '-v', 'error', '-ss', '2', '-i', renderPath, '-frames:v', '1', '-q:v', '2', path.join(absBundle, 'proof-frame.jpg')])
  run('ffmpeg', ['-y', '-v', 'error', '-ss', '8', '-i', renderPath, '-frames:v', '1', '-q:v', '2', path.join(absBundle, 'proof-frame-mid.jpg')])
  await writeFile(path.join(absBundle, 'thumbnail-brief.md'), `# Thumbnail Lab Draft — ${spec.title}\n\n- Big text: ${spec.title.toUpperCase().slice(0, 34)}\n- Visual reference: proof-frame.jpg + proof-frame-mid.jpg.\n- Concept: Masala + product/build screen, clear proof-of-work energy, bold contrast.\n- Avoid: readable secrets, logins, tiny UI text, public-posting claims.\n- Manual upload only; owner approval required.\n`)
  await writeFile(path.join(absBundle, 'youtube-upload.md'), `# YouTube Shorts Draft — ${spec.title}\n\nTitle: ${spec.seo?.youtubeTitle || spec.title}\n\nDescription:\n${spec.caption}\n\n${spec.hashtags.join(' ')}\n\nChecklist:\n- [ ] Watch render end-to-end\n- [ ] Confirm captions clear Shorts UI\n- [ ] Owner approval before upload\n`)
  await writeFile(path.join(absBundle, 'tiktok-upload.md'), `# TikTok Draft — ${spec.title}\n\nCaption:\n${spec.hook}\n\n${spec.hashtags.join(' ')}\n\nChecklist:\n- [ ] Check first 2 seconds hook\n- [ ] Confirm no private text is readable\n- [ ] Owner approval before upload\n`)
}

await ensureClips()
const results = []
for (const spec of clips) {
  const outputPath = `media/renders/day3-${slug(spec.title)}-${spec.preset}-${stamp}.mp4`
  console.log(`\n[day3-0947] render ${spec.title} -> ${outputPath}`)
  const rendered = await api(`/api/clips/${spec.id}/render`, { presetId: spec.preset, outputPath, quality: 'draft', inputPath, videoId, brandText: 'VIBE ZONE', headline: spec.hook })
  if (rendered.clip?.renderStatus !== 'done') {
    results.push({ id: spec.id, title: spec.title, status: 'render-failed', error: rendered.clip?.renderError })
    continue
  }
  const review = run('node', ['scripts/review-render.mjs', outputPath])
  process.stdout.write(review.stdout || '')
  if (review.status !== 0) {
    results.push({ id: spec.id, title: spec.title, status: 'review-failed', outputPath })
    continue
  }
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,duration', '-of', 'json', outputPath])
  const exported = await api(`/api/clips/${spec.id}/export-bundle`, {})
  await proofAndExtras(exported.bundleDir, path.join(root, outputPath), spec)
  results.push({ id: spec.id, title: spec.title, status: 'ready', outputPath, bundleDir: exported.bundleDir, review: `media/reviews/${path.basename(outputPath, '.mp4')}.review.md`, ffprobe: JSON.parse(probe.stdout || '{}') })
}
await writeFile(path.join(root, 'media', 'exports', `day3-manual-clips-${stamp}.json`), JSON.stringify({ stamp, videoId, results }, null, 2))
console.log('\n[day3-0947] summary')
console.log(JSON.stringify(results.map(({ffprobe, ...r}) => r), null, 2))
