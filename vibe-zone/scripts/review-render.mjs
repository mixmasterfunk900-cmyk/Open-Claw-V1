#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const input = process.argv[2]
if (!input) {
  console.error('Usage: node scripts/review-render.mjs <render.mp4>')
  process.exit(2)
}

const root = path.resolve(import.meta.dirname, '..')
const reviewDir = path.join(root, 'media', 'reviews')
await mkdir(reviewDir, { recursive: true })
const base = path.basename(input, path.extname(input))
const framePattern = path.join(reviewDir, `${base}-%02d.jpg`)
const jsonPath = path.join(reviewDir, `${base}.review.json`)
const mdPath = path.join(reviewDir, `${base}.review.md`)
const modelPath = path.join(root, '.venv-review', 'face_detection_yunet_2023mar.onnx')

const extract = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', input, '-vf', 'fps=1/2,scale=720:1280', '-frames:v', '6', framePattern], { cwd: root, encoding: 'utf8' })
if (extract.status !== 0) {
  console.error(extract.stderr || 'frame extraction failed')
  process.exit(1)
}

const py = spawnSync(path.join(root, '.venv-review', 'bin', 'python'), ['-c', String.raw`
import cv2, json, glob, os, re, sys
base=sys.argv[3]
frames=sorted(f for f in glob.glob(sys.argv[1]) if re.match(r'^'+re.escape(base)+r'-\d{2}\.jpg$', os.path.basename(f)))
model=sys.argv[2]
requires_face='facecam' in base
faces=[]; checks=[]
yunet=None
try:
    yunet=cv2.FaceDetectorYN_create(model, '', (320,320), 0.45, 0.3, 5000)
except Exception:
    yunet=None
haar=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
for frame in frames:
    img=cv2.imread(frame)
    h,w=img.shape[:2]
    frame_faces=[]
    if yunet is not None:
        yunet.setInputSize((w,h))
        ok, dets = yunet.detect(img)
        if dets is not None:
            for d in dets:
                x,y,fw,fh,score = d[0],d[1],d[2],d[3],d[-1]
                if score >= 0.45:
                    frame_faces.append({'x':int(x),'y':int(y),'w':int(fw),'h':int(fh),'cx':int(x+fw/2),'cy':int(y+fh/2),'score':round(float(score),3),'detector':'yunet','topPercent':round(float(y/h),3)})
    if not frame_faces:
        gray=cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        detected=haar.detectMultiScale(gray, 1.05, 3, minSize=(22,22))
        for (x,y,fw,fh) in detected:
            frame_faces.append({'x':int(x),'y':int(y),'w':int(fw),'h':int(fh),'cx':int(x+fw/2),'cy':int(y+fh/2),'score':0.35,'detector':'haar','topPercent':round(float(y/h),3)})
    faces.append({'frame':os.path.basename(frame),'faces':frame_faces})
    top=img[:int(h*0.28),:]
    bottom=img[int(h*0.55):,:]
    hsv=cv2.cvtColor(top, cv2.COLOR_BGR2HSV)
    dark=cv2.inRange(hsv, (0,0,0), (180,255,75))
    dark_ratio=float((dark>0).mean())
    bottom_hsv=cv2.cvtColor(bottom, cv2.COLOR_BGR2HSV)
    bottom_dark=cv2.inRange(bottom_hsv, (0,0,0), (180,255,55))
    bottom_dark_ratio=float((bottom_dark>0).mean())
    bottom_gray=cv2.cvtColor(bottom, cv2.COLOR_BGR2GRAY)
    bottom_bright_ratio=float((bottom_gray>135).mean())
    bottom_edge_ratio=float((cv2.Canny(bottom_gray, 40, 120)>0).mean())
    checks.append({'frame':os.path.basename(frame),'topDarkRatio':round(dark_ratio,3),'bottomDarkRatio':round(bottom_dark_ratio,3),'bottomBrightRatio':round(bottom_bright_ratio,3),'bottomEdgeRatio':round(bottom_edge_ratio,3)})
all_faces=[f for item in faces for f in item['faces']]
face_visible=bool(all_faces)
face_top_ok=any(f['cy'] < 1280*0.38 for f in all_faces)
# Use the largest detected face per sampled frame for composition checks. A render can
# technically contain a face while still being too small or surrounded by empty UI.
largest_faces=[]
for item in faces:
    if item['faces']:
        largest_faces.append(max(item['faces'], key=lambda f: f.get('w',0)*f.get('h',0)))
face_height_ratios=sorted([f['h']/1280 for f in largest_faces])
median_face_height_ratio=face_height_ratios[len(face_height_ratios)//2] if face_height_ratios else 0
top_dark_avg=sum(c.get('topDarkRatio',0) for c in checks)/len(checks) if checks else 0
face_scale_ok=median_face_height_ratio >= 0.12
facecam_top_void=requires_face and top_dark_avg > 0.62
hook_present=any(c['topDarkRatio'] > 0.10 for c in checks)
bottom_blackout=bool(checks) and sum(1 for c in checks if c.get('bottomDarkRatio',0) > 0.72 and c.get('bottomBrightRatio',0) < 0.015 and c.get('bottomEdgeRatio',0) < 0.01) >= max(2, len(checks)//2)
score=100; issues=[]
if requires_face and not face_visible:
    score-=45; issues.append('No face detected in sampled frames; facecam tracking/layout is not ready.')
elif requires_face and not face_top_ok:
    score-=25; issues.append('Face detected, but not in the top third where the clip style expects it.')
if requires_face and face_visible and not face_scale_ok:
    score-=20; issues.append('Face is detected but too small in the sampled frames; facecam crop needs a tighter/clearer layout.')
if facecam_top_void:
    score-=15; issues.append('Top region is mostly dark/blank around the facecam; layout is wasting vertical space.')
if not hook_present:
    score-=20; issues.append('Top hook card was not detected clearly in sampled frames.')
if bottom_blackout:
    score-=30; issues.append('Bottom half is mostly empty black in sampled frames; layout/crop is wasting vertical space.')
result={'score':max(score,0),'ready':score>=80,'issues':issues,'faces':faces,'checks':checks,'detector':'yunet+haar','composition':{'medianFaceHeightRatio':round(median_face_height_ratio,3),'topDarkAvg':round(top_dark_avg,3)}}
print(json.dumps(result, indent=2))
`, `${base}-*.jpg`, modelPath, base], { cwd: reviewDir, encoding: 'utf8' })
if (py.status !== 0) {
  console.error(py.stderr || 'review failed')
  process.exit(1)
}
const review = JSON.parse(py.stdout)
await writeFile(jsonPath, JSON.stringify(review, null, 2))
const md = [`# Render Review — ${base}`, '', `Score: ${review.score}/100`, `Ready: ${review.ready ? 'yes' : 'no'}`, `Detector: ${review.detector}`, '', '## Issues', ...(review.issues.length ? review.issues.map((issue) => `- ${issue}`) : ['- None detected by automated checks.']), '', '## Sample frames', ...Array.from({ length: 6 }, (_, i) => `- media/reviews/${base}-${String(i + 1).padStart(2, '0')}.jpg`), ''].join('\n')
await writeFile(mdPath, md)
console.log(JSON.stringify({ review: path.relative(root, jsonPath), report: path.relative(root, mdPath), ...review }, null, 2))
process.exit(review.ready ? 0 : 3)
