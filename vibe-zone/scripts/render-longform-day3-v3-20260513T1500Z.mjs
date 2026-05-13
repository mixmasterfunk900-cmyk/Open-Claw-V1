#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const id = 'day3-product-content-machine-v3-20260513T1500Z'
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const out = `media/renders/long-form/${id}.mp4`
const work = `media/renders/long-form/.tmp-${id}`
const reviewDir = 'media/reviews/long-form'
const fontBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
const fontRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

const beats = [
  {
    role: 'Hook',
    title: 'WHY THIS BUILD MATTERS',
    subtitle: 'A dad with a full-time job trying to build the machine live.',
    start: '00:11:58.4',
    end: '00:12:12.4',
  },
  {
    role: 'Problem',
    title: 'THE PRODUCT PROMISE',
    subtitle: 'Upload a stream; get clips, prompts, analytics, and distribution prep.',
    start: '00:14:56.4',
    end: '00:15:38.4',
  },
  {
    role: 'Blocker',
    title: 'THE ROUGH PART',
    subtitle: 'The prototype works, but the AI brain and quality bar are not there yet.',
    start: '00:24:00.4',
    end: '00:24:52.4',
  },
  {
    role: 'Build',
    title: 'SHIP IT LIVE ANYWAY',
    subtitle: 'Turn the broken prototype into proof instead of hiding it.',
    start: '00:26:11.4',
    end: '00:26:28.4',
  },
  {
    role: 'Stakes',
    title: 'PRODUCT OR CONTENT MACHINE?',
    subtitle: 'The product and the channel have to grow together.',
    start: '00:30:10.4',
    end: '00:30:49.4',
  },
  {
    role: 'Result',
    title: 'THE AGENT LOOP',
    subtitle: 'Planner, film, work, and scout agents keep the build moving after stream.',
    start: '00:44:48.4',
    end: '00:46:14.4',
  },
  {
    role: 'Next',
    title: 'NEXT BOTTLENECK: FACE TRACKING',
    subtitle: 'The next upload-ready leap is making clips follow the face and story.',
    start: '00:47:13.4',
    end: '00:47:46.4',
  },
]

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 80 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function esc(s) { return s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,') }

await mkdir(path.join(root, work), { recursive: true })
await mkdir(path.join(root, reviewDir), { recursive: true })

const concat = []
const intro = `${work}/00-intro.mp4`
run('ffmpeg', [
  '-y', '-v', 'error',
  '-f', 'lavfi', '-i', 'color=c=#0b0b10:s=1920x1080:r=30:d=5',
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  '-vf', `drawtext=fontfile=${fontBold}:text='I\'M BUILDING THE PRODUCT':fontcolor=white:fontsize=78:x=(w-text_w)/2:y=390,drawtext=fontfile=${fontBold}:text='AND THE CONTENT MACHINE':fontcolor=#ff3b6b:fontsize=78:x=(w-text_w)/2:y=490,drawtext=fontfile=${fontRegular}:text='A Vibe Zone Day 3 story draft':fontcolor=#d8d8e8:fontsize=34:x=(w-text_w)/2:y=620`,
  '-t', '5', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', intro,
])
concat.push(intro)

let n = 1
for (const beat of beats) {
  const segPath = `${work}/${String(n++).padStart(2, '0')}-${beat.role.toLowerCase()}.mp4`
  const vf = [
    'fps=30',
    'scale=1920:1080:force_original_aspect_ratio=decrease',
    'pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
    'setsar=1',
    "drawbox=x=70:y=735:w=1780:h=205:color=black@0.62:t=fill:enable='between(t,0.15,6.8)'",
    `drawtext=fontfile=${fontBold}:text='${esc(beat.title)}':fontcolor=white:fontsize=50:x=110:y=765:enable='between(t,0.15,6.8)'`,
    `drawtext=fontfile=${fontRegular}:text='${esc(beat.role)} — ${esc(beat.subtitle)}':fontcolor=#f3d1dc:fontsize=30:x=110:y=835:enable='between(t,0.15,6.8)'`,
    `drawtext=fontfile=${fontBold}:text='VIBE ZONE':fontcolor=#ff3b6b:fontsize=24:x=w-text_w-90:y=72:enable='between(t,0.15,6.8)'`,
  ].join(',')
  run('ffmpeg', [
    '-y', '-v', 'error', '-ss', beat.start, '-to', beat.end, '-i', source,
    '-map', '0:v:0', '-map', '0:a:0',
    '-vf', vf,
    '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5,aresample=48000',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', segPath,
  ])
  concat.push(segPath)
}

const outro = `${work}/99-outro.mp4`
run('ffmpeg', [
  '-y', '-v', 'error',
  '-f', 'lavfi', '-i', 'color=c=#101014:s=1920x1080:r=30:d=5',
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  '-vf', `drawtext=fontfile=${fontBold}:text='NEXT\: MAKE THE CLIPS FOLLOW THE STORY':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=430,drawtext=fontfile=${fontRegular}:text='Follow the Vibe Zone build-in-public series':fontcolor=#ffb3c7:fontsize=36:x=(w-text_w)/2:y=545`,
  '-t', '5', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', outro,
])
concat.push(outro)

const concatPath = `${work}/concat.txt`
await writeFile(path.join(root, concatPath), concat.map((p) => `file '${path.resolve(root, p).replace(/'/g, "'\\''")}'`).join('\n') + '\n')
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatPath, '-c', 'copy', out])

run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:52', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${id}-screenshot.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/55,scale=480:-1,tile=3x2', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out])
await writeFile(path.join(root, `${reviewDir}/${id}.ffprobe.json`), probe.stdout)
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
await writeFile(path.join(root, `${reviewDir}/${id}.decode.log`), decode.stderr || decode.stdout || '')
if (decode.status !== 0) throw new Error(`decode failed\n${decode.stderr || decode.stdout}`)

console.log(JSON.stringify({
  id,
  out,
  screenshot: `${reviewDir}/${id}-screenshot.jpg`,
  contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`,
  ffprobe: JSON.parse(probe.stdout),
  decodeLog: `${reviewDir}/${id}.decode.log`,
}, null, 2))
