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
# Ready/default renders must be the VIBE ZONE house layout. Square face boxes
# and screen-card/blue-card treatments can still be exported as explicit visual
# experiments, but they must not pass as default upload-ready clips by accident.
legacy_default_variant=bool(re.search(r'(screen-card|facecam-smart|square-face|face-box)', base, re.I)) and not bool(re.search(r'(optional|variant|ab-test|proof)', base, re.I))
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
    # House-style guard: Masala/VIBE ZONE clips should not regress into a
    # saturated blue-card-only look. Blue accents are fine; a persistent full
    # title/card panel is not the default style.
    top_title=img[:int(h*0.22),:]
    top_title_hsv=cv2.cvtColor(top_title, cv2.COLOR_BGR2HSV)
    blue_mask=cv2.inRange(top_title_hsv, (92,70,55), (130,255,255))
    top_blue_ratio=float((blue_mask>0).mean())
    mid=img[int(h*0.18):int(h*0.54),:]
    mid_gray=cv2.cvtColor(mid, cv2.COLOR_BGR2GRAY)
    mid_edge_ratio=float((cv2.Canny(mid_gray, 40, 120)>0).mean())
    # Some rejected "blue card" regressions are not only in the top title band;
    # they sit as a large mid-frame panel and previously slipped through when
    # the top hook was dark. Track saturated blue in the content band too.
    mid_hsv=cv2.cvtColor(mid, cv2.COLOR_BGR2HSV)
    mid_blue_mask=cv2.inRange(mid_hsv, (92,70,55), (130,255,255))
    mid_blue_ratio=float((mid_blue_mask>0).mean())
    # Catch blue-card regressions wherever the template parks the card. The old
    # guard only watched title/mid bands; a blue lower branding panel could still
    # pass if it preserved enough edges. Blue accents are OK, but a large saturated
    # blue area across any sampled frame is not house-style default.
    full_hsv=cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    full_blue_mask=cv2.inRange(full_hsv, (92,70,55), (130,255,255))
    full_blue_ratio=float((full_blue_mask>0).mean())
    # A rectangular blue card can slip past whole-frame ratio checks when it is
    # only ~10-15% of the frame but still visually dominates the composition.
    # Track the largest connected saturated-blue panel so default renders fail
    # when they contain a big blue box, while small blue accents remain allowed.
    blue_components=cv2.connectedComponentsWithStats(full_blue_mask, 8)
    largest_blue_component_ratio=0.0
    largest_blue_panel_ratio=0.0
    if blue_components[0] > 1:
        stats=blue_components[2][1:]
        largest_blue_component_ratio=float(max(stats[:, cv2.CC_STAT_AREA])/(h*w))
        # Masala's rejected regression often appears as a clean rectangular blue
        # card that is visually dominant before it crosses whole-frame blue-area
        # thresholds.  Score the largest card-like saturated-blue panel by its
        # bounding box, not only by raw blue pixels, so sparse text/logo cutouts
        # inside the panel do not let it pass as a tiny accent.
        for x,y,bw,bh,area in stats:
            bbox_area=max(1, int(bw)*int(bh))
            fill=float(area/bbox_area)
            box_ratio=float(bbox_area/(h*w))
            if fill >= 0.42 and box_ratio > largest_blue_panel_ratio:
                largest_blue_panel_ratio=box_ratio
    lower_context=img[int(h*0.40):int(h*0.82),:]
    lower_context_gray=cv2.cvtColor(lower_context, cv2.COLOR_BGR2GRAY)
    lower_context_edge_ratio=float((cv2.Canny(lower_context_gray, 40, 120)>0).mean())
    # White text / brand guard: default house style must preserve clean white
    # hook/caption/brand marks, not just avoid blue.  This is intentionally a
    # visual proxy (bright, low-saturation strokes) so it catches renders before
    # they are promoted without requiring OCR.
    top_white=cv2.inRange(top_title_hsv, (0,0,175), (180,58,255))
    top_white_ratio=float((top_white>0).mean())
    brand_lane=img[int(h*0.54):int(h*0.74),:]
    brand_hsv=cv2.cvtColor(brand_lane, cv2.COLOR_BGR2HSV)
    brand_white=cv2.inRange(brand_hsv, (0,0,165), (180,72,255))
    brand_white_ratio=float((brand_white>0).mean())
    checks.append({'frame':os.path.basename(frame),'topDarkRatio':round(dark_ratio,3),'bottomDarkRatio':round(bottom_dark_ratio,3),'bottomBrightRatio':round(bottom_bright_ratio,3),'bottomEdgeRatio':round(bottom_edge_ratio,3),'topBlueRatio':round(top_blue_ratio,3),'midBlueRatio':round(mid_blue_ratio,3),'fullBlueRatio':round(full_blue_ratio,3),'largestBlueComponentRatio':round(largest_blue_component_ratio,3),'largestBluePanelRatio':round(largest_blue_panel_ratio,3),'midEdgeRatio':round(mid_edge_ratio,3),'lowerContextEdgeRatio':round(lower_context_edge_ratio,3),'topWhiteRatio':round(top_white_ratio,3),'brandWhiteRatio':round(brand_white_ratio,3)})
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
avg_top_white=sum(c.get('topWhiteRatio',0) for c in checks)/len(checks) if checks else 0
avg_brand_white=sum(c.get('brandWhiteRatio',0) for c in checks)/len(checks) if checks else 0
face_scale_ok=median_face_height_ratio >= 0.12
facecam_top_void=requires_face and top_dark_avg > 0.62
hook_present=any(c['topDarkRatio'] > 0.10 for c in checks)
bottom_blackout=bool(checks) and sum(1 for c in checks if c.get('bottomDarkRatio',0) > 0.72 and c.get('bottomBrightRatio',0) < 0.015 and c.get('bottomEdgeRatio',0) < 0.006) >= max(2, len(checks)//2)
blue_card_artifact=bool(checks) and sum(1 for c in checks if c.get('topBlueRatio',0) > 0.34 or c.get('midBlueRatio',0) > 0.24 or c.get('fullBlueRatio',0) > 0.18 or c.get('largestBlueComponentRatio',0) > 0.085 or c.get('largestBluePanelRatio',0) > 0.075) >= max(2, len(checks)//2)
avg_mid_edge=(sum(c.get('midEdgeRatio',0) for c in checks)/len(checks)) if checks else 0
avg_lower_context_edge=(sum(c.get('lowerContextEdgeRatio',0) for c in checks)/len(checks)) if checks else 0
weak_mid_frames=sum(1 for c in checks if c.get('midEdgeRatio',0) < 0.012)
weak_lower_context_frames=sum(1 for c in checks if c.get('lowerContextEdgeRatio',0) < 0.010)
weak_screen_context=bool(checks) and (avg_mid_edge < 0.012 or avg_lower_context_edge < 0.010)
# A render can average out as "detailed" while still collapsing into static/blank
# card frames for part of the clip. House style should keep following the source
# screen/context throughout; square-face/card variants are review-only, not ready
# defaults when multiple sampled frames lose screen detail.
screen_context_dropouts=bool(checks) and (weak_mid_frames >= max(2, len(checks)//3) or weak_lower_context_frames >= max(2, len(checks)//3))
white_branding_weak=bool(checks) and avg_top_white < 0.012 and avg_brand_white < 0.008
# The regression Masala caught can happen even when the filename does not say
# "facecam": the default render collapses into a square face box while the source
# screen/context fades into a weak/static card.  Treat that as a default house-style
# failure for every non-explicit optional variant; square face boxes are allowed
# only when exported/labeled as variants or proof experiments.
optional_visual_variant=bool(re.search(r'(optional|variant|ab-test|proof|seed|thumbnail|test)', base, re.I))
square_face_box_default=(not optional_visual_variant) and median_face_height_ratio >= 0.18 and (weak_screen_context or screen_context_dropouts)
# Dark lower thirds are allowed when they are intentional brand/caption lanes and
# the sampled middle still has real source-screen detail. Flag only true empty
# black space: almost no bright pixels/edges, or dark lower space plus weak screen.
bottom_void=bool(checks) and sum(1 for c in checks if c.get('bottomDarkRatio',0) > 0.90 and c.get('bottomBrightRatio',0) < 0.012 and c.get('bottomEdgeRatio',0) < 0.006) >= max(2, len(checks)//2)
bottom_wasted=bottom_blackout or (bottom_void and weak_screen_context)
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
if bottom_wasted:
    score-=30; issues.append('Bottom half is mostly empty black in sampled frames with weak brand/caption/screen detail; layout/crop is wasting vertical space.')
if blue_card_artifact:
    score-=35; issues.append('House-style regression: persistent saturated blue card/title/content panel detected. Default VIBE ZONE style should keep screen context plus clean white text/branding; blue-card-only belongs only as an optional variant.')
if legacy_default_variant:
    score-=30; issues.append('House-style regression: filename/preset indicates a legacy screen-card or square-face default variant. Rename/render as an explicit optional variant, or use the default house-style screen/context-first preset before marking ready.')
if white_branding_weak:
    score-=25; issues.append('House-style regression: sampled frames do not show enough clean white hook/branding/caption detail. Preserve VIBE ZONE/OpenClaw branding and white text before marking ready.')
if square_face_box_default:
    score-=25; issues.append('House-style regression: square face-box composition is dominating while screen/context detail is weak. Keep this as an optional variant only; default renders must follow the source screen/context, even when the filename does not include facecam/square-face.')
if weak_screen_context:
    score-=20; issues.append('Screen/context detail is too weak in sampled frames; render should follow the source screen rather than become a static card.')
if screen_context_dropouts:
    score-=20; issues.append('House-style regression: sampled frames drop source-screen detail for part of the clip. Keep VIBE ZONE/OpenClaw branding and white captions while following the screen/context; square face boxes are optional variants only.')
max_largest_blue_component=max((c.get('largestBlueComponentRatio',0) for c in checks), default=0)
max_largest_blue_panel=max((c.get('largestBluePanelRatio',0) for c in checks), default=0)
house_style_hard_fail=bool(blue_card_artifact or legacy_default_variant or white_branding_weak or square_face_box_default or weak_screen_context or screen_context_dropouts)
ready=score>=80 and not house_style_hard_fail
result={'score':max(score,0),'ready':ready,'issues':issues,'faces':faces,'checks':checks,'detector':'yunet+haar','composition':{'medianFaceHeightRatio':round(median_face_height_ratio,3),'topDarkAvg':round(top_dark_avg,3),'avgTopWhiteRatio':round(avg_top_white,3),'avgBrandWhiteRatio':round(avg_brand_white,3),'bottomVoid':bottom_void,'bottomWasted':bottom_wasted,'blueCardArtifact':blue_card_artifact,'maxLargestBlueComponentRatio':round(max_largest_blue_component,3),'maxLargestBluePanelRatio':round(max_largest_blue_panel,3),'legacyDefaultVariant':legacy_default_variant,'whiteBrandingWeak':white_branding_weak,'optionalVisualVariant':optional_visual_variant,'squareFaceBoxDefault':square_face_box_default,'weakScreenContext':weak_screen_context,'screenContextDropouts':screen_context_dropouts,'houseStyleHardFail':house_style_hard_fail,'weakMidFrameCount':weak_mid_frames,'weakLowerContextFrameCount':weak_lower_context_frames,'avgMidEdgeRatio':round(avg_mid_edge,3),'avgLowerContextEdgeRatio':round(avg_lower_context_edge,3)}}
print(json.dumps(result, indent=2))
`, `${base}-*.jpg`, modelPath, base], { cwd: reviewDir, encoding: 'utf8' })
if (py.status !== 0) {
  console.error(py.stderr || 'review failed')
  process.exit(1)
}
const review = JSON.parse(py.stdout)
await writeFile(jsonPath, JSON.stringify(review, null, 2))
const md = [`# Render Review — ${base}`, '', `Score: ${review.score}/100`, `Ready: ${review.ready ? 'yes' : 'no'}`, `House-style hard fail: ${review.composition?.houseStyleHardFail ? 'yes' : 'no'}`, `Detector: ${review.detector}`, '', '## Issues', ...(review.issues.length ? review.issues.map((issue) => `- ${issue}`) : ['- None detected by automated checks.']), '', '## Sample frames', ...Array.from({ length: 6 }, (_, i) => `- media/reviews/${base}-${String(i + 1).padStart(2, '0')}.jpg`), ''].join('\n')
await writeFile(mdPath, md)
console.log(JSON.stringify({ review: path.relative(root, jsonPath), report: path.relative(root, mdPath), ...review }, null, 2))
process.exit(review.ready ? 0 : 3)
