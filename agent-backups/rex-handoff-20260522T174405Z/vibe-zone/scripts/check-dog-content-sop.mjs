import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const laneRoot = path.join(root, 'media/practice/youtube-automation/dog-content')
const minWords = Number(process.env.DOG_CONTENT_MIN_WORDS || 1600)
const maxWords = Number(process.env.DOG_CONTENT_MAX_WORDS || 2400)
const required = [
  (slug) => `media/practice/youtube-automation/dog-content/${slug}/transcripts/${slug}-script-v1.md`,
  (slug) => `media/practice/youtube-automation/dog-content/${slug}/transcripts/${slug}-script-v1-voiceover-only.txt`,
  (slug) => `media/practice/youtube-automation/dog-content/${slug}/transcripts/${slug}-source-notes.md`,
  (slug) => `media/practice/youtube-automation/dog-content/${slug}/seo.md`,
  (slug) => `media/practice/youtube-automation/dog-content/${slug}/visual-plan/${slug}-visual-plan.md`,
]

const formulaChecks = [
  { id: 'owner-recognition hook', test: (text) => /^your dog\b/i.test(text.trim()) },
  { id: 'common assumption', test: (text) => /most people|people (?:usually|often)|to a human/i.test(text) },
  { id: 'curiosity turn', test: (text) => /but (?:the truth|both answers|that is not|the science|the story)|except the science|more interesting/i.test(text) },
  { id: 'research-backed explanation', test: (text) => /research|study|studies|researchers|formal term|FRAPs|attachment|Horowitz|secure base|social referencing/i.test(text) },
  { id: 'body/context nuance', test: (text) => /context matters|look at the body|body language|body quality|pattern|what happened before|trigger|not one behaviour|same .* can mean/i.test(text) },
  { id: 'practical owner takeaway', test: (text) => /what do you do|useful owner|simple rule|practical test|first,|second,|third,|diary|reward|prevent|practice/i.test(text) },
  { id: 'emotional payoff', test: (text) => /understanding|communication|safe|relationship|trust|not a character flaw|whole room gets translated/i.test(text) },
  { id: 'next-video CTA bridge', test: (text) => /in the next video|next, we are going|what we are going to cover next/i.test(text) },
]

const expectedNext = {
  'dog-staring-psychology': /follow(?:s)? you everywhere|shadow/i,
  'why-dogs-follow-you-everywhere': /zoomies|FRAPs/i,
  'why-dogs-get-zoomies': /guilty look|look guilty/i,
  'why-dogs-look-guilty': /bring(?:s)? you (?:a )?(?:toy|toys)|gifts?/i,
}

const exists = async (file) => {
  try { return (await stat(path.join(root, file))).isFile() } catch { return false }
}
const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length
const entries = await readdir(laneRoot, { withFileTypes: true })
const projectSlugs = entries.filter((entry) => entry.isDirectory() && entry.name !== 'transcripts').map((entry) => entry.name).sort()
const failures = []
const rows = []
for (const slug of projectSlugs) {
  for (const rel of required.map((fn) => fn(slug))) {
    if (!await exists(rel)) failures.push(`${slug}: missing ${rel}`)
  }
  const scriptRel = `media/practice/youtube-automation/dog-content/${slug}/transcripts/${slug}-script-v1-voiceover-only.txt`
  if (await exists(scriptRel)) {
    const text = await readFile(path.join(root, scriptRel), 'utf8')
    const words = wordCount(text)
    rows.push({ slug, words })
    if (words < minWords) failures.push(`${slug}: voiceover too short (${words} words; min ${minWords})`)
    if (words > maxWords) failures.push(`${slug}: voiceover too long (${words} words; max ${maxWords})`)
    for (const check of formulaChecks) {
      if (!check.test(text)) failures.push(`${slug}: missing writing formula check: ${check.id}`)
    }
    const nextCheck = expectedNext[slug]
    if (nextCheck && !nextCheck.test(text)) failures.push(`${slug}: CTA does not bridge to expected next episode`)
  }
}
if (!projectSlugs.length) failures.push('No Dog Content project folders found')
console.log('Dog Content SOP gate')
for (const row of rows) console.log(`- ${row.slug}: ${row.words} words`)
console.log(`Formula checks: ${formulaChecks.map((check) => check.id).join(' · ')}`)
if (failures.length) {
  console.error('\nFAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`PASS (${projectSlugs.length} project(s), ${minWords}-${maxWords} word gate + writing formula + CTA chain)`)
