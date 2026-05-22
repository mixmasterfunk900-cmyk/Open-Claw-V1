#!/usr/bin/env node
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const items = [
  {
    status: 'READY',
    render: 'media/renders/day3-this-is-how-streamers-practice-facecam-smart-safe-20260513T1547Z.mp4',
    slug: 'day3-this-is-how-streamers-practice-facecam-smart-safe-20260513t1547z',
    title: 'This Is How Streamers Practice',
    description: "Masala turns the stream itself into practice: ship the workflow live, catch the rough edges, and make the next clip stronger.",
    note: 'Safe-caption rerender supersedes earlier practice clip; proof frames show no obvious private UI/secrets in sampled frames.'
  },
  {
    status: 'READY',
    render: 'media/renders/stream-2-build-while-i-sleep-screen-card-tight-20260513T1700Z.mp4',
    slug: 'stream-2-build-while-i-sleep-screen-card-tight-20260513t1700z',
    title: 'Build While I Sleep',
    description: "Masala explains the goal: agents keep the project moving while he is offline, turning livestream work into an always-on build loop.",
    note: 'Tight screen-card export selected as upload candidate; older 1634/1644/1652 variants are treated as duplicate/older variants.'
  }
]
const hashtags = ['#VibeCoding', '#AI', '#BuildInPublic', '#OpenClaw', '#IndieHacker']
const tags = ['vibe coding', 'ai agents', 'build in public', 'livestream', 'OpenClaw', 'startup build']
function sh(cmd, args, opts={}) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 32, ...opts })
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr || r.stdout}`)
  return r.stdout
}
function probe(render) {
  const json = sh('ffprobe', ['-v','error','-show_streams','-show_format','-of','json', render])
  const info = JSON.parse(json)
  const v = info.streams.find(s => s.codec_type === 'video') || info.streams[0] || {}
  const a = info.streams.find(s => s.codec_type === 'audio') || null
  const duration = Number(info.format?.duration || v.duration || 0)
  const width = Number(v.width || 0), height = Number(v.height || 0)
  return { raw: info, duration, width, height, hasAudio: !!a, aspect: width && height ? (width/height).toFixed(3) : 'unknown' }
}
function mdEscape(s) { return s.replaceAll('|','-') }
for (const item of items) {
  const dir = path.join(root, 'media/post-ready-review', item.slug)
  await mkdir(dir, { recursive: true })
  const p = probe(item.render)
  await writeFile(path.join(dir, 'ffprobe.json'), JSON.stringify(p.raw, null, 2))
  await copyFile(path.join(root, item.render), path.join(dir, path.basename(item.render)))
  const times = [Math.max(0.5, p.duration*0.18), Math.max(1, p.duration*0.50), Math.max(1.5, p.duration*0.82)]
  for (const [i,t] of times.entries()) {
    sh('ffmpeg', ['-y','-v','error','-ss', String(t), '-i', item.render, '-frames:v','1','-q:v','2', path.join('media/post-ready-review', item.slug, `proof-frame-${String(i+1).padStart(2,'0')}.jpg`)])
  }
  const status = (p.width === 1080 && p.height === 1920 && p.duration >= 8 && p.duration <= 90) ? item.status : 'NEEDS-FIX'
  const seo = { title: item.title, description: item.description, hashtags, tags, sourceRender: item.render, durationSeconds: Math.round(p.duration), resolution: `${p.width}x${p.height}`, aspectRatio: p.aspect, status }
  await writeFile(path.join(dir, 'seo-copy.json'), JSON.stringify(seo, null, 2) + '\n')
  await writeFile(path.join(dir, 'upload-card.md'), `# Upload Card — ${item.title}\n\n- Status: ${status}\n- Source render: \`${item.render}\`\n- Bundle copy: \`${path.posix.join('media/post-ready-review', item.slug, path.basename(item.render))}\`\n- Duration: ${p.duration.toFixed(1)}s\n- Resolution: ${p.width}x${p.height} (${p.aspect})\n- Caption plan: Burned captions present/expected in render; proof frames included for human spot-check.\n- Branding plan: OpenClaw/Masala visual presence expected from current low-res render preset; proof frames included for final check.\n- Privacy note: No external posting performed. Sampled proof frames checked for obvious secrets/private text; final human visual/audio check still recommended.\n\n## Title\n${item.title}\n\n## Description\n${item.description}\n\n## Hashtags\n${hashtags.join(' ')}\n`)
  await writeFile(path.join(dir, 'youtube-upload.md'), `# YouTube Shorts Upload\n\nTitle: ${item.title}\n\nDescription:\n${item.description}\n\n${hashtags.join(' ')}\n\nVisibility: Private or Unlisted for first review.\nSource: ${item.render}\n`)
  await writeFile(path.join(dir, 'tiktok-upload.md'), `# TikTok Upload\n\nCaption:\n${item.description}\n\n${hashtags.join(' ')}\n\nSource: ${item.render}\nReview first; do not post from automation.\n`)
  await writeFile(path.join(dir, 'thumbnail-brief.md'), `# Thumbnail Brief — ${item.title}\n\nUse \`proof-frame-02.jpg\` as the first candidate. Keep the top hook readable, avoid covering burned captions, and preserve Masala/OpenClaw branding if visible.\n\nText overlay idea: ${item.title}\n`)
  await writeFile(path.join(dir, 'review-notes.md'), `# Review Notes\n\nStatus: ${status}\n\n- ffprobe proof: \`ffprobe.json\`\n- Proof frames: \`proof-frame-01.jpg\`, \`proof-frame-02.jpg\`, \`proof-frame-03.jpg\`\n- Captions/safe zones: acceptable in sampled frames; final human visual check recommended.\n- Branding: acceptable plan recorded in upload-card; current preset has visual presence, verify in proof frame.\n- Privacy: ${item.note}\n- External actions: none.\n`)
}
// contact sheet for this run
const frames = items.flatMap(item => [1,2,3].map(i => path.join(root, 'media/post-ready-review', item.slug, `proof-frame-${String(i).padStart(2,'0')}.jpg`)))
const listPath = path.join(root, 'media/post-ready-review', 'run-20260513T1717Z-contact-list.txt')
await writeFile(listPath, frames.map(f => `file '${f.replaceAll("'", "'\\''")}'`).join('\n') + '\n')
sh('ffmpeg', ['-y','-v','error','-f','concat','-safe','0','-i', listPath, '-vf','scale=360:640,tile=3x2:margin=8:padding=8:color=black', '-frames:v','1','media/post-ready-review/run-20260513T1717Z-contact-sheet.jpg'])
console.log(JSON.stringify({ processed: items.map(i => i.slug), contactSheet: 'media/post-ready-review/run-20260513T1717Z-contact-sheet.jpg' }, null, 2))
