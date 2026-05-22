#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
const root=path.resolve(import.meta.dirname,'..'), dbPath=path.join(root,'data/vibe-zone.json'), stamp='20260513T0655Z'
const slug=v=>String(v||'clip').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'clip'
async function api(p,b){const r=await fetch(`http://127.0.0.1:8787${p}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})});const t=await r.text(); if(!r.ok)throw new Error(`${p} ${r.status}: ${t}`); return JSON.parse(t)}
function run(c,a){return spawnSync(c,a,{cwd:root,encoding:'utf8',maxBuffer:1024*1024*20})}
async function proof(bundleDir, renderPath, clip){await mkdir(path.join(root,bundleDir),{recursive:true}); run('ffmpeg',['-y','-v','error','-ss','2','-i',renderPath,'-frames:v','1','-q:v','2',path.join(root,bundleDir,'proof-frame.jpg')]); await writeFile(path.join(root,bundleDir,'thumbnail-brief.md'),`# Thumbnail Brief — ${clip.title}\n\n- Big text: ${clip.title.toUpperCase().slice(0,32)}\n- Visual: Masala + product screen, high contrast, no readable private text.\n- Safety: manual upload only; review full render before posting.\n`)}
const updates={
 'clip_1778654489064_712732':['Tweaking Clip Presets Live','I can change the preset of the rendering.','A live product-testing moment where Vibe Zone starts exposing the exact controls clips need.'],
 'clip_1778654489064_56167a':['Uploading The Clip Live','I’m literally going to upload this on stream right now.','Masala takes the clip factory from tool-building to actual upload workflow in the same stream.'],
 'clip_1778654489063_e41a66':['Troubleshoot Before You Ship','We got to fix it first.','A very real build-in-public moment: before the fancy AI workflow, fix the annoying bottleneck.']
}
let db=JSON.parse(await readFile(dbPath,'utf8')); for(const c of db.clips){if(updates[c.id]){const u=updates[c.id]; c.title=u[0]; c.hook=u[1]; c.caption=`${u[1]} ${u[2]}`; c.hashtags=['#BuildInPublic','#VibeCoding','#CreatorTools','#AIWorkflow']}} await writeFile(dbPath,JSON.stringify(db,null,2))
const targets=Object.keys(updates).map(id=>({stream:'day3',id,videoId:'SxOhgmSWqD4',inputPath:'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4',preset:'centered-screen'}))
const results=[]
for(const t of targets){db=JSON.parse(await readFile(dbPath,'utf8')); const clip=db.clips.find(c=>c.id===t.id); const outputPath=`media/renders/day3-${slug(clip.title)}-${t.preset}-${stamp}.mp4`; console.log(`\n[batch2] ${clip.title}`); const rendered=await api(`/api/clips/${clip.id}/render`,{presetId:t.preset,outputPath,quality:'draft',inputPath:t.inputPath,videoId:t.videoId,brandText:'VIBE ZONE'}); if(rendered.clip?.renderStatus!=='done'){results.push({...t,title:clip.title,status:'render-failed',error:rendered.clip?.renderError}); continue} const rev=run('node',['scripts/review-render.mjs',outputPath]); process.stdout.write(rev.stdout||''); if(rev.status!==0){results.push({...t,title:clip.title,status:'review-failed',outputPath}); continue} const exported=await api(`/api/clips/${clip.id}/export-bundle`,{}); await proof(exported.bundleDir,path.join(root,outputPath),rendered.clip); results.push({...t,title:clip.title,status:'ready',outputPath,bundleDir:exported.bundleDir,review:`media/reviews/${path.basename(outputPath,'.mp4')}.review.md`})}
await writeFile(path.join(root,'media','exports',`clip-factory-batch-${stamp}.json`),JSON.stringify({stamp,results},null,2)); console.log('\n[batch2] summary'); console.log(JSON.stringify(results,null,2))
