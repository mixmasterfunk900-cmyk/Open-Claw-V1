#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const ytDlp = path.join(root, '.venv-media', 'bin', 'yt-dlp')
const url = process.argv[2]
const outTemplate = process.argv[3] || 'media/downloads/%(id)s.%(ext)s'

if (!url) {
  console.error('Usage: node scripts/vibe-download.mjs <youtube-url> [output-template]')
  process.exit(2)
}

const common = [
  '--no-playlist',
  '--newline',
  '--merge-output-format', 'mp4',
  '-o', outTemplate,
]

const strategies = [
  {
    name: 'live-hls-web-safari',
    why: 'Best first try for live/replay streams: yt-dlp docs say HLS live streams often avoid PO-token enforcement.',
    args: [...common, '--extractor-args', 'youtube:player_client=web_safari', '-f', 'hls/best[protocol^=m3u8]/best', url],
  },
  {
    name: 'mweb-po-token-ready',
    why: 'Mobile web client route; works better when a PO token provider plugin is installed/healthy.',
    args: [...common, '--extractor-args', 'youtube:player_client=mweb', '-f', 'bv*+ba/b', url],
  },
  {
    name: 'embedded-public',
    why: 'Public embeddable fallback; limited but sometimes avoids normal web client friction.',
    args: [...common, '--extractor-args', 'youtube:player_client=web_embedded', '-f', 'bv*+ba/b', url],
  },
  {
    name: 'standard-best',
    why: 'Plain yt-dlp fallback for videos/IPs not blocked by YouTube.',
    args: [...common, '-f', 'bv*+ba/b', url],
  },
]

const botBlockPattern = /sign in to confirm you.?re not a bot|LOGIN_REQUIRED|use --cookies|cookies-from-browser/i
let lastOutput = ''

await mkdir(path.join(root, 'media', 'downloads'), { recursive: true })
process.chdir(root)

for (const strategy of strategies) {
  console.error(`\n[Vibe Download] Trying ${strategy.name}`)
  console.error(`[Vibe Download] ${strategy.why}`)
  const result = await run(ytDlp, strategy.args)
  lastOutput = result.output
  if (result.code === 0) {
    console.error(`[Vibe Download] Success via ${strategy.name}`)
    process.exit(0)
  }
  const blocked = botBlockPattern.test(result.output)
  console.error(`[Vibe Download] ${strategy.name} failed${blocked ? ' — YouTube bot-check/IP block detected' : ''}.`)
}

console.error('\n[Vibe Download] All safe server-side strategies failed.')
if (botBlockPattern.test(lastOutput)) {
  console.error('[Vibe Download] This looks like YouTube rejecting the VPS/cloud IP, not a missing code path. Use the local companion/import flow or a trusted residential/local route.')
}
process.exit(1)

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => { const text = chunk.toString(); output += text; process.stdout.write(text) })
    child.stderr.on('data', (chunk) => { const text = chunk.toString(); output += text; process.stderr.write(text) })
    child.on('error', (error) => resolve({ code: 127, output: `${output}\n${error.message}` }))
    child.on('close', (code) => resolve({ code, output }))
  })
}
