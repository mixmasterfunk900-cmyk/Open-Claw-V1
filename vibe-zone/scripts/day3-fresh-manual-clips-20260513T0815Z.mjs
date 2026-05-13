#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data', 'vibe-zone.json')
const stamp = '20260513T0815Z'
const videoId = 'SxOhgmSWqD4'
const inputPath = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptId = 'tx_1778654489042_25b369'

const clips = [
  {
    id: 'clip_day3_platform_creates_content_20260513T0815Z',
    platform: 'youtube',
    start: '15:12',
    end: '15:32',
    title: 'The Platform Clips Everything',
    hook: 'The goal is simple: stream once, then the platform turns it into clips and content automatically.',
    caption: 'Masala explains the bigger Vibe Zone vision: livestream, upload once, then let the creator platform generate clips and distribution assets. Manual upload only.',
    hashtags: ['#BuildInPublic', '#CreatorTools', '#AIWorkflow', '#VibeCoding', '#YouTubeShorts'],
    score: 88,
    reason: 'Manual Day 3 pick: clear product vision, strong Content HQ positioning, non-duplicate versus existing rendered clips.',
    preset: 'centered-screen',
  },
  {
    id: 'clip_day3_first_auto_clip_shipped_20260513T0815Z',
    platform: 'tiktok',
    start: '28:51',
    end: '29:07',
    title: 'First Auto Clip Shipped Live',
    hook: 'That is the first semi-automatic clip shipped live in one day.',
    caption: 'A real build-in-public proof moment: the clip factory went from idea to a semi-automatic upload-ready clip during the same stream.',
    hashtags: ['#BuildInPublic', '#VibeCoding', '#CreatorTools', '#ShipIt', '#AIWorkflow'],
    score: 86,
    reason: 'Manual Day 3 pick: concrete proof/result moment, distinct from the earlier upload-process candidate.',
    preset: 'facecam-smart',
  },
  {
    id: 'clip_day3_content_is_a_funnel_20260513T0815Z',
    platform: 'youtube',
    start: '30:30',
    end: '31:07',
    title: 'Content Is A Funnel',
    hook: 'I am building both: the product and the content machine, because content is a funnel.',
    caption: 'Masala connects the product to the business model: more good offers, more chances to convert, and a creator workflow that supports the whole funnel.',
    hashtags: ['#BuildInPublic', '#CreatorEconomy', '#AIWorkflow', '#Startup', '#VibeCoding'],
    score: 84,
    reason: 'Manual Day 3 pick: product/business thesis and monetization angle; not already exported as its own clip.',
    preset: 'centered-screen',
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
        tags: ['build in public', 'vibe coding', 'creator tools', 'AI workflow', 'Vibe Zone'],
        titleVariants: [spec.title, spec.hook, `${spec.title} — Day 3 Live Build`],
        pinnedComment: 'Would you use a tool that turns a livestream into clips and upload drafts?',
        primaryKeyword: 'AI creator tools',
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
  await writeFile(path.join(absBundle, 'thumbnail-brief.md'), `# Thumbnail Lab Draft — ${spec.title}\n\n- Big text: ${spec.title.toUpperCase().slice(0, 34)}\n- Visual reference: proof-frame.jpg + proof-frame-mid.jpg.\n- Concept: Masala plus product/build screen, high contrast, creator-ops energy.\n- Avoid: readable secrets, logins, tiny UI text, external posting promises.\n- Manual upload only; owner approval required.\n`)
  await writeFile(path.join(absBundle, 'youtube-upload.md'), `# YouTube Shorts Draft — ${spec.title}\n\nTitle: ${spec.seo?.youtubeTitle || spec.title}\n\nDescription:\n${spec.caption}\n\n${spec.hashtags.join(' ')}\n\nChecklist:\n- [ ] Watch render end-to-end\n- [ ] Confirm captions clear Shorts UI\n- [ ] Owner approval before upload\n`)
  await writeFile(path.join(absBundle, 'tiktok-upload.md'), `# TikTok Draft — ${spec.title}\n\nCaption:\n${spec.hook}\n\n${spec.hashtags.join(' ')}\n\nChecklist:\n- [ ] Check first 2 seconds hook\n- [ ] Confirm no private text is readable\n- [ ] Owner approval before upload\n`)
}

await ensureClips()
const results = []
for (const spec of clips) {
  const outputPath = `media/renders/day3-${slug(spec.title)}-${spec.preset}-${stamp}.mp4`
  console.log(`\n[day3-fresh] render ${spec.title} -> ${outputPath}`)
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
  const exported = await api(`/api/clips/${spec.id}/export-bundle`, {})
  await proofAndExtras(exported.bundleDir, path.join(root, outputPath), spec)
  results.push({ id: spec.id, title: spec.title, status: 'ready', outputPath, bundleDir: exported.bundleDir, review: `media/reviews/${path.basename(outputPath, '.mp4')}.review.md` })
}
await writeFile(path.join(root, 'media', 'exports', `day3-fresh-manual-clips-${stamp}.json`), JSON.stringify({ stamp, videoId, results }, null, 2))
console.log('\n[day3-fresh] summary')
console.log(JSON.stringify(results, null, 2))
