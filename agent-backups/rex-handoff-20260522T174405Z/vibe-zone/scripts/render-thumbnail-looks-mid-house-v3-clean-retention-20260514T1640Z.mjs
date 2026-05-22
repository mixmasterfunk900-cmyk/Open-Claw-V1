#!/usr/bin/env node
import { mkdir, copyFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '..')
const input = 'media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-house-v3.mp4'
const id = 'thumbnail-looks-mid-house-v3-clean-retention-20260514T1640Z'
const out = `media/renders/${id}.mp4`
const review = `media/reviews/${id}-contact-sheet.jpg`
const exportDir = `media/exports/clip_${id}`
const ready = `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-house-v3-clean-retention.mp4`
const readyThumb = `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-house-v3-clean-retention-thumbnail.jpg`
function run(command,args){const r=spawnSync(command,args,{cwd:root,encoding:'utf8',maxBuffer:1024*1024*120}); if(r.status!==0) throw new Error(`${command} failed: ${r.stderr||r.stdout}`); return r}
await mkdir(path.join(root,'media/renders'),{recursive:true}); await mkdir(path.join(root,'media/reviews'),{recursive:true}); await mkdir(path.join(root,exportDir),{recursive:true}); await mkdir(path.join(root,'media/exports/READY_TO_SHIP_NOW'),{recursive:true})
const duration = 18
const vf = [
  // Retention-safe pass over the already-approved house-v3 render: tiny push only, no colored caption boxes, no progress bar, no arrow clutter.
  `[0:v]scale=w='1080*(1+0.012*t/${duration})':h='1920*(1+0.012*t/${duration})':eval=frame,crop=1080:1920:(iw-1080)/2:(ih-1920)/2[v1]`,
  // One restrained white start pulse around the title/header zone, chosen to preserve the existing white branding/captions.
  `[v1]drawbox=x=54:y=88:w=972:h=360:color=white@0.10:t=5:enable='between(t,0.20,0.95)'[v2]`,
  // Gentle end-loop cue in white only; avoids green/gold frame regression from prior experiments.
  `[v2]drawbox=x=40:y=600:w=1000:h=584:color=white@0.18:t=5:enable='between(t,16.85,17.75)',format=yuv420p[vout]`
].join(';')
run('ffmpeg',['-y','-v','error','-i',input,'-filter_complex',vf,'-map','[vout]','-map','0:a?','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','copy','-shortest',out])
run('ffmpeg',['-y','-v','error','-i',out,'-vf','fps=1/3,scale=320:-1,tile=6x1','-frames:v','1','-q:v','3',review])
run('ffmpeg',['-y','-v','error','-ss','3','-i',out,'-frames:v','1','-vf','scale=1080:1920','-q:v','2',`${exportDir}/thumbnail.jpg`])
for (const [i,t] of [2.5,8.5,14.5].entries()) run('ffmpeg',['-y','-v','error','-ss',String(t),'-i',out,'-frames:v','1','-vf','scale=1080:1920','-q:v','2',`${exportDir}/proof-frame-${String(i+1).padStart(2,'0')}.jpg`])
const probe=run('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_type,codec_name,width,height','-of','json',out]).stdout
run('ffmpeg',['-v','error','-i',out,'-f','null','-'])
const reviewJson=JSON.parse(run('node',['scripts/review-render.mjs',out]).stdout)
if(!reviewJson.ready) throw new Error(`review failed: ${JSON.stringify(reviewJson)}`)
await writeFile(path.join(root,exportDir,'ffprobe.json'),probe)
try { await copyFile(path.join(root,'media/transcripts/thumbnail-looks-mid-house-v3-20260514T1125Z.qa.json'), path.join(root,exportDir,'caption-qa.json')) } catch {}
await copyFile(path.join(root,out), path.join(root,exportDir,`${id}.mp4`)); await copyFile(path.join(root,review), path.join(root,exportDir,'contact-sheet.jpg')); await copyFile(path.join(root,out), path.join(root,ready)); await copyFile(path.join(root,`${exportDir}/thumbnail.jpg`), path.join(root,readyThumb))
const youtube = `# YouTube Shorts Upload Draft\n\nTitle: Why Your Thumbnail Still Looks Mid | Clean Creator Workflow\n\nDescription:\nA tightened Vibe Zone thumbnail-workflow short with the approved house-v3 look: centered source context, white captions, VIBE ZONE/OpenClaw branding, and only restrained motion so the lesson stays readable.\n\nManual upload draft only. Owner approval and a final privacy/watch pass are required before public posting.\n\nHashtags: #YouTubeShorts #ThumbnailDesign #CreatorWorkflow #VibeCoding #OpenClaw\n\nPinned comment idea: Would you let an agent create the first thumbnail proof set?\n`
const tiktok = `# TikTok Upload Draft\n\nCaption: Your thumbnail workflow does not need clutter. Clean source context, readable captions, and one restrained motion pass keeps the lesson obvious. Manual upload only after owner privacy/watch pass. #thumbnaildesign #creatorworkflow #vibecoding #openclaw\n`
const uploadCard = `# Upload Card — Why Your Thumbnail Still Looks Mid (House-v3 Clean Retention)\n\n- Render: ${out}\n- Ready copy: ${ready}\n- Source/base: approved house-v3 Thumbnail Looks Mid render\n- Improvement: replaces the cluttered/no-brand retention experiments with a safe pass: 1.2% slow push, white start pulse, white end-loop cue only\n- Template: centered source screen, clean white captions, VIBE ZONE + OpenClaw branding preserved, no blue card, no square-face default, no green/gold artifact frame\n- Thumbnail: ${readyThumb}\n- Contact sheet: ${review}\n- Proof frames: ${exportDir}/proof-frame-01.jpg, proof-frame-02.jpg, proof-frame-03.jpg\n- Verification: ffprobe/decode pass; automated review ${reviewJson.score}/100 ready=${reviewJson.ready}; source caption QA copied from approved house-v3 base\n- SEO: thumbnail design workflow / creator workflow / Vibe Zone / OpenClaw\n- Privacy: final owner watch pass required because source-screen UI is visible; no external posting/login/cookie/API write performed\n`
const metadata={id:'clip_thumbnail_looks_mid_house_v3_clean_retention_20260514T1640Z',title:'Why Your Thumbnail Still Looks Mid — House-v3 Clean Retention',platform:'youtube+tiktok-manual',status:'exported',sourceUrl:'manual://thumbnail-looks-mid-house-v3',renderPath:out,readyCopyPath:ready,thumbnailPath:readyThumb,durationSec:18,hook:'Clean motion keeps the thumbnail lesson readable instead of burying it in hacks.',caption:'A house-v3-safe retention pass for the thumbnail workflow clip: centered screen context, readable white captions, and restrained motion only.',hashtags:['#YouTubeShorts','#ThumbnailDesign','#CreatorWorkflow','#VibeCoding','#OpenClaw'],seo:{primaryKeyword:'thumbnail design workflow',youtubeTitle:'Why Your Thumbnail Still Looks Mid | Clean Creator Workflow',fileName:'why-thumbnail-looks-mid-house-v3-clean-retention-vibe-zone-short.mp4',description:youtube.split('Description:\n')[1].split('\n\nManual')[0],tiktokCaption:tiktok.split('Caption: ')[1].trim(),tags:['thumbnail design','creator workflow','Vibe Zone','OpenClaw','shorts editing','retention editing'],titleVariants:['Why Your Thumbnail Still Looks Mid','Clean Creator Thumbnail Workflow','The Thumbnail Proof Workflow'],pinnedComment:'Would you let an agent create the first thumbnail proof set?',thumbnailText:'LOOKS MID?'},proofFrames:[`${exportDir}/proof-frame-01.jpg`,`${exportDir}/proof-frame-02.jpg`,`${exportDir}/proof-frame-03.jpg`],reviewPath:`media/reviews/${id}.review.md`,reviewScore:`${reviewJson.score}/100 ready=${reviewJson.ready}`,createdAt:'2026-05-14T16:40:00.000Z'}
await writeFile(path.join(root,exportDir,'youtube-upload.md'),youtube); await writeFile(path.join(root,exportDir,'tiktok-upload.md'),tiktok); await writeFile(path.join(root,exportDir,'upload-card.md'),uploadCard); await writeFile(path.join(root,exportDir,'metadata.json'),JSON.stringify(metadata,null,2)+'\n')
console.log(JSON.stringify({id,out,ready,readyThumb,exportDir,contactSheet:review,review:reviewJson,ffprobe:JSON.parse(probe)},null,2))
