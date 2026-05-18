import { readFile } from 'node:fs/promises'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const app = await readFile('src/App.tsx', 'utf8')
const css = await readFile('src/App.css', 'utf8')
const server = await readFile('server/server.mjs', 'utf8')

for (const text of [
  "'twitter-radar'",
  'TwitterRadarPage',
  'Run screening now',
  'High-profile watchlist',
  'Save topics + watchlist',
  '/api/twitter-radar/scan',
  'Open X search',
  'Copy reply',
  'No-API source adapters',
  '4-lane radar workers',
  'Manual check queue',
  '/api/twitter-radar/watchlist/check',
  'Bulk watchlist import/export',
  'parseBulkWatchAccount',
  'Copy CSV export',
]) {
  assert(app.includes(text), `App.tsx missing ${text}`)
}

for (const text of [
  '.twitter-radar-hero',
  '.twitter-radar-card',
  '.reply-draft',
  '.radar-input-label',
  '.twitter-watch-card',
  '.watch-tier',
  '.radar-source-grid',
  '.radar-worker-grid',
  '.manual-check-list',
  '.radar-bulk-grid',
]) {
  assert(css.includes(text), `App.css missing ${text}`)
}

for (const text of [
  '/api/twitter-radar',
  '/api/twitter-radar/config',
  '/api/twitter-radar/watchlist',
  '/api/twitter-radar/scan',
  'scanTwitterRadar',
  'normalizeTwitterRadar',
  'normalizeWatchAccounts',
  'makeWatchlistRadarItem',
  'normalizeRadarSourceAdapters',
  'normalizeRadarWorkerLanes',
  'markTwitterRadarAccountChecked',
  'watchPriorityScore',
]) {
  assert(server.includes(text), `server.mjs missing ${text}`)
}

console.log('Twitter Radar static UI contract passed')
