#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data', 'vibe-zone.json')
const stamp = '20260513T0642Z'

function slug(value = 'clip') { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'clip' }
function secs(time='0:00') { const p=String(time).split(':').map(Number); return p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1] }
async function api(pathname, body) {
  const res = await fetch(`http://127.0.0.1:8787${pathname}`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body || {}) })
  const txt = await res.text()
  if (!res.ok) throw new Error(`${pathname} ${res.status}: ${txt}`)
  return JSON.parse(txt)
}
function run(cmd, args) {
  return spawnSync(cmd, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 })
}
async function updateClipCopy() {
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  const updates = {
    clip_1778654489064_d2b45a: ['Product or Content Machine?', 'Are you building a product, or are you building the content machine right now?', 'A sharp live-stream product question: is Vibe Zone just a private tool, or useful enough for other streamers too?'],
    clip_1778654489066_7c7868: ['AI Building More AI', 'Why is this building me more AI to try to?', 'Masala realizes the stream tool is now generating AI helpers to test the AI-powered stream tool.'],
    clip_1778654489063_2ce698: ['Quality First, Local First', 'The quality-first thing actually makes sense.', 'A candid product strategy moment: rough drafts can use local AI, but quality still needs the right workflow.'],
    clip_1778654489065_593637: ['A Stream Tool Worth Paying For', 'What would make this good enough to use every stream?', 'Masala narrows Vibe Zone toward an intuitive every-stream tool instead of a one-off hack.'],
    clip_1778654489066_c05550: ['This Is How Streamers Practice', 'If you want to be a streamer, this is how you practice.', 'A strong demo moment: the live chat simulator starts feeling useful for practicing on stream.'],
    clip_1778654489066_55d0d5: ['The Facecam Is Missing', 'My face cam is nowhere to be seen.', 'A clear product QA moment: automated clips need to find the facecam and place it properly.'],
    clip_1778654489067_4a6a74: ['Build While I’m Off Stream', 'I can send it messages from my phone when I’m off stream.', 'The vision for a VPS-powered build agent that keeps the project moving away from the livestream.'],
    clip_1778603919031_ecab86: ['Mic Check Before The Build', 'Why is the mic not working?', 'A human live-build moment: fix the stream basics, then get back to building the company.']
  }
  for (const clip of db.clips) {
    const u = updates[clip.id]
    if (!u) continue
    clip.title = u[0]; clip.hook = u[1]; clip.caption = `${u[1]} ${u[2]}`; clip.hashtags = ['#BuildInPublic', '#VibeCoding', '#AIWorkflow', '#CreatorTools']
  }
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}
async function proofAndBrief(bundleDir, renderPath, clip) {
  await mkdir(path.join(root, bundleDir), { recursive: true })
  const proof = path.join(root, bundleDir, 'proof-frame.jpg')
  run('ffmpeg', ['-y','-v','error','-ss','2','-i',renderPath,'-frames:v','1','-q:v','2',proof])
  await writeFile(path.join(root, bundleDir, 'thumbnail-brief.md'), `# Thumbnail Brief — ${clip.title}\n\n- Big text: ${clip.title.toUpperCase().slice(0, 32)}\n- Visual: Use the proof frame as reference; keep private text unreadable, emphasize Masala + the visible build moment.\n- Mood: build-in-public, slightly chaotic, useful lesson.\n- Safety: manual upload only; review full render before posting.\n`)
}
async function main() {
  await updateClipCopy()
  const targets = [
    { stream:'day3', id:'clip_1778654489064_d2b45a', videoId:'SxOhgmSWqD4', inputPath:'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4', preset:'centered-screen' },
    { stream:'day3', id:'clip_1778654489066_7c7868', videoId:'SxOhgmSWqD4', inputPath:'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4', preset:'centered-screen' },
    { stream:'day3', id:'clip_1778654489063_2ce698', videoId:'SxOhgmSWqD4', inputPath:'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4', preset:'centered-screen' },
    { stream:'day3', id:'clip_1778654489065_593637', videoId:'SxOhgmSWqD4', inputPath:'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4', preset:'centered-screen' },
    { stream:'day3', id:'clip_1778654489066_c05550', videoId:'SxOhgmSWqD4', inputPath:'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4', preset:'facecam-smart' },
    { stream:'day3', id:'clip_1778654489066_55d0d5', videoId:'SxOhgmSWqD4', inputPath:'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4', preset:'facecam-smart' },
    { stream:'day3', id:'clip_1778654489067_4a6a74', videoId:'SxOhgmSWqD4', inputPath:'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4', preset:'centered-screen' },
    { stream:'stream2', id:'clip_1778603919031_ecab86', videoId:'stream-2', inputPath:'media/downloads/stream-2.mp4', preset:'centered-screen', allowArchived:true },
  ]
  const results = []
  for (const t of targets) {
    const db = JSON.parse(await readFile(dbPath, 'utf8'))
    const clip = db.clips.find(c => c.id === t.id)
    if (!clip) { results.push({ ...t, status:'missing' }); continue }
    const outputPath = `media/renders/${t.stream}-${slug(clip.title)}-${t.preset}-${stamp}.mp4`
    console.log(`\n[batch] render ${clip.id} ${clip.title} -> ${outputPath}`)
    const rendered = await api(`/api/clips/${clip.id}/render`, { presetId:t.preset, outputPath, quality:'draft', allowArchived:!!t.allowArchived, inputPath:t.inputPath, videoId:t.videoId, brandText: t.stream === 'day3' ? 'VIBE ZONE' : 'OPENCLAW' })
    if (rendered.clip?.renderStatus !== 'done') { results.push({ ...t, title:clip.title, status:'render-failed', error:rendered.clip?.renderError || rendered.job?.detail }); continue }
    const review = run('node', ['scripts/review-render.mjs', outputPath])
    process.stdout.write(review.stdout || '')
    if (review.status !== 0) { results.push({ ...t, title:clip.title, status:'review-failed', outputPath, reviewExit:review.status }); continue }
    const exported = await api(`/api/clips/${clip.id}/export-bundle`, {})
    await proofAndBrief(exported.bundleDir, path.join(root, outputPath), rendered.clip)
    results.push({ ...t, title:clip.title, status:'ready', outputPath, bundleDir:exported.bundleDir, review: `media/reviews/${path.basename(outputPath, '.mp4')}.review.md` })
  }
  await writeFile(path.join(root, 'media', 'exports', `clip-factory-batch-${stamp}.json`), JSON.stringify({ stamp, results }, null, 2))
  console.log('\n[batch] summary')
  console.log(JSON.stringify(results, null, 2))
}
main().catch(e => { console.error(e); process.exit(1) })
