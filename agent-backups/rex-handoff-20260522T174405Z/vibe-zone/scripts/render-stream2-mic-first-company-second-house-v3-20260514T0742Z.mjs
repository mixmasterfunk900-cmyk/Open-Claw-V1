#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260514T0742Z'
const id = `stream-2-mic-first-company-second-house-v3-${stamp}`
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const reviewDir = 'media/reviews'
const exportDir = `media/exports/clip_${id}`
const postReadyDir = `media/post-ready-review/${id}`
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const logoPath = 'media/assets/logos/openclaw-logo-text.png'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const startSec = 688
const endSec = 706
const duration = endSec - startSec

const copy = {
  title: 'Mic First, Company Second',
  hook: 'The AI company build starts with the least glamorous blocker: make the mic work.',
  caption: 'A clean build-in-public moment from Stream 2: before the agents, dashboards, and clip machine can ship, the live setup has to work.',
  youtubeTitle: 'Mic First, Company Second | Vibe Zone Build In Public',
  fileName: 'mic-first-company-second-vibe-zone-short.mp4',
  tiktokCaption: 'Before the agents and dashboards, the mic has to work. Build-in-public is glamorous like that. #buildinpublic #vibecoding #creatorops #openclaw',
  thumbnailText: 'MIC FIRST',
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
function filterPath(value) { return String(value).replaceAll("'", "'\\\\''") }

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, postReadyDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const events = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: endSec, minDuration: 0.18, maxDuration: 0.62, gap: 0.015 })
const captionEvents = events.filter((event) => !/^[AI]$/.test(event.text))
const qa = qaCaptionEvents(captionEvents, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`Caption QA failed: ${qa.failures.join('; ')}`)
await writeFile(path.join(root, assPath), buildAss(captionEvents, { mode: 'short', font: 'DejaVu Sans' }))
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

const vf = [
  '[0:v]split=2[srcmain][srcbg]',
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:1,eq=brightness=-0.18:saturation=0.58[bg]',
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[base][bg]overlay=0:0:format=auto,drawbox=x=0:y=0:w=1080:h=308:color=black@0.74:t=fill,drawbox=x=0:y=1036:w=1080:h=884:color=black@0.12:t=fill[underlay]',
  '[srcmain]crop=iw:ih-92:0:92,scale=992:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[1:v]scale=230:-1,format=rgba[logo]',
  `[underlay]drawtext=fontfile=${fontBold}:text='${esc('MIC FIRST')}':x=(w-text_w)/2:y=86:fontcolor=white:fontsize=96:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('BUILD SECOND')}':x=(w-text_w)/2:y=178:fontcolor=white:fontsize=94:borderw=5:bordercolor=black[headline]`,
  '[headline]drawbox=x=44:y=330:w=992:h=700:color=black@0.62:t=fill,drawbox=x=44:y=330:w=992:h=700:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=400:format=auto[withscreen]',
  `[withscreen][logo]overlay=x=(W-w)/2:y=1082:format=auto,drawtext=fontfile=${fontBold}:text='${esc('VIBE ZONE')}':x=(w-text_w)/2:y=1190:fontcolor=white@0.98:fontsize=62:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('STREAM ONCE, CLIP FOREVER')}':x=(w-text_w)/2:y=1264:fontcolor=white@0.96:fontsize=54:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('BUILD-IN-PUBLIC REALITY')}':x=(w-text_w)/2:y=1336:fontcolor=white@0.94:fontsize=50:borderw=5:bordercolor=black[branded]`,
  `[branded]subtitles='${filterPath(assPath)}'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])

for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '9'], ['proof-frame-03.jpg', '15']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(postReadyDir, name)])
  await copyFile(path.join(root, postReadyDir, name), path.join(root, exportDir, name))
}
run('ffmpeg', ['-y', '-v', 'error', '-ss', '9', '-i', out, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', `${exportDir}/thumbnail-mic-first-company-second.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])

const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
const review = run('node', ['scripts/review-render.mjs', out])
const reviewJson = JSON.parse(review.stdout)
if (!reviewJson.ready) throw new Error(`Automated review failed: ${review.stdout}`)

await writeFile(path.join(root, postReadyDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, postReadyDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, readyDir, 'short-mic-first-company-second-house-v3.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'short-mic-first-company-second-house-v3-contact-sheet.jpg'))
await copyFile(path.join(root, `${exportDir}/thumbnail-mic-first-company-second.jpg`), path.join(root, `${readyDir}/short-mic-first-company-second-house-v3-thumbnail.jpg`))

const metadata = {
  id: `clip_stream2_mic_first_company_second_house_v3_${stamp}`,
  title: copy.title,
  platform: 'youtube+tiktok-manual',
  status: 'exported',
  sourceUrl: 'manual://stream-2',
  start: '11:28',
  end: '11:46',
  renderPath: out,
  readyCopyPath: `${readyDir}/short-mic-first-company-second-house-v3.mp4`,
  thumbnailPath: `${readyDir}/short-mic-first-company-second-house-v3-thumbnail.jpg`,
  hook: copy.hook,
  caption: copy.caption,
  hashtags: ['#BuildInPublic', '#VibeCoding', '#CreatorOps', '#OpenClaw', '#Shorts'],
  seo: {
    primaryKeyword: 'build in public creator workflow',
    searchIntent: 'Creators looking for honest behind-the-scenes live build setup and AI workflow moments.',
    youtubeTitle: copy.youtubeTitle,
    fileName: copy.fileName,
    description: `${copy.caption}\n\nLocal manual-upload draft only. Owner approval and a final privacy watch pass are required before public posting.\n\n#BuildInPublic #VibeCoding #CreatorOps #OpenClaw #Shorts`,
    tiktokCaption: copy.tiktokCaption,
    tags: ['build in public', 'creator workflow', 'AI agents', 'Vibe Zone', 'OpenClaw', 'vibe coding', 'stream setup'],
    titleVariants: ['Mic First, Company Second', 'Fix The Mic Before The AI Build', 'The Boring Setup Step That Unlocks The Build'],
    pinnedComment: 'What setup detail derails a live build the fastest: mic, screen, or internet?',
    thumbnailText: copy.thumbnailText,
  },
  proofFrames: [`${exportDir}/proof-frame-01.jpg`, `${exportDir}/proof-frame-02.jpg`, `${exportDir}/proof-frame-03.jpg`],
  contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`,
  reviewPath: `${reviewDir}/${id}.review.md`,
  reviewScore: `${reviewJson.score}/100 ready=${reviewJson.ready}`,
  createdAt: '2026-05-14T07:42:00.000Z',
}
await writeFile(path.join(root, exportDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'youtube-upload.md'), `# YouTube Shorts Upload Draft — ${copy.title}\n\nTitle: ${copy.youtubeTitle}\n\nDescription:\n${metadata.seo.description}\n\nTags: ${metadata.seo.tags.join(', ')}\n\nPinned comment: ${metadata.seo.pinnedComment}\n`)
await writeFile(path.join(root, exportDir, 'tiktok-upload.md'), `# TikTok Upload Draft — ${copy.title}\n\nCaption:\n${copy.tiktokCaption}\n`)
await writeFile(path.join(root, exportDir, 'thumbnail-brief.md'), `# Thumbnail Brief — ${copy.title}\n\nUse the ready thumbnail frame with bold text: ${copy.thumbnailText}. Keep the centered screen visible, retain VIBE ZONE/OpenClaw branding, and avoid adding any browser/address-bar text.\n`)
await writeFile(path.join(root, exportDir, 'upload-card.md'), `# Upload Bundle — ${copy.title}\n\n- Platform: YouTube Shorts + TikTok manual draft\n- Source: Stream 2 local clip\n- Timecode: 11:28–11:46\n- Render: \`${out}\`\n- Ready copy: \`${metadata.readyCopyPath}\`\n- Thumbnail: \`${metadata.thumbnailPath}\`\n- Contact sheet: \`${metadata.contactSheet}\`\n\n## Hook\n${copy.hook}\n\n## Caption\n${copy.caption}\n\n## Manual upload checklist\n- [ ] Owner approval received\n- [ ] Watch the full render for private details/secrets\n- [ ] Confirm captions are not covered by platform UI\n- [ ] Confirm house-style visual gate: white title/captions, centered source screen, VIBE ZONE/OpenClaw branding, no blue-card regression\n- [ ] Manual posting only — no external API/login/cookie use\n`)
await writeFile(path.join(root, postReadyDir, 'review-notes.md'), `# Review Notes — ${copy.title} house-style v3\n\n- Style-corrects the suspended legacy \`Fix The Mic, Then Build The Company\` / mic-check family.\n- Uses a cleaner 11:28–11:46 window that avoids the earlier profanity and keeps the setup-to-build story tight.\n- New render uses centered source screen/context, clean white title/captions, visible VIBE ZONE + OpenClaw branding, dim blurred underlay, and no blue-card/square-face default.\n- Browser/address bar is cropped from the source frame. Local-only render/export; no external posting, login, cookies, public exposure, or site restart.\n- Final owner privacy/watch pass still required before public upload because stream UI text is visible.\n`)

const dataPath = path.join(root, 'data/vibe-zone.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const clipId = metadata.id
const clip = {
  platform: metadata.platform, status: 'exported', exportedAt: metadata.createdAt, id: clipId,
  transcriptId: 'tx_1778603901735_e1b588', score: 86, start: metadata.start, end: metadata.end,
  title: metadata.title, hook: metadata.hook, caption: metadata.caption, hashtags: metadata.hashtags,
  reason: 'Style-corrected Stream 2 mic/setup blocker moment into current house-v3 layout; supersedes legacy mic-check package pending owner privacy pass.',
  createdAt: metadata.createdAt, sourceIdeaId: `stream2_mic_first_company_second_house_v3_${stamp}`, videoId: 'stream-2',
  renderStatus: 'done', renderPreset: 'house-v3-centered-screen-underlay-privacycrop', renderPath: metadata.renderPath,
  renderError: '', renderUrl: `/${metadata.renderPath}`.replace('/media/', '/media/'), exportBundlePath: exportDir,
  seo: metadata.seo, proofFrames: metadata.proofFrames, reviewPath: metadata.reviewPath,
  readyCopyPath: metadata.readyCopyPath, thumbnailPath: metadata.thumbnailPath,
  notes: 'Local-only manual upload bundle. Final owner privacy/watch pass required before public upload.',
}
const dispatch = { id: `dispatch_${clipId}`, clipId, title: metadata.title, platform: metadata.platform, status: 'needs-owner-approval', renderPath: metadata.renderPath, exportBundlePath: exportDir, proofFrames: metadata.proofFrames, blockers: ['Owner approval required before public upload', 'Final full-render privacy/watch pass required'], lastAuditAction: 'House-style v3 render/export created locally; no external posting performed', createdAt: metadata.createdAt, updatedAt: metadata.createdAt }
if (!data.clips.some((c) => c.id === clipId)) data.clips.push(clip)
if (!data.dispatchItems.some((d) => d.id === dispatch.id)) data.dispatchItems.push(dispatch)
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')

console.log(JSON.stringify({ id, out, exportDir, readyCopy: metadata.readyCopyPath, thumbnail: metadata.thumbnailPath, contactSheet: metadata.contactSheet, review: reviewJson, captionQa: qa, ffprobe: JSON.parse(probe.stdout) }, null, 2))
