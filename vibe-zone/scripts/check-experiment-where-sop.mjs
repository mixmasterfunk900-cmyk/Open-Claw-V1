import { readdir, stat, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const workspace = path.resolve(root, '..')
const laneRoot = path.join(root, 'media/practice/youtube-automation/the-experiment-where')
const sopRoot = path.join(workspace, 'youtube-automation-niche-flow-repo/niches/the-experiment-where/sop')
const failures = []
const rows = []

const exists = async (file) => {
  try { return (await stat(file)).isFile() } catch { return false }
}

const requiredSops = [
  'ExperimentChannel_AI_SOP.md',
  'ExperimentChannel_Script_SOP_Human.md',
  'ExperimentChannel_Thumbnail_SOP.md',
  'ExperimentChannel_Visual_SOP.md',
]
for (const sop of requiredSops) {
  if (!await exists(path.join(sopRoot, sop))) failures.push(`missing niche SOP ${path.join(sopRoot, sop)}`)
}

let entries = []
try { entries = await readdir(laneRoot, { withFileTypes: true }) } catch {
  failures.push(`missing The Experiment Where lane root: ${laneRoot}`)
}
const projectSlugs = entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('_')).map((entry) => entry.name).sort()

const forbidden = ['fascinating', 'incredible', 'amazing', 'interestingly', 'surprisingly', 'notably', 'crucially', 'importantly']
const requiredTerms = ['John B. Watson', 'Rosalie Rayner', '1920', 'Johns Hopkins', 'Little Albert']

for (const slug of projectSlugs) {
  const project = path.join(laneRoot, slug)
  const script = path.join(project, 'transcripts', `${slug}-script-v1.md`)
  const voice = path.join(project, 'transcripts', `${slug}-script-v1-voiceover-only.txt`)
  const sources = path.join(project, 'transcripts', `${slug}-source-notes.md`)
  const visualPlan = path.join(project, 'visual-plan', `${slug}-visual-plan-draft.md`)
  const thumbnails = path.join(project, 'thumbnails')
  for (const file of [script, voice, sources, visualPlan]) {
    if (!await exists(file)) failures.push(`${slug}: missing ${path.relative(root, file)}`)
  }
  let scriptText = ''
  if (await exists(script)) scriptText = await readFile(script, 'utf8')
  const words = scriptText.split(/\s+/).filter(Boolean)
  if (words.length < 2000 || words.length > 2600) failures.push(`${slug}: word count ${words.length} outside 2000-2600`)
  for (const word of forbidden) {
    const re = new RegExp(`\\b${word}\\b`, 'i')
    if (re.test(scriptText)) failures.push(`${slug}: forbidden word '${word}' found`)
  }
  for (const term of requiredTerms) {
    if (!scriptText.includes(term)) failures.push(`${slug}: missing required term '${term}'`)
  }
  const first120 = words.slice(0, 140).join(' ').toLowerCase()
  if (!first120.includes('taught to fear')) failures.push(`${slug}: result not clearly stated in opening block`)
  if (!/Mineka|Cook/.test(scriptText)) failures.push(`${slug}: missing modern parallel Mineka/Cook`)
  if (!/LeDoux|Phelps/.test(scriptText)) failures.push(`${slug}: missing modern neural fear parallel`)
  if (!/Mary Cover Jones/.test(scriptText)) failures.push(`${slug}: missing edge case Mary Cover Jones`)
  let thumbnailCount = 0
  try { thumbnailCount = (await readdir(thumbnails)).filter((file) => /thumbnail_option_\d+\.png$/i.test(file)).length } catch {}
  if (thumbnailCount < 4) failures.push(`${slug}: expected at least 4 thumbnail options, found ${thumbnailCount}`)
  rows.push({ slug, words: words.length, thumbnails: thumbnailCount })
}

console.log('The Experiment Where SOP gate')
for (const row of rows) console.log(`- ${row.slug}: ${row.words} words, thumbnails=${row.thumbnails}`)
if (!rows.length) console.log('- no projects found')
if (failures.length) {
  console.error('\nFAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('PASS')
