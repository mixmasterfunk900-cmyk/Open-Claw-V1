import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type PageId = 'roadmap' | 'dashboard' | 'media-pipeline' | 'clip-factory' | 'thumbnail-lab' | 'viral-research' | 'viral-hunter' | 'studio-feedback' | 'social-dashboard' | 'live-chat' | 'rex-jobs' | 'settings'
type JobStatus = 'running' | 'queued' | 'done' | 'needs-review' | 'failed'
type Settings = { channelUrl: string; streamSafeMode: boolean; clipStrategy?: string; thumbnailStyle?: string; productAngle?: string; localModel?: string; guardrails: string[]; thumbnailConceptFeedback?: Record<string, 'like' | 'dislike'> }
type Video = { id: string; title: string; url: string; published: string; author: string; kind?: 'stream' | 'short' | 'video'; duration?: number | null }
type Scan = { id: string; channelUrl: string; channelId?: string; status: JobStatus; startedAt: string; finishedAt: string; count: number; error?: string | null }
type Transcript = { id: string; title: string; sourceUrl: string; text: string; createdAt: string }
type FacecamTrackingBox = { x?: number; y?: number; w?: number; h?: number; ok?: boolean }
type FacecamTracking = { fallback?: boolean; reason?: string; method?: string; confidence?: number; sampleSeconds?: number[]; samples?: FacecamTrackingBox[]; detections?: FacecamTrackingBox[] }
type Clip = { id: string; transcriptId: string; score: number; platform?: 'tiktok' | 'youtube' | 'x'; status?: 'idea' | 'draft' | 'reviewed' | 'exported'; exportedAt?: string | null; start: string; end: string; title: string; hook: string; caption: string; hashtags: string[]; reason: string; createdAt: string; renderPath?: string; renderUrl?: string; renderPreset?: string; renderStatus?: JobStatus; renderError?: string; exportBundlePath?: string; proofFramePath?: string; proofFrames?: string[]; thumbnailProofPath?: string; facecamTracking?: FacecamTracking; seo?: { youtubeTitle?: string; description?: string; tiktokDescription?: string; tags?: string[]; titleVariants?: string[]; pinnedComment?: string; primaryKeyword?: string; fileName?: string } }
type DispatchStatus = 'drafted' | 'needs_owner_review' | 'approved_manual_upload' | 'posted_manual' | 'blocked'
type DispatchItem = { id: string; clipId?: string; title: string; platform?: 'tiktok' | 'youtube' | 'x'; status: DispatchStatus; renderPath?: string; exportBundlePath?: string; proofFrames?: string[]; blockers?: string[]; lastAuditAction?: string; createdAt: string; updatedAt: string }
type DispatchListResponse = { items: DispatchItem[]; summary: { total: number; drafted: number; needsOwnerReview: number; approvedManualUpload: number; postedManual: number; blocked: number } }
type Job = { id: string; type: string; title: string; status: JobStatus; detail: string; createdAt: string }
type MediaJob = { id: string; step: string; status: JobStatus; detail: string; command: string; createdAt: string }
type ViralFind = { id: string; source: string; title: string; url: string; score: number; angle: string; createdAt: string }
type PracticeChat = { id: string; name: string; text: string; label: string; createdAt: string }
type ThumbnailConcept = { id: string; sourceClipId?: string; sourceTranscriptId?: string; sourceTitle?: string; status: 'idea' | 'liked' | 'disliked' | 'used'; rating?: 'like' | 'dislike' | null; title: string; thumbnailText: string; visualAngle: string; emotion: string; style: string; prompt: string; imageUrl?: string; learningNotes?: string; createdAt: string; updatedAt?: string }
type MediaValidation = { status: 'complete' | 'partial' | 'unknown'; detail: string; durationSeconds?: number; lastPacketSeconds?: number; validatedAt?: string; cacheStatus?: 'fresh' | 'reused' | 'not-applicable' }
type MediaFile = { name: string; kind: 'source' | 'transcript' | 'render' | 'export'; path: string; url: string; size: number; updatedAt: string; validation?: MediaValidation }
type AppState = { settings: Settings; scans: Scan[]; videos: Video[]; transcripts: Transcript[]; clips: Clip[]; dispatchItems: DispatchItem[]; mediaJobs: MediaJob[]; viralFinds: ViralFind[]; chatMessages: PracticeChat[]; thumbnailConcepts: ThumbnailConcept[]; jobs: Job[]; mediaFiles: MediaFile[] }
type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }
type SpeechRecognitionErrorEventLike = { error?: string }
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const navItems = [
  { id: 'roadmap', label: 'Rex Live Roadmap', icon: '🦖', kicker: 'Watch me work' },
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', kicker: 'Today' },
  { id: 'media-pipeline', label: 'Media Pipeline', icon: '🧰', kicker: 'yt-dlp → Whisper → ffmpeg' },
  { id: 'clip-factory', label: 'Clip Factory', icon: '🎬', kicker: 'Transcript ops' },
  { id: 'thumbnail-lab', label: 'Thumbnail Lab', icon: '🖼️', kicker: 'Concept backlog' },
  { id: 'viral-research', label: 'YouTube Scanner', icon: '📡', kicker: 'Public RSS' },
  { id: 'viral-hunter', label: 'Viral Hunter', icon: '🕵️', kicker: 'Lead finder' },
  { id: 'studio-feedback', label: 'Studio Feedback', icon: '🎙️', kicker: 'Stream quality' },
  { id: 'social-dashboard', label: 'Social Dashboard', icon: '📣', kicker: 'Drafts only' },
  { id: 'live-chat', label: 'Live Chat Co-Pilot', icon: '💬', kicker: 'Practice chat' },
  { id: 'rex-jobs', label: 'Rex Activity / Jobs', icon: '🦖', kicker: 'Real history' },
  { id: 'settings', label: 'Settings', icon: '⚙️', kicker: 'Local-first' },
] as const

const emptyState: AppState = { settings: { channelUrl: 'https://www.youtube.com/@ModernResponsibility', streamSafeMode: true, guardrails: [] }, scans: [], videos: [], transcripts: [], clips: [], dispatchItems: [], mediaJobs: [], viralFinds: [], chatMessages: [], thumbnailConcepts: [], jobs: [], mediaFiles: [] }
const formatDate = (value: string) => Number.isNaN(new Date(value).getTime()) ? 'date unavailable' : new Date(value).toLocaleDateString()
const formatBytes = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
const focusClipIds = ['clip_stream2_no_leaks_12s', 'clip_stream2_youtube_progress_12s', 'clip_1778603919030_8b73d8', 'clip_1778603919031_91c4f5', 'clip_1778603919030_f17815', 'clip_1778603919030_b27b7d', 'clip_1778603919030_00b5ee', 'clip_day3_build_the_face_tracker_live_20260513T0947Z', 'clip_day3_iphone_for_streamers_20260513T0947Z', 'clip_day3_first_auto_clip_shipped_20260513T0815Z', 'clip_1778654489064_d2b45a']
const focusRenderNames = ['day3-build-the-face-tracker-live-facecam-smart-20260513T0947Z.mp4', 'day3-an-iphone-for-streamers-facecam-smart-20260513T0947Z.mp4', 'stream-2-no-leaks-centered-screen-final.mp4', 'stream-2-youtube-progress-centered-screen-final-v2.mp4', 'stream-2-big-day-sprint-centered-screen-20260512T2117Z.mp4', 'stream-2-huge-day-mic-fixed-facecam-smart-20260512T2235Z.mp4', 'stream-2-second-clip-facecam-smart-lowerfill-20260513T0130Z.mp4', 'stream-2-thumbnail-quality-check-facecam-smart-20260513T0304Z.mp4', 'stream-2-should-i-rename-the-channel-facecam-smart-20260513T0738Z.mp4']
const validationLabel = (validation?: MediaValidation) => validation ? ({ complete: '✅ complete', partial: '⚠️ partial/corrupt', unknown: '❔ validation unknown' }[validation.status]) : ''
const mediaUrl = (url = '', stamp?: string | number) => `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(stamp || Date.now()))}`
const validationCacheLabel = (validation?: MediaValidation) => validation?.validatedAt ? `${validation.cacheStatus === 'reused' ? 'cached' : 'validated'} ${new Date(validation.validatedAt).toLocaleString()}` : 'not cached'
const mediaMatchKey = (value = '') => value.toLowerCase().replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]+/g, ' ').trim()
const matchesStreamArtifact = (file: MediaFile, stream?: Video) => {
  if (!stream) return false
  const fileKey = mediaMatchKey(file.name)
  const idKey = mediaMatchKey(stream.id)
  const titleKey = mediaMatchKey(stream.title)
  return Boolean((stream.id && file.name.startsWith(`${stream.id}.`)) || (idKey && fileKey === idKey) || (titleKey && fileKey === titleKey))
}
const isTranscriptText = (file: MediaFile) => /\.txt$/i.test(file.name)
const isCaptionFile = (file: MediaFile) => /\.(srt|vtt|ass)$/i.test(file.name)
const renderPresets = [
  { id: 'punchy-captions', label: 'Punchy captions short', helper: '1–2 word ASS subtitles, 9:16' },
  { id: 'standard-captions', label: 'Standard captions short', helper: 'SRT subtitles, 9:16' },
  { id: 'no-captions', label: 'No captions short', helper: 'Clean 9:16 render for manual editing' },
  { id: 'facecam-split', label: '50/50 facecam layout', helper: 'Top half source video, bottom half reserved for facecam/B-roll with captions' },
  { id: 'right-focus-captions', label: 'Right-centred punchy short', helper: '9:16 crop biased right for app layouts, with punchy captions' },
  { id: 'hook-card', label: 'Top hook card + captions', helper: 'Viral-style text box at the top, spoken captions at the bottom.' },
  { id: 'centered-screen', label: 'Centered screen', helper: 'Full screen scaled into the middle with bold permanent hook text and a brand-style wordmark.' },
  { id: 'facecam-smart', label: 'Smart facecam crop', helper: 'Samples the clip and shifts the 9:16 crop toward the most facecam-like top-screen region.' },
  { id: 'facecam-right', label: 'Facecam right drop-zone', helper: 'Older right-biased test layout with a visible facecam placeholder box' },
  { id: 'long-standard', label: 'Long-form with captions', helper: '1920px wide clip with SRT subtitles' },
] as const
type RenderPresetId = typeof renderPresets[number]['id']
const medianNumber = (values: number[]) => values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)]
const facecamCropLabel = (tracking?: FacecamTracking) => {
  const boxes = [...(tracking?.samples || []), ...(tracking?.detections || [])].filter((box) => [box.x, box.y, box.w, box.h].every((value) => typeof value === 'number'))
  if (!boxes.length) return 'crop unavailable'
  const x = medianNumber(boxes.map((box) => Number(box.x)))
  const y = medianNumber(boxes.map((box) => Number(box.y)))
  const w = medianNumber(boxes.map((box) => Number(box.w)))
  const h = medianNumber(boxes.map((box) => Number(box.h)))
  return `x${x} y${y} ${w}×${h}`
}
const facecamSampleCount = (tracking?: FacecamTracking) => tracking?.sampleSeconds?.length || tracking?.samples?.length || tracking?.detections?.length || 0

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { headers: { 'content-type': 'application/json' }, ...options })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

function App() {
  const [activePage, setActivePage] = useState<PageId>('roadmap')
  const [state, setState] = useState<AppState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const current = useMemo(() => navItems.find((item) => item.id === activePage) ?? navItems[0], [activePage])
  const refresh = async () => {
    const next = await api<AppState>('/api/state')
    setState(next)
  }
  useEffect(() => {
    let ignore = false
    api<AppState>('/api/state')
      .then((next) => { if (!ignore) setState(next) })
      .catch((err: Error) => { if (!ignore) setError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])
  useEffect(() => {
    const timer = window.setInterval(() => { refresh().catch(() => undefined) }, 12000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Vibe Zone navigation">
        <div className="brand-card"><div className="brand-mark">VZ</div><div><p className="eyebrow">Masala's local control room</p><h1>Vibe Zone</h1></div></div>
        <nav>{navItems.map((item) => <button className={item.id === activePage ? 'nav-item active' : 'nav-item'} key={item.id} onClick={() => setActivePage(item.id)} type="button"><span className="nav-icon">{item.icon}</span><span><strong>{item.label}</strong><small>{item.kicker}</small></span></button>)}</nav>
        <div className="stream-safe"><strong>Creator mode</strong><span>Clean stream view enabled.</span></div>
      </aside>
      <main className={`main-panel page-${activePage}`}>
        <header className="topbar"><div><p className="eyebrow">{current.kicker}</p><h2>{current.icon} {current.label}</h2></div><div className="status-pill"><span /> {loading ? 'Refreshing' : 'Ready'}</div></header>
        {error && <div className="notice danger">Something needs attention. Keep the stream view clean and ask Rex to check it.</div>}
        <Page page={activePage} state={state} refresh={refresh} setError={setError} />
      </main>
    </div>
  )
}

function Page({ page, state, refresh, setError }: { page: PageId; state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const props = { state, refresh, setError }
  switch (page) {
    case 'roadmap': return <LiveRoadmap state={state} />
    case 'media-pipeline': return <MediaPipeline {...props} />
    case 'clip-factory': return <ClipFactory {...props} />
    case 'viral-research': return <YouTubeScanner {...props} />
    case 'thumbnail-lab': return <ThumbnailLab {...props} />
    case 'viral-hunter': return <ViralHunter {...props} />
    case 'studio-feedback': return <StudioFeedback />
    case 'social-dashboard': return <SocialDashboard clips={state.clips} dispatchItems={state.dispatchItems} refresh={refresh} setError={setError} />
    case 'live-chat': return <LiveChat {...props} />
    case 'rex-jobs': return <RexJobs jobs={state.jobs} scans={state.scans} mediaJobs={state.mediaJobs} />
    case 'settings': return <SettingsPage {...props} />
    default: return <Dashboard state={state} setPage={() => undefined} />
  }
}

function LiveRoadmap({ state }: { state: AppState }) {
  const [focusPath, setFocusPath] = useState('Now')
  const activeJobs = [...state.mediaJobs, ...state.jobs].filter((job) => ['running', 'queued'].includes(job.status)).slice(0, 4)
  const recentJobs = [...state.mediaJobs, ...state.jobs].slice(0, 8)
  const latestStream = state.videos.find((video) => video.kind === 'stream') || state.videos.find((video) => /stream|vibe coding|day \d+/i.test(video.title)) || state.videos[0]
  const doneMediaJobs = state.mediaJobs.filter((job) => job.status === 'done').length
  const clipProgress = Math.min(100, Math.round((state.clips.filter((clip) => clip.renderStatus === 'done' || clip.status === 'exported').length / Math.max(state.clips.length, 1)) * 100))
  const pipelinePulse = activeJobs.length ? 'Active' : state.mediaJobs[0]?.status === 'done' ? 'Ready' : 'Idle'
  const particles = Array.from({ length: 18 }, (_, index) => index)
  const lanes = [
    { label: 'Listen', detail: 'Telegram + Web UI requests come in', status: 'live', icon: '📥' },
    { label: 'Think', detail: 'Rex plans the safest next step', status: activeJobs.length ? 'running' : 'ready', icon: '🧠' },
    { label: 'Build', detail: 'Code, media jobs, and Vibe Zone UI changes', status: state.mediaJobs.some((job) => job.status === 'running') ? 'running' : 'ready', icon: '🛠️' },
    { label: 'Verify', detail: 'Builds, probes, health checks, screenshots', status: 'ready', icon: '✅' },
    { label: 'Ship', detail: 'Final review before anything leaves the studio', status: 'guarded', icon: '🚀' },
  ]
  const visibleWork = activeJobs[0] || state.mediaJobs[0] || state.jobs[0]
  const workMode = activeJobs.length ? 'working' : visibleWork?.status === 'failed' ? 'blocked' : 'watching'
  const workSteps = [
    { label: 'Thinking', icon: '🧠', active: workMode === 'working' || focusPath === 'Now' },
    { label: 'Building', icon: '🛠️', active: state.mediaJobs.some((job) => ['running', 'queued'].includes(job.status)) },
    { label: 'Checking', icon: '🔍', active: /review|probe|health|verify|render/i.test(visibleWork?.detail || '') },
    { label: 'Ready to report', icon: '📣', active: workMode === 'watching' },
  ]
  const paths = [
    { title: 'Now', text: streamSafeText(visibleWork?.detail || 'Rex is watching the pipeline and waiting for the next useful move.'), tone: 'blue' },
    { title: 'Next path', text: 'Lock face tracking, then ship one reviewed short at a time.', tone: 'violet' },
    { title: 'Side quest', text: latestStream ? `Newest stream focus: ${latestStream.title}` : 'Scan YouTube to lock onto the newest stream.', tone: 'orange' },
    { title: 'Guardrail', text: 'Clean stream view. Review first, ship second.', tone: 'green' },
  ]
  return <section className="page-grid live-roadmap-page">
    <div className="roadmap-stage full-span">
      <div className="roadmap-particles" aria-hidden="true">{particles.map((particle) => <i key={particle} style={{ '--particle-delay': `${particle * 0.34}s`, '--particle-x': `${8 + (particle * 17) % 84}%`, '--particle-size': `${4 + (particle % 5) * 2}px` } as React.CSSProperties} />)}</div>
      <div className="roadmap-metrics" aria-label="Live roadmap metrics">
        <div><span>{pipelinePulse}</span><strong>Pipeline</strong></div>
        <div><span>{clipProgress}%</span><strong>Clips rendered/exported</strong></div>
        <div><span>{doneMediaJobs}</span><strong>Completed media jobs</strong></div>
      </div>
      <div className="rex-sky" aria-hidden="true"><span className="cloud c1">☁️</span><span className="cloud c2">☁️</span><span className="cloud c3">☁️</span><span className="moon">🌙</span></div>
      <div className="rex-mountains" aria-hidden="true"><span /><span /><span /></div>
      <div className="rex-amigos" aria-hidden="true"><b>🛸</b><b>🐙</b><b>🤖</b><b>🦝</b></div>
      <div className="maze-track" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className={`rex-core ${workMode}`} aria-label="Rex live work core">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="orbit orbit-three" />
        <div className="orbit orbit-four" />
        <div className="rex-work-console"><strong>{workMode === 'working' ? 'Rex is working' : workMode === 'blocked' ? 'Rex found a blocker' : 'Rex is watching'}</strong><span>{streamSafeText(visibleWork?.detail || 'Waiting for the next useful move.')}</span></div>
        <div className="rex-avatar"><span>🦖</span></div>
        <div className="rex-work-steps">{workSteps.map((step) => <div className={step.active ? 'active' : ''} key={step.label}><b>{step.icon}</b><span>{step.label}</span></div>)}</div>
        <div className="pulse-label"><strong>{focusPath}: {paths.find((path) => path.title === focusPath)?.text || 'Rex is online'}</strong><span>visible work state • no log-diving needed</span></div>
      </div>
      <div className="path-web">
        {paths.map((path, index) => <button className={`path-card ${path.tone} ${focusPath === path.title ? 'focused' : ''}`} type="button" onMouseEnter={() => setFocusPath(path.title)} onFocus={() => setFocusPath(path.title)} onClick={() => setFocusPath(path.title)} style={{ '--delay': `${index * 0.7}s` } as React.CSSProperties} key={path.title}>
          <span>{path.title}</span><strong>{path.text}</strong><em>tap / hover to focus</em>
        </button>)}
      </div>
    </div>
    <Card title="Live work lanes" eyebrow="Stream-followable flow" className="full-span">
      <div className="lane-map">{lanes.map((lane, index) => <div className={`work-lane ${lane.status}`} key={lane.label} style={{ '--lane-delay': `${index * 0.18}s` } as React.CSSProperties}>
        <div className="lane-icon">{lane.icon}</div><div><strong>{lane.label}</strong><span>{lane.detail}</span></div><small>{lane.status}</small>
      </div>)}</div>
    </Card>
    <Card title="Rex activity ticker" eyebrow="Auto-refreshes every few seconds" className="full-span">
      <div className="job-list">{recentJobs.map((job) => <article className="job-row" key={job.id}><span className={`dot ${job.status}`} /><div><h3>{'title' in job ? job.title : job.step}</h3><p>{streamSafeText(job.detail)}</p><small>{new Date(job.createdAt).toLocaleString()}</small></div><small>{job.status}</small></article>)}{!recentJobs.length && <p>No persisted jobs yet. As soon as I scan, render, upload, or change pipeline state, it appears here.</p>}</div>
    </Card>
  </section>
}

function Dashboard({ state }: { state: AppState; setPage: (page: PageId) => void }) {
  const lastScan = state.scans[0]
  const latestStream = state.videos.find((video) => video.kind === 'stream') || state.videos.find((video) => /\blive\b|stream|vibe coding|day \d+/i.test(video.title)) || state.videos[0]
  const latestSource = latestStream ? state.mediaFiles.find((file) => file.kind === 'source' && matchesStreamArtifact(file, latestStream)) : undefined
  const latestTranscript = latestStream ? state.mediaFiles.find((file) => file.kind === 'transcript' && isTranscriptText(file) && matchesStreamArtifact(file, latestStream)) : undefined
  const latestCaption = latestStream ? state.mediaFiles.find((file) => file.kind === 'transcript' && isCaptionFile(file) && matchesStreamArtifact(file, latestStream)) : undefined
  const activeMediaJobs = state.mediaJobs.filter((job) => ['running', 'queued'].includes(job.status))
  const stats = [
    { label: 'Recent videos', value: String(state.videos.length), detail: lastScan ? `Last scan ${lastScan.status}` : 'Run YouTube scanner', tone: 'blue' },
    { label: 'Transcripts', value: String(state.transcripts.length), detail: 'Imported locally', tone: 'purple' },
    { label: 'Clip candidates', value: String(state.clips.length), detail: 'Heuristic scored', tone: 'green' },
    { label: 'Media jobs', value: String(state.mediaJobs.length), detail: activeMediaJobs.length ? `${activeMediaJobs.length} active` : 'No active queue', tone: activeMediaJobs.length ? 'purple' : 'green' },
    { label: 'Viral leads', value: String(state.viralFinds.length), detail: 'Hunter backlog', tone: 'blue' },
  ]
  const expectedSourcePath = latestStream ? `media/downloads/${latestStream.id}.mp4` : 'media/downloads/VIDEO_ID.mp4'
  const expectedTranscriptPath = latestStream ? `media/transcripts/${latestStream.id}.txt` : 'media/transcripts/VIDEO_ID.txt'
  const expectedCaptionPath = latestStream ? `media/transcripts/${latestStream.id}.srt or .vtt` : 'media/transcripts/VIDEO_ID.srt or .vtt'
  const blocker = !latestStream ? 'Run a public YouTube scan to discover the newest stream.' : !latestSource ? `Upload or import ${expectedSourcePath}, then create ${expectedTranscriptPath} and press “Import local transcript + score” in Media Pipeline.` : latestSource.validation?.status === 'partial' ? latestSource.validation.detail : !latestTranscript ? `Source is present, but ${expectedTranscriptPath} is missing. Transcribe or import captions before clip scoring/rendering.` : !latestCaption ? `Transcript is present, but captions are missing. Add ${expectedCaptionPath} before render review.` : ''
  return <section className="page-grid"><div className="hero-card full-span"><div><p className="eyebrow">Creator operations control tower</p><h3>Track the stream-to-clips pipeline from one clean command centre.</h3><p>Inspired by modern logistics dashboards: scanner, uploads, transcripts, clip candidates, render queue, viral leads, and Rex activity are laid out like live operational lanes.</p></div></div><div className="stat-grid full-span">{stats.map((stat) => <MetricCard key={stat.label} {...stat} />)}</div><Card title="Newest-stream readiness" eyebrow="Masala scope guard"><p><strong>{latestStream ? latestStream.title : 'No stream selected yet'}</strong></p><p>{latestStream ? <a href={latestStream.url}>{latestStream.url}</a> : 'Scanner has not found a stream yet.'}</p>{latestSource ? <div className={`validation-badge ${latestSource.validation?.status || 'unknown'}`}>{validationLabel(latestSource.validation) || 'source found'}: {latestSource.path}</div> : <div className="notice danger">Newest stream source file is missing. Expected local file: <code>{expectedSourcePath}</code></div>}{latestTranscript ? <div className="notice">Transcript found: <code>{latestTranscript.path}</code></div> : latestSource ? <div className="notice danger">Transcript missing. Expected local file: <code>{expectedTranscriptPath}</code></div> : null}{latestCaption ? <div className="notice">Caption file found: <code>{latestCaption.path}</code></div> : latestTranscript ? <div className="notice danger">Caption file missing. Expected <code>{expectedCaptionPath}</code></div> : null}{blocker ? <div className="notice danger">Next action: {blocker}</div> : <div className="notice">Newest stream source, transcript, and captions look ready; continue Clip Factory review, renders, export bundles, Viral Hunter, and dispatch work.</div>}<small>Current scope is intentionally limited to Masala’s most recent stream first; older videos stay out of the pipeline unless requested.</small></Card><Card title="Operations route" eyebrow="From stream to shipment"><ol className="timeline"><li><time>1</time><span><strong>Media Pipeline</strong><small>Import newest stream + validate complete source</small></span></li><li><time>2</time><span><strong>Clip Factory</strong><small>Review candidates, render selected clips, build bundles</small></span></li><li><time>3</time><span><strong>Viral Hunter</strong><small>Find angles and platform-native hooks</small></span></li><li><time>4</time><span><strong>Social Dashboard</strong><small>Draft-only dispatch and winner tracking</small></span></li><li><time>5</time><span><strong>Rex Jobs</strong><small>Show persisted activity</small></span></li></ol></Card><Card title="Dispatch model" eyebrow="Vibe Zone / HQ"><p>Built for Masala first, but shaped like a creator logistics product: ingest streams, process media, dispatch clips, and review every action before anything leaves the yard.</p></Card></section>
}

function YouTubeScanner({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [busy, setBusy] = useState(false)
  const scan = async () => { setBusy(true); setError(''); try { await api<Scan>('/api/youtube/scan', { method: 'POST', body: '{}' }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  const last = state.scans[0]
  return <section className="page-grid"><Card title="YouTube channel scan" eyebrow="Creator research" className="full-span"><p>Channel: <a href={state.settings.channelUrl}>{state.settings.channelUrl}</a></p><button className="primary" type="button" onClick={scan} disabled={busy}>{busy ? 'Scanning…' : 'Scan recent videos'}</button>{last && <div className={last.status === 'failed' ? 'notice danger' : 'notice'}>Last scan: {last.status} • {last.count} videos • {new Date(last.finishedAt).toLocaleString()}{last.error ? ` • ${last.error}` : ''}</div>}</Card><Card title="Recent videos / streams" eyebrow={`${state.videos.length} stored`} className="full-span"><div className="table-list">{state.videos.map((video) => <div className="table-row" key={video.id}><strong>{video.title}</strong><span>{formatDate(video.published)} • {video.kind || 'video'} • {video.author}</span><a href={video.url}>{video.url}</a></div>)}{!state.videos.length && <p>No scan results yet.</p>}</div></Card></section>
}

function FacecamTrackingPanel({ preset, tracking }: { preset?: string; tracking?: FacecamTracking }) {
  if (preset !== 'facecam-smart') return null
  if (!tracking) return <div className="tracking-proof missing"><strong>Facecam tracking</strong><span>Tracking proof missing — re-render with latest preset.</span></div>
  const confidence = typeof tracking.confidence === 'number' ? `${Math.round(tracking.confidence * 100)}%` : 'unknown'
  const method = tracking.method || tracking.reason || 'tracked'
  return <div className="tracking-proof"><strong>Facecam tracking</strong><span>method {streamSafeText(method)} • confidence {confidence} • fallback {tracking.fallback ? 'yes' : 'no'} • samples {facecamSampleCount(tracking)} • crop {facecamCropLabel(tracking)}</span></div>
}

function FacecamTrackingProof({ clip }: { clip: Clip }) {
  return <FacecamTrackingPanel preset={clip.renderPreset} tracking={clip.facecamTracking} />
}

function ClipFactory({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [title, setTitle] = useState('Stream transcript')
  const [sourceUrl, setSourceUrl] = useState('')
  const [text, setText] = useState('00:00 Why local-first tools matter for creators\n00:18 Stop overbuilding before the workflow earns it\n00:35 How we can turn livestream chaos into repeatable clips\n01:02 The mistake is pretending fake demos are finished products')
  const [busy, setBusy] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<RenderPresetId>('punchy-captions')
  const importAndScore = async () => { setBusy(true); setError(''); try { const transcript = await api<Transcript>('/api/transcripts', { method: 'POST', body: JSON.stringify({ title, sourceUrl, text }) }); await api<Clip[]>('/api/clips/generate', { method: 'POST', body: JSON.stringify({ transcriptId: transcript.id }) }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  const updateClip = async (clip: Clip, patch: Partial<Pick<Clip, 'status' | 'platform'>>) => { setError(''); try { await api<Clip>(`/api/clips/${clip.id}`, { method: 'PATCH', body: JSON.stringify(patch) }); await refresh() } catch (err) { setError((err as Error).message) } }
  const renderClip = async (clip: Clip) => { setBusy(true); setError(''); try { await api<{ clip: Clip; job: MediaJob }>(`/api/clips/${clip.id}/render`, { method: 'POST', body: JSON.stringify({ presetId: selectedPreset }) }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  const exportBundle = async (clip: Clip) => { setBusy(true); setError(''); try { await api<{ clip: Clip; job: MediaJob; files: string[] }>(`/api/clips/${clip.id}/export-bundle`, { method: 'POST', body: '{}' }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  const preset = renderPresets.find((item) => item.id === selectedPreset) ?? renderPresets[0]
  return <section className="page-grid"><Card title="Import/paste transcript" eyebrow="Timestamp-aware" className="full-span"><div className="form-grid"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Transcript title" /><input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Optional source video URL" /><textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Paste transcript lines with optional timestamps like 00:42 text…" /></div><button className="primary" type="button" onClick={importAndScore} disabled={busy || !text.trim()}>{busy ? 'Working…' : 'Import and generate clip candidates'}</button><small>Quantity-first scoring uses overlapping transcript windows to create more candidates. Download and transcript steps stay review-first so the workflow remains calm on stream.</small></Card><Card title="Render preset" eyebrow="Clip Factory controls"><div className="form-grid"><select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value as RenderPresetId)}>{renderPresets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><p>{preset.helper}</p><small>The selected preset applies to each “Render” action below. Facecam/right-centred presets are editor-ready layouts; they keep the frame editor-ready for manual review.</small></Card><Card title="Focused test clips" eyebrow="Current workflow test outputs" className="full-span"><div className="clip-list">{state.clips.filter((clip) => focusClipIds.includes(clip.id)).map((clip) => <article className="clip-card" key={clip.id}><div className="clip-score">{clip.score}</div><div><h3>{clip.title}</h3><p>{clip.start}–{clip.end} • {(clip.platform || 'tiktok').toUpperCase()} • {clip.status || 'idea'} • {clip.renderStatus ? `render ${clip.renderStatus}` : 'not rendered yet'}</p>{clip.renderUrl && <video className="clip-preview" src={mediaUrl(clip.renderUrl, clip.renderPath)} controls preload="metadata" />}<blockquote>{clip.hook}</blockquote><p><strong>Title:</strong> {clip.title}</p><p><strong>Caption:</strong> {clip.caption}</p>{clip.seo && <div className="seo-copy-card"><h4>Upload copy</h4>{clip.seo.youtubeTitle && <p><strong>YouTube title:</strong> {clip.seo.youtubeTitle}</p>}{clip.seo.description && <p><strong>YouTube description:</strong> {clip.seo.description}</p>}{clip.seo.tiktokDescription && <p><strong>TikTok description:</strong> {clip.seo.tiktokDescription}</p>}{clip.seo.tags?.length ? <p><strong>Tags:</strong> {clip.seo.tags.join(', ')}</p> : null}</div>}<div className="tag-row">{clip.hashtags.map((tag) => <span key={tag}>{tag}</span>)}<span>{clip.renderPreset || 'No render preset yet'}</span><span>{clip.renderPreset === 'long-standard' ? 'long-form' : '9:16 short'}</span>{clip.exportBundlePath && <span>export bundle ready</span>}</div><FacecamTrackingProof clip={clip} /><div className="review-row"><select value={clip.status || 'idea'} onChange={(e) => updateClip(clip, { status: e.target.value as Clip['status'] })}><option value="idea">idea</option><option value="draft">draft</option><option value="reviewed">reviewed</option><option value="exported">exported</option></select><select value={clip.platform || 'tiktok'} onChange={(e) => updateClip(clip, { platform: e.target.value as Clip['platform'] })}><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="x">X/Twitter</option></select><button className="primary" type="button" onClick={() => renderClip(clip)} disabled={busy}>Render: {preset.label}</button><button type="button" onClick={() => exportBundle(clip)} disabled={busy}>Build upload bundle</button>{clip.exportedAt && <small>Exported {new Date(clip.exportedAt).toLocaleString()}</small>}</div>{clip.renderPath && <p><strong>Render:</strong> <a href={`/${clip.renderPath}`} target="_blank">Open rendered clip</a></p>}{clip.exportBundlePath && <p><strong>Upload card:</strong> <a href={`/${clip.exportBundlePath}/upload-card.md`} target="_blank">Open upload card</a></p>}{clip.renderError && <div className="notice danger">{clip.renderError}</div>}<small>{clip.reason}</small></div></article>)}{!state.clips.filter((clip) => focusClipIds.includes(clip.id)).length && <p>Focused test clip is not loaded yet.</p>}</div></Card></section>
}


type UploadResponse = { ok: boolean; path: string; size: number }
function uploadFileWithProgress(file: File, onProgress: (percent: number) => void): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `/api/media/upload?filename=${encodeURIComponent(file.name)}`)
    request.setRequestHeader('content-type', file.type || 'application/octet-stream')
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onload = () => {
      try {
        const data = JSON.parse(request.responseText || '{}')
        if (request.status >= 200 && request.status < 300) resolve(data)
        else reject(new Error(data.error || `Upload failed for ${file.name}`))
      } catch (error) { reject(error) }
    }
    request.onerror = () => reject(new Error(`Network error uploading ${file.name}`))
    request.send(file)
  })
}

function MediaPipeline({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const latestStream = state.videos.find((video) => video.kind === 'stream') || state.videos.find((video) => /\blive\b|stream|vibe coding|day \d+/i.test(video.title)) || state.videos[0]
  const plannedVideoId = latestStream?.id || 'VIDEO_ID'
  const plannedMediaPath = `media/downloads/${plannedVideoId}.mp4`
  const plannedSubtitlePath = `media/transcripts/${plannedVideoId}.srt`
  const plannedTranscriptPath = `media/transcripts/${plannedVideoId}.txt`
  const [videoUrl, setVideoUrl] = useState('')
  const [inputPath, setInputPath] = useState('')
  const [busy, setBusy] = useState('')
  const [uploadNote, setUploadNote] = useState('')
  const [uploadPercent, setUploadPercent] = useState(0)
  const latestSourceFiles = state.mediaFiles.filter((file) => file.kind === 'source' && matchesStreamArtifact(file, latestStream))
  const latestReadySource = latestSourceFiles.find((file) => file.validation?.status !== 'partial') || latestSourceFiles[0]
  const targetUrl = videoUrl || latestStream?.url || ''
  const targetInputPath = inputPath || latestReadySource?.path || plannedMediaPath
  const run = async (path: string, body: object = {}) => { setBusy(path); setError(''); try { await api<unknown>(path, { method: 'POST', body: JSON.stringify(body) }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy('') } }
  const uploadFiles = async (files: FileList | File[]) => {
    const items = Array.from(files)
    if (!items.length) return
    setBusy('/api/media/upload'); setError(''); setUploadPercent(0); setUploadNote(`Uploading ${items.length} file(s)… 0%`)
    try {
      for (const file of items) {
        const data = await uploadFileWithProgress(file, (percent) => { setUploadPercent(percent); setUploadNote(`Uploading ${file.name}… ${percent}%`) })
        setUploadPercent(100); setUploadNote(`Uploaded ${data.path}`)
        if (/\.(mp4|mov|mkv|webm|m4v)$/i.test(file.name)) setInputPath(data.path)
      }
      await refresh()
    } catch (err) { setError((err as Error).message) } finally { setBusy('') }
  }
  const renderedFiles = state.mediaFiles
    .filter((file) => file.kind === 'render' && focusRenderNames.includes(file.name))
    .sort((a, b) => focusRenderNames.indexOf(a.name) - focusRenderNames.indexOf(b.name))
  const clipForRender = (file: MediaFile) => state.clips.find((clip) => clip.renderPath === file.path || clip.renderPath?.endsWith(file.name) || clip.renderUrl === file.url || clip.renderUrl?.endsWith(file.name))
  const fallbackSourceFiles = state.mediaFiles.filter((file) => file.kind === 'source' && file.name === 'stream-2.mp4')
  const latestTranscriptFiles = state.mediaFiles.filter((file) => file.kind === 'transcript' && matchesStreamArtifact(file, latestStream))
  const hasLatestTranscriptText = latestTranscriptFiles.some(isTranscriptText)
  const hasLatestCaptionFile = latestTranscriptFiles.some(isCaptionFile)
  const fallbackTranscriptFiles = state.mediaFiles.filter((file) => file.kind === 'transcript' && file.name.startsWith('stream-2'))
  const sourceFiles = (latestSourceFiles.length ? latestSourceFiles : fallbackSourceFiles).slice(0, 3)
  const transcriptFiles = (latestTranscriptFiles.length ? latestTranscriptFiles : fallbackTranscriptFiles).slice(0, 3)
  const pipelineBlocker = !latestStream
    ? 'Run the public YouTube scan first so Vibe Zone can lock onto the newest stream.'
      : !latestSourceFiles.length
      ? `Missing newest stream source. Expected ${plannedMediaPath}; upload/drop it here, then transcribe or import ${plannedTranscriptPath}.`
      : latestSourceFiles.some((file) => file.validation?.status === 'partial')
        ? 'Newest stream source is present but validation says partial/corrupt; replace it before rendering.'
        : !hasLatestTranscriptText
          ? `Source is present. Next create or import ${plannedTranscriptPath}, then score clips.`
          : !hasLatestCaptionFile
            ? `Transcript is present. Next add captions at ${plannedSubtitlePath} or media/transcripts/${plannedVideoId}.vtt before render review.`
          : ''
  return <section className="page-grid"><Card title="Production pipeline" eyebrow="Stream to clips" className="full-span"><div className="notice">Current target is the most recent public stream item first: <strong>{latestStream ? latestStream.title : 'scan YouTube first'}</strong>. This view is simplified for livestream review.</div>{pipelineBlocker ? <div className="notice danger">Pipeline blocker: {pipelineBlocker}</div> : <div className="notice">Newest stream source, transcript, and captions are visible. Ready for Clip Factory review/render work.</div>}{latestReadySource && latestReadySource.path !== plannedMediaPath ? <div className="notice">Using detected source file for actions: <code>{latestReadySource.path}</code></div> : null}<label className="upload-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files) }}><input type="file" multiple accept="video/*,audio/*,.mp4,.mov,.mkv,.webm,.m4v,.mp3,.wav,.m4a,.txt,.srt,.vtt" onChange={(e) => e.currentTarget.files && uploadFiles(e.currentTarget.files)} /><strong>Drop downloaded stream files here</strong><span>Drop video, audio, transcript, or subtitle files here. Click here if drag/drop is awkward.</span>{uploadNote && <div className="upload-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadPercent}><div style={{ width: `${uploadPercent}%` }} /><strong>{uploadPercent}%</strong></div>}{uploadNote && <small>{uploadNote}</small>}</label><div className="form-grid"><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={latestStream?.url || 'YouTube video/live replay URL'} /><input value={inputPath} onChange={(e) => setInputPath(e.target.value)} placeholder={latestReadySource?.path || plannedMediaPath} /></div><div className="button-row"><button className="primary" onClick={() => run('/api/media/probe')} disabled={!!busy}>Probe tools</button><button className="primary" onClick={() => run('/api/media/extract', { videoUrl: targetUrl })} disabled={!!busy || !targetUrl}>Preflight YouTube extraction</button><button className="primary" onClick={() => run('/api/media/ingest-local', { videoId: plannedVideoId, inputPath: targetInputPath, transcriptPath: plannedTranscriptPath, subtitlePath: plannedSubtitlePath, sourceUrl: targetUrl })} disabled={!!busy}>Import local transcript + score</button><button className="primary" onClick={() => run('/api/media/transcribe', { inputPath: targetInputPath })} disabled={!!busy}>Plan Whisper transcript</button><button className="primary" onClick={() => run('/api/media/render', { inputPath: targetInputPath, start: '0:00', end: '0:45', mode: 'short', subtitlePath: plannedSubtitlePath })} disabled={!!busy}>Queue short + subtitles</button><button className="primary" onClick={() => run('/api/media/render', { inputPath: targetInputPath, start: '0:00', end: '8:00', mode: 'long', subtitlePath: plannedSubtitlePath })} disabled={!!busy}>Queue long-form + subtitles</button></div><small>Jobs stay review-first until the needed source and captions are ready. Import turns a transcript into clip candidates for the newest stream only.</small></Card><Card title="Focused render previews" eyebrow="current test outputs" className="full-span"><div className="render-grid">{renderedFiles.map((file) => { const clip = clipForRender(file); const inferredPreset = clip?.renderPreset || (file.name.includes('facecam-smart') ? 'facecam-smart' : undefined); return <article className="render-card" key={file.path}><video src={mediaUrl(file.url, file.updatedAt)} controls preload="metadata" /><div><h3>{file.name}</h3><p>{formatBytes(file.size)} • {new Date(file.updatedAt).toLocaleString()}</p><FacecamTrackingPanel preset={inferredPreset} tracking={clip?.facecamTracking} /><div className="button-row"><a className="file-link" href={mediaUrl(file.url, file.updatedAt)} target="_blank">Open</a><a className="file-link" href={mediaUrl(file.url, file.updatedAt)} download>Download</a></div></div></article> })}{!renderedFiles.length && <p>No rendered clips yet.</p>}</div></Card><Card title="Review files" eyebrow="Ready for review" className="full-span"><div className="table-list">{[...sourceFiles, ...transcriptFiles].map((file) => <div className="table-row media-artifact-row" key={file.path}><strong>{file.kind}</strong><span>{formatBytes(file.size)}</span><a href={file.url} target="_blank">Open file</a>{file.validation && <div className={`validation-badge ${file.validation.status}`} title={`${streamSafeText(file.validation.detail)} • ${validationCacheLabel(file.validation)}`}>{validationLabel(file.validation)}<em>{validationCacheLabel(file.validation)}</em></div>}<small>{file.validation ? streamSafeText(file.validation.detail) : ''}</small></div>)}{!latestSourceFiles.length && fallbackSourceFiles.length ? <div className="notice danger">Showing Stream 2 fallback files for review only. Newest-stream actions still need <code>{plannedMediaPath}</code>.</div> : null}{!sourceFiles.length && !transcriptFiles.length && <p>No uploaded/transcript artifacts yet.</p>}</div></Card><Card title="Work log" eyebrow={`${state.mediaJobs.length} jobs`} className="full-span"><div className="job-list">{state.mediaJobs.map((job) => <article className="job-row" key={job.id}><span className={`dot ${job.status}`} /><div><h3>{job.step}</h3><p>{streamSafeText(job.detail)}</p><small>{new Date(job.createdAt).toLocaleString()}</small></div><small>{job.status}</small></article>)}{!state.mediaJobs.length && <p>No media jobs yet. Probe tools first.</p>}</div></Card></section>
}

function ViralHunter({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [busy, setBusy] = useState(false)
  const latestStream = state.videos.find((video) => video.kind === 'stream') || state.videos[0]
  const hunt = async () => { setBusy(true); setError(''); try { await api<ViralFind[]>('/api/viral/hunt', { method: 'POST', body: '{}' }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  return <section className="page-grid"><Card title="Viral Hunter MVP" eyebrow="Newest stream only" className="full-span"><p>Finds hookable ideas from Masala’s newest stream and generated clip candidates, then frames them with Opus-style patterns: money/proof, problem→fix, AI workflow reveal, and curiosity-first captions.</p><div className="notice">Scope guard: {latestStream ? <><strong>{latestStream.title}</strong> is the only stream Vibe Zone is hunting right now.</> : 'Scan YouTube first so Viral Hunter can lock onto the newest stream.'}</div><button className="primary" type="button" onClick={hunt} disabled={busy}>{busy ? 'Hunting…' : 'Generate newest-stream leads'}</button></Card><Card title="Competitor gap board" eyebrow="Opus Clip patterns to match"><ol className="timeline"><li><time>1</time><span><strong>Virality score with reasons</strong><small>Already seeded; next add retention/comment prediction fields.</small></span></li><li><time>2</time><span><strong>Auto-reframe + caption templates</strong><small>Caption-safe renders exist; true face tracking and more templates are next.</small></span></li><li><time>3</time><span><strong>Publishing workflow</strong><small>Keep draft/export-only until Masala approves official integrations.</small></span></li></ol></Card><Card title="Lead backlog" eyebrow="Review candidates" className="full-span"><div className="clip-list">{state.viralFinds.map((find) => <article className="clip-card" key={find.id}><div className="clip-score">{find.score}</div><div><h3>{find.title}</h3><p>{find.source}{find.url ? <> • <a href={find.url}>{find.url}</a></> : null}</p><blockquote>{find.angle}</blockquote><small>{new Date(find.createdAt).toLocaleString()}</small></div></article>)}{!state.viralFinds.length && <p>No leads yet. Run a YouTube scan or generate clips, then hunt.</p>}</div></Card></section>
}

function LiveChat({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [topic, setTopic] = useState('building Vibe Zone local-first')
  const [context, setContext] = useState('We are turning a visual scaffold into real local workflows.')
  const [liveContext, setLiveContext] = useState('')
  const [listening, setListening] = useState(false)
  const [autoAsk, setAutoAsk] = useState(false)
  const [secondsBetween, setSecondsBetween] = useState(90)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const liveContextRef = useRef('')
  const lastAutoAskRef = useRef(0)
  const generate = useCallback(async (overrideContext = context) => { setError(''); try { await api<PracticeChat[]>('/api/chat/generate', { method: 'POST', body: JSON.stringify({ topic, context: overrideContext }) }); await refresh(); lastAutoAskRef.current = Date.now() } catch (err) { setError((err as Error).message) } }, [context, refresh, setError, topic])
  const appendLiveContext = (text: string) => {
    const next = `${liveContextRef.current} ${text}`.trim().split(/\s+/).slice(-180).join(' ')
    liveContextRef.current = next
    setLiveContext(next)
    setContext(next || context)
  }
  const startListening = () => {
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognition) { setError('Mic co-pilot needs Chrome or Edge Web Speech API support. Use manual context input as fallback.'); return }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) if (event.results[i].isFinal) finalText += ` ${event.results[i][0].transcript}`
      if (finalText.trim()) appendLiveContext(finalText.trim())
    }
    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => setError(`Mic listener warning: ${event.error || 'speech recognition error'}`)
    recognition.onend = () => { if (recognitionRef.current) recognition.start() }
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }
  const stopListening = () => {
    const recognition = recognitionRef.current
    recognitionRef.current = null
    setListening(false)
    if (recognition) recognition.stop()
  }
  useEffect(() => () => stopListening(), [])
  useEffect(() => {
    if (!autoAsk) return
    const timer = window.setInterval(() => {
      const enoughTime = Date.now() - lastAutoAskRef.current > secondsBetween * 1000
      if (enoughTime && liveContextRef.current.split(/\s+/).length > 18) generate(`Live mic context: ${liveContextRef.current}`).catch(() => undefined)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [autoAsk, generate, secondsBetween])
  return <section className="page-grid live-chat-page"><Card title="Live Chat Co-Pilot" eyebrow="Viewer-style practice" className="full-span chat-shell-card"><div className="chat-shell"><div className="chat-top"><div><strong>No Sleep Shipping chat</strong><span>{listening ? 'Listening' : 'Mic paused'} • {autoAsk ? `auto every ${secondsBetween < 60 ? `${secondsBetween}s` : `${secondsBetween / 60}m`}` : 'manual mode'}</span></div><div className={`chat-live-dot ${listening ? 'on' : ''}`} /></div><div className="chat-window" aria-label="Practice chat messages">{state.chatMessages.length ? state.chatMessages.map((message, index) => <article className="chat-message" key={message.id} style={{ '--bubble-delay': `${Math.min(index, 8) * 0.04}s`, '--avatar-hue': `${(message.name.charCodeAt(0) * 37 + index * 29) % 360}deg` } as React.CSSProperties}><div className="chat-avatar"><span>{chatAvatar(message.name, index)}</span></div><div className="chat-bubble"><div><strong>{message.name}</strong><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.text}</p></div></article>) : <div className="chat-empty"><strong>No prompts yet</strong><span>Start listening or hit generate — prompts will drop in here like a clean private chat.</span></div>}</div><div className="chat-controls"><button className={listening ? '' : 'primary'} type="button" onClick={listening ? stopListening : startListening}>{listening ? 'Stop listening' : 'Start listening'}</button><button className={autoAsk ? 'primary' : ''} type="button" onClick={() => setAutoAsk(!autoAsk)}>{autoAsk ? 'Auto on' : 'Auto off'}</button><label>Every <select value={secondsBetween} onChange={(e) => setSecondsBetween(Number(e.target.value))}><option value={45}>45s</option><option value={90}>90s</option><option value={150}>2.5m</option><option value={300}>5m</option></select></label><button type="button" onClick={() => generate(context)}>Generate now</button></div></div></Card><Card title="Context" eyebrow="Quiet controls" className="full-span chat-context-card"><div className="form-grid"><input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Current topic" /><textarea value={context} onChange={(e) => { setContext(e.target.value); liveContextRef.current = e.target.value; setLiveContext(e.target.value) }} rows={3} placeholder="Stream context" /></div><details><summary>Listening buffer</summary><p>{liveContext || 'Nothing captured yet.'}</p><button type="button" onClick={() => { liveContextRef.current = ''; setLiveContext('') }}>Clear context</button></details></Card></section>
}

function chatAvatar(name: string, index: number) {
  const avatars = ['🦝', '🛸', '🦊', '🐸', '🤖', '🦄', '👻', '🐙', '🦖', '🐧', '🧃', '🌚']
  return avatars[(name.charCodeAt(0) + index) % avatars.length]
}


function ThumbnailLab({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const feedback = state.settings.thumbnailConceptFeedback || {}
  const concepts = (state.thumbnailConcepts || []).map((concept) => ({ ...concept, rating: feedback[concept.id] || concept.rating, status: feedback[concept.id] === 'like' ? 'liked' as const : feedback[concept.id] === 'dislike' ? 'disliked' as const : concept.status }))
  const selected = concepts.find((concept) => concept.id === selectedId) || null
  const liked = concepts.filter((concept) => concept.rating === 'like' || concept.status === 'liked').length
  const disliked = concepts.filter((concept) => concept.rating === 'dislike' || concept.status === 'disliked').length
  const latestImage = state.mediaFiles.find((file) => file.path === 'media/thumbnails/stream-2-thumbnail-quality-check-20260513T0304Z.jpg')
  const generate = async () => {
    setBusy(true); setError('')
    try { await api<ThumbnailConcept[]>('/api/thumbnails/generate', { method: 'POST', body: JSON.stringify({ limit: 50 }) }); await refresh() }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }
  const saveConcept = async (concept: ThumbnailConcept, patch: Partial<ThumbnailConcept>) => {
    setError('')
    try { await api<ThumbnailConcept>(`/api/thumbnails/${concept.id}`, { method: 'PATCH', body: JSON.stringify(patch) }) }
    catch (err) { setError((err as Error).message); throw err }
    await refresh()
  }
  const rate = async (concept: ThumbnailConcept, rating: 'like' | 'dislike') => {
    try { await saveConcept(concept, { rating, status: rating === 'like' ? 'liked' : 'disliked', learningNotes: comment || concept.learningNotes || '' }) }
    catch {
      await api<Settings>('/api/settings', { method: 'POST', body: JSON.stringify({ thumbnailConceptFeedback: { ...feedback, [concept.id]: rating } }) })
      await refresh()
    }
  }
  const markUsed = async (concept: ThumbnailConcept) => saveConcept(concept, { status: 'used', learningNotes: comment || concept.learningNotes || '' })
  const openConcept = (concept: ThumbnailConcept) => { setSelectedId(concept.id); setComment(concept.learningNotes || '') }
  return <section className="page-grid thumbnail-lab-page">
    <Card title="Thumbnail verdict" eyebrow="Latest generated image" className="full-span compact-card">
      <div className="thumbnail-verdict compact">
        {latestImage ? <img src={mediaUrl(latestImage.url, latestImage.updatedAt)} alt="Latest thumbnail proof" /> : <div className="empty-panel"><strong>No generated thumbnail image found yet.</strong></div>}
        <div><p><strong>Honest read:</strong> the last thumbnail is useful as a proof frame, but not upload-ready. It is too screenshot-like: face too small, text too busy, and not enough emotional click tension.</p><p>New target: 50 face-led concepts, big 2–4 word text, fast like/dislike feedback, and comments to train the next batch.</p></div>
      </div>
    </Card>
    <div className="stat-grid full-span"><MetricCard label="Concepts" value={`${concepts.length}/50`} detail="Target backlog size" tone={concepts.length >= 50 ? 'green' : 'amber'} /><MetricCard label="Liked" value={String(liked)} detail="Use more like these" tone="green" /><MetricCard label="Disliked" value={String(disliked)} detail="Avoid these patterns" tone={disliked ? 'amber' : 'green'} /><MetricCard label="Style target" value="Face-led" detail="GothamChess-inspired" tone="purple" /></div>
    <Card title="Concept grid" eyebrow="Click any thumbnail card to review" className="full-span compact-card"><div className="thumbnail-toolbar"><p>I’ll use stream logs and your uploaded Google Drive reference photos for concepts going forward.</p><button className="primary" type="button" onClick={generate} disabled={busy}>{busy ? 'Generating…' : 'Fill to 50 concepts'}</button></div><div className="thumbnail-grid compact-grid">{concepts.map((concept, index) => <button className={`thumbnail-tile ${concept.rating || concept.status}`} key={concept.id} type="button" onClick={() => openConcept(concept)}>
      <div className="thumbnail-mock"><span className="thumb-face">{index % 3 === 0 ? '😲' : index % 3 === 1 ? '😤' : '🤯'}</span><strong>{concept.thumbnailText}</strong><em>{concept.emotion}</em></div><span>{concept.rating || concept.status}</span>
    </button>)}{!concepts.length && <div className="empty-panel"><strong>No concepts yet.</strong><p>Press generate and I’ll seed 50 from the current Stream 2 clips/transcripts.</p></div>}</div></Card>
    {selected && <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setSelectedId(null)}><article className="thumbnail-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setSelectedId(null)}>×</button><div className="thumbnail-modal-preview"><div className="thumbnail-mock large"><span className="thumb-face">😲</span><strong>{selected.thumbnailText}</strong><em>{selected.emotion}</em></div></div><div className="thumbnail-modal-copy"><p className="eyebrow">{selected.status} • {selected.rating || 'unrated'}</p><h3>{selected.title}</h3><p><strong>Visual:</strong> {selected.visualAngle}</p><p><strong>Style:</strong> {selected.style}</p><p><strong>Prompt:</strong> {selected.prompt}</p><label><strong>Your note / Rex learning</strong><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="e.g. bigger face, less text, funnier expression, more drama…" /></label><div className="review-row"><button type="button" onClick={() => rate(selected, 'like')}>👍 Like</button><button type="button" onClick={() => rate(selected, 'dislike')}>👎 Dislike</button><button type="button" onClick={() => markUsed(selected)}>Mark used</button></div></div></article></div>}
  </section>
}

function RexJobs({ jobs, scans, mediaJobs }: { jobs: Job[]; scans: Scan[]; mediaJobs: MediaJob[] }) {
  return <section className="page-grid"><Card title="Recent Rex work" eyebrow="Activity" className="full-span"><div className="job-list">{jobs.map((job) => <article className="job-row" key={job.id}><span className={`dot ${job.status}`} /><div><h3>{job.title}</h3><p>{streamSafeText(job.detail)}</p><small>{'work'} • {new Date(job.createdAt).toLocaleString()}</small></div><small>{job.status}</small></article>)}{!jobs.length && <p>No jobs logged yet. Run a scan, import transcript, or generate practice chat.</p>}</div></Card><Card title="Media pipeline queue" eyebrow="30-minute checker view" className="full-span"><div className="job-list">{mediaJobs.map((job) => <article className="job-row" key={job.id}><span className={`dot ${job.status}`} /><div><h3>{job.step}</h3><p>{streamSafeText(job.detail)}</p><small>{new Date(job.createdAt).toLocaleString()}</small></div><small>{job.status}</small></article>)}</div></Card><Card title="Scan runs" eyebrow="Status"><div className="table-list">{scans.map((scan) => <div className="table-row" key={scan.id}><strong>{scan.status} • {scan.count} videos</strong><span>{new Date(scan.finishedAt).toLocaleString()}</span><p>{streamSafeText(scan.error || scan.channelId || scan.channelUrl)}</p></div>)}</div></Card></section>
}

function SettingsPage({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const channelRef = useRef<HTMLInputElement>(null)
  const save = async () => {
    setError('')
    try {
      await api<Settings>('/api/settings', { method: 'POST', body: JSON.stringify({ channelUrl: channelRef.current?.value || state.settings.channelUrl }) })
      await refresh()
    } catch (err) { setError((err as Error).message) }
  }
  return <section className="page-grid"><Card title="Channel settings" eyebrow="Creator setup"><div className="form-grid"><input key={state.settings.channelUrl} ref={channelRef} defaultValue={state.settings.channelUrl} /></div><button className="primary" type="button" onClick={save}>Save channel URL</button></Card><Card title="Growth strategy" eyebrow="Masala preference"><p>{state.settings.clipStrategy || 'Quantity-first: TikTok filters winners, YouTube scales them, X reports proven lessons.'}</p></Card><Card title="Thumbnail direction" eyebrow="Needs approved refs"><p>{state.settings.thumbnailStyle || 'Hyper-realistic Masala face thumbnails once reference images are approved; GothamChess-inspired composition.'}</p></Card><Card title="Product angle" eyebrow="Vibe Zone / HQ"><p>{state.settings.productAngle || 'Monthly product for upcoming streamers.'}</p></Card></section>
}

function StudioFeedback() { return <section className="page-grid">{['Audio: add peak warning if music overlaps mic.', 'Pacing: add chapter cards every 20 minutes.', 'Privacy: keep the live view clean and creator-friendly.', 'Chat: use transparent practice questions, not fake engagement.'].map((note) => <Card key={note} title={note.split(':')[0]} eyebrow="Checklist"><p>{note}</p></Card>)}</section> }
function streamSafeText(value = '') {
  return String(value)
    .replace(/https?:\/\/\S+/g, 'source link')
    .replace(/127\.0\.0\.1(?::\d+)?/g, 'local app')
    .replace(/\bAPI\b/gi, 'system')
    .replace(/\btoken\b|\bsecret\b|\bauth\b|\bcookie[s]?\b|\bSSH\b/gi, 'private setup')
    .replace(/(?:media|data|src|server|scripts)\/[\w./-]+/g, 'project file')
    .replace(/\/root\/\S+/g, 'project file')
}
function platformChecklist(platform: Clip['platform'] = 'tiktok', clip?: Clip) {
  const hasRender = Boolean(clip?.renderPath)
  const hasBundle = Boolean(clip?.exportBundlePath)
  const common = [
    hasRender ? 'Watch the rendered file end-to-end' : 'Render the clip before upload',
    hasBundle ? 'Open the local upload card before posting' : 'Build the local upload bundle first',
    'Confirm subtitles/safe-zone placement',
    'Manual upload only — no external posting',
  ]
  if (platform === 'youtube') return [
    `YouTube title ready: ${clip?.seo?.youtubeTitle || clip?.title || 'needs title'}`,
    clip?.seo?.description ? 'Description copy present' : 'Add YouTube description copy',
    clip?.seo?.tags?.length ? 'Tags/keywords present' : 'Add Shorts tags/keywords',
    ...common,
  ]
  if (platform === 'x') return ['Pair the clip with one build-in-public lesson', 'Keep the post human, specific, and non-hypey', ...common]
  return [
    clip?.seo?.tiktokDescription ? 'TikTok description copy present' : 'Confirm TikTok caption/description',
    clip?.hashtags?.length ? 'Hashtags present' : 'Add 3–5 relevant hashtags',
    'Use TikTok first for quantity validation',
    ...common,
  ]
}
function expectedProofFrames(clip: Clip) {
  if (clip.proofFrames?.length) return clip.proofFrames
  if (clip.proofFramePath) return [clip.proofFramePath]
  if (clip.thumbnailProofPath) return [clip.thumbnailProofPath]
  return clip.exportBundlePath ? [`${clip.exportBundlePath}/proof-frame.jpg`, `${clip.exportBundlePath}/proof-frame-mid.jpg`] : []
}
function ownerGateLabel(clip: Clip) {
  if (clip.status === 'exported') return 'Owner-approved/exported'
  if (clip.status === 'reviewed') return 'Reviewed — awaiting owner export approval'
  return 'Needs owner review before manual upload'
}
const dispatchStatusOptions: DispatchStatus[] = ['drafted', 'needs_owner_review', 'approved_manual_upload', 'posted_manual', 'blocked']
const dispatchStatusLabel = (status: DispatchStatus) => ({
  drafted: 'Drafted',
  needs_owner_review: 'Needs owner review',
  approved_manual_upload: 'Approved for manual upload',
  posted_manual: 'Posted manually',
  blocked: 'Blocked',
}[status])
const blockerReworkHints = (blockers: string[] = []) => {
  const text = blockers.join(' ').toLowerCase()
  const hints = [
    /headline|wording|caption/.test(text) && 'Tighten headline/caption wording before approval.',
    /safe-zone|safe zone|bottom/.test(text) && 'Raise captions or move text out of the bottom safe zone.',
    /proof/.test(text) && 'Regenerate proof frames after the re-render.',
    /render|asset/.test(text) && 'Re-render locally with the latest facecam-smart preset.',
    /bundle|metadata|upload/.test(text) && 'Rebuild the local upload bundle after the render passes.',
  ].filter(Boolean) as string[]
  return hints.length ? hints : ['Review the blocker, fix the local asset, then refresh the dispatch queue.']
}
const isBlockedDispatch = (item: DispatchItem) => item.status === 'blocked' || Boolean(item.blockers?.length)

function SocialDashboard({ clips, dispatchItems, refresh, setError }: { clips: Clip[]; dispatchItems: DispatchItem[]; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [seeding, setSeeding] = useState(false)
  const dispatchReady = clips.filter((clip) => clip.exportBundlePath || clip.renderPath || clip.status === 'reviewed' || clip.status === 'exported')
  const queue = dispatchItems.length ? dispatchItems : dispatchReady.map((clip) => ({ id: `fallback_${clip.id}`, clipId: clip.id, title: clip.title, platform: clip.platform || 'tiktok', status: clip.status === 'exported' ? 'approved_manual_upload' : clip.status === 'reviewed' ? 'needs_owner_review' : 'drafted', renderPath: clip.renderPath, exportBundlePath: clip.exportBundlePath, proofFrames: expectedProofFrames(clip), blockers: [!clip.renderPath && 'Missing rendered asset', !clip.exportBundlePath && 'Missing local upload bundle'].filter(Boolean) as string[], lastAuditAction: 'Derived fallback from clip metadata', createdAt: clip.createdAt, updatedAt: clip.exportedAt || clip.createdAt } satisfies DispatchItem))
  const blockedItems = queue.filter(isBlockedDispatch)
  const approvedCount = queue.filter((item) => ['approved_manual_upload', 'posted_manual'].includes(item.status)).length
  const blockedCount = blockedItems.length
  const needsReviewCount = queue.filter((item) => item.status === 'needs_owner_review' || item.status === 'drafted').length
  const updateStatus = async (id: string, status: DispatchStatus) => {
    try {
      await api<DispatchItem>('/api/dispatch/update', { method: 'POST', body: JSON.stringify({ id, status }) })
      await refresh()
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dispatch update failed')
    }
  }
  const seedDispatch = async () => {
    setSeeding(true)
    try {
      await api<DispatchListResponse>('/api/dispatch/seed', { method: 'POST', body: '{}' })
      await refresh()
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dispatch seed failed')
    } finally {
      setSeeding(false)
    }
  }
  return <section className="page-grid">
    <Card title="Platform funnel" eyebrow="Quantity-first strategy" className="full-span"><ol className="timeline"><li><time>1</time><span><strong>TikTok first</strong><small>Post lots of variants and measure retention/comments.</small></span></li><li><time>2</time><span><strong>Winners to YouTube</strong><small>Promote proven short-form concepts into Shorts or longer videos.</small></span></li><li><time>3</time><span><strong>Proven YouTube winners to X</strong><small>Turn validated ideas into frequent reports/posts in Masala's tone.</small></span></li></ol></Card>
    <div className="stat-grid full-span"><MetricCard label="Dispatch queue" value={String(queue.length)} detail="Persisted local items" tone="blue" /><MetricCard label="Approved/manual" value={String(approvedCount)} detail="Owner-approved or posted manually" tone="green" /><MetricCard label="Blocked" value={String(blockedCount)} detail="Missing render, bundle, or proof" tone={blockedCount ? 'amber' : 'green'} /><MetricCard label="Needs review" value={String(needsReviewCount)} detail="Manual owner gate" tone={needsReviewCount ? 'amber' : 'green'} /></div>
    <Card title="Blocked rework queue" eyebrow="What to fix before upload" className="full-span">
      {blockedItems.length ? <div className="blocked-dispatch-list">{blockedItems.slice(0, 6).map((item) => {
        const clip = clips.find((candidate) => candidate.id === item.clipId)
        const proofFrames = item.proofFrames?.length ? item.proofFrames : clip ? expectedProofFrames(clip) : []
        return <article className="blocked-dispatch-card" key={item.id}>
          <div><strong>{item.title}</strong><span>{item.platform?.toUpperCase() || clip?.platform?.toUpperCase() || 'TIKTOK'} • blocked {new Date(item.updatedAt).toLocaleString()}</span></div>
          <div className="blocked-reasons"><b>Why blocked</b>{(item.blockers?.length ? item.blockers : ['Needs local review before manual upload']).map((blocker) => <span key={blocker}>{blocker}</span>)}</div>
          <div className="blocked-reasons"><b>Next local fix</b>{blockerReworkHints(item.blockers).map((hint) => <span key={hint}>{hint}</span>)}</div>
          <div className="dispatch-actions">{item.renderPath && <a href={`/${item.renderPath}`} target="_blank">Open render</a>}{item.exportBundlePath && <a href={`/${item.exportBundlePath}/upload-card.md`} target="_blank">Open upload card</a>}{proofFrames.map((frame, index) => <a href={`/${frame}`} target="_blank" key={frame}>{index ? 'Open mid proof' : 'Open proof frame'}</a>)}<button type="button" onClick={() => updateStatus(item.id, 'needs_owner_review')} disabled={item.id.startsWith('fallback_')}>Needs re-render/review</button></div>
        </article>
      })}</div> : <div className="empty-panel"><strong>No blocked dispatch items.</strong><p>The queue is clear; keep reviewing approved bundles manually before anything leaves the studio.</p></div>}
    </Card>
    <Card title="Dispatch queue" eyebrow="Local-only state — no external posting" className="full-span"><div className="dispatch-toolbar"><div><strong>Manual dispatch audit</strong><span>Refreshes from rendered/exported clips and upload bundles. This never posts externally.</span></div><button className="primary" type="button" onClick={seedDispatch} disabled={seeding}>{seeding ? 'Refreshing…' : 'Refresh local queue'}</button></div><div className="table-list">{queue.slice(0, 12).map((item) => { const clip = clips.find((candidate) => candidate.id === item.clipId); const platform = item.platform || clip?.platform || 'tiktok'; const proofFrames = item.proofFrames?.length ? item.proofFrames : clip ? expectedProofFrames(clip) : []; return <div className="dispatch-row" key={item.id}><div><strong>{item.title}</strong><span>{platform.toUpperCase()} • {dispatchStatusLabel(item.status)} • updated {new Date(item.updatedAt).toLocaleString()}</span><em className={['approved_manual_upload', 'posted_manual'].includes(item.status) ? 'dispatch-gate approved' : 'dispatch-gate'}>{item.lastAuditAction || (clip ? ownerGateLabel(clip) : 'Local dispatch item')}</em></div>{clip && <ul>{platformChecklist(platform, clip).map((check) => <li key={check}>{check}</li>)}</ul>}<div className="dispatch-actions">{item.renderPath && <a href={`/${item.renderPath}`} target="_blank">Open rendered asset</a>}{item.exportBundlePath && <a href={`/${item.exportBundlePath}/upload-card.md`} target="_blank">Open upload card</a>}{item.exportBundlePath && <a href={`/${item.exportBundlePath}/metadata.json`} target="_blank">Open metadata</a>}{proofFrames.map((frame, index) => <a href={`/${frame}`} target="_blank" key={frame}>{index ? 'Open mid proof' : 'Open proof frame'}</a>)}{item.blockers?.map((blocker) => <span key={blocker}>{blocker}</span>)}<label>Local status <select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as DispatchStatus)} disabled={item.id.startsWith('fallback_')}>{dispatchStatusOptions.map((status) => <option key={status} value={status}>{dispatchStatusLabel(status)}</option>)}</select></label></div>{item.exportBundlePath && clip && <div className="dispatch-copy-grid"><p><strong>YouTube Shorts</strong><span>{clip.seo?.youtubeTitle || item.title}</span><small>{clip.seo?.description ? 'Description ready' : 'Description needs manual check'} • {clip.seo?.tags?.length ? `${clip.seo.tags.length} tags` : 'tags missing'}</small></p><p><strong>TikTok</strong><span>{clip.seo?.tiktokDescription || clip.caption}</span><small>{clip.hashtags?.length ? clip.hashtags.join(' ') : 'hashtags missing'}</small></p></div>}</div> })}{!queue.length && <div className="empty-panel"><strong>No dispatch-ready assets yet.</strong><p>Review a clip, render it, then build an upload bundle in Clip Factory. This page stays draft/manual-upload only.</p></div>}</div></Card>
    <Card title="X/Twitter report drafts from clips" eyebrow="Manual approval only" className="full-span"><div className="table-list">{clips.slice(0, 8).map((clip) => <div className="table-row" key={clip.id}><strong>{clip.title}</strong><span>Draft only • manual review</span><p>Report angle: {clip.hook} What changed, what performed, and what I learned building in public. {clip.hashtags.join(' ')}</p></div>)}{!clips.length && <p>Generate clips first. Everything here is draft-only.</p>}</div></Card>
  </section>
}
function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <article className={`metric-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article> }
function Card({ title, eyebrow, children, className = '' }: { title: string; eyebrow: string; children: React.ReactNode; className?: string }) { return <article className={`card ${className}`}><p className="eyebrow">{eyebrow}</p><h3>{title}</h3>{children}</article> }

export default App
