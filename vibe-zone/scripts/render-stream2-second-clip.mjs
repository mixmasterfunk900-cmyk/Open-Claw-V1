#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const clipId = 'clip_1778603919030_f17815'
const presets = process.argv.slice(2)
const selected = presets.length ? presets : ['hook-card', 'facecam-smart']
let failedReview = false

async function render(presetId) {
  const outputPath = `media/renders/stream-2-second-clip-${presetId}.mp4`
  const response = await fetch(`http://127.0.0.1:8787/api/clips/${clipId}/render`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      presetId,
      outputPath,
      quality: 'draft',
      allowArchived: true,
      inputPath: 'media/downloads/stream-2.mp4',
      videoId: 'stream-2',
    }),
  })
  const body = await response.json()
  if (!response.ok || body.clip?.renderStatus !== 'done') {
    failedReview = true
    console.error(`${presetId} render not reviewable: ${body.clip?.renderError || body.job?.detail || JSON.stringify(body)}`)
    return
  }
  const renderPath = outputPath
  console.log(`${presetId}: ${body.clip?.renderStatus || 'done'} -> ${renderPath}`)
  const review = spawnSync('node', ['scripts/review-render.mjs', renderPath], { encoding: 'utf8', stdio: 'pipe' })
  process.stdout.write(review.stdout)
  if (review.status !== 0) failedReview = true
}

for (const preset of selected) await render(preset)
if (failedReview) {
  console.log('One or more renders failed automated review. Treat as iteration-needed, not ready-to-ship.')
  process.exit(3)
}
