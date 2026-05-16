#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260514T0608Z'
const id = `stream-2-keep-stream-hide-secrets-house-v3-${stamp}`
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
const startSec = 1041
const endSec = 1074
const duration = endSec - startSec

const copy = {
  title: 'Keep The Stream On, Hide Secrets',
  hook: 'The safest live build workflow is simple: keep the energy on-screen, but hide anything private before setup gets real.',
  caption: 'Building in public does not mean showing everything. Hide keys, recovery codes, private files, and billing pages before the real setup starts.',
  youtubeTitle: 'Keep The Stream On, Hide Secrets | Vibe Zone',
  fileName: 'keep-stream-hide-secrets-vibe-zone-short.mp4',
  tiktokCaption: 'Build in public, but hide the private stuff first. #buildinpublic #opsec #vibecoding #openclaw',
  thumbnailText: 'HIDE SECRETS',
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
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:1,eq=brightness=-0.20:saturation=0.50[bg]',
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[base][bg]overlay=0:0:format=auto,drawbox=x=0:y=0:w=1080:h=430:color=black@0.88:t=fill,drawbox=x=0:y=1036:w=1080:h=884:color=black@0.16:t=fill[underlay]',
  '[srcmain]crop=iw:ih-92:0:92,scale=992:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit]',
  '[1:v]scale=320:-1,format=rgba[logo]',
  `[underlay]drawtext=fontfile='${fontBold}':text='KEEP STREAM\nHIDE SECRETS':x=(w-text_w)/2:y=76:fontcolor=white:fontsize=92:line_spacing=-8:borderw=3:bordercolor=black@0.70[headline]`,
  '[headline]drawbox=x=44:y=520:w=992:h=700:color=black@0.62:t=fill,drawbox=x=44:y=520:w=992:h=700:color=white@0.24:t=4[panel]',
  '[panel][screenfit]overlay=x=(W-w)/2:y=590:format=auto[withscreen]',
  '[withscreen][logo]overlay=x=(W-w)/2:y=1248:format=auto[branded]',
  '[branded]null[vout]',
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])

for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '12'], ['proof-frame-03.jpg', '22']]) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', out, '-frames:v', '1', '-q:v', '2', path.join(postReadyDir, name)])
  await copyFile(path.join(root, postReadyDir, name), path.join(root, exportDir, name))
}
run('ffmpeg', ['-y', '-v', 'error', '-ss', '12', '-i', out, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', `${exportDir}/thumbnail-hide-secrets.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/6,scale=320:-1,tile=5x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])

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
await copyFile(path.join(root, out), path.join(root, readyDir, 'short-keep-stream-hide-secrets-house-v3.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'short-keep-stream-hide-secrets-house-v3-contact-sheet.jpg'))
await copyFile(path.join(root, `${exportDir}/thumbnail-hide-secrets.jpg`), path.join(root, `${readyDir}/short-keep-stream-hide-secrets-house-v3-thumbnail.jpg`))

const metadata = {
  id: `clip_stream2_keep_stream_hide_secrets_house_v3_${stamp}`,
  title: copy.title,
  platform: 'youtube+tiktok-manual',
  status: 'exported',
  sourceUrl: 'manual://stream-2',
  start: '17:21',
  end: '17:54',
  renderPath: out,
  readyCopyPath: `${readyDir}/short-keep-stream-hide-secrets-house-v3.mp4`,
  thumbnailPath: `${readyDir}/short-keep-stream-hide-secrets-house-v3-thumbnail.jpg`,
  hook: copy.hook,
  caption: copy.caption,
  hashtags: ['#BuildInPublic', '#OpSec', '#VibeCoding', '#OpenClaw', '#Shorts'],
  seo: {
    primaryKeyword: 'build in public privacy checklist',
    searchIntent: 'Creators learning how to build in public while keeping secrets and private setup screens safe.',
    youtubeTitle: copy.youtubeTitle,
    fileName: copy.fileName,
    description: `${copy.caption}\n\nLocal manual-upload draft only. Owner approval and a final privacy watch pass are required before public posting.\n\n#BuildInPublic #OpSec #VibeCoding #OpenClaw #Shorts`,
    tiktokCaption: copy.tiktokCaption,
    tags: ['build in public', 'opsec', 'privacy checklist', 'live coding', 'Vibe Zone', 'OpenClaw'],
    titleVariants: ['Keep The Stream On, Hide Secrets', 'Build Publicly Without Leaking', 'The Live Build Privacy Rule'],
    pinnedComment: 'What is your pre-stream privacy checklist?',
    thumbnailText: copy.thumbnailText,
  },
  proofFrames: [`${exportDir}/proof-frame-01.jpg`, `${exportDir}/proof-frame-02.jpg`, `${exportDir}/proof-frame-03.jpg`],
  reviewPath: `${reviewDir}/${id}.review.md`,
  reviewScore: `${reviewJson.score}/100 ready=${reviewJson.ready}`,
  createdAt: '2026-05-14T06:08:00.000Z',
}
await writeFile(path.join(root, exportDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'upload-card.md'), `# Upload Bundle — ${copy.title}\n\n- Platform: YouTube Shorts + TikTok manual draft\n- Source: Stream 2 local clip\n- Timecode: 17:21–17:54\n- Render: \`${out}\`\n- Ready copy: \`${metadata.readyCopyPath}\`\n- Thumbnail: \`${metadata.thumbnailPath}\`\n- Contact sheet: \`${reviewDir}/${id}-contact-sheet.jpg\`\n\n## Hook\n${copy.hook}\n\n## Caption\n${copy.caption}\n\n## Manual upload checklist\n- [ ] Owner approval received\n- [ ] Watch the full render for private details/secrets\n- [ ] Confirm captions are not covered by platform UI\n- [ ] Confirm house-style visual gate: white title/captions, centered source screen, VIBE ZONE/OpenClaw branding, no blue-card regression\n- [ ] Manual posting only — no external API/login/cookie use\n`)
await writeFile(path.join(root, postReadyDir, 'review-notes.md'), `# Review Notes — ${copy.title} house-style v3\n\n- Fresh Stream 2 privacy/OpSec clip cut from 17:21–17:54, focused on hiding the screen before sensitive setup work.\n- New render uses the current house-style default: centered source-screen context, clean white title/captions, visible VIBE ZONE + OpenClaw branding, dim blurred underlay, no blue-card/square-face default.\n- Browser/address bar is cropped from the source frame. Local-only render/export; no external posting, login, cookies, public exposure, or site restart.\n- Final owner privacy/watch pass still required before public upload because the clip explicitly discusses secrets and dense stream UI text is visible.\n`)

console.log(JSON.stringify({ id, out, exportDir, readyCopy: metadata.readyCopyPath, thumbnail: metadata.thumbnailPath, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, review: reviewJson, captionQa: qa, ffprobe: JSON.parse(probe.stdout) }, null, 2))
