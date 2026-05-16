#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260514T0217Z'
const id = `stream-2-rename-channel-house-v3-${stamp}`
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
const startSec = 267
const endSec = 301
const duration = endSec - startSec

const copy = {
  title: 'Should I Rename The Channel?',
  hook: 'Before the tool can win, the channel packaging has to make sense.',
  caption: 'Masala pauses the build to ask the real creator question: keep the same channel name, or make a new one for the Vibe Zone era?',
  youtubeTitle: 'Should I Rename The Channel? Build In Public Strategy' ,
  fileName: 'should-i-rename-the-channel-vibe-zone-short.mp4',
  tiktokCaption: 'The build is working, but should the channel name change too? #buildinpublic #vibecoding #creatorstrategy #openclaw',
  thumbnailText: 'RENAME THE CHANNEL?',
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
const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`Caption QA failed: ${qa.failures.join('; ')}`)
await writeFile(path.join(root, assPath), buildAss(events, { mode: 'short', font: 'DejaVu Sans' }))
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

const vf = [
  '[0:v]split=2[srcmain][srcbg]',
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:1,eq=brightness=-0.18:saturation=0.58[bg]',
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[base][bg]overlay=0:0:format=auto,drawbox=x=0:y=0:w=1080:h=308:color=black@0.74:t=fill,drawbox=x=0:y=1036:w=1080:h=884:color=black@0.12:t=fill[underlay]',
  '[srcmain]scale=992:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[1:v]scale=230:-1,format=rgba[logo]',
  `[underlay]drawtext=fontfile=${fontBold}:text='${esc('RENAME THE')}':x=(w-text_w)/2:y=86:fontcolor=white:fontsize=88:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('CHANNEL?')}':x=(w-text_w)/2:y=178:fontcolor=white:fontsize=94:borderw=5:bordercolor=black[headline]`,
  '[headline]drawbox=x=44:y=330:w=992:h=700:color=black@0.62:t=fill,drawbox=x=44:y=330:w=992:h=700:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=400:format=auto[withscreen]',
  `[withscreen][logo]overlay=x=(W-w)/2:y=1082:format=auto,drawtext=fontfile=${fontBold}:text='${esc('VIBE ZONE')}':x=(w-text_w)/2:y=1190:fontcolor=white@0.98:fontsize=62:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('SAME NAME OR NEW NAME?')}':x=(w-text_w)/2:y=1264:fontcolor=white@0.96:fontsize=56:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('CREATOR STRATEGY MOMENT')}':x=(w-text_w)/2:y=1336:fontcolor=white@0.94:fontsize=52:borderw=5:bordercolor=black,drawtext=fontfile=${fontBold}:text='${esc('HOUSE STYLE V3')}':x=(w-text_w)/2:y=1406:fontcolor=white@0.84:fontsize=42:borderw=5:bordercolor=black[branded]`,
  `[branded]subtitles='${filterPath(assPath)}'[vout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])

for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '9'], ['proof-frame-03.jpg', '16']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(postReadyDir, name)])
  await copyFile(path.join(root, postReadyDir, name), path.join(root, exportDir, name))
}
run('ffmpeg', ['-y', '-v', 'error', '-ss', '9', '-i', out, '-frames:v', '1', '-vf', "scale=1080:1920,drawbox=x=44:y=72:w=992:h=252:color=black@0.32:t=fill", '-q:v', '2', `${exportDir}/thumbnail-rename-the-channel.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/5,scale=320:-1,tile=4x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])

const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
const review = run('node', ['scripts/review-render.mjs', out])
const reviewJson = JSON.parse(review.stdout)

await writeFile(path.join(root, postReadyDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, postReadyDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, readyDir, 'short-rename-the-channel-house-v3.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'short-rename-the-channel-house-v3-contact-sheet.jpg'))
await copyFile(path.join(root, `${exportDir}/thumbnail-rename-the-channel.jpg`), path.join(root, `${readyDir}/short-rename-the-channel-house-v3-thumbnail.jpg`))

const metadata = {
  id: `clip_stream2_rename_channel_house_v3_${stamp}`,
  title: copy.title,
  platform: 'youtube+tiktok-manual',
  status: 'exported',
  sourceUrl: 'manual://stream-2',
  start: '4:27',
  end: '5:01',
  renderPath: out,
  readyCopyPath: `${readyDir}/short-rename-the-channel-house-v3.mp4`,
  thumbnailPath: `${readyDir}/short-rename-the-channel-house-v3-thumbnail.jpg`,
  hook: copy.hook,
  caption: copy.caption,
  hashtags: ['#BuildInPublic', '#VibeCoding', '#OpenClaw', '#AITools', '#CreatorOps'],
  seo: {
    primaryKeyword: 'should I rename my channel build in public',
    searchIntent: 'Creators thinking about channel positioning while building products in public.',
    youtubeTitle: copy.youtubeTitle,
    fileName: copy.fileName,
    description: `${copy.caption}\n\nThis is a local manual-upload draft from Stream 2. Owner approval and a final privacy watch pass are required before public posting.\n\n#BuildInPublic #VibeCoding #OpenClaw #AITools #Shorts`,
    tiktokCaption: copy.tiktokCaption,
    tags: ['channel rename', 'creator strategy', 'build in public', 'OpenClaw', 'vibe coding', 'content strategy'],
    titleVariants: ['Should I Rename The Channel?', 'Same Name Or New Name?', 'The Channel Packaging Question'],
    pinnedComment: 'Would you keep the existing channel name, or launch the Vibe Zone as a fresh brand?',
    thumbnailText: copy.thumbnailText,
  },
  proofFrames: [`${exportDir}/proof-frame-01.jpg`, `${exportDir}/proof-frame-02.jpg`, `${exportDir}/proof-frame-03.jpg`],
  reviewPath: `${reviewDir}/${id}.review.md`,
  reviewScore: `${reviewJson.score}/100 ready=${reviewJson.ready}`,
  createdAt: '2026-05-14T02:17:00.000Z',
}
await writeFile(path.join(root, exportDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'upload-card.md'), `# Upload Bundle — ${copy.title}\n\n- Platform: YouTube Shorts + TikTok manual draft\n- Source: Stream 2 local clip\n- Timecode: 4:27–5:01\n- Render: \`${out}\`\n- Ready copy: \`${metadata.readyCopyPath}\`\n- Thumbnail: \`${metadata.thumbnailPath}\`\n- Contact sheet: \`${reviewDir}/${id}-contact-sheet.jpg\`\n\n## Hook\n${copy.hook}\n\n## Caption\n${copy.caption}\n\n## YouTube SEO\n- Suggested title: ${copy.youtubeTitle}\n- Primary keyword: ${metadata.seo.primaryKeyword}\n- Search intent: ${metadata.seo.searchIntent}\n- File name: ${copy.fileName}\n\n### Description\n${metadata.seo.description}\n\n### Tags\n${metadata.seo.tags.join(', ')}\n\n### Title variants\n${metadata.seo.titleVariants.map((t) => `- ${t}`).join('\n')}\n\n### Pinned comment\n${metadata.seo.pinnedComment}\n\n## TikTok\n${metadata.seo.tiktokCaption}\n\n## Manual upload checklist\n- [ ] Owner approval received\n- [ ] Watch the full 20s render for private details/secrets\n- [ ] Confirm captions are not covered by platform UI\n- [ ] Confirm house-style visual gate: white title/captions, screen context, VIBE ZONE/OpenClaw branding, no blue-card regression\n- [ ] Manual posting only — no external API/login/cookie use\n`)
await writeFile(path.join(root, postReadyDir, 'review-notes.md'), `# Review Notes — ${copy.title} house-style v3\n\n- Style-corrects the older \`stream-2-secure-vps-setup-facecam-smart-20260513T0600Z.mp4\` candidate into the restored house layout.\n- Uses centered source screen/context, clean white title/captions, visible VIBE ZONE + OpenClaw branding, dim blurred underlay, and no blue-card/square-face default.\n- The clip angle is creator strategy: the stream pauses to decide whether the channel packaging should change for Vibe Zone.\n- Local-only render/export; no external posting, login, cookies, public exposure, or site restart.\n- Final owner privacy/watch pass still required before any public upload because stream UI text is visible.\n`)

const dataPath = path.join(root, 'data/vibe-zone.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const clipId = metadata.id
const clip = {
  platform: 'youtube+tiktok-manual',
  status: 'exported',
  exportedAt: '2026-05-14T02:17:00.000Z',
  id: clipId,
  transcriptId: 'tx_1778603901735_e1b588',
  score: 85,
  start: metadata.start,
  end: metadata.end,
  title: metadata.title,
  hook: metadata.hook,
  caption: metadata.caption,
  hashtags: metadata.hashtags,
  reason: 'Style-corrected Stream 2 channel-rename moment into current house-v3 layout; supersedes the older facecam-smart/blue-card package pending owner privacy pass.',
  createdAt: metadata.createdAt,
  sourceIdeaId: `stream2_rename_channel_house_v3_${stamp}`,
  videoId: 'stream-2',
  renderStatus: 'done',
  renderPreset: 'house-v3-centered-screen-underlay',
  renderPath: metadata.renderPath,
  renderError: '',
  renderUrl: `/${metadata.renderPath}`.replace('/media/', '/media/'),
  exportBundlePath: exportDir,
  seo: metadata.seo,
  proofFrames: metadata.proofFrames,
  reviewPath: metadata.reviewPath,
  readyCopyPath: metadata.readyCopyPath,
  thumbnailPath: metadata.thumbnailPath,
  notes: 'Local-only manual upload bundle. Final owner privacy/watch pass required before public upload.',
}
const dispatch = {
  id: `dispatch_${clipId}`,
  clipId,
  title: metadata.title,
  platform: 'youtube+tiktok-manual',
  status: 'needs-owner-approval',
  renderPath: metadata.renderPath,
  exportBundlePath: exportDir,
  proofFrames: metadata.proofFrames,
  blockers: ['Owner approval required before public upload', 'Final full-render privacy/watch pass required'],
  lastAuditAction: 'House-style v3 render/export created locally; no external posting performed',
  createdAt: metadata.createdAt,
  updatedAt: metadata.createdAt,
}
if (!data.clips.some((c) => c.id === clipId)) data.clips.push(clip)
if (!data.dispatchItems.some((d) => d.id === dispatch.id)) data.dispatchItems.push(dispatch)
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')

console.log(JSON.stringify({ id, out, exportDir, readyCopy: metadata.readyCopyPath, thumbnail: metadata.thumbnailPath, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, review: reviewJson, captionQa: qa, ffprobe: JSON.parse(probe.stdout) }, null, 2))
