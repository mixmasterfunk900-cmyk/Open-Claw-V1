import { createWriteStream } from 'node:fs'
import { mkdir, rename, stat, unlink } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'

const [, , fileId, outputPath] = process.argv
if (!fileId || !outputPath) {
  console.error('Usage: node scripts/download-drive-file.mjs <fileId> <outputPath>')
  process.exit(2)
}
const userAgent = 'Mozilla/5.0 OpenClaw Vibe Zone downloader'
const cookieJar = new Map()
function cookieHeader() { return [...cookieJar].map(([k, v]) => `${k}=${v}`).join('; ') }
function storeCookies(headers) {
  const raw = headers.getSetCookie ? headers.getSetCookie() : []
  for (const item of raw) {
    const [pair] = item.split(';')
    const eq = pair.indexOf('=')
    if (eq > 0) cookieJar.set(pair.slice(0, eq), pair.slice(eq + 1))
  }
}
async function request(url) {
  const response = await fetch(url, { headers: { 'user-agent': userAgent, ...(cookieJar.size ? { cookie: cookieHeader() } : {}) }, redirect: 'follow' })
  storeCookies(response.headers)
  return response
}
function confirmUrlFromHtml(html) {
  const match = html.match(/href="([^"]*confirm=download[^"]*)"/) || html.match(/href="([^"]*uc\?export=download[^"]*)"/)
  if (!match) return ''
  return new URL(match[1].replaceAll('&amp;', '&'), 'https://drive.google.com').toString()
}
await mkdir(path.dirname(outputPath), { recursive: true })
const tmp = `${outputPath}.download`
let url = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
let response = await request(url)
const contentType = response.headers.get('content-type') || ''
if (contentType.includes('text/html')) {
  const html = await response.text()
  const confirmed = confirmUrlFromHtml(html)
  if (!confirmed) throw new Error('Google Drive returned an HTML page without a direct download link. Check sharing permissions.')
  response = await request(confirmed)
}
if (!response.ok || !response.body) throw new Error(`Download failed: ${response.status} ${response.statusText}`)
await pipeline(response.body, createWriteStream(tmp))
await rename(tmp, outputPath)
const info = await stat(outputPath)
console.log(`Downloaded ${info.size} bytes to ${outputPath}`)
