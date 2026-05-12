import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type PageId = 'dashboard' | 'media-pipeline' | 'clip-factory' | 'viral-research' | 'viral-hunter' | 'studio-feedback' | 'social-dashboard' | 'live-chat' | 'rex-jobs' | 'settings'
type JobStatus = 'running' | 'queued' | 'done' | 'needs-review' | 'failed'
type Settings = { channelUrl: string; streamSafeMode: boolean; clipStrategy?: string; thumbnailStyle?: string; productAngle?: string; localModel?: string; guardrails: string[] }
type Video = { id: string; title: string; url: string; published: string; author: string; kind?: 'stream' | 'short' | 'video'; duration?: number | null }
type Scan = { id: string; channelUrl: string; channelId?: string; status: JobStatus; startedAt: string; finishedAt: string; count: number; error?: string | null }
type Transcript = { id: string; title: string; sourceUrl: string; text: string; createdAt: string }
type Clip = { id: string; transcriptId: string; score: number; platform?: 'tiktok' | 'youtube' | 'x'; status?: 'idea' | 'draft' | 'reviewed' | 'exported'; exportedAt?: string | null; start: string; end: string; title: string; hook: string; caption: string; hashtags: string[]; reason: string; createdAt: string; renderPath?: string; renderUrl?: string; renderPreset?: string; renderStatus?: JobStatus; renderError?: string; exportBundlePath?: string }
type Job = { id: string; type: string; title: string; status: JobStatus; detail: string; createdAt: string }
type MediaJob = { id: string; step: string; status: JobStatus; detail: string; command: string; createdAt: string }
type ViralFind = { id: string; source: string; title: string; url: string; score: number; angle: string; createdAt: string }
type PracticeChat = { id: string; name: string; text: string; label: string; createdAt: string }
type MediaValidation = { status: 'complete' | 'partial' | 'unknown'; detail: string; durationSeconds?: number; lastPacketSeconds?: number }
type MediaFile = { name: string; kind: 'source' | 'transcript' | 'render' | 'export'; path: string; url: string; size: number; updatedAt: string; validation?: MediaValidation }
type AppState = { settings: Settings; scans: Scan[]; videos: Video[]; transcripts: Transcript[]; clips: Clip[]; mediaJobs: MediaJob[]; viralFinds: ViralFind[]; chatMessages: PracticeChat[]; jobs: Job[]; mediaFiles: MediaFile[] }

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', kicker: 'Today' },
  { id: 'media-pipeline', label: 'Media Pipeline', icon: '🧰', kicker: 'yt-dlp → Whisper → ffmpeg' },
  { id: 'clip-factory', label: 'Clip Factory', icon: '🎬', kicker: 'Transcript ops' },
  { id: 'viral-research', label: 'YouTube Scanner', icon: '📡', kicker: 'Public RSS' },
  { id: 'viral-hunter', label: 'Viral Hunter', icon: '🕵️', kicker: 'Lead finder' },
  { id: 'studio-feedback', label: 'Studio Feedback', icon: '🎙️', kicker: 'Stream quality' },
  { id: 'social-dashboard', label: 'Social Dashboard', icon: '📣', kicker: 'Drafts only' },
  { id: 'live-chat', label: 'Live Chat Co-Pilot', icon: '💬', kicker: 'Practice chat' },
  { id: 'rex-jobs', label: 'Rex Activity / Jobs', icon: '🦖', kicker: 'Real history' },
  { id: 'settings', label: 'Settings', icon: '⚙️', kicker: 'Local-first' },
] as const

const emptyState: AppState = { settings: { channelUrl: 'https://www.youtube.com/@ModernResponsibility', streamSafeMode: true, guardrails: [] }, scans: [], videos: [], transcripts: [], clips: [], mediaJobs: [], viralFinds: [], chatMessages: [], jobs: [], mediaFiles: [] }
const formatDate = (value: string) => Number.isNaN(new Date(value).getTime()) ? 'date unavailable' : new Date(value).toLocaleDateString()
const formatBytes = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
const validationLabel = (validation?: MediaValidation) => validation ? ({ complete: '✅ complete', partial: '⚠️ partial/corrupt', unknown: '❔ validation unknown' }[validation.status]) : ''
const renderPresets = [
  { id: 'punchy-captions', label: 'Punchy captions short', helper: '1–2 word ASS subtitles, 9:16' },
  { id: 'standard-captions', label: 'Standard captions short', helper: 'SRT subtitles, 9:16' },
  { id: 'no-captions', label: 'No captions short', helper: 'Clean 9:16 render for manual editing' },
  { id: 'long-standard', label: 'Long-form with captions', helper: '1920px wide clip with SRT subtitles' },
] as const
type RenderPresetId = typeof renderPresets[number]['id']

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { headers: { 'content-type': 'application/json' }, ...options })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
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

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Vibe Zone navigation">
        <div className="brand-card"><div className="brand-mark">VZ</div><div><p className="eyebrow">Masala's local control room</p><h1>Vibe Zone</h1></div></div>
        <nav>{navItems.map((item) => <button className={item.id === activePage ? 'nav-item active' : 'nav-item'} key={item.id} onClick={() => setActivePage(item.id)} type="button"><span className="nav-icon">{item.icon}</span><span><strong>{item.label}</strong><small>{item.kicker}</small></span></button>)}</nav>
        <div className="stream-safe"><strong>Stream-safe mode</strong><span>No secrets, no logins, no external posting. API binds to 127.0.0.1.</span></div>
      </aside>
      <main className="main-panel">
        <header className="topbar"><div><p className="eyebrow">{current.kicker}</p><h2>{current.icon} {current.label}</h2></div><div className="status-pill"><span /> {loading ? 'Loading local data' : 'Local JSON connected'}</div></header>
        {error && <div className="notice danger">API error: {error}. Run <code>npm run dev:full</code> or <code>npm run api</code>.</div>}
        <Page page={activePage} state={state} refresh={refresh} setError={setError} />
      </main>
    </div>
  )
}

function Page({ page, state, refresh, setError }: { page: PageId; state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const props = { state, refresh, setError }
  switch (page) {
    case 'media-pipeline': return <MediaPipeline {...props} />
    case 'clip-factory': return <ClipFactory {...props} />
    case 'viral-research': return <YouTubeScanner {...props} />
    case 'viral-hunter': return <ViralHunter {...props} />
    case 'studio-feedback': return <StudioFeedback />
    case 'social-dashboard': return <SocialDashboard clips={state.clips} />
    case 'live-chat': return <LiveChat {...props} />
    case 'rex-jobs': return <RexJobs jobs={state.jobs} scans={state.scans} mediaJobs={state.mediaJobs} />
    case 'settings': return <SettingsPage {...props} />
    default: return <Dashboard state={state} setPage={() => undefined} />
  }
}

function Dashboard({ state }: { state: AppState; setPage: (page: PageId) => void }) {
  const lastScan = state.scans[0]
  const stats = [
    { label: 'Recent videos', value: String(state.videos.length), detail: lastScan ? `Last scan ${lastScan.status}` : 'Run YouTube scanner', tone: 'blue' },
    { label: 'Transcripts', value: String(state.transcripts.length), detail: 'Imported locally', tone: 'purple' },
    { label: 'Clip candidates', value: String(state.clips.length), detail: 'Heuristic scored', tone: 'green' },
    { label: 'Media jobs', value: String(state.mediaJobs.length), detail: 'Extraction/render queue', tone: 'purple' },
    { label: 'Viral leads', value: String(state.viralFinds.length), detail: 'Hunter backlog', tone: 'blue' },
  ]
  return <section className="page-grid"><div className="hero-card full-span"><div><p className="eyebrow">Creator operations control tower</p><h3>Track the stream-to-clips pipeline from one clean command centre.</h3><p>Inspired by modern logistics dashboards: scanner, uploads, transcripts, clip candidates, render queue, viral leads, and Rex activity are laid out like live operational lanes.</p></div></div><div className="stat-grid full-span">{stats.map((stat) => <MetricCard key={stat.label} {...stat} />)}</div><Card title="Operations route" eyebrow="From stream to shipment"><ol className="timeline"><li><time>1</time><span><strong>Settings</strong><small>Confirm channel URL</small></span></li><li><time>2</time><span><strong>YouTube Scanner</strong><small>Run public RSS scan</small></span></li><li><time>3</time><span><strong>Media Pipeline</strong><small>Plan yt-dlp, Whisper, ffmpeg/subtitle jobs</small></span></li><li><time>4</time><span><strong>Clip Factory</strong><small>Paste transcript and generate clips</small></span></li><li><time>5</time><span><strong>Rex Jobs</strong><small>Show persisted activity</small></span></li></ol></Card><Card title="Dispatch model" eyebrow="Vibe Zone / HQ"><p>Built for Masala first, but shaped like a creator logistics product: ingest streams, process media, dispatch clips, and review every action before anything leaves the yard.</p></Card></section>
}

function YouTubeScanner({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [busy, setBusy] = useState(false)
  const scan = async () => { setBusy(true); setError(''); try { await api<Scan>('/api/youtube/scan', { method: 'POST', body: '{}' }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  const last = state.scans[0]
  return <section className="page-grid"><Card title="Public YouTube channel scan" eyebrow="No login / no API key" className="full-span"><p>Channel: <a href={state.settings.channelUrl}>{state.settings.channelUrl}</a></p><button className="primary" type="button" onClick={scan} disabled={busy}>{busy ? 'Scanning…' : 'Scan recent videos'}</button>{last && <div className={last.status === 'failed' ? 'notice danger' : 'notice'}>Last scan: {last.status} • {last.count} videos • {new Date(last.finishedAt).toLocaleString()}{last.error ? ` • ${last.error}` : ''}</div>}</Card><Card title="Recent videos / streams" eyebrow={`${state.videos.length} stored`} className="full-span"><div className="table-list">{state.videos.map((video) => <div className="table-row" key={video.id}><strong>{video.title}</strong><span>{formatDate(video.published)} • {video.kind || 'video'} • {video.author}</span><a href={video.url}>{video.url}</a></div>)}{!state.videos.length && <p>No scan results yet.</p>}</div></Card></section>
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
  return <section className="page-grid"><Card title="Import/paste transcript" eyebrow="Timestamp-aware" className="full-span"><div className="form-grid"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Transcript title" /><input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Optional source video URL" /><textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Paste transcript lines with optional timestamps like 00:42 text…" /></div><button className="primary" type="button" onClick={importAndScore} disabled={busy || !text.trim()}>{busy ? 'Working…' : 'Import and generate clip candidates'}</button><small>Quantity-first scoring uses overlapping transcript windows to create more candidates. Optional download/transcribe is intentionally not automatic yet; this MVP avoids surprise bandwidth/cost.</small></Card><Card title="Render preset" eyebrow="Clip Factory controls"><div className="form-grid"><select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value as RenderPresetId)}>{renderPresets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><p>{preset.helper}</p><small>The selected preset applies to each “Render” action below. Facecam/50-50 layout is still queued as a separate render mode.</small></Card><Card title="Quantity-first candidate clips" eyebrow="Review, render selected clips, then dispatch manually" className="full-span"><div className="clip-list">{state.clips.map((clip) => <article className="clip-card" key={clip.id}><div className="clip-score">{clip.score}</div><div><h3>{clip.title}</h3><p>{clip.start}–{clip.end} • {(clip.platform || 'tiktok').toUpperCase()} • {clip.status || 'idea'} • {clip.renderStatus ? `render ${clip.renderStatus}` : 'not rendered yet'}</p>{clip.renderUrl && <video className="clip-preview" src={clip.renderUrl} controls preload="metadata" />}<blockquote>{clip.hook}</blockquote><p><strong>Title:</strong> {clip.title}</p><p><strong>Caption:</strong> {clip.caption}</p><div className="tag-row">{clip.hashtags.map((tag) => <span key={tag}>{tag}</span>)}<span>{clip.renderPreset || 'No render preset yet'}</span><span>{clip.renderPreset === 'long-standard' ? 'long-form' : '9:16 short'}</span>{clip.exportBundlePath && <span>export bundle ready</span>}</div><div className="review-row"><select value={clip.status || 'idea'} onChange={(e) => updateClip(clip, { status: e.target.value as Clip['status'] })}><option value="idea">idea</option><option value="draft">draft</option><option value="reviewed">reviewed</option><option value="exported">exported</option></select><select value={clip.platform || 'tiktok'} onChange={(e) => updateClip(clip, { platform: e.target.value as Clip['platform'] })}><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="x">X/Twitter</option></select><button className="primary" type="button" onClick={() => renderClip(clip)} disabled={busy}>Render: {preset.label}</button><button type="button" onClick={() => exportBundle(clip)} disabled={busy}>Build upload bundle</button>{clip.exportedAt && <small>Exported {new Date(clip.exportedAt).toLocaleString()}</small>}</div>{clip.renderPath && <p><strong>Render:</strong> <a href={`/${clip.renderPath}`} target="_blank">{clip.renderPath}</a></p>}{clip.exportBundlePath && <p><strong>Upload card:</strong> <a href={`/${clip.exportBundlePath}/upload-card.md`} target="_blank">{clip.exportBundlePath}/upload-card.md</a></p>}{clip.renderError && <div className="notice danger">{clip.renderError}</div>}<small>{clip.reason}</small></div></article>)}{!state.clips.length && <p>No clips yet. Import a transcript above.</p>}</div></Card></section>
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
  const [videoUrl, setVideoUrl] = useState('')
  const [inputPath, setInputPath] = useState('')
  const [busy, setBusy] = useState('')
  const [uploadNote, setUploadNote] = useState('')
  const targetUrl = videoUrl || latestStream?.url || ''
  const targetInputPath = inputPath || plannedMediaPath
  const run = async (path: string, body: object = {}) => { setBusy(path); setError(''); try { await api<unknown>(path, { method: 'POST', body: JSON.stringify(body) }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy('') } }
  const uploadFiles = async (files: FileList | File[]) => {
    const items = Array.from(files)
    if (!items.length) return
    setBusy('/api/media/upload'); setError(''); setUploadNote(`Uploading ${items.length} file(s)… 0%`)
    try {
      for (const file of items) {
        const data = await uploadFileWithProgress(file, (percent) => setUploadNote(`Uploading ${file.name}… ${percent}%`))
        setUploadNote(`Uploaded ${data.path}`)
        if (/\.(mp4|mov|mkv|webm|m4v)$/i.test(file.name)) setInputPath(data.path)
      }
      await refresh()
    } catch (err) { setError((err as Error).message) } finally { setBusy('') }
  }
  const renderedFiles = state.mediaFiles.filter((file) => file.kind === 'render')
  const transcriptFiles = state.mediaFiles.filter((file) => file.kind === 'transcript')
  const sourceFiles = state.mediaFiles.filter((file) => file.kind === 'source')
  return <section className="page-grid"><Card title="Actual media pipeline scaffold" eyebrow="YouTube → transcript → clips/subtitles" className="full-span"><div className="notice">Current target is the most recent public stream tab item first: <strong>{latestStream ? latestStream.title : 'scan YouTube first'}</strong>. Planned local paths: <code>{plannedMediaPath}</code> and <code>{plannedSubtitlePath}</code>. Extraction is preflighted before queueing; if YouTube blocks the VPS, Vibe Zone records the blocker and keeps the local companion fallback visible instead of asking for cookies.</div><label className="upload-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files) }}><input type="file" multiple accept="video/*,audio/*,.mp4,.mov,.mkv,.webm,.m4v,.mp3,.wav,.m4a,.txt,.srt,.vtt" onChange={(e) => e.currentTarget.files && uploadFiles(e.currentTarget.files)} /><strong>Drop downloaded stream files here</strong><span>Uploads save locally to <code>media/downloads</code> for video/audio and <code>media/transcripts</code> for .txt/.srt/.vtt. Click here if drag/drop is awkward through the tunnel.</span>{uploadNote && <small>{uploadNote}</small>}</label><div className="form-grid"><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={latestStream?.url || 'YouTube video/live replay URL'} /><input value={inputPath} onChange={(e) => setInputPath(e.target.value)} placeholder={plannedMediaPath} /></div><div className="button-row"><button className="primary" onClick={() => run('/api/media/probe')} disabled={!!busy}>Probe tools</button><button className="primary" onClick={() => run('/api/media/extract', { videoUrl: targetUrl })} disabled={!!busy || !targetUrl}>Preflight YouTube extraction</button><button className="primary" onClick={() => run('/api/media/ingest-local', { videoId: plannedVideoId, inputPath: targetInputPath, transcriptPath: `media/transcripts/${plannedVideoId}.txt`, subtitlePath: plannedSubtitlePath, sourceUrl: targetUrl })} disabled={!!busy}>Import local transcript + score</button><button className="primary" onClick={() => run('/api/media/transcribe', { inputPath: targetInputPath })} disabled={!!busy}>Plan Whisper transcript</button><button className="primary" onClick={() => run('/api/media/render', { inputPath: targetInputPath, start: '0:00', end: '0:45', mode: 'short', subtitlePath: plannedSubtitlePath })} disabled={!!busy}>Queue short + subtitles</button><button className="primary" onClick={() => run('/api/media/render', { inputPath: targetInputPath, start: '0:00', end: '8:00', mode: 'long', subtitlePath: plannedSubtitlePath })} disabled={!!busy}>Queue long-form + subtitles</button></div><small>Whisper/ffmpeg jobs now stay “needs-review” until the referenced local media/SRT files exist. The local ingest button turns a companion-generated <code>.txt</code> into clip candidates for the newest stream only.</small></Card><Card title="Rendered review queue" eyebrow={`${renderedFiles.length} outputs`} className="full-span"><div className="render-grid">{renderedFiles.map((file) => <article className="render-card" key={file.path}><video src={file.url} controls preload="metadata" /><div><h3>{file.name}</h3><p>{formatBytes(file.size)} • {new Date(file.updatedAt).toLocaleString()}</p><div className="button-row"><a className="file-link" href={file.url} target="_blank">Open</a><a className="file-link" href={file.url} download>Download</a></div></div></article>)}{!renderedFiles.length && <p>No rendered clips yet.</p>}</div></Card><Card title="Media artifacts" eyebrow="Source + transcript files" className="full-span"><div className="table-list">{[...sourceFiles, ...transcriptFiles].map((file) => <div className="table-row media-artifact-row" key={file.path}><strong>{file.kind}</strong><span>{formatBytes(file.size)}</span><a href={file.url} target="_blank">{file.path}</a>{file.validation && <div className={`validation-badge ${file.validation.status}`} title={file.validation.detail}>{validationLabel(file.validation)}</div>}<small>{file.validation?.detail}</small></div>)}{!sourceFiles.length && !transcriptFiles.length && <p>No uploaded/transcript artifacts yet.</p>}</div></Card><Card title="Media job log" eyebrow={`${state.mediaJobs.length} jobs`} className="full-span"><div className="job-list">{state.mediaJobs.map((job) => <article className="job-row" key={job.id}><span className={`dot ${job.status}`} /><div><h3>{job.step}</h3><p>{job.detail}</p>{job.command && <code>{job.command}</code>}<small>{new Date(job.createdAt).toLocaleString()}</small></div><small>{job.status}</small></article>)}{!state.mediaJobs.length && <p>No media jobs yet. Probe tools first.</p>}</div></Card></section>
}

function ViralHunter({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [busy, setBusy] = useState(false)
  const hunt = async () => { setBusy(true); setError(''); try { await api<ViralFind[]>('/api/viral/hunt', { method: 'POST', body: '{}' }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  return <section className="page-grid"><Card title="Viral Hunter MVP" eyebrow="RSS + clips" className="full-span"><p>Finds hookable ideas from public YouTube titles and generated clip candidates. This is the seed of the Opus-style “find the best moments” workflow.</p><button className="primary" type="button" onClick={hunt} disabled={busy}>{busy ? 'Hunting…' : 'Generate viral leads'}</button></Card><Card title="Lead backlog" eyebrow="Review candidates" className="full-span"><div className="clip-list">{state.viralFinds.map((find) => <article className="clip-card" key={find.id}><div className="clip-score">{find.score}</div><div><h3>{find.title}</h3><p>{find.source}{find.url ? <> • <a href={find.url}>{find.url}</a></> : null}</p><blockquote>{find.angle}</blockquote><small>{new Date(find.createdAt).toLocaleString()}</small></div></article>)}{!state.viralFinds.length && <p>No leads yet. Run a YouTube scan or generate clips, then hunt.</p>}</div></Card></section>
}

function LiveChat({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [topic, setTopic] = useState('building Vibe Zone local-first')
  const [context, setContext] = useState('We are turning a visual scaffold into real local workflows.')
  const generate = async () => { setError(''); try { await api<PracticeChat[]>('/api/chat/generate', { method: 'POST', body: JSON.stringify({ topic, context }) }); await refresh() } catch (err) { setError((err as Error).message) } }
  return <section className="page-grid"><Card title="Transparent AI practice chat simulator" eyebrow="Natural pop-up style" className="full-span"><div className="notice">These simulate chat messages popping up naturally, but stay clearly labelled as AI practice chat — never fake viewers. If Ollama is running locally, qwen2.5:1.5b-instruct can draft rough messages; templates remain as fallback.</div><div className="form-grid"><input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Current topic" /><textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4} placeholder="Stream context" /></div><button className="primary" type="button" onClick={generate}>Generate AI practice questions</button></Card><Card title="Practice questions" eyebrow="Generated locally" className="full-span"><div className="job-list">{state.chatMessages.map((message) => <article className="job-row" key={message.id}><span className="dot done" /><div><h3>{message.name}</h3><p>{message.text}</p><small>{message.label}</small></div></article>)}{!state.chatMessages.length && <p>No practice questions yet.</p>}</div></Card></section>
}

function RexJobs({ jobs, scans, mediaJobs }: { jobs: Job[]; scans: Scan[]; mediaJobs: MediaJob[] }) {
  return <section className="page-grid"><Card title="Actual persisted job history" eyebrow="Local JSON" className="full-span"><div className="job-list">{jobs.map((job) => <article className="job-row" key={job.id}><span className={`dot ${job.status}`} /><div><h3>{job.title}</h3><p>{job.detail}</p><small>{job.type} • {new Date(job.createdAt).toLocaleString()}</small></div><small>{job.status}</small></article>)}{!jobs.length && <p>No jobs logged yet. Run a scan, import transcript, or generate practice chat.</p>}</div></Card><Card title="Media pipeline queue" eyebrow="30-minute checker view" className="full-span"><div className="job-list">{mediaJobs.map((job) => <article className="job-row" key={job.id}><span className={`dot ${job.status}`} /><div><h3>{job.step}</h3><p>{job.detail}</p>{job.command && <code>{job.command}</code>}<small>{new Date(job.createdAt).toLocaleString()}</small></div><small>{job.status}</small></article>)}</div></Card><Card title="Scan runs" eyebrow="Status"><div className="table-list">{scans.map((scan) => <div className="table-row" key={scan.id}><strong>{scan.status} • {scan.count} videos</strong><span>{new Date(scan.finishedAt).toLocaleString()}</span><p>{scan.error || scan.channelId || scan.channelUrl}</p></div>)}</div></Card></section>
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
  return <section className="page-grid"><Card title="Channel settings" eyebrow="Persisted"><div className="form-grid"><input key={state.settings.channelUrl} ref={channelRef} defaultValue={state.settings.channelUrl} /></div><button className="primary" type="button" onClick={save}>Save channel URL</button></Card><Card title="Growth strategy" eyebrow="Masala preference"><p>{state.settings.clipStrategy || 'Quantity-first: TikTok filters winners, YouTube scales them, X reports proven lessons.'}</p></Card><Card title="Thumbnail direction" eyebrow="Needs approved refs"><p>{state.settings.thumbnailStyle || 'Hyper-realistic Masala face thumbnails once reference images are approved; GothamChess-inspired composition.'}</p></Card><Card title="Product angle" eyebrow="Vibe Zone / HQ"><p>{state.settings.productAngle || 'Monthly product for upcoming streamers.'}</p></Card><Card title="Cheap/local model fallback" eyebrow="Ollama"><p>{state.settings.localModel || 'Ollama can power rough drafts, chat simulation, classification/scoring, and API/rate-limit fallback when available.'}</p></Card><Card title="Stream-safe guardrails" eyebrow="Visible by design"><div className="settings-grid">{state.settings.guardrails.map((item) => <div className="setting-card" key={item}><strong>{item}</strong><span>Enabled now</span></div>)}</div></Card><Card title="Data path" eyebrow="Local"><p><code>data/vibe-zone.json</code> stores settings, scans, transcripts, clips, chat practice, and jobs. It is ignored by git.</p></Card></section>
}

function StudioFeedback() { return <section className="page-grid">{['Audio: add peak warning if music overlaps mic.', 'Pacing: add chapter cards every 20 minutes.', 'Privacy: keep stream-safe warning banner visible.', 'Chat: use transparent practice questions, not fake engagement.'].map((note) => <Card key={note} title={note.split(':')[0]} eyebrow="Checklist"><p>{note}</p></Card>)}</section> }
function SocialDashboard({ clips }: { clips: Clip[] }) { return <section className="page-grid"><Card title="Platform funnel" eyebrow="Quantity-first strategy" className="full-span"><ol className="timeline"><li><time>1</time><span><strong>TikTok first</strong><small>Post lots of variants and measure retention/comments.</small></span></li><li><time>2</time><span><strong>Winners to YouTube</strong><small>Promote proven short-form concepts into Shorts or longer videos.</small></span></li><li><time>3</time><span><strong>Proven YouTube winners to X</strong><small>Turn validated ideas into frequent reports/posts in Masala's tone.</small></span></li></ol></Card><Card title="X/Twitter report drafts from clips" eyebrow="Manual approval only" className="full-span"><div className="table-list">{clips.slice(0, 8).map((clip) => <div className="table-row" key={clip.id}><strong>{clip.title}</strong><span>Draft only • no posting integration</span><p>Report angle: {clip.hook} What changed, what performed, and what I learned building in public. {clip.hashtags.join(' ')}</p></div>)}{!clips.length && <p>Generate clips first. This page never posts externally.</p>}</div></Card></section> }
function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <article className={`metric-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article> }
function Card({ title, eyebrow, children, className = '' }: { title: string; eyebrow: string; children: React.ReactNode; className?: string }) { return <article className={`card ${className}`}><p className="eyebrow">{eyebrow}</p><h3>{title}</h3>{children}</article> }

export default App
