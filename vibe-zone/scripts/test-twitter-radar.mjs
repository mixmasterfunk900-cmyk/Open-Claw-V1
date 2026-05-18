const baseUrl = process.env.VIBE_ZONE_API_URL || 'http://127.0.0.1:8787'
const topics = ['AI agents', 'build in public', 'creator tools']
const watchAccounts = [
  { handle: '@openai', displayName: 'OpenAI', tier: 'A', topicTags: ['AI agents'], sourceMode: 'manual_search', enabled: true },
  { handle: 'levelsio', displayName: 'Pieter Levels', tier: 'A', topicTags: ['build in public', 'indie hacking'], sourceMode: 'manual_search', lastSeenTweetId: 'local-note-only', enabled: true },
]

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`${path} failed: ${response.status} ${JSON.stringify(body)}`)
  return body
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const initial = await request('/api/twitter-radar')
assert(Array.isArray(initial.topics), 'twitter radar topics must be an array')
assert(Array.isArray(initial.watchAccounts), 'twitter radar watchAccounts must be an array')
assert(initial.watchAccounts.every((account) => account.handle && Array.isArray(account.topicTags)), 'watchlist accounts need normalized handles and topicTags')
assert(initial.watchAccounts.every((account) => account.nextManualCheckAt && account.checkCadenceMinutes && typeof account.priorityScore === 'number'), 'watchlist accounts need manual check scheduling fields')
assert(Array.isArray(initial.items), 'twitter radar items must be an array')
assert(Array.isArray(initial.sourceAdapters) && initial.sourceAdapters.some((source) => source.id === 'manual_x_search'), 'twitter radar needs no-API source adapter status')
assert(Array.isArray(initial.workerLanes) && initial.workerLanes.length === 4, 'twitter radar needs 4 worker lanes')

const configured = await request('/api/twitter-radar/config', {
  method: 'POST',
  body: JSON.stringify({ topics, watchAccounts }),
})
assert(configured.topics.join('|') === topics.join('|'), 'config endpoint should persist supplied topics')
assert(configured.watchAccounts.length === watchAccounts.length, 'config endpoint should persist supplied watchlist accounts')
assert(configured.watchAccounts[0].handle === 'openai', 'watchlist handles should be normalized without @')
assert(configured.pollingMode.includes('2h cron'), 'config should report 2h cron polling mode')

const watchlist = await request('/api/twitter-radar/watchlist', {
  method: 'POST',
  body: JSON.stringify({ accounts: watchAccounts }),
})
assert(watchlist.accounts.length === watchAccounts.length, 'watchlist endpoint should return normalized accounts')

const checked = await request('/api/twitter-radar/watchlist/check', {
  method: 'POST',
  body: JSON.stringify({ handle: 'openai' }),
})
assert(checked.account.handle === 'openai', 'manual check endpoint should update selected account')
assert(checked.account.lastManualCheckedAt && checked.account.nextManualCheckAt, 'manual check endpoint should set last/next check timestamps')

const scanned = await request('/api/twitter-radar/scan', {
  method: 'POST',
  body: JSON.stringify({ topics, watchAccounts }),
})
assert(scanned.lastScanAt, 'scan should set lastScanAt')
assert(scanned.items.length >= topics.length + watchAccounts.length, 'scan should create cards for topics and watchlist accounts')
assert(scanned.items.some((item) => item.source === 'watchlist_account' && item.url.includes('from%3Aopenai')), 'scan should create manual X search cards from watchlist accounts')
assert(scanned.sourceAdapters.some((source) => source.status === 'blocked-credentials' && source.latencyClass === 'real-time-api'), 'scan should preserve real-time API blocked adapter status')

for (const topic of topics) {
  const card = scanned.items.find((item) => item.topic === topic)
  assert(card, `missing radar card for ${topic}`)
  assert(card.url.includes('https://x.com/search'), `card for ${topic} should link to X search`)
  assert(card.replyDraft && card.replyDraft.length > 20, `card for ${topic} needs a real reply draft`)
  assert(card.status === 'needs_manual_screen', `card for ${topic} should be manual screening only`)
}

console.log(`Twitter Radar smoke test passed against ${baseUrl}`)
