import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RexLiveRoadmap from './RexLiveRoadmap'
import './App.css'

type PageId = 'roadmap' | 'dashboard' | 'media-pipeline' | 'clip-factory' | 'thumbnail-lab' | 'viral-research' | 'viral-hunter' | 'studio-feedback' | 'social-dashboard' | 'twitter-radar' | 'live-chat' | 'settings'
type JobStatus = 'running' | 'queued' | 'done' | 'needs-review' | 'failed'
type PlatformId = 'tiktok' | 'youtube' | 'x' | 'instagram' | 'facebook' | 'threads' | 'linkedin' | 'pinterest' | 'rednote' | 'douyin' | 'kuaishou' | 'bilibili' | 'wechat'
type Settings = { channelUrl: string; streamSafeMode: boolean; clipStrategy?: string; thumbnailStyle?: string; productAngle?: string; localModel?: string; guardrails: string[]; thumbnailConceptFeedback?: Record<string, 'like' | 'dislike'>; thumbnailPreferenceProfile?: { updatedAt?: string; guidance?: string; liked?: unknown[]; disliked?: unknown[] } }
type Video = { id: string; title: string; url: string; published: string; author: string; kind?: 'stream' | 'short' | 'video'; duration?: number | null }
type Scan = { id: string; channelUrl: string; channelId?: string; status: JobStatus; startedAt: string; finishedAt: string; count: number; error?: string | null }
type Transcript = { id: string; title: string; sourceUrl: string; text: string; createdAt: string }
type FacecamTrackingBox = { x?: number; y?: number; w?: number; h?: number; ok?: boolean }
type FacecamTracking = { fallback?: boolean; reason?: string; method?: string; confidence?: number; sampleSeconds?: number[]; samples?: FacecamTrackingBox[]; detections?: FacecamTrackingBox[] }
type Clip = { id: string; transcriptId: string; score: number; platform?: PlatformId; status?: 'idea' | 'draft' | 'reviewed' | 'exported' | 'ready_local_manual_upload' | 'uploaded' | 'archived' | 'needs-review' | 'superseded'; exportedAt?: string | null; uploadedAt?: string | null; start: string; end: string; title: string; hook: string; caption: string; hashtags: string[]; reason: string; createdAt: string; renderPath?: string; renderUrl?: string; renderPreset?: string; renderStatus?: JobStatus; renderError?: string; exportBundlePath?: string; proofFramePath?: string; proofFrames?: string[]; thumbnailProofPath?: string; facecamTracking?: FacecamTracking; seo?: { youtubeTitle?: string; description?: string; tiktokDescription?: string; tags?: string[]; titleVariants?: string[]; pinnedComment?: string; primaryKeyword?: string; fileName?: string } }
type DispatchStatus = 'drafted' | 'needs_owner_review' | 'approved_manual_upload' | 'posted_manual' | 'blocked' | 'style_rework_needed' | 'superseded'
type ManualPostResult = { externalUrl?: string; postedAt?: string; notes?: string; recordedAt?: string }
type PlatformCopyOverride = { title?: string; postText?: string; description?: string; hashtags?: string[]; updatedAt?: string }
type DispatchItem = { id: string; clipId?: string; title: string; platform?: PlatformId; status: DispatchStatus; renderPath?: string; exportBundlePath?: string; proofFrames?: string[]; blockers?: string[]; ownerGateRequired?: boolean; ownerGate?: string; privacyWatchRequired?: boolean; replacedByDispatchId?: string; replacedByRenderPath?: string; replacedByBundlePath?: string; manualResult?: ManualPostResult; copyOverrides?: Partial<Record<PlatformId, PlatformCopyOverride>>; lastAuditAction?: string; createdAt: string; updatedAt: string }
type DispatchFilterId = 'all' | 'manual-ready' | 'owner-gate' | 'style-suspended' | 'needs-rerender' | 'superseded'
type PlatformProfile = { id: PlatformId; label: string; stage: 'ready' | 'draft' | 'planned'; format: string; note: string }
type ScheduleItem = { id: string; label: string; cadence: string; status: 'draft' | 'ready' | 'planned' }
type EngagementTask = { id: string; label: string; mode: 'draft-only' | 'manual-review'; status: 'ready' | 'planned' }
type MonetizationOffer = { id: string; model: 'CPM' | 'CPE' | 'CPS'; label: string; status: 'tracking' | 'planned' }
type PostingConnector = { id: string; label: string; platforms: PlatformId[]; mode: string; status: 'credentials-needed' | 'connected' | 'planned'; requiredSecrets: string[]; note: string }
type SocialConnection = { id: string; label: string; platform: PlatformId | 'meta'; provider: string; status: 'connected' | 'oauth_approved' | 'manual_linked' | 'ready_to_connect' | 'needs_app_config' | 'planned'; scopes: string[]; mode: string; callbackUrl: string; connectedAt?: string; accountLabel?: string; manualUrl?: string; missingConfig?: string[]; note: string }
type PostingValidation = { id: string; title: string; platform: PlatformId; blockers: string[]; warnings: string[]; ok: boolean }
type PostingReadiness = { readyForCredentials: boolean; approvedManualAssets: number; platformsReady: PlatformId[]; connectors: PostingConnector[]; missingCredentialConnectors: PostingConnector[]; validations: PostingValidation[]; nextCredentialStep: string; safetyGate: string }
type DispatchListResponse = { items: DispatchItem[]; summary: { manifestReady?: number; manualReadyManifest?: number; missingManifestReady?: number; missingManifestReadyPaths?: string[]; total: number; drafted: number; needsOwnerReview: number; approvedManualUpload: number; postedManual: number; blocked: number; superseded?: number } }
type Job = { id: string; type: string; title: string; status: JobStatus; detail: string; createdAt: string }
type MediaJob = { id: string; step: string; status: JobStatus; detail: string; command: string; createdAt: string }
type ViralFind = { id: string; source: string; title: string; url: string; score: number; angle: string; createdAt: string }
type PracticeChat = { id: string; name: string; text: string; label: string; createdAt: string }
type TwitterRadarItem = { id: string; topic: string; account: string; handle?: string; tier?: string; watchTier?: string; sourceMode?: string; source?: 'topic_search' | 'watchlist_account' | string; sourceLabel?: string; observedAt?: string | null; latencyMs?: number | null; text: string; url: string; replyDraft: string; score: number; reason: string; status: 'needs_manual_screen' | 'ready_to_reply' | 'saved' | 'skipped'; createdAt: string }
type TwitterWatchAccount = { handle: string; displayName: string; tier: 'A' | 'B' | 'C' | string; topicTags: string[]; sourceMode: 'manual_search' | 'api_pending' | 'rss_pending' | string; lastSeenTweetId?: string | null; lastSeenAt?: string | null; lastManualCheckedAt?: string | null; nextManualCheckAt?: string | null; checkCadenceMinutes?: number; priorityScore?: number; enabled: boolean }
type TwitterRadarSourceAdapter = { id: string; label: string; status: string; latencyClass: string; requiresCredentials: boolean; termsRisk: string; minPollIntervalMs: number; capability: string; note: string }
type TwitterRadarWorkerLane = { id: string; label: string; status: string; focus: string }
type TwitterRadar = { status: string; mode: string; pollingMode?: string; source?: string; lastScanAt?: string | null; topics: string[]; watchAccounts: TwitterWatchAccount[]; sourceAdapters?: TwitterRadarSourceAdapter[]; workerLanes?: TwitterRadarWorkerLane[]; items: TwitterRadarItem[] }
type StudioAiResult = { draft: string; score: number; coach: string; predictedImpressions: number; provider: string; model: string; notes?: string }
type ThumbnailConcept = { id: string; sourceClipId?: string; sourceTranscriptId?: string; sourceTitle?: string; sourceVideoPath?: string; sourceProofPath?: string; status: 'idea' | 'liked' | 'disliked' | 'used'; rating?: 'like' | 'dislike' | null; title: string; thumbnailText: string; visualAngle: string; emotion: string; style: string; prompt: string; imageUrl?: string; learningNotes?: string; createdAt: string; updatedAt?: string }
type MediaValidation = { status: 'complete' | 'partial' | 'unknown'; detail: string; durationSeconds?: number; lastPacketSeconds?: number; validatedAt?: string; cacheStatus?: 'fresh' | 'reused' | 'not-applicable' }
type MediaFile = { name: string; kind: 'source' | 'transcript' | 'render' | 'export' | 'concept'; path: string; url: string; size: number; updatedAt: string; validation?: MediaValidation }
type ImportChecklistItem = { id: string; label: string; status: 'done' | 'next' | 'blocked'; detail: string }
type ImportReadiness = { latestStream?: Video | null; expected: { source: string; transcript: string; captions: string[] }; found: { source?: MediaFile | null; transcript?: MediaFile | null; caption?: MediaFile | null }; checklist: ImportChecklistItem[]; activeMediaJobs: number; nextAction: string; guardrail: string }
type AppState = { settings: Settings; scans: Scan[]; videos: Video[]; transcripts: Transcript[]; clips: Clip[]; dispatchItems: DispatchItem[]; platformProfiles?: PlatformProfile[]; scheduleItems?: ScheduleItem[]; engagementTasks?: EngagementTask[]; monetizationOffers?: MonetizationOffer[]; importReadiness?: ImportReadiness; postingReadiness?: PostingReadiness; socialConnections?: SocialConnection[]; twitterRadar?: TwitterRadar; mediaJobs: MediaJob[]; viralFinds: ViralFind[]; chatMessages: PracticeChat[]; thumbnailConcepts: ThumbnailConcept[]; jobs: Job[]; mediaFiles: MediaFile[] }
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

type LiveChatController = {
  topic: string
  setTopic: (value: string) => void
  context: string
  setManualContext: (value: string) => void
  liveContext: string
  listening: boolean
  desiredListening: boolean
  autoAsk: boolean
  setAutoAsk: (value: boolean) => void
  secondsBetween: number
  setSecondsBetween: (value: number) => void
  promptMode: 'chat' | 'wisdom'
  setPromptMode: (value: 'chat' | 'wisdom') => void
  startListening: () => void
  stopListening: () => void
  generate: (overrideContext?: string) => Promise<void>
  clearContext: () => void
  lastGeneratedAt: number
  micStatus: string
}
const liveChatStorageKey = 'vibe-zone-live-chat-control-v2'
const readLiveChatPrefs = () => {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(liveChatStorageKey) || '{}') as Partial<Pick<LiveChatController, 'topic' | 'context' | 'liveContext' | 'autoAsk' | 'secondsBetween' | 'promptMode' | 'desiredListening'>> } catch { return {} }
}
const writeLiveChatPrefs = (patch: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  const current = readLiveChatPrefs()
  window.localStorage.setItem(liveChatStorageKey, JSON.stringify({ ...current, ...patch }))
}
const navItems = [
  { id: 'roadmap', label: 'Rex Command Center', icon: '🦖', kicker: 'Roadmap + activity' },
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', kicker: 'Today' },
  { id: 'media-pipeline', label: 'Media Pipeline', icon: '🧪', kicker: 'Concept lab + experiments' },
  { id: 'clip-factory', label: 'Clip Factory', icon: '🎬', kicker: 'Approved ready-to-ship' },
  { id: 'thumbnail-lab', label: 'Thumbnail Lab', icon: '🖼️', kicker: 'Concept backlog' },
  { id: 'viral-research', label: 'YouTube Scanner', icon: '📡', kicker: 'Public RSS' },
  { id: 'viral-hunter', label: 'Viral Hunter', icon: '🕵️', kicker: 'Lead finder' },
  { id: 'studio-feedback', label: 'Studio Feedback', icon: '🎙️', kicker: 'Stream quality' },
  { id: 'social-dashboard', label: 'Social Hub', icon: '📣', kicker: 'Dispatch + connections' },
  { id: 'twitter-radar', label: 'Twitter Radar', icon: '🛰️', kicker: 'Reply targets' },
  { id: 'live-chat', label: 'Live Chat Co-Pilot', icon: '💬', kicker: 'Practice chat' },
  { id: 'settings', label: 'Settings', icon: '⚙️', kicker: 'Local-first' },
] as const

const emptyState: AppState = { settings: { channelUrl: 'https://www.youtube.com/@ModernResponsibility', streamSafeMode: true, guardrails: [] }, scans: [], videos: [], transcripts: [], clips: [], dispatchItems: [], platformProfiles: [], scheduleItems: [], engagementTasks: [], monetizationOffers: [], twitterRadar: { status: 'draft-only', mode: 'topic-mvp', topics: [], watchAccounts: [], items: [] }, mediaJobs: [], viralFinds: [], chatMessages: [], thumbnailConcepts: [], jobs: [], mediaFiles: [] }
const formatDate = (value: string) => Number.isNaN(new Date(value).getTime()) ? 'date unavailable' : new Date(value).toLocaleDateString()
const formatBytes = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
const approvedHouseRenderNames = ['stream-2-build-clip-machine-restored-layout-v2-20260513T2012Z.mp4', 'stream-2-ai-agents-real-work-house-style-v3-20260513T1942Z.mp4', 'stream-2-project-progress-offline-house-v3-20260513T2234Z.mp4', 'day3-platform-creates-content-house-v3-20260513T2104Z.mp4', 'day3-honest-ai-chat-house-v3-20260513T2147Z.mp4', 'day3-agent-loop-keeps-building-house-v3-20260513T2147Z.mp4', 'day3-no-sleep-shipping-house-v3-20260513T2317Z.mp4', 'stream-2-thumbnail-looks-mid-house-v3-20260514T0004Z.mp4', 'stream-2-build-while-i-sleep-house-v3-20260514T0047Z.mp4', 'stream-2-secure-vps-house-v3-20260514T0134Z.mp4', 'stream-2-rename-channel-house-v3-20260514T0217Z.mp4', 'stream-2-big-day-sprint-house-v3-20260514T0347Z.mp4', 'stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z.mp4', 'stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z.mp4', 'stream-2-post-while-i-sleep-house-v3-20260514T1045Z.mp4', 'thumbnail-looks-mid-house-v3-20260514T1125Z.mp4', 'stream-2-ai-still-working-house-v3-20260514T1208Z.mp4', 'template-trial-no-leaks-house-v3-20260514T1338Z.mp4', 'stream-2-phone-controls-build-house-v3-20260514T1510Z.mp4', 'template-trial-no-leaks-20260514T0800Z.mp4', 'thumbnail-looks-mid-template-20260514T0852Z.mp4', 'socials-to-vps-template-20260514T0910Z.mp4', 'stream-2-project-moves-offstream-house-v4d-20260515T0645Z.mp4', 'stream-2-clips-first-vps-next-house-v4b-20260515T0650Z.mp4']
const currentProductionPreset = 'confirmed-template-01-gotham-seed-raw-source-audio-wrapped-title'
const isCurrentProductionClip = (clip: Clip) => Boolean(clip.renderPath && clip.renderPreset?.startsWith(currentProductionPreset))
const isApprovedHouseRender = (nameOrPath = '') => approvedHouseRenderNames.some((name) => nameOrPath.endsWith(name)) || /gotham-seed|confirmed-template-01|house-v3|permanent-template|fixed-template|template-trial|thumbnail-looks-mid-template|socials-to-vps-template|restored-layout-v2|clean-no-story-overlays|upload-candidate/i.test(nameOrPath)
const isVisibleCurrentClip = (clip: Clip) => Boolean(clip.renderPath && !['uploaded', 'archived', 'superseded'].includes(String(clip.status || '')) && String(clip.renderStatus || '') !== 'superseded' && (isCurrentProductionClip(clip) || isApprovedHouseRender(clip.renderPath)) && !rejectedRenderPattern.test(clip.renderPath))
const rejectedRenderPattern = /screen-card|facecam-smart|facecam-tracked|smart-pip|lowerfill|centered-logo-fix|title-top-logo-below|logo-below-video|one-word-captions/i
const validationLabel = (validation?: MediaValidation) => validation ? ({ complete: '✅ complete', partial: '⚠️ partial/corrupt', unknown: '❔ validation unknown' }[validation.status]) : ''
const mediaUrl = (url = '', stamp?: string | number) => `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(stamp || Date.now()))}`
const localAssetUrl = (path = '') => path.startsWith('/') ? path : `/${path}`
const thumbnailTranscriptUrl = (videoPath = '', download = false) => `/api/thumbnails/transcript?videoPath=${encodeURIComponent(videoPath)}${download ? '&download=1' : ''}`
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
  { id: 'house-style', label: 'Permanent short template', helper: 'Default now: blurred playing-clip background, clean white header/captions, centred source-screen context, and visible VIBE ZONE/OpenClaw branding. Square face boxes/blue cards are optional variants only, never the default.' },
  { id: 'long-standard', label: 'Long-form with fixed captions', helper: 'Clean long-form render with one stable Netflix-style caption lane and no story/lower-third overlays.' },
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
  if (!response.ok) throw new Error(data.error || data.message || 'Request failed')
  return data
}

function usePersistentLiveChat(refresh: () => Promise<void>, setError: (value: string) => void): LiveChatController {
  const prefs = useMemo(() => readLiveChatPrefs(), [])
  const [topic, setTopicState] = useState(prefs.topic || 'building Vibe Zone local-first')
  const [context, setContext] = useState(prefs.context || prefs.liveContext || 'We are turning a visual scaffold into real local workflows.')
  const [liveContext, setLiveContext] = useState(prefs.liveContext || '')
  const [listening, setListening] = useState(false)
  const [desiredListening, setDesiredListening] = useState(Boolean(prefs.desiredListening))
  const [autoAsk, setAutoAskState] = useState(prefs.autoAsk ?? true)
  const [secondsBetween, setSecondsBetweenState] = useState(Number(prefs.secondsBetween || 30))
  const [promptMode, setPromptModeState] = useState<'chat' | 'wisdom'>(prefs.promptMode === 'chat' ? 'chat' : 'wisdom')
  const [lastGeneratedAt, setLastGeneratedAt] = useState(0)
  const [micStatus, setMicStatus] = useState('Ready')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const liveContextRef = useRef(prefs.liveContext || '')
  const desiredListeningRef = useRef(Boolean(prefs.desiredListening))
  const lastAutoAskRef = useRef(0)

  const setTopic = useCallback((value: string) => { setTopicState(value); writeLiveChatPrefs({ topic: value }) }, [])
  const setManualContext = useCallback((value: string) => {
    const clean = value.slice(-1600)
    setContext(clean); setLiveContext(clean); liveContextRef.current = clean; writeLiveChatPrefs({ context: clean, liveContext: clean })
  }, [])
  const setAutoAsk = useCallback((value: boolean) => { setAutoAskState(value); writeLiveChatPrefs({ autoAsk: value }) }, [])
  const setSecondsBetween = useCallback((value: number) => { setSecondsBetweenState(value); writeLiveChatPrefs({ secondsBetween: value }) }, [])
  const setPromptMode = useCallback((value: 'chat' | 'wisdom') => { setPromptModeState(value); writeLiveChatPrefs({ promptMode: value }) }, [])
  const appendLiveContext = useCallback((text: string) => {
    const next = `${liveContextRef.current} ${text}`.trim().split(/\s+/).slice(-240).join(' ')
    liveContextRef.current = next
    setLiveContext(next)
    setContext(next)
    writeLiveChatPrefs({ context: next, liveContext: next })
  }, [])
  const generate = useCallback(async (overrideContext = context) => {
    setError('')
    try {
      await api<PracticeChat[]>('/api/chat/generate', { method: 'POST', body: JSON.stringify({ topic, context: overrideContext, mode: promptMode }) })
      await refresh()
      const now = Date.now()
      lastAutoAskRef.current = now
      setLastGeneratedAt(now)
    } catch (err) { setError((err as Error).message) }
  }, [context, promptMode, refresh, setError, topic])
  const startListening = useCallback(() => {
    desiredListeningRef.current = true
    setDesiredListening(true)
    writeLiveChatPrefs({ desiredListening: true })
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognition) { setMicStatus('Mic needs Chrome/Edge Web Speech; manual context still works.'); setError('Mic co-pilot needs Chrome or Edge Web Speech API support. Use manual context input as fallback.'); return }
    if (recognitionRef.current) return
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) if (event.results[i].isFinal) finalText += ` ${event.results[i][0].transcript}`
      if (finalText.trim()) appendLiveContext(finalText.trim())
    }
    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const warning = event.error || 'speech recognition error'
      setMicStatus(`Mic warning: ${warning}`)
      if (!['no-speech', 'aborted'].includes(warning)) setError(`Mic listener warning: ${warning}`)
    }
    recognition.onend = () => {
      setListening(false)
      if (!desiredListeningRef.current || recognitionRef.current !== recognition) return
      window.setTimeout(() => {
        if (!desiredListeningRef.current || recognitionRef.current !== recognition) return
        try { recognition.start(); setListening(true); setMicStatus('Listening through navigation') } catch { setMicStatus('Mic paused; tap resume if the browser blocked restart.') }
      }, 450)
    }
    recognitionRef.current = recognition
    try { recognition.start(); setListening(true); setMicStatus('Listening through navigation') } catch { recognitionRef.current = null; setListening(false); setMicStatus('Tap Start listening again — browser blocked auto-start.') }
  }, [appendLiveContext, setError])
  const stopListening = useCallback(() => {
    desiredListeningRef.current = false
    setDesiredListening(false)
    writeLiveChatPrefs({ desiredListening: false })
    const recognition = recognitionRef.current
    recognitionRef.current = null
    setListening(false)
    setMicStatus('Paused')
    if (recognition) recognition.stop()
  }, [])
  const clearContext = useCallback(() => { liveContextRef.current = ''; setLiveContext(''); setContext(''); writeLiveChatPrefs({ context: '', liveContext: '' }) }, [])

  useEffect(() => { desiredListeningRef.current = desiredListening }, [desiredListening])
  useEffect(() => () => stopListening(), [stopListening])
  useEffect(() => {
    if (!desiredListening || recognitionRef.current) return undefined
    const timer = window.setTimeout(startListening, 600)
    return () => window.clearTimeout(timer)
  }, [desiredListening, startListening])
  useEffect(() => {
    if (!autoAsk) return
    const timer = window.setInterval(() => {
      const enoughTime = Date.now() - lastAutoAskRef.current > secondsBetween * 1000
      const words = liveContextRef.current.split(/\s+/).filter(Boolean).length
      if (enoughTime && words > 10) generate(`Live mic context: ${liveContextRef.current}`).catch(() => undefined)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [autoAsk, generate, secondsBetween])

  return { topic, setTopic, context, setManualContext, liveContext, listening, desiredListening, autoAsk, setAutoAsk, secondsBetween, setSecondsBetween, promptMode, setPromptMode, startListening, stopListening, generate, clearContext, lastGeneratedAt, micStatus }
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
  const liveChat = usePersistentLiveChat(refresh, setError)
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
        <LiveChatDock controller={liveChat} openChat={() => setActivePage('live-chat')} />
        <div className="stream-safe"><strong>Creator mode</strong><span>Clean stream view enabled.</span></div>
      </aside>
      <main className={`main-panel page-${activePage}`}>
        <header className="topbar"><div><p className="eyebrow">{current.kicker}</p><h2>{current.icon} {current.label}</h2></div><div className="status-pill"><span /> {loading ? 'Refreshing' : 'Ready'}</div></header>
        {error && <div className="notice danger">Something needs attention. Keep the stream view clean and ask Rex to check it.</div>}
        <Page page={activePage} state={state} refresh={refresh} setError={setError} liveChat={liveChat} />
      </main>
    </div>
  )
}

function Page({ page, state, refresh, setError, liveChat }: { page: PageId; state: AppState; refresh: () => Promise<void>; setError: (value: string) => void; liveChat: LiveChatController }) {
  const props = { state, refresh, setError }
  switch (page) {
    case 'roadmap': return <LiveRoadmap state={state} />
    case 'media-pipeline': return <MediaPipeline {...props} />
    case 'clip-factory': return <ClipFactory {...props} />
    case 'viral-research': return <YouTubeScanner {...props} />
    case 'thumbnail-lab': return <ThumbnailLab {...props} />
    case 'viral-hunter': return <ViralHunter {...props} />
    case 'studio-feedback': return <StudioFeedback />
    case 'social-dashboard': return <SocialDashboard state={state} refresh={refresh} setError={setError} />
    case 'twitter-radar': return <TwitterRadarPage state={state} refresh={refresh} setError={setError} />
    case 'live-chat': return <LiveChat state={state} controller={liveChat} />
    case 'settings': return <SettingsPage {...props} />
    default: return <Dashboard state={state} setPage={() => undefined} />
  }
}

function LiveRoadmap({ state }: { state: AppState }) {
  return (
    <>
      <RexLiveRoadmap state={state} />
      <RexJobs jobs={state.jobs} scans={state.scans} mediaJobs={state.mediaJobs} />
    </>
  )
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
  return <section className="page-grid"><div className="hero-card full-span"><div><p className="eyebrow">Creator operations control tower</p><h3>Track the stream-to-clips pipeline from one clean command centre.</h3><p>Inspired by modern logistics dashboards: scanner, uploads, transcripts, clip candidates, render queue, viral leads, and Rex activity are laid out like live operational lanes.</p></div></div><div className="stat-grid full-span">{stats.map((stat) => <MetricCard key={stat.label} {...stat} />)}</div><Card title="Newest-stream readiness" eyebrow="Masala scope guard"><p><strong>{latestStream ? latestStream.title : 'No stream selected yet'}</strong></p><p>{latestStream ? <a href={latestStream.url}>{latestStream.url}</a> : 'Scanner has not found a stream yet.'}</p>{latestSource ? <div className={`validation-badge ${latestSource.validation?.status || 'unknown'}`}>{validationLabel(latestSource.validation) || 'source found'}: {latestSource.path}</div> : <div className="notice danger">Newest stream source file is missing. Expected local file: <code>{expectedSourcePath}</code></div>}{latestTranscript ? <div className="notice">Transcript found: <code>{latestTranscript.path}</code></div> : latestSource ? <div className="notice danger">Transcript missing. Expected local file: <code>{expectedTranscriptPath}</code></div> : null}{latestCaption ? <div className="notice">Caption file found: <code>{latestCaption.path}</code></div> : latestTranscript ? <div className="notice danger">Caption file missing. Expected <code>{expectedCaptionPath}</code></div> : null}{blocker ? <div className="notice danger">Next action: {blocker}</div> : <div className="notice">Newest stream source, transcript, and captions look ready; continue Clip Factory review, renders, export bundles, Viral Hunter, and dispatch work.</div>}<small>Current scope is intentionally limited to Masala’s most recent stream first; older videos stay out of the pipeline unless requested.</small></Card><Card title="Operations route" eyebrow="From stream to shipment"><ol className="timeline"><li><time>1</time><span><strong>Media Pipeline</strong><small>Import newest stream + validate complete source</small></span></li><li><time>2</time><span><strong>Clip Factory</strong><small>Review candidates, render selected clips, build bundles</small></span></li><li><time>3</time><span><strong>Viral Hunter</strong><small>Find angles and platform-native hooks</small></span></li><li><time>4</time><span><strong>Social Dashboard</strong><small>Draft-only dispatch and winner tracking</small></span></li><li><time>5</time><span><strong>Rex Command Center</strong><small>Show roadmap, persisted activity, and blockers</small></span></li></ol></Card><Card title="Dispatch model" eyebrow="Vibe Zone / HQ"><p>Built for Masala first, but shaped like a creator logistics product: ingest streams, process media, dispatch clips, and review every action before anything leaves the yard.</p></Card></section>
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


function WorkflowRail({ eyebrow, title, description, tone, steps }: { eyebrow: string; title: string; description: string; tone: 'lab' | 'factory'; steps: { label: string; detail: string; state: 'complete' | 'active' | 'next' }[] }) {
  return <div className={`workflow-rail ${tone} full-span`}><div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3><p>{description}</p></div><ol>{steps.map((step, index) => <li className={step.state} key={step.label}><span>{step.state === 'complete' ? '✓' : String(index + 1)}</span><strong>{step.label}</strong><small>{step.detail}</small></li>)}</ol></div>
}

function ClipFactory({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [title, setTitle] = useState('Stream transcript')
  const [sourceUrl, setSourceUrl] = useState('')
  const [text, setText] = useState('00:00 Why local-first tools matter for creators\n00:18 Stop overbuilding before the workflow earns it\n00:35 How we can turn livestream chaos into repeatable clips\n01:02 The mistake is pretending fake demos are finished products')
  const [busy, setBusy] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<RenderPresetId>('house-style')
  const importAndScore = async () => { setBusy(true); setError(''); try { const transcript = await api<Transcript>('/api/transcripts', { method: 'POST', body: JSON.stringify({ title, sourceUrl, text }) }); await api<Clip[]>('/api/clips/generate', { method: 'POST', body: JSON.stringify({ transcriptId: transcript.id }) }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  const updateClip = async (clip: Clip, patch: Partial<Pick<Clip, 'status' | 'platform'>>) => { setError(''); try { await api<Clip>(`/api/clips/${clip.id}`, { method: 'PATCH', body: JSON.stringify(patch) }); await refresh() } catch (err) { setError((err as Error).message) } }
  const renderClip = async (clip: Clip) => { setBusy(true); setError(''); try { await api<{ clip: Clip; job: MediaJob }>(`/api/clips/${clip.id}/render`, { method: 'POST', body: JSON.stringify({ presetId: selectedPreset }) }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  const exportBundle = async (clip: Clip) => { setBusy(true); setError(''); try { await api<{ clip: Clip; job: MediaJob; files: string[] }>(`/api/clips/${clip.id}/export-bundle`, { method: 'POST', body: '{}' }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  const preset = renderPresets.find((item) => item.id === selectedPreset) ?? renderPresets[0]
  const visibleCurrentClips = state.clips.filter(isVisibleCurrentClip)
  const readyClipCount = visibleCurrentClips.filter((clip) => clip.exportBundlePath || clip.status === 'ready_local_manual_upload').length
  return <section className="page-grid"><WorkflowRail eyebrow="Approved media lane" title="Clip Factory is the ready-to-ship bench." description="Only current-template renders and export bundles belong here; experiments graduate from Media Pipeline after review." tone="factory" steps={[{ label: 'Score transcript', detail: `${state.transcripts.length} transcript(s) stored`, state: state.transcripts.length ? 'complete' : 'active' }, { label: 'Review current clips', detail: `${visibleCurrentClips.length} registered render(s) visible`, state: visibleCurrentClips.length ? 'active' : 'next' }, { label: 'Build upload bundle', detail: `${readyClipCount} ready/manual upload asset(s)`, state: readyClipCount ? 'complete' : 'next' }]} /><Card title="Import/paste transcript" eyebrow="Timestamp-aware" className="full-span"><div className="form-grid"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Transcript title" /><input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Optional source video URL" /><textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Paste transcript lines with optional timestamps like 00:42 text…" /></div><button className="primary" type="button" onClick={importAndScore} disabled={busy || !text.trim()}>{busy ? 'Working…' : 'Import and generate clip candidates'}</button><small>Quantity-first scoring uses overlapping transcript windows to create more candidates. Download and transcript steps stay review-first so the workflow remains calm on stream.</small></Card><Card title="Render preset" eyebrow="Clip Factory controls"><div className="form-grid"><select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value as RenderPresetId)}>{renderPresets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><p>{preset.helper}</p><small>The selected preset applies to each “Render” action below. Facecam/right-centred presets are editor-ready layouts; they keep the frame editor-ready for manual review.</small></Card><Card title="Current template clips" eyebrow="old junk hidden; registered renders only" className="full-span"><div className="clip-list">{visibleCurrentClips.slice(0, 16).map((clip) => <article className="clip-card" key={clip.id}><div className="clip-score">{clip.score}</div><div><h3>{clip.title}</h3><p>{clip.start}–{clip.end} • {(clip.platform || 'tiktok').toUpperCase()} • {clip.status || 'idea'} • {clip.renderStatus ? `render ${clip.renderStatus}` : 'not rendered yet'}</p>{clip.renderUrl && <video className="clip-preview" src={mediaUrl(clip.renderUrl, clip.renderPath)} controls preload="metadata" />}<blockquote>{clip.hook}</blockquote><p><strong>Title:</strong> {clip.title}</p><p><strong>Caption:</strong> {clip.caption}</p>{clip.seo && <div className="seo-copy-card"><h4>Upload copy</h4>{clip.seo.youtubeTitle && <p><strong>YouTube title:</strong> {clip.seo.youtubeTitle}</p>}{clip.seo.description && <p><strong>YouTube description:</strong> {clip.seo.description}</p>}{clip.seo.tiktokDescription && <p><strong>TikTok description:</strong> {clip.seo.tiktokDescription}</p>}{clip.seo.tags?.length ? <p><strong>Tags:</strong> {clip.seo.tags.join(', ')}</p> : null}</div>}<div className="tag-row">{clip.hashtags.map((tag) => <span key={tag}>{tag}</span>)}<span>{clip.renderPreset || 'No render preset yet'}</span><span>{clip.renderPreset === 'long-standard' ? 'long-form' : '9:16 short'}</span>{clip.exportBundlePath && <span>export bundle ready</span>}</div><FacecamTrackingProof clip={clip} /><div className="review-row"><select value={clip.status || 'idea'} onChange={(e) => updateClip(clip, { status: e.target.value as Clip['status'] })}><option value="idea">idea</option><option value="draft">draft</option><option value="reviewed">reviewed</option><option value="exported">exported</option><option value="ready_local_manual_upload">ready upload</option><option value="uploaded">uploaded / hide</option></select><select value={clip.platform || 'tiktok'} onChange={(e) => updateClip(clip, { platform: e.target.value as Clip['platform'] })}><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="x">X/Twitter</option></select><button className="primary" type="button" onClick={() => renderClip(clip)} disabled={busy}>Render: {preset.label}</button><button type="button" onClick={() => exportBundle(clip)} disabled={busy}>Build upload bundle</button><button type="button" onClick={() => updateClip(clip, { status: 'uploaded' })} disabled={busy}>Mark uploaded + hide</button>{clip.exportedAt && <small>Exported {new Date(clip.exportedAt).toLocaleString()}</small>}</div>{clip.renderPath && <p><strong>Render:</strong> <a href={`/${clip.renderPath}`} target="_blank">Open rendered clip</a></p>}{clip.exportBundlePath && <p><strong>Upload card:</strong> <a href={`/${clip.exportBundlePath}/upload-card.md`} target="_blank">Open upload card</a></p>}{clip.renderError && <div className="notice danger">{clip.renderError}</div>}<small>{clip.reason}</small></div></article>)}{!visibleCurrentClips.length && <p>No current house-style clips loaded yet. Old blue-card/facecam tests are hidden.</p>}</div></Card></section>
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
  const isReviewConceptAsset = (file: MediaFile) => {
    if (file.kind !== 'concept') return false
    if (!/\.(mp4|mov|webm|mkv|jpg|jpeg|png)$/i.test(file.name)) return false
    if (/\b(bottom|loop|source|frame|generated-scenes?|cards?)-/i.test(file.path)) return false
    if (/\/(generated-scenes?|cards?|telegram)\//i.test(file.path)) return false
    const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(file.name)
    const isContactSheet = /contact-sheet.*\.(jpg|jpeg|png)$/i.test(file.name)
    const isFinalPractice = /practice(-v\d+)?\.(mp4|mov|webm|mkv)$/i.test(file.name) || /template-v2-script-aware\.(mp4|mov|webm|mkv)$/i.test(file.name)
    return isVideo ? isFinalPractice : isContactSheet
  }
  const conceptFiles = state.mediaFiles
    .filter(isReviewConceptAsset)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8)
  const conceptTitle = (file: MediaFile) => file.name
    .replace(/\.(mp4|mov|webm|mkv|jpg|jpeg|png)$/i, '')
    .replace(/day4-zero-risk-/i, '')
    .replace(/stream4-/i, 'Stream 4 ')
    .replace(/[-_]+/g, ' ')
    .replace(/\b(template|practice|correct captions|generated scenes|script aware|mp4|jpg|png)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  const conceptTag = (file: MediaFile) => file.path.includes('youtube-automation') ? 'YouTube Automation' : file.path.includes('stream4-template-v2') ? 'Stream 4 V2' : file.path.includes('contextual-short') ? 'Template V2' : file.path.includes('script-aware-short') ? 'Script-aware test' : 'Concept'
  const isWideConceptAsset = (file: MediaFile) => file.path.includes('youtube-automation') || file.path.includes('long-form') || file.path.includes('full-preview') || file.path.includes('full_video')
  const visibleMediaJobs = state.mediaJobs.slice(0, 12)
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
  const readiness = state.importReadiness
  return <section className="page-grid"><WorkflowRail eyebrow="Concept lab workflow" title="Media Pipeline stays experimental, visible, and safe." description="Use this lane for ingest checks, Template V2 tests, generated-scene experiments, and rough cuts before anything becomes a Clip Factory candidate." tone="lab" steps={[{ label: 'Lock source', detail: latestSourceFiles.length ? 'Newest source detected' : plannedMediaPath, state: latestSourceFiles.length ? 'complete' : 'active' }, { label: 'Transcript + captions', detail: hasLatestTranscriptText && hasLatestCaptionFile ? 'Text and caption files visible' : 'Needed before render review', state: hasLatestTranscriptText && hasLatestCaptionFile ? 'complete' : 'next' }, { label: 'Concept review', detail: `${conceptFiles.length} polished WIP asset(s)`, state: conceptFiles.length ? 'active' : 'next' }, { label: 'Graduate only winners', detail: 'Approved renders move to Clip Factory', state: 'next' }]} /><Card title="Media Pipeline Concept Lab" eyebrow="Work-in-progress experiments" className="full-span"><div className="notice"><strong>New role:</strong> Media Pipeline is now the concept lab for Template V2 tests, rough edits, generated-scene experiments, and workflow ideas. Keep Clip Factory for fully approved ready-to-ship media.</div><div className="notice">Current source target still starts from the newest public stream: <strong>{latestStream ? latestStream.title : 'scan YouTube first'}</strong>. Concept renders can live here before they graduate into Clip Factory.</div>{pipelineBlocker ? <div className="notice danger">Pipeline blocker: {pipelineBlocker}</div> : <div className="notice">Newest stream source, transcript, and captions are visible. Ready for concept planning, transcript checks, and experimental renders.</div>}{readiness && <div className="import-readiness"><div><p className="eyebrow">Local ingest checklist</p><h3>{readiness.activeMediaJobs ? `${readiness.activeMediaJobs} active media job(s)` : 'No active media jobs'}</h3><small>{readiness.guardrail}</small></div><ol>{readiness.checklist.map((item) => <li className={item.status} key={item.id}><span>{item.status === 'done' ? '✓' : item.status === 'next' ? '→' : '!'}</span><div><strong>{item.label}</strong><small>{streamSafeText(item.detail)}</small></div></li>)}</ol><div className="notice">Next safe local action: {streamSafeText(readiness.nextAction)}</div></div>}{latestReadySource && latestReadySource.path !== plannedMediaPath ? <div className="notice">Using detected source file for actions: <code>{latestReadySource.path}</code></div> : null}<label className="upload-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files) }}><input type="file" multiple accept="video/*,audio/*,.mp4,.mov,.mkv,.webm,.m4v,.mp3,.wav,.m4a,.txt,.srt,.vtt" onChange={(e) => e.currentTarget.files && uploadFiles(e.currentTarget.files)} /><strong>Drop downloaded stream files here</strong><span>Drop video, audio, transcript, or subtitle files here. Click here if drag/drop is awkward.</span>{uploadNote && <div className="upload-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadPercent}><div style={{ width: `${uploadPercent}%` }} /><strong>{uploadPercent}%</strong></div>}{uploadNote && <small>{uploadNote}</small>}</label><div className="form-grid"><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={latestStream?.url || 'YouTube video/live replay URL'} /><input value={inputPath} onChange={(e) => setInputPath(e.target.value)} placeholder={latestReadySource?.path || plannedMediaPath} /></div><div className="button-row"><button className="primary" onClick={() => run('/api/media/probe')} disabled={!!busy}>Probe tools</button><button className="primary" onClick={() => run('/api/media/extract', { videoUrl: targetUrl })} disabled={!!busy || !targetUrl}>Probe public extractor (no cookies)</button><button className="primary" onClick={() => run('/api/media/ingest-local', { videoId: plannedVideoId, inputPath: targetInputPath, transcriptPath: plannedTranscriptPath, subtitlePath: plannedSubtitlePath, sourceUrl: targetUrl })} disabled={!!busy}>Import local transcript + score</button><button className="primary" onClick={() => run('/api/media/transcribe', { inputPath: targetInputPath })} disabled={!!busy}>Plan Whisper transcript</button><button className="primary" onClick={() => run('/api/media/render', { inputPath: targetInputPath, start: '0:00', end: '0:45', mode: 'short', subtitlePath: plannedSubtitlePath })} disabled={!!busy}>Queue short + subtitles</button><button className="primary" onClick={() => run('/api/media/render', { inputPath: targetInputPath, start: '0:00', end: '8:00', mode: 'long', subtitlePath: plannedSubtitlePath })} disabled={!!busy}>Queue long-form + subtitles</button></div><small>Jobs stay review-first until source/captions are ready. Experimental outputs stay here; only approved assets move to Clip Factory.</small></Card><Card title="Concept review shelf" eyebrow="Only polished WIP assets" className="full-span"><div className="notice"><strong>Clean lane:</strong> showing final concept videos and contact sheets only. Raw frames, generated-image folders, scene loops, and scratch files are hidden so this stays reviewable.</div><div className="render-grid">{conceptFiles.map((file) => <article className={`render-card ${isWideConceptAsset(file) ? 'render-card-wide' : ''}`} key={file.path}>{/\.(mp4|mov|webm|mkv)$/i.test(file.name) ? <video src={mediaUrl(file.url, file.updatedAt)} controls preload="metadata" /> : <img src={mediaUrl(file.url, file.updatedAt)} alt={file.name} />}<div><h3>{conceptTitle(file) || file.name}</h3><p>{formatBytes(file.size)} • {new Date(file.updatedAt).toLocaleString()}</p><div className="tag-row"><span>{conceptTag(file)}</span><span>{file.name.includes('contact-sheet') ? 'QA sheet' : 'concept video'}</span><span>not ready-to-ship</span></div><div className="button-row"><a className="file-link" href={mediaUrl(file.url, file.updatedAt)} target="_blank">Open</a><a className="file-link" href={mediaUrl(file.url, file.updatedAt)} download>Download</a></div></div></article>)}{!conceptFiles.length && <p>No clean concept renders yet. Final Template V2 tests and contact sheets will appear here.</p>}</div></Card><Card title="Review files" eyebrow="Source/captions only — old renders hidden" className="full-span"><div className="table-list">{[...sourceFiles, ...transcriptFiles].map((file) => <div className="table-row media-artifact-row" key={file.path}><strong>{file.kind}</strong><span>{formatBytes(file.size)}</span><a href={file.url} target="_blank">Open file</a>{file.validation && <div className={`validation-badge ${file.validation.status}`} title={`${streamSafeText(file.validation.detail)} • ${validationCacheLabel(file.validation)}`}>{validationLabel(file.validation)}<em>{validationCacheLabel(file.validation)}</em></div>}<small>{file.validation ? streamSafeText(file.validation.detail) : ''}</small></div>)}{!latestSourceFiles.length && fallbackSourceFiles.length ? <div className="notice danger">Showing Stream 2 fallback files for review only. Newest-stream actions still need <code>{plannedMediaPath}</code>.</div> : null}{!sourceFiles.length && !transcriptFiles.length && <p>No uploaded/transcript artifacts yet.</p>}</div></Card><Card title="Recent concept/pipeline activity" eyebrow={`${state.mediaJobs.length} total jobs`} className="full-span"><div className="notice">Showing the latest 12 jobs only. Older render/debug noise stays out of the main review lane.</div><div className="job-list">{visibleMediaJobs.map((job) => <article className="job-row" key={job.id}><span className={`dot ${job.status}`} /><div><h3>{job.step}</h3><p>{streamSafeText(job.detail)}</p><small>{new Date(job.createdAt).toLocaleString()}</small></div><small>{job.status}</small></article>)}{!state.mediaJobs.length && <p>No media jobs yet. Probe tools first.</p>}</div></Card></section>
}

function ViralHunter({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [busy, setBusy] = useState(false)
  const latestStream = state.videos.find((video) => video.kind === 'stream') || state.videos[0]
  const hunt = async () => { setBusy(true); setError(''); try { await api<ViralFind[]>('/api/viral/hunt', { method: 'POST', body: '{}' }); await refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  return <section className="page-grid"><Card title="Viral Hunter MVP" eyebrow="Newest stream only" className="full-span"><p>Finds hookable ideas from Masala’s newest stream and generated clip candidates, then frames them with Opus-style patterns: money/proof, problem→fix, AI workflow reveal, and curiosity-first captions.</p><div className="notice">Scope guard: {latestStream ? <><strong>{latestStream.title}</strong> is the only stream Vibe Zone is hunting right now.</> : 'Scan YouTube first so Viral Hunter can lock onto the newest stream.'}</div><button className="primary" type="button" onClick={hunt} disabled={busy}>{busy ? 'Hunting…' : 'Generate newest-stream leads'}</button></Card><Card title="Competitor gap board" eyebrow="Opus Clip patterns to match"><ol className="timeline"><li><time>1</time><span><strong>Virality score with reasons</strong><small>Already seeded; next add retention/comment prediction fields.</small></span></li><li><time>2</time><span><strong>Auto-reframe + caption templates</strong><small>Caption-safe renders exist; true face tracking and more templates are next.</small></span></li><li><time>3</time><span><strong>Publishing workflow</strong><small>Keep draft/export-only until Masala approves official integrations.</small></span></li></ol></Card><Card title="Lead backlog" eyebrow="Review candidates" className="full-span"><div className="clip-list">{state.viralFinds.map((find) => <article className="clip-card" key={find.id}><div className="clip-score">{find.score}</div><div><h3>{find.title}</h3><p>{find.source}{find.url ? <> • <a href={find.url}>{find.url}</a></> : null}</p><blockquote>{find.angle}</blockquote><small>{new Date(find.createdAt).toLocaleString()}</small></div></article>)}{!state.viralFinds.length && <p>No leads yet. Run a YouTube scan or generate clips, then hunt.</p>}</div></Card></section>
}

function LiveChatDock({ controller, openChat }: { controller: LiveChatController; openChat: () => void }) {
  const words = controller.liveContext.split(/\s+/).filter(Boolean).length
  return <div className="live-chat-dock"><div><p className="eyebrow">Always-on co-chat</p><strong>{controller.listening ? 'Listening now' : controller.desiredListening ? 'Reconnecting mic' : 'Mic paused'}</strong><span>{controller.autoAsk ? `Fast prompts every ${controller.secondsBetween}s` : 'Auto prompts off'} • {words} words buffered</span></div><div className="dock-actions"><button type="button" onClick={controller.listening ? controller.stopListening : controller.startListening}>{controller.listening ? 'Pause' : 'Listen'}</button><button type="button" onClick={openChat}>Open</button></div></div>
}

function LiveChat({ state, controller }: { state: AppState; controller: LiveChatController }) {
  const messages = state.chatMessages
  const cadenceText = controller.autoAsk ? `auto every ${controller.secondsBetween < 60 ? `${controller.secondsBetween}s` : `${controller.secondsBetween / 60}m`}` : 'manual mode'
  return <section className="page-grid live-chat-page"><Card title="Live Chat Co-Pilot" eyebrow="Always-on viewer engine" className="full-span chat-shell-card"><div className="cochat-hero"><div><p className="eyebrow">Always-on live co-chat</p><h3>Fast private chat prompts that survive panel-hopping.</h3><p>Keep the mic running while you navigate the product. Prompts can be normal viewer chaos or clip-farm wisdom you can read live.</p></div><div className="cochat-status"><span className={`chat-live-dot ${controller.listening ? 'on' : ''}`} /><strong>{controller.listening ? 'Listening' : controller.desiredListening ? 'Reconnecting' : 'Paused'}</strong><small>{controller.micStatus}</small></div></div><div className="chat-shell"><div className="chat-top"><div><strong>No Sleep Shipping chat</strong><span>{controller.listening ? 'Listening through navigation' : 'Mic paused'} • {cadenceText} • {controller.promptMode === 'wisdom' ? 'clip-farm wisdom mode' : 'normal viewer mode'}</span></div><div className={`chat-live-dot ${controller.listening ? 'on' : ''}`} /></div><div className="chat-window" aria-label="Practice chat messages">{messages.length ? messages.map((message, index) => <article className={`chat-message ${message.label === 'clip-farm wisdom' ? 'wisdom' : ''}`} key={message.id} style={{ '--bubble-delay': `${Math.min(index, 8) * 0.04}s`, '--avatar-hue': `${(message.name.charCodeAt(0) * 37 + index * 29) % 360}deg` } as React.CSSProperties}><div className="chat-avatar"><span>{chatAvatar(message.name, index)}</span></div><div className="chat-bubble"><div><strong>{message.name}</strong><time>{message.label === 'clip-farm wisdom' ? 'clip seed' : new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.text}</p></div></article>) : <div className="chat-empty"><strong>No prompts yet</strong><span>Hit Start listening once. After that it keeps trying to listen across panel changes and page refreshes.</span></div>}</div><div className="chat-controls"><button className={controller.listening ? '' : 'primary'} type="button" onClick={controller.listening ? controller.stopListening : controller.startListening}>{controller.listening ? 'Stop listening' : 'Start listening'}</button><button className={controller.autoAsk ? 'primary' : ''} type="button" onClick={() => controller.setAutoAsk(!controller.autoAsk)}>{controller.autoAsk ? 'Auto on' : 'Auto off'}</button><label>Every <select value={controller.secondsBetween} onChange={(e) => controller.setSecondsBetween(Number(e.target.value))}><option value={15}>15s</option><option value={30}>30s</option><option value={45}>45s</option><option value={90}>90s</option><option value={150}>2.5m</option></select></label><label>Mode <select value={controller.promptMode} onChange={(e) => controller.setPromptMode(e.target.value as 'chat' | 'wisdom')}><option value="wisdom">Clip wisdom</option><option value="chat">Normal chat</option></select></label><button type="button" onClick={() => controller.generate(controller.context)}>Generate now</button></div></div></Card><Card title="Context" eyebrow="Persistent listener buffer" className="full-span chat-context-card"><div className="form-grid"><input value={controller.topic} onChange={(e) => controller.setTopic(e.target.value)} placeholder="Current topic" /><textarea value={controller.context} onChange={(e) => controller.setManualContext(e.target.value)} rows={3} placeholder="Stream context" /></div><div className="notice">Listener intent is saved locally. If the website refreshes, Vibe Zone attempts to resume the mic and auto-prompts immediately after load; browser permission rules may still require one tap.</div><details open><summary>Listening buffer</summary><p>{controller.liveContext || 'Nothing captured yet.'}</p><button type="button" onClick={controller.clearContext}>Clear context</button></details></Card></section>
}

function chatAvatar(name: string, index: number) {
  const avatars = ['🦝', '🛸', '🦊', '🐸', '🤖', '🦄', '👻', '🐙', '🦖', '🐧', '🧃', '🌚']
  return avatars[(name.charCodeAt(0) + index) % avatars.length]
}


function thumbnailGroups(concepts: ThumbnailConcept[]) {
  const groups = new Map<string, { title: string; videoPath: string; proofPath?: string; concepts: ThumbnailConcept[] }>()
  for (const concept of concepts) {
    const status = String(concept.status || '')
    const videoPath = concept.sourceVideoPath || ''
    const isLongForm = concept.sourceClipId?.startsWith('long-') || /(^|\/)long-[^/]+\.(mp4|mov|mkv|webm)$/i.test(videoPath)
    if (!isLongForm || status === 'archived' || status === 'uploaded') continue
    const title = concept.sourceTitle || 'Long-form upload candidate'
    const key = `${title}:${videoPath}`
    const group = groups.get(key) || { title, videoPath, proofPath: concept.sourceProofPath, concepts: [] }
    group.concepts.push(concept)
    groups.set(key, group)
  }
  return [...groups.values()].filter((group) => group.videoPath || group.concepts.length).sort((a, b) => a.title.localeCompare(b.title))
}


function ThumbnailPreview({ concept, large = false }: { concept: ThumbnailConcept; large?: boolean }) {
  if (concept.imageUrl) return <img src={localAssetUrl(concept.imageUrl)} alt={concept.title} />
  return <div className={large ? 'thumbnail-mock large' : 'thumbnail-mock'}><span className="thumb-face">😲</span><strong>{concept.thumbnailText}</strong><em>{concept.emotion}</em></div>
}

function ThumbnailLab({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [selectedVideoKey, setSelectedVideoKey] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const feedback = state.settings.thumbnailConceptFeedback || {}
  const concepts = (state.thumbnailConcepts || []).map((concept) => ({ ...concept, rating: feedback[concept.id] || concept.rating, status: feedback[concept.id] === 'like' ? 'liked' as const : feedback[concept.id] === 'dislike' ? 'disliked' as const : concept.status }))
  const groups = thumbnailGroups(concepts)
  const selectedGroup = groups.find((group) => `${group.title}:${group.videoPath}` === selectedVideoKey) || groups[0]
  const selected = concepts.find((concept) => concept.id === selectedId) || null
  const liked = concepts.filter((concept) => concept.rating === 'like' || concept.status === 'liked').length
  const disliked = concepts.filter((concept) => concept.rating === 'dislike' || concept.status === 'disliked').length
  const generate = async () => {
    setBusy(true); setError('')
    try { await api<ThumbnailConcept[]>('/api/thumbnails/generate', { method: 'POST', body: JSON.stringify({ limit: 20 }) }); await refresh() }
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
    <Card title="Long-form thumbnail lab" eyebrow="Completed videos → real options" className="full-span compact-card">
      <div className="notice"><strong>Winner picker:</strong> click a completed long-form video, then judge each thumbnail individually. The grid is one card per thumbnail option; 👍/👎 applies to that exact option, and <strong>Mark used</strong> picks the winner.</div>
      <div className="stat-grid"><MetricCard label="Completed long-form videos" value={String(groups.length)} detail="Clickable thumbnail sets" tone="blue" /><MetricCard label="Thumbnail options" value={String(concepts.length)} detail="One card = one thumbnail" tone="purple" /><MetricCard label="Liked" value={String(liked)} detail="Feeds future styles" tone="green" /><MetricCard label="Disliked" value={String(disliked)} detail="Avoid these patterns" tone={disliked ? 'amber' : 'green'} /></div>{state.settings.thumbnailPreferenceProfile?.guidance && <div className="notice"><strong>Learning active:</strong> {state.settings.thumbnailPreferenceProfile.guidance}</div>}
    </Card>
    <Card title="Completed long-form videos" eyebrow="Click to reveal thumbnail options" className="full-span compact-card">
      <div className="longform-video-grid">{groups.map((group) => {
        const key = `${group.title}:${group.videoPath}`
        return <button className={selectedGroup === group ? 'longform-video-card active' : 'longform-video-card'} key={key} type="button" onClick={() => setSelectedVideoKey(key)}>
          {group.videoPath ? <video src={localAssetUrl(group.videoPath)} preload="metadata" muted /> : group.proofPath ? <img src={localAssetUrl(group.proofPath)} alt="Long-form proof" /> : <div className="thumbnail-mock"><strong>{group.title}</strong></div>}
          <span>{group.title}</span>
          <small>{group.concepts.length} thumbnail options • completed render ready</small>
        </button>
      })}{!groups.length && <div className="empty-panel"><strong>No long-form thumbnail sets yet.</strong><p>Generate concepts after a completed long-form render lands.</p></div>}</div>
    </Card>
    {selectedGroup && <Card title={selectedGroup.title} eyebrow="Pick one thumbnail winner" className="full-span compact-card"><div className="thumbnail-toolbar"><p><strong>How this works:</strong> each card is one thumbnail option. Use 👍/👎 on individual thumbnails, open a card for detail, and use <strong>Mark used</strong> when one is the winner.</p><button className="primary" type="button" onClick={generate} disabled={busy}>{busy ? 'Generating…' : 'Regenerate/fill concepts'}</button></div>{selectedGroup.videoPath && <div className="selected-longform-preview"><video src={localAssetUrl(selectedGroup.videoPath)} controls preload="metadata" /><div><strong>Playable completed long-form render</strong><p>Use these links for the review/watch pass, full-video transcript, and local handoff.</p><div className="button-row"><a className="file-link" href={localAssetUrl(selectedGroup.videoPath)} target="_blank">Open video</a><a className="file-link" href={thumbnailTranscriptUrl(selectedGroup.videoPath)} target="_blank">Open transcript</a><a className="file-link" href={localAssetUrl(selectedGroup.videoPath)} download>Download video</a><a className="file-link" href={thumbnailTranscriptUrl(selectedGroup.videoPath, true)} download>Download transcript</a>{selectedGroup.proofPath && <a className="file-link" href={localAssetUrl(selectedGroup.proofPath)} target="_blank">Open proof sheet</a>}</div></div></div>}<div className="thumbnail-grid compact-grid">{selectedGroup.concepts.map((concept) => <article className={`thumbnail-tile ${concept.rating || concept.status}`} key={concept.id}>
      <button className="thumbnail-preview-button" type="button" onClick={() => openConcept(concept)}><ThumbnailPreview concept={concept} /></button><span>{concept.rating || concept.status}</span><small>{concept.title}</small>{!concept.imageUrl && <em className="missing-asset-note">concept preview — final image asset can be exported from prompt</em>}<div className="thumbnail-tile-actions"><button type="button" onClick={() => rate(concept, 'like')}>👍 Like</button><button type="button" onClick={() => rate(concept, 'dislike')}>👎 Dislike</button><button type="button" onClick={() => markUsed(concept)}>🏆 Winner</button></div>
    </article>)}</div></Card>}
    {selected && <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setSelectedId(null)}><article className="thumbnail-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setSelectedId(null)}>×</button><div className="thumbnail-modal-preview"><ThumbnailPreview concept={selected} large /></div><div className="thumbnail-modal-copy"><p className="eyebrow">{selected.sourceTitle} • {selected.status} • {selected.rating || 'unrated'}</p><h3>{selected.title}</h3><p><strong>Text:</strong> {selected.thumbnailText}</p><p><strong>Visual:</strong> {selected.visualAngle}</p><p><strong>Style:</strong> {selected.style}</p><p><strong>Prompt:</strong> {selected.prompt}</p>{!selected.imageUrl && <div className="notice danger">This is an individual concept preview, not a four-up stack. Practical fix: generate/export the final 16:9 image from this prompt, save it under the matching long-form export folder, then set this concept’s <code>imageUrl</code>.</div>}{selected.imageUrl && <p><strong>Thumbnail image:</strong> <a href={localAssetUrl(selected.imageUrl)} target="_blank">Open image</a> · <a href={localAssetUrl(selected.imageUrl)} download>Download image</a></p>}{selected.sourceVideoPath && <p><strong>Video:</strong> <a href={localAssetUrl(selected.sourceVideoPath)} target="_blank">Open completed long-form</a> · <a href={localAssetUrl(selected.sourceVideoPath)} download>Download video</a></p>}<label><strong>Your note / Rex learning</strong><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="e.g. bigger face, less text, funnier expression, more drama…" /></label><div className="review-row"><button type="button" onClick={() => rate(selected, 'like')}>👍 Like</button><button type="button" onClick={() => rate(selected, 'dislike')}>👎 Dislike</button><button type="button" onClick={() => markUsed(selected)}>Mark used</button></div></div></article></div>}
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

function SocialConnectionsPanel({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const [workingId, setWorkingId] = useState('')
  const [notice, setNotice] = useState('')
  const [connectError, setConnectError] = useState('')
  const [pendingAuthUrl, setPendingAuthUrl] = useState('')
  const [manualLinks, setManualLinks] = useState<Record<string, string>>({})
  const connections = state.socialConnections || []
  const startConnect = async (id: string) => {
    setWorkingId(id)
    setNotice('')
    setConnectError('')
    setPendingAuthUrl('')
    const popup = window.open('', '_blank')
    popup?.document.write('<title>Opening social login…</title><body style="font-family:system-ui;padding:24px;background:#07111f;color:#eaf6ff"><h1>Opening social login…</h1><p>You can close this tab if Vibe Zone reports setup is still needed.</p></body>')
    try {
      const result = await api<{ status: string; authUrl?: string; message?: string }>(`/api/social/connect/${encodeURIComponent(id)}/start`, { method: 'POST', body: '{}' })
      if (result.authUrl) {
        if (popup && !popup.closed) popup.location.href = result.authUrl
        else setPendingAuthUrl(result.authUrl)
      } else {
        popup?.close()
      }
      setNotice(result.message || (result.authUrl ? 'Opened provider login in a new tab.' : 'Connector updated.'))
      await refresh()
      setError('')
    } catch (err) {
      popup?.close()
      const message = err instanceof Error ? err.message : 'Connection start failed'
      setConnectError(message)
      setError(message)
    } finally {
      setWorkingId('')
    }
  }
  const manualLink = async (id: string) => {
    const accountUrl = manualLinks[id]?.trim()
    if (!accountUrl) { setConnectError('Paste the public channel/profile URL first.'); return }
    setWorkingId(id)
    setConnectError('')
    setNotice('')
    try {
      const result = await api<{ message?: string }>(`/api/social/connect/${encodeURIComponent(id)}/manual`, { method: 'POST', body: JSON.stringify({ accountUrl }) })
      await refresh()
      setNotice(result.message || 'Channel linked locally.')
      setError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Manual link failed'
      setConnectError(message)
      setError(message)
    } finally {
      setWorkingId('')
    }
  }
  const disconnect = async (id: string) => {
    setWorkingId(id)
    try {
      await api(`/api/social/connect/${encodeURIComponent(id)}/disconnect`, { method: 'POST', body: '{}' })
      await refresh()
      setNotice('Disconnected locally. Revoke the app inside the platform too if this was a real OAuth connection.')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed')
    } finally {
      setWorkingId('')
    }
  }
  return <>
    <Card title="Connect your socials inside Vibe Zone" eyebrow="OAuth + manual channel links" className="full-span"><p><strong>Manual link</strong> works now: paste your public channel/profile URL and Vibe Zone will track it locally. <strong>X OAuth</strong> now has a real browser login/token exchange path once <code>X_CLIENT_ID</code>, <code>X_CLIENT_SECRET</code>, and your public tunnel callback are set.</p><div className="notice"><strong>Safe setup rule:</strong> do not paste secrets on stream or into chat. Provider app keys live in environment variables; OAuth happens in your browser session.</div>{notice && <div className="notice">{notice}</div>}{connectError && <div className="notice danger"><strong>Connection blocked:</strong> {connectError}</div>}{pendingAuthUrl && <div className="notice"><a href={pendingAuthUrl} target="_blank" rel="noreferrer">Popup was blocked — open login manually</a></div>}</Card>
    <div className="connection-grid full-span">{connections.map((connection) => {
      const actionLabel = workingId === connection.id ? 'Opening…' : connection.status === 'connected' || connection.status === 'oauth_approved' ? 'Reconnect' : connection.status === 'needs_app_config' ? 'Show setup needed' : 'Connect'
      return <article className={`connection-card ${connection.status}`} key={connection.id}><div><strong>{connection.label}</strong><span>{connection.status.replaceAll('_', ' ')}</span></div><p>{connection.note}</p><small>Provider: {connection.provider} • Mode: {connection.mode}</small><small>Callback: <code>{connection.callbackUrl}</code></small><div className="scope-list">{connection.scopes.map((scope) => <em key={scope}>{scope}</em>)}</div>{connection.missingConfig?.length ? <div className="blocked-reasons"><b>Needed before OAuth login</b>{connection.missingConfig.map((item) => <span key={item}>{item}</span>)}</div> : null}{connection.manualUrl ? <small>Linked profile: <a href={connection.manualUrl} target="_blank" rel="noreferrer">{connection.accountLabel || connection.manualUrl}</a></small> : null}{connection.connectedAt ? <small>Connected {new Date(connection.connectedAt).toLocaleString()} {connection.accountLabel && !connection.manualUrl ? `• ${connection.accountLabel}` : ''}</small> : null}<div className="manual-link-row"><input value={manualLinks[connection.id] ?? connection.manualUrl ?? ''} onChange={(event) => setManualLinks((current) => ({ ...current, [connection.id]: event.target.value }))} placeholder={`Paste ${connection.label} channel/profile URL`} /><button type="button" onClick={() => manualLink(connection.id)} disabled={workingId === connection.id}>{connection.manualUrl ? 'Update link' : 'Link manually'}</button></div><div className="dispatch-actions"><button className="primary" type="button" onClick={() => startConnect(connection.id)} disabled={workingId === connection.id || connection.status === 'planned'}>{actionLabel}</button>{['connected', 'oauth_approved', 'manual_linked'].includes(connection.status) && <button type="button" onClick={() => disconnect(connection.id)} disabled={workingId === connection.id}>Disconnect locally</button>}</div></article>
    })}</div>
    <Card title="How the flow works" eyebrow="OAuth handshake" className="full-span"><ol className="timeline"><li><time>1</time><span><strong>Configure provider app keys</strong><small>Set client id/secret in env, never in the UI.</small></span></li><li><time>2</time><span><strong>Click Connect in Vibe Zone</strong><small>We open X/TikTok/YouTube/etc with requested permissions.</small></span></li><li><time>3</time><span><strong>Provider redirects to tunnel callback</strong><small>Example: /api/social/callback/x on your public tunnel URL.</small></span></li><li><time>4</time><span><strong>Vibe Zone stores local connection state</strong><small>X OAuth tokens are stored locally only; do not expose the data file on stream.</small></span></li><li><time>5</time><span><strong>First post remains approval-gated</strong><small>You approve exact video/caption before it leaves the machine.</small></span></li></ol></Card>
  </>
}

function StudioFeedback() { return <section className="page-grid">{['Audio: add peak warning if music overlaps mic.', 'Pacing: add chapter cards every 20 minutes.', 'Privacy: keep the live view clean and creator-friendly.', 'Chat: use transparent practice questions, not fake engagement.'].map((note) => <Card key={note} title={note.split(':')[0]} eyebrow="Checklist"><p>{note}</p></Card>)}</section> }
function streamSafeText(value = '') {
  return String(value)
    .replace(/\b(?:[A-Z][A-Z0-9_]*(?:TOKEN|SECRET|KEY|COOKIE|PASSWORD|PASS|AUTH)[A-Z0-9_]*)\s*=\s*\S+/g, 'private setting')
    .replace(/\b[A-Za-z0-9_=-]{24,}\b/g, '•••')
    .replace(/https?:\/\/\S+/g, 'source link')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, 'network address')
    .replace(/127\.0\.0\.1(?::\d+)?/g, 'local app')
    .replace(/\bAPI\b/gi, 'system')
    .replace(/\btoken\b|\bsecret\b|\bauth\b|\bcookie[s]?\b|\bSSH\b/gi, 'private setup')
    .replace(/(?:media|data|src|server|scripts)\/[\w./-]+/g, 'project file')
    .replace(/\/root\/\S+/g, 'project file')
    .slice(0, 240)
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
  if (platform === 'instagram') return ['Check Reels safe zones for username/caption overlays', 'Use short caption plus 3–5 focused hashtags', ...common]
  if (platform === 'threads') return ['Convert hook into a conversational lesson thread', 'Attach clip only if it supports the point', ...common]
  if (platform === 'linkedin') return ['Rewrite into a creator/product-building takeaway', 'Avoid hype; add one concrete result or lesson', ...common]
  if (platform === 'facebook') return ['Confirm reel/video upload format', 'Use accessible caption copy and simple tags', ...common]
  if (platform === 'pinterest') return ['Pair with a strong thumbnail/pin title', 'Add evergreen tutorial/search keywords', ...common]
  if (['rednote', 'douyin', 'kuaishou', 'bilibili', 'wechat'].includes(platform || '')) return ['Hold until account strategy and language/localisation are approved', 'Prepare platform-native copy rather than direct translation', ...common]
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
const dispatchStatusOptions: DispatchStatus[] = ['drafted', 'needs_owner_review', 'approved_manual_upload', 'posted_manual', 'blocked', 'style_rework_needed', 'superseded']
const dispatchStatusLabel = (status: DispatchStatus) => ({
  drafted: 'Drafted',
  needs_owner_review: 'Needs owner review',
  approved_manual_upload: 'Approved for manual upload',
  posted_manual: 'Posted manually',
  blocked: 'Blocked',
  style_rework_needed: 'Style rework needed',
  superseded: 'Superseded by rerender',
}[status])
const blockerReworkHints = (item: DispatchItem) => {
  const blockers = item.blockers || []
  if (item.status === 'superseded') return ['No rework needed on this old item — use the linked replacement render/bundle.']
  const text = blockers.join(' ').toLowerCase()
  const hints = [
    /headline|wording|caption/.test(text) && 'Tighten headline/caption wording before approval.',
    /safe-zone|safe zone|bottom/.test(text) && 'Raise captions or move text out of the bottom safe zone.',
    /proof/.test(text) && (item.exportBundlePath ? `Generate missing proof frames in ${item.exportBundlePath}: proof-frame.jpg and proof-frame-mid.jpg.` : 'Regenerate proof frames after the re-render.'),
    /render|asset/.test(text) && 'Re-render locally with the latest facecam-smart preset.',
    /bundle|metadata|upload/.test(text) && 'Rebuild the local upload bundle after the render passes.',
  ].filter(Boolean) as string[]
  return hints.length ? hints : ['Review the blocker, fix the local asset, then refresh the dispatch queue.']
}
const isBlockedDispatch = (item: DispatchItem) => item.status === 'blocked' || item.status === 'style_rework_needed' || (item.status !== 'superseded' && Boolean(item.blockers?.length))
const isStyleSuspendedDispatch = (item: DispatchItem) => item.status !== 'superseded' && (item.status === 'style_rework_needed' || Boolean(item.blockers?.some((blocker) => /style gate|style rework/i.test(blocker))))
const isOwnerGateDispatch = (item: DispatchItem) => item.status !== 'superseded' && (item.ownerGateRequired || item.privacyWatchRequired || (isManifestReadyDispatch(item) && item.status === 'approved_manual_upload'))
const isManualReadyDispatch = (item: DispatchItem) => item.status === 'approved_manual_upload' && !isStyleSuspendedDispatch(item) && !item.blockers?.some((blocker) => !/owner|privacy|watch/i.test(blocker))
const isNeedsRerenderDispatch = (item: DispatchItem) => item.status !== 'superseded' && (isStyleSuspendedDispatch(item) || item.status === 'blocked' || Boolean(item.blockers?.some((blocker) => /render|proof|caption|safe.?zone|bundle|style gate|style rework/i.test(blocker))))
const isResolvedReplacement = (item: DispatchItem) => item.status === 'superseded' || Boolean(item.replacedByRenderPath || item.replacedByBundlePath)
const dispatchUpdatedAt = (item: DispatchItem) => item.updatedAt || item.createdAt
const manifestReadyRenderPaths = [
  'media/renders/stream-2-build-clip-machine-restored-layout-v2-20260513T2012Z.mp4',
  'media/renders/stream-2-ai-agents-real-work-house-style-v3-20260513T1942Z.mp4',
  'media/renders/stream-2-project-progress-offline-house-v3-20260513T2234Z.mp4',
  'media/renders/day3-platform-creates-content-house-v3-20260513T2104Z.mp4',
  'media/renders/day3-honest-ai-chat-house-v3-20260513T2147Z.mp4',
  'media/renders/day3-agent-loop-keeps-building-house-v3-20260513T2147Z.mp4',
  'media/renders/day3-no-sleep-shipping-house-v3-20260513T2317Z.mp4',
  'media/renders/stream-2-build-while-i-sleep-house-v3-20260514T0047Z.mp4',
  'media/renders/stream-2-secure-vps-house-v3-20260514T0134Z.mp4',
  'media/renders/stream-2-rename-channel-house-v3-20260514T0217Z.mp4',
  'media/renders/stream-2-big-day-sprint-house-v3-20260514T0347Z.mp4',
  'media/renders/stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z.mp4',
  'media/renders/stream-2-live-no-leaks-house-v3-20260514T0517Z.mp4',
  'media/renders/stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z.mp4',
  'media/renders/stream-2-black-screen-flop-house-v3-20260514T0647Z.mp4',
  'media/renders/stream-2-mic-first-company-second-house-v3-20260514T0742Z.mp4',
  'media/renders/stream-2-billion-company-no-experience-house-v3-20260514T0817Z.mp4',
  'media/renders/stream2-start-posting-clips-template-20260514T0910Z.mp4',
  'media/renders/stream-2-post-while-i-sleep-house-v3-20260514T1045Z.mp4',
  'media/renders/thumbnail-looks-mid-house-v3-20260514T1125Z.mp4',
  'media/renders/stream-2-ai-still-working-house-v3-20260514T1208Z.mp4',
  'media/renders/template-trial-no-leaks-house-v3-20260514T1338Z.mp4',
  'media/renders/stream-2-phone-controls-build-house-v3-20260514T1510Z.mp4',
] as const
const manifestReadyKey = (value = '') => value.replace(/^\/+/, '').replace(/.*\//, '').replace(/\.mp4$/i, '')
const manifestReadyKeys = new Set(manifestReadyRenderPaths.map(manifestReadyKey))
const manifestStyleRecheckTarget = 42
const isManifestReadyDispatch = (item: DispatchItem) => manifestReadyKeys.has(manifestReadyKey(item.renderPath || ''))
const aiToEarnFeatures = [
  { title: 'Monetize', detail: 'Track CPS / CPE / CPM style opportunities beside every upload candidate, but keep deal acceptance manual until accounts and terms are approved.', status: 'Mapped into manual dispatch' },
  { title: 'Publish', detail: 'One upload-ready bundle can fan out into platform-specific copy, metadata, proof frames, and scheduling notes for every channel.', status: 'Local bundle workflow' },
  { title: 'Engage', detail: 'Comment mining, reply drafts, and brand monitoring can run as labelled drafts; no bot likes/follows or public replies without owner approval.', status: 'Draft-only guardrail' },
  { title: 'Create', detail: 'Use our existing clip factory, captions, thumbnails, and render presets as the source of truth, then add marketplace/task ideas on top.', status: 'Vibe Zone native' },
] as const
const publishDestinations: PlatformProfile[] = [
  { id: 'tiktok', label: 'TikTok', stage: 'ready', format: '9:16 short + caption + hashtags', note: 'Primary quantity test lane.' },
  { id: 'youtube', label: 'YouTube Shorts', stage: 'ready', format: '9:16 short + title/description/tags', note: 'Promote TikTok winners and stream highlights.' },
  { id: 'x', label: 'X / Twitter', stage: 'draft', format: 'build-in-public post + optional clip', note: 'Turn proven clips into lessons/reports.' },
  { id: 'instagram', label: 'Instagram Reels', stage: 'draft', format: '9:16 reel + short caption', note: 'Reuse short bundle after safe-zone check.' },
  { id: 'threads', label: 'Threads', stage: 'planned', format: 'short lesson thread', note: 'Repurpose X copy once tone is locked.' },
  { id: 'linkedin', label: 'LinkedIn', stage: 'planned', format: 'creator/business lesson', note: 'Post product-building takeaways, not memes.' },
  { id: 'facebook', label: 'Facebook', stage: 'planned', format: 'reel/video post', note: 'Later cross-post lane.' },
  { id: 'pinterest', label: 'Pinterest', stage: 'planned', format: 'thumbnail/pin + link', note: 'Useful for evergreen tutorials.' },
  { id: 'rednote', label: 'Rednote / Xiaohongshu', stage: 'planned', format: 'vertical video + notes', note: 'Hold until account/market strategy exists.' },
]
const scheduleWindows: ScheduleItem[] = [
  { id: 'morning-upload', label: 'Morning upload candidate', cadence: 'Daily first slot', status: 'ready' },
  { id: 'lunch-experiment', label: 'Lunch experiment slot', cadence: 'Optional second short', status: 'draft' },
  { id: 'evening-recap', label: 'Evening stream recap', cadence: 'After stream', status: 'draft' },
  { id: 'next-day-winner', label: 'Next-day winner repost', cadence: 'Promote proven winner', status: 'planned' },
]
const engagementAgents: EngagementTask[] = [
  { id: 'comment-intent', label: 'Comment intent finder', mode: 'draft-only', status: 'ready' },
  { id: 'reply-drafts', label: 'Reply draft writer', mode: 'draft-only', status: 'ready' },
  { id: 'brand-watcher', label: 'Brand mention watcher', mode: 'manual-review', status: 'planned' },
  { id: 'link-detector', label: 'High-conversion “link?” detector', mode: 'draft-only', status: 'planned' },
]
const monetizationModels: MonetizationOffer[] = [
  { id: 'cpm', model: 'CPM', label: 'Views/reach tracking', status: 'tracking' },
  { id: 'cpe', model: 'CPE', label: 'Comments/saves/clicks', status: 'planned' },
  { id: 'cps', model: 'CPS', label: 'Deal/link attribution', status: 'planned' },
]

function SocialDashboard({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const { clips, dispatchItems } = state
  const platformProfiles = state.platformProfiles?.length ? state.platformProfiles : publishDestinations
  const calendarItems = state.scheduleItems?.length ? state.scheduleItems : scheduleWindows
  const agentItems = state.engagementTasks?.length ? state.engagementTasks : engagementAgents
  const offerItems = state.monetizationOffers?.length ? state.monetizationOffers : monetizationModels
  const postingReadiness = state.postingReadiness
  const [seeding, setSeeding] = useState(false)
  const [dispatchFilter, setDispatchFilter] = useState<DispatchFilterId>('all')
  const [manualResultDrafts, setManualResultDrafts] = useState<Record<string, ManualPostResult>>({})
  const [copyDrafts, setCopyDrafts] = useState<Record<string, PlatformCopyOverride>>({})
  const dispatchReady = clips.filter((clip) => clip.exportBundlePath || clip.renderPath || clip.status === 'reviewed' || clip.status === 'exported')
  const queue: DispatchItem[] = dispatchItems.length ? dispatchItems : dispatchReady.map((clip) => ({ id: `fallback_${clip.id}`, clipId: clip.id, title: clip.title, platform: clip.platform || 'tiktok', status: clip.status === 'exported' ? 'approved_manual_upload' : clip.status === 'reviewed' ? 'needs_owner_review' : 'drafted', renderPath: clip.renderPath, exportBundlePath: clip.exportBundlePath, proofFrames: expectedProofFrames(clip), blockers: [!clip.renderPath && 'Missing rendered asset', !clip.exportBundlePath && 'Missing local upload bundle'].filter(Boolean) as string[], lastAuditAction: 'Derived fallback from clip metadata', createdAt: clip.createdAt, updatedAt: clip.exportedAt || clip.createdAt } satisfies DispatchItem))
  const blockedItems = queue.filter(isBlockedDispatch)
  const replacedItems = queue.filter(isResolvedReplacement)
  const manifestReadyItems = queue.filter(isManifestReadyDispatch)
  const manualReadyCount = queue.filter(isManualReadyDispatch).length
  const visibleManifestKeys = new Set(manifestReadyItems.map((item) => manifestReadyKey(item.renderPath || '')))
  const missingManifestPaths = manifestReadyRenderPaths.filter((path) => !visibleManifestKeys.has(manifestReadyKey(path)))
  const missingManifestCount = missingManifestPaths.length
  const currentReadyCount = manualReadyCount
  const styleSuspendedItems = queue.filter(isStyleSuspendedDispatch)
  const styleSuspendedCount = styleSuspendedItems.length
  const approvedCount = currentReadyCount
  const blockedCount = blockedItems.length
  const needsReviewCount = queue.filter((item) => item.status === 'needs_owner_review' || item.status === 'drafted').length
  const ownerGateItems = queue.filter(isOwnerGateDispatch)
  const needsRerenderItems = queue.filter(isNeedsRerenderDispatch)
  const activeStyleRecheckCount = needsRerenderItems.length
  const blockedOnlyStyleRecheckCount = needsRerenderItems.filter((item) => !isStyleSuspendedDispatch(item)).length
  const resolvedStyleRecheckCount = Math.min(replacedItems.length, Math.max(0, manifestStyleRecheckTarget - activeStyleRecheckCount))
  const unaccountedStyleRecheckCount = Math.max(0, manifestStyleRecheckTarget - activeStyleRecheckCount - resolvedStyleRecheckCount)
  const extraSupersededCount = Math.max(0, replacedItems.length - resolvedStyleRecheckCount)
  const styleRecheckDelta = activeStyleRecheckCount + resolvedStyleRecheckCount - manifestStyleRecheckTarget
  const ownerGateCount = ownerGateItems.length
  const dispatchFilters: { id: DispatchFilterId; label: string; count: number; helper: string }[] = [
    { id: 'all', label: 'All local items', count: queue.length, helper: 'Everything in dispatch' },
    { id: 'manual-ready', label: 'Manual-ready', count: manualReadyCount, helper: 'Ready bundle, still manual only' },
    { id: 'owner-gate', label: 'Owner privacy/watch gate', count: ownerGateCount, helper: 'Final owner watch pass, not rework' },
    { id: 'style-suspended', label: 'Style-suspended', count: styleSuspendedCount, helper: 'Legacy style paused' },
    { id: 'needs-rerender', label: 'Needs rerender', count: needsRerenderItems.length, helper: 'Local fix before upload' },
    { id: 'superseded', label: 'Superseded', count: replacedItems.length, helper: 'Old variants, not current' },
  ]
  const filteredQueue = queue.filter((item) => {
    if (dispatchFilter === 'manual-ready') return isManualReadyDispatch(item)
    if (dispatchFilter === 'owner-gate') return isOwnerGateDispatch(item)
    if (dispatchFilter === 'style-suspended') return isStyleSuspendedDispatch(item)
    if (dispatchFilter === 'needs-rerender') return isNeedsRerenderDispatch(item)
    if (dispatchFilter === 'superseded') return isResolvedReplacement(item)
    return true
  }).sort((a, b) => new Date(dispatchUpdatedAt(b)).getTime() - new Date(dispatchUpdatedAt(a)).getTime())
  const selectedDispatchFilter = dispatchFilters.find((filter) => filter.id === dispatchFilter) || dispatchFilters[0]
  const updateStatus = async (id: string, status: DispatchStatus, manualResult?: ManualPostResult, copyOverrides?: Partial<Record<PlatformId, PlatformCopyOverride>>) => {
    try {
      await api<DispatchItem>('/api/dispatch/update', { method: 'POST', body: JSON.stringify({ id, status, manualResult, copyOverrides }) })
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
  const updateManualResultDraft = (id: string, patch: ManualPostResult) => setManualResultDrafts((current) => ({ ...current, [id]: { ...(current[id] || {}), ...patch } }))
  const recordManualResult = async (item: DispatchItem) => {
    const draft = manualResultDrafts[item.id] || item.manualResult || {}
    await updateStatus(item.id, 'posted_manual', draft)
  }
  const updateCopyDraft = (id: string, patch: PlatformCopyOverride) => setCopyDrafts((current) => ({ ...current, [id]: { ...(current[id] || {}), ...patch } }))
  const saveCopyOverride = async (item: DispatchItem, platform: PlatformId) => {
    const draft = copyDrafts[item.id] || item.copyOverrides?.[platform] || {}
    await updateStatus(item.id, item.status, undefined, { [platform]: draft })
  }
  return <section className="page-grid social-hub-grid">
    <div className="social-hero full-span">
      <div className="social-hero-copy"><p className="eyebrow">Social launch bridge</p><h2>One cockpit for every channel.</h2><p>Dispatch-ready clips, OAuth status, creator-safe gates, platform copy, and monetization lanes now live in one loud control surface — still local-first, still manual before anything posts.</p><div className="social-hero-actions"><button className="primary" type="button" onClick={seedDispatch} disabled={seeding}>{seeding ? 'Syncing manifest…' : 'Sync dispatch queue'}</button><span>{queue.length} local items watched</span></div></div>
      <div className="social-radar" aria-label="Social distribution status graphic"><span className="radar-ring one" /><span className="radar-ring two" /><span className="radar-ring three" /><strong>{manualReadyCount}</strong><small>manual-ready</small><em>TikTok → YouTube → X</em></div>
      <div className="social-signal-strip"><span>READY {manualReadyCount}</span><span>GATED {ownerGateCount}</span><span>REWORK {needsRerenderItems.length}</span><span>CONNECT {state.socialConnections?.length || 0}</span></div>
    </div>
    <Card title="AiToEarn feature intake" eyebrow="MIT-inspired map — Vibe Zone native" className="full-span social-intake-card"><div className="feature-card-grid">{aiToEarnFeatures.map((feature) => <article className="feature-card" key={feature.title}><strong>{feature.title}</strong><span>{feature.status}</span><p>{feature.detail}</p></article>)}</div></Card>
    <SocialConnectionsPanel state={state} refresh={refresh} setError={setError} />
    {postingReadiness ? <Card title="Credential readiness" eyebrow="Posting connectors"><div className="readiness-panel"><strong>{postingReadiness.readyForCredentials ? 'Ready for credential setup' : 'Credential setup pending local readiness'}</strong><span>{postingReadiness.approvedManualAssets} approved local asset(s) can feed posting connectors.</span><small>{postingReadiness.safetyGate}</small></div><div className="connector-list">{postingReadiness.connectors.map((connector) => <article key={connector.id}><strong>{connector.label}</strong><span>{connector.status}</span><small>{connector.platforms.join(', ')} • {connector.mode}</small><p>{connector.note}</p></article>)}</div></Card> : null}
    <Card title="Publishing surface map" eyebrow="All channels, no blind posting" className="full-span"><div className="platform-grid">{platformProfiles.map((destination) => <article className={`platform-card ${destination.stage}`} key={destination.id}><strong>{destination.label}</strong><span>{destination.stage === 'ready' ? 'Ready lane' : destination.stage === 'draft' ? 'Draft lane' : 'Planned lane'}</span><p>{destination.format}</p><small>{destination.note}</small></article>)}</div></Card>
    <div className="ops-grid full-span"><Card title="Content calendar" eyebrow="Schedule scaffold"><ul className="compact-list">{calendarItems.map((window) => <li key={window.id}><strong>{window.label}</strong> <small>{window.cadence} • {window.status}</small></li>)}</ul></Card><Card title="Engagement agents" eyebrow="Draft-only automation"><ul className="compact-list">{agentItems.map((agent) => <li key={agent.id}><strong>{agent.label}</strong> <small>{agent.mode} • {agent.status}</small></li>)}</ul></Card><Card title="Monetization tracking" eyebrow="Deal model placeholders"><ul className="compact-list">{offerItems.map((model) => <li key={model.id}><strong>{model.model}</strong> <small>{model.label} • {model.status}</small></li>)}</ul></Card></div>
    <Card title="Platform funnel" eyebrow="Quantity-first strategy" className="full-span"><ol className="timeline"><li><time>1</time><span><strong>TikTok first</strong><small>Post lots of variants and measure retention/comments.</small></span></li><li><time>2</time><span><strong>Winners to YouTube</strong><small>Promote proven short-form concepts into Shorts or longer videos.</small></span></li><li><time>3</time><span><strong>Proven YouTube winners to X</strong><small>Turn validated ideas into frequent reports/posts in Masala's tone.</small></span></li></ol></Card>
    <div className="stat-grid full-span"><MetricCard label="Manifest ready" value={String(manifestReadyRenderPaths.length)} detail="Corrected-ready candidates listed" tone="blue" /><MetricCard label="Manual-ready" value={String(manualReadyCount)} detail="Owner privacy/watch pass still required" tone={manualReadyCount === manifestReadyRenderPaths.length ? 'green' : 'amber'} /><MetricCard label="Missing from dispatch" value={String(missingManifestCount)} detail="Corrected-ready not visible in queue" tone={missingManifestCount ? 'amber' : 'green'} /><MetricCard label="Dispatch queue" value={String(queue.length)} detail="Persisted local items" tone="blue" /><MetricCard label="Current ready" value={String(approvedCount)} detail="Passed corrected house-style gate; manual only" tone="green" /><MetricCard label="Style suspended" value={String(styleSuspendedCount)} detail="Legacy packaged assets paused" tone={styleSuspendedCount ? 'amber' : 'green'} /><MetricCard label="Blocked" value={String(blockedCount)} detail="Missing render, bundle, proof, or style gate" tone={blockedCount ? 'amber' : 'green'} /><MetricCard label="Replaced" value={String(replacedItems.length)} detail="Old blockers superseded locally" tone={replacedItems.length ? 'green' : 'blue'} /><MetricCard label="Owner gate" value={String(ownerGateCount)} detail="Final privacy/watch pass, not a blocker" tone={ownerGateCount === manifestReadyRenderPaths.length ? 'green' : 'amber'} /><MetricCard label="Needs review" value={String(needsReviewCount)} detail="Draft/rework review" tone={needsReviewCount ? 'amber' : 'green'} /></div>
    {missingManifestPaths.length ? <Card title="Manifest mismatch list" eyebrow="Dispatch reconciliation"><p><strong>{missingManifestPaths.length} corrected-ready manifest path(s) are not visible as current dispatch items.</strong></p><ul className="compact-list">{missingManifestPaths.map((missingPath) => <li key={missingPath}><small>{missingPath}</small></li>)}</ul></Card> : null}
    <Card title="Style-recheck reconciliation" eyebrow="Manifest count truth layer"><p><strong>{manifestStyleRecheckTarget} manifest candidates need rerender/style recheck.</strong></p><ul className="compact-list"><li><strong>{styleSuspendedCount}</strong> active dashboard item(s) are explicitly style-suspended.</li><li><strong>{blockedOnlyStyleRecheckCount}</strong> active dashboard item(s) need rerender/rework for non-style blockers such as proof, bundle, caption, or safe-zone fixes.</li><li><strong>{resolvedStyleRecheckCount}</strong> manifest slot(s) are accounted for as superseded/resolved legacy rows after a corrected replacement landed.</li><li><strong>{extraSupersededCount}</strong> extra superseded dashboard row(s) are duplicate tests/proof attempts beyond the manifest target.</li></ul>{unaccountedStyleRecheckCount ? <div className="notice danger">Reconciliation gap: {unaccountedStyleRecheckCount} manifest style-recheck candidate(s) are not represented by current active rework or resolved/superseded rows. Re-audit manifest and dispatch queue before trusting counts.</div> : styleRecheckDelta ? <div className="notice danger">Reconciliation mismatch: {styleRecheckDelta > 0 ? '+' : ''}{styleRecheckDelta}. Re-audit manifest and dispatch queue before trusting counts.</div> : <div className="notice">Manifest {manifestStyleRecheckTarget} is reconciled at the dashboard level; owner privacy/watch gate remains separate from rework.</div>}</Card>
    {styleSuspendedCount ? <Card title="Style gate is active" eyebrow="House-style correction"><p><strong>{styleSuspendedCount} packaged legacy dispatch item(s) are paused.</strong></p><p>Only corrected house-style candidates stay marked current-ready. Anything suspended needs a rerender/recheck before manual upload; no external posting is enabled here.</p></Card> : null}
    <Card title="Blocked rework queue" eyebrow="What to fix before upload" className="full-span">
      {replacedItems.length ? <div className="notice"><strong>Replaced blockers:</strong> {replacedItems.slice(0, 3).map((item) => item.title).join(', ')} now point to ready rerenders instead of red work.</div> : null}
      {blockedItems.length ? <div className="blocked-dispatch-list">{blockedItems.slice(0, 6).map((item) => {
        const clip = clips.find((candidate) => candidate.id === item.clipId)
        const proofFrames = item.proofFrames?.length ? item.proofFrames : clip ? expectedProofFrames(clip) : []
        return <article className="blocked-dispatch-card" key={item.id}>
          <div><strong>{item.title}</strong><span>{item.platform?.toUpperCase() || clip?.platform?.toUpperCase() || 'TIKTOK'} • blocked {new Date(item.updatedAt).toLocaleString()}</span></div>
          <div className="blocked-reasons"><b>Why blocked</b>{(item.blockers?.length ? item.blockers : ['Needs local review before manual upload']).map((blocker) => <span key={blocker}>{blocker}</span>)}</div>
          <div className="blocked-reasons"><b>Next local fix</b>{blockerReworkHints(item).map((hint) => <span key={hint}>{hint}</span>)}</div>
          <div className="dispatch-actions">{item.renderPath && <a href={`/${item.renderPath}`} target="_blank">Open render</a>}{item.exportBundlePath && <a href={`/${item.exportBundlePath}/upload-card.md`} target="_blank">Open upload card</a>}{proofFrames.map((frame, index) => <a href={`/${frame}`} target="_blank" key={frame}>{index ? 'Open mid proof' : 'Open proof frame'}</a>)}<button type="button" onClick={() => updateStatus(item.id, 'needs_owner_review')} disabled={item.id.startsWith('fallback_')}>Needs re-render/review</button></div>
        </article>
      })}</div> : <div className="empty-panel"><strong>No blocked dispatch items.</strong><p>The queue is clear; keep reviewing approved bundles manually before anything leaves the studio.</p></div>}
    </Card>
    <Card title="Dispatch queue" eyebrow="Local-only state — no external posting" className="full-span"><div className="dispatch-toolbar"><div><strong>Manual dispatch audit</strong><span>Refreshes from rendered/exported clips and upload bundles. This never posts externally.</span></div><button className="primary" type="button" onClick={seedDispatch} disabled={seeding}>{seeding ? 'Refreshing…' : 'Refresh local queue'}</button></div><div className="dispatch-filter-bar" role="tablist" aria-label="Dispatch queue filters">{dispatchFilters.map((filter) => <button className={dispatchFilter === filter.id ? 'active' : ''} key={filter.id} type="button" onClick={() => setDispatchFilter(filter.id)}><strong>{filter.label}</strong><span>{filter.count}</span><small>{filter.helper}</small></button>)}</div><div className="notice"><strong>{selectedDispatchFilter.label}:</strong> showing {filteredQueue.length} local item(s). Owner privacy/watch gate is tracked separately from true blockers.</div><div className="table-list">{filteredQueue.slice(0, 12).map((item) => { const clip = clips.find((candidate) => candidate.id === item.clipId); const platform = item.platform || clip?.platform || 'tiktok'; const proofFrames = item.proofFrames?.length ? item.proofFrames : clip ? expectedProofFrames(clip) : []; return <div className="dispatch-row" key={item.id}><div><strong>{item.title}</strong><span>{platform.toUpperCase()} • {dispatchStatusLabel(item.status)} • updated {new Date(dispatchUpdatedAt(item)).toLocaleString()}</span><em className={['approved_manual_upload', 'posted_manual', 'superseded'].includes(item.status) ? 'dispatch-gate approved' : 'dispatch-gate'}>{item.lastAuditAction || (clip ? ownerGateLabel(clip) : 'Local dispatch item')}</em></div>{clip && <ul>{platformChecklist(platform, clip).map((check) => <li key={check}>{check}</li>)}</ul>}<div className="dispatch-actions">{item.renderPath && <a href={`/${item.renderPath}`} target="_blank">Open rendered asset</a>}{item.exportBundlePath && <a href={`/${item.exportBundlePath}/upload-card.md`} target="_blank">Open upload card</a>}{item.exportBundlePath && <a href={`/${item.exportBundlePath}/metadata.json`} target="_blank">Open metadata</a>}{item.replacedByRenderPath && <a href={`/${item.replacedByRenderPath}`} target="_blank">Open replacement render</a>}{item.replacedByBundlePath && <a href={`/${item.replacedByBundlePath}/upload-card.md`} target="_blank">Open replacement bundle</a>}{proofFrames.map((frame, index) => <a href={`/${frame}`} target="_blank" key={frame}>{index ? 'Open mid proof' : 'Open proof frame'}</a>)}{(item.ownerGateRequired || item.privacyWatchRequired) && <span>Owner gate: {item.ownerGate || 'Final privacy/watch pass required before upload'}</span>}{item.blockers?.map((blocker) => <span key={blocker}>{blocker}</span>)}<label>Local status <select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as DispatchStatus)} disabled={item.id.startsWith('fallback_')}>{dispatchStatusOptions.map((status) => <option key={status} value={status}>{dispatchStatusLabel(status)}</option>)}</select></label></div>{item.exportBundlePath && clip && <div className="dispatch-copy-grid"><p><strong>YouTube Shorts</strong><span>{clip.seo?.youtubeTitle || item.title}</span><small>{clip.seo?.description ? 'Description ready' : 'Description needs manual check'} • {clip.seo?.tags?.length ? `${clip.seo.tags.length} tags` : 'tags missing'}</small></p><p><strong>TikTok</strong><span>{clip.seo?.tiktokDescription || clip.caption}</span><small>{clip.hashtags?.length ? clip.hashtags.join(' ') : 'hashtags missing'}</small></p></div>}<DispatchCopyOverrideEditor item={item} clip={clip} platform={platform} draft={copyDrafts[item.id] || item.copyOverrides?.[platform] || {}} onDraft={(patch) => updateCopyDraft(item.id, patch)} onSave={() => saveCopyOverride(item, platform)} /><DispatchManualResultForm item={item} draft={manualResultDrafts[item.id] || item.manualResult || {}} onDraft={(patch) => updateManualResultDraft(item.id, patch)} onSave={() => recordManualResult(item)} /></div> })}{!filteredQueue.length && <div className="empty-panel"><strong>No items in this dispatch group.</strong><p>{queue.length ? 'Try another filter, or refresh the local queue after new renders/export bundles land.' : 'Review a clip, render it, then build an upload bundle in Clip Factory. This page stays draft/manual-upload only.'}</p></div>}</div></Card>
    <Card title="X/Twitter report drafts from clips" eyebrow="Manual approval only" className="full-span"><div className="table-list">{clips.slice(0, 8).map((clip) => <div className="table-row" key={clip.id}><strong>{clip.title}</strong><span>Draft only • manual review</span><p>Report angle: {clip.hook} What changed, what performed, and what I learned building in public. {clip.hashtags.join(' ')}</p></div>)}{!clips.length && <p>Generate clips first. Everything here is draft-only.</p>}</div></Card>
  </section>
}

function DispatchCopyOverrideEditor({ item, clip, platform, draft, onDraft, onSave }: { item: DispatchItem; clip?: Clip; platform: PlatformId; draft: PlatformCopyOverride; onDraft: (patch: PlatformCopyOverride) => void; onSave: () => void }) {
  const saved = item.copyOverrides?.[platform]
  const baseTitle = clip?.seo?.youtubeTitle || item.title
  const baseDescription = clip?.seo?.description || clip?.seo?.tiktokDescription || clip?.caption || ''
  const baseHashtags = clip?.hashtags || []
  const draftHasHashtags = Object.prototype.hasOwnProperty.call(draft, 'hashtags')
  const draftTags = draftHasHashtags ? (draft.hashtags || []).join(' ') : saved?.hashtags?.join(' ') || baseHashtags.join(' ')
  const hashtagList = (value: string) => value.split(/[\s,]+/).map((tag) => tag.trim()).filter(Boolean).map((tag) => tag.startsWith('#') ? tag : `#${tag}`)
  return <div className="copy-override-editor"><strong>Per-platform draft copy</strong><small>Local override for {platform.toUpperCase()}; review-only and never posted automatically.</small><div className="copy-override-grid"><input value={draft.title ?? saved?.title ?? baseTitle} onChange={(event) => onDraft({ title: event.target.value })} placeholder="Platform title" /><textarea value={draft.postText ?? saved?.postText ?? ''} onChange={(event) => onDraft({ postText: event.target.value })} placeholder="Native post text / hook" rows={3} /><textarea value={draft.description ?? saved?.description ?? baseDescription} onChange={(event) => onDraft({ description: event.target.value })} placeholder="Description / caption" rows={3} /><input value={draftTags} onChange={(event) => onDraft({ hashtags: hashtagList(event.target.value) })} placeholder="#hashtags" /><button type="button" onClick={onSave}>Save draft copy</button></div>{saved?.updatedAt && <small>Saved {new Date(saved.updatedAt).toLocaleString()}</small>}</div>
}

function DispatchManualResultForm({ item, draft, onDraft, onSave }: { item: DispatchItem; draft: ManualPostResult; onDraft: (patch: ManualPostResult) => void; onSave: () => void }) {
  const canRecord = ['approved_manual_upload', 'posted_manual'].includes(item.status)
  if (!canRecord) return item.manualResult ? <div className="manual-result-ledger"><strong>Manual result</strong><small>{item.manualResult.externalUrl || 'No URL recorded'} • {item.manualResult.postedAt || item.manualResult.recordedAt || 'time not recorded'}</small>{item.manualResult.notes && <p>{item.manualResult.notes}</p>}</div> : null
  return <div className="manual-result-ledger"><strong>Manual post result ledger</strong><small>Only records what Masala posted manually. It never posts or verifies externally.</small><div className="manual-result-inputs"><input value={draft.externalUrl || ''} onChange={(event) => onDraft({ externalUrl: event.target.value })} placeholder="Optional public post URL" /><input value={draft.postedAt || ''} onChange={(event) => onDraft({ postedAt: event.target.value })} placeholder="Posted at, e.g. 2026-05-17 15:30" /><input value={draft.notes || ''} onChange={(event) => onDraft({ notes: event.target.value })} placeholder="Manual result note / first metrics" /><button type="button" onClick={onSave}>Record posted manually</button></div>{item.manualResult?.recordedAt && <small>Last recorded {new Date(item.manualResult.recordedAt).toLocaleString()}</small>}</div>
}

const splitRadarLines = (value: string) => value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
const radarTierLabel = (value: string, index: number) => {
  const explicit = value.match(/\b(?:tier\s*)?([abc])\b/i)?.[1]?.toUpperCase()
  return explicit || (index < 5 ? 'A' : index < 14 ? 'B' : 'C')
}
const cleanWatchAccount = (value: string) => value.replace(/^tier\s*[abc][:\s-]*/i, '').replace(/^@?/, '@').replace(/\s+[—-].*$/, '').trim()
const formatWatchAccount = (account: TwitterWatchAccount) => `Tier ${account.tier || 'B'} @${account.handle}${account.displayName ? ` — ${account.displayName}` : ''}${account.topicTags?.length ? ` | ${account.topicTags.join(', ')}` : ''}`
const parseWatchAccount = (value: string, index: number): TwitterWatchAccount | null => {
  const [identity = '', tags = ''] = value.split('|').map((part) => part.trim())
  const handle = cleanWatchAccount(identity).replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15)
  if (!handle) return null
  return { handle, displayName: identity.replace(/^tier\s*[abc][:\s-]*/i, '').replace(/^@?[a-zA-Z0-9_]+\s*[—-]?\s*/, '').trim() || `@${handle}`, tier: radarTierLabel(value, index), topicTags: splitRadarLines(tags).slice(0, 8), sourceMode: 'manual_search', lastSeenTweetId: null, lastSeenAt: null, enabled: true }
}
const parseBulkWatchAccount = (value: string, index: number): TwitterWatchAccount | null => {
  const parts = value.split(',').map((part) => part.trim())
  if (parts.length >= 3) {
    const handle = cleanWatchAccount(parts[0] || '').replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15)
    if (!handle) return null
    return { handle, displayName: parts[1] || `@${handle}`, tier: radarTierLabel(parts[2] || '', index), topicTags: splitRadarLines(parts.slice(3).join(',')).slice(0, 8), sourceMode: 'manual_search', lastSeenTweetId: null, lastSeenAt: null, enabled: true }
  }
  return parseWatchAccount(value, index)
}

function TwitterRadarPage({ state, refresh, setError }: { state: AppState; refresh: () => Promise<void>; setError: (value: string) => void }) {
  const radar = state.twitterRadar || { status: 'draft-only', mode: 'topic-mvp', lastScanAt: null, topics: [], watchAccounts: [], items: [] }
  const xConnection = (state.socialConnections || []).find((connection) => connection.id === 'x')
  const linkedLabel = xConnection?.manualUrl ? xHandleFromUrl(xConnection.manualUrl) || xConnection.accountLabel || 'Linked profile' : 'No X profile linked'
  const isManualLinked = xConnection?.status === 'manual_linked'
  const isOauthReady = xConnection?.status === 'connected' || xConnection?.status === 'oauth_approved'
  const [draft, setDraft] = useState('')
  const [format, setFormat] = useState<'one-liner' | 'milestone' | 'lesson' | 'stack' | 'trend'>('one-liner')
  const [chatPrompt, setChatPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState<'draft' | 'score' | 'coach' | ''>('')
  const [aiResult, setAiResult] = useState<StudioAiResult | null>(null)
  const [topicText, setTopicText] = useState((radar.topics || []).join('\n'))
  const [watchText, setWatchText] = useState((radar.watchAccounts || []).map(formatWatchAccount).join('\n'))
  const [bulkWatchText, setBulkWatchText] = useState('')
  const [scanning, setScanning] = useState(false)
  const [trafficBusy, setTrafficBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const topics = splitRadarLines(topicText)
  const watchAccounts = splitRadarLines(watchText).map(parseWatchAccount).filter(Boolean).slice(0, 2000) as TwitterWatchAccount[]
  const replyCards = radar.items || []
  const manualQueue = [...(radar.watchAccounts || [])].filter((account) => account.enabled !== false).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)).slice(0, 8)
  const csvExport = (radar.watchAccounts || []).map((account) => `${account.handle},${account.displayName || ''},${account.tier || 'B'},${(account.topicTags || []).join('|')}`).join('\n')
  const xSearchUrl = (handle: string) => `https://x.com/search?q=${encodeURIComponent(`from:${handle}`)}&src=typed_query&f=live`
  const localScore = draft.trim().length ? Math.min(19, Math.max(4, Math.round(5 + draft.length / 22 + (/[?]/.test(draft) ? 2 : 0) + (format === 'lesson' ? 2 : 0)))) : 0
  const score = aiResult?.score || localScore
  const predictedImpressions = draft.trim().length ? (aiResult?.predictedImpressions || Math.max(24, Math.round(score * 18 + draft.length * 1.7))) : 0
  const formatRows = [
    { id: 'one-liner', icon: '⚡', label: 'One-liner', help: 'Punchy, no setup' },
    { id: 'milestone', icon: '🏆', label: 'Milestone', help: 'Crossed a number' },
    { id: 'lesson', icon: '📖', label: 'Lesson learned', help: 'From doing the work' },
    { id: 'stack', icon: '🛠️', label: 'My stack', help: 'What I use, why' },
    { id: 'trend', icon: '🔥', label: 'AI trend', help: 'Niche-aware viral angle' },
  ] as const
  const analytics = twitterStudioAnalytics(replyCards, watchAccounts, draft)
  const saveRadar = async () => {
    setSaving(true)
    try {
      await api<TwitterRadar>('/api/twitter-radar/config', { method: 'POST', body: JSON.stringify({ topics, watchAccounts }) })
      await refresh()
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Twitter/X Studio config failed')
    } finally {
      setSaving(false)
    }
  }
  const runScan = async () => {
    setScanning(true)
    try {
      await api<TwitterRadar>('/api/twitter-radar/scan', { method: 'POST', body: JSON.stringify({ topics, watchAccounts }) })
      await refresh()
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Twitter/X screening failed')
    } finally {
      setScanning(false)
    }
  }
  const runTrafficQueue = async () => {
    setTrafficBusy(true)
    try {
      await api<TwitterRadar>('/api/twitter-radar/traffic', { method: 'POST', body: JSON.stringify({ topics }) })
      await refresh()
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Traffic reply queue failed')
    } finally {
      setTrafficBusy(false)
    }
  }
  const copyDraft = async () => {
    try { await navigator.clipboard.writeText(draft) } catch { setError('Copy failed. Select the draft manually.') }
  }
  const composeUrl = draft.trim() ? `https://x.com/intent/tweet?text=${encodeURIComponent(draft.trim())}` : 'https://x.com/compose/post'
  const runStudioAi = async (action: 'draft' | 'score' | 'coach' | 'trend' | 'improve', nextFormat = format, prompt = chatPrompt) => {
    setAiBusy(action === 'trend' || action === 'improve' ? 'draft' : action)
    setError('')
    try {
      const result = await api<StudioAiResult>('/api/studio/ai', { method: 'POST', body: JSON.stringify({ action, format: nextFormat, prompt, draft, niche: 'AI agents, creator tools, stream-to-content systems, local-first automation, build-in-public software' }) })
      setAiResult(result)
      if ((action === 'draft' || action === 'trend' || action === 'improve') && result.draft) setDraft(result.draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Studio AI failed')
    } finally {
      setAiBusy('')
    }
  }
  const copyReply = async (text: string) => {
    try { await navigator.clipboard.writeText(text) } catch { setError('Copy failed. Select the reply manually.') }
  }
  const copyCsvExport = async () => {
    try { await navigator.clipboard.writeText(csvExport) } catch { setError('Copy CSV export failed. Select the export manually.') }
  }
  const importBulkWatchlist = () => {
    const byHandle = new Map(watchAccounts.map((account) => [account.handle.toLowerCase(), account]))
    splitRadarLines(bulkWatchText).map(parseBulkWatchAccount).filter(Boolean).forEach((account) => byHandle.set((account as TwitterWatchAccount).handle.toLowerCase(), account as TwitterWatchAccount))
    setWatchText([...byHandle.values()].slice(0, 2000).map(formatWatchAccount).join('\n'))
  }
  const markChecked = async (handle: string) => {
    try {
      await api('/api/twitter-radar/watchlist/check', { method: 'POST', body: JSON.stringify({ handle }) })
      await refresh()
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Manual check update failed')
    }
  }
  const applyStarter = (next: typeof format) => {
    setFormat(next)
    setAiResult(null)
    const starters = {
      'one-liner': 'Boring systems beat flashy ideas when you have to show up every day.',
      milestone: 'Today I linked the first social profile into Vibe Zone. Tiny step, real product momentum.',
      lesson: 'Lesson learned: “connected” should mean exactly what the product can do, not what the UI hopes it can do later.',
      stack: 'My current build stack: Vite, local media pipeline, manual social review, and tiny loops that actually ship.',
      trend: 'AI agents are moving from demos into boring daily workflows. That is where the real creator-tool opportunity is.',
    }
    setDraft(starters[next])
    runStudioAi(next === 'trend' ? 'trend' : 'draft', next, chatPrompt || (next === 'trend' ? 'Find a current AI niche angle for creator tools, AI agents, and stream-to-content workflows.' : '')).catch(() => undefined)
  }
  return <section className="x-studio-page">
    <div className="x-studio-title"><div><h2>Studio</h2><p>Draft, refine, and publish posts in your voice.</p></div><div className={`x-connection-pill ${isOauthReady ? 'live' : isManualLinked ? 'linked' : 'blocked'}`}><strong>{isOauthReady ? 'OAuth connected' : isManualLinked ? 'Profile linked' : 'Not linked'}</strong><span>{linkedLabel}</span></div></div>
    <div className="x-studio-explainer"><strong>How this works right now:</strong> your Twitter/X URL is linked locally, so Vibe Zone knows which profile belongs to you. It does <em>not</em> mean X has granted posting/analytics access yet. Until X API/OAuth credentials are added, this page drafts, scores, saves/copies, and opens X manually — it cannot post or read real analytics.</div>
    <div className="x-studio-grid">
      <div className="x-main-column">
        <section className="x-card x-starter-card"><div><h3>What should we draft today?</h3><p>Pick a starting point — Cliff drafts options in your voice.</p></div><div className="x-starter-grid">{formatRows.map((row) => <button className={format === row.id ? 'active' : ''} type="button" key={row.id} onClick={() => applyStarter(row.id)} disabled={aiBusy === 'draft'}><span>{row.icon}</span><strong>{row.label}</strong><small>{aiBusy === 'draft' && format === row.id ? 'AI drafting…' : row.help}</small></button>)}</div><label className="x-chat-line">💬 <input value={chatPrompt} onChange={(event) => setChatPrompt(event.target.value)} placeholder="or describe what you want in chat" onKeyDown={(event) => { if (event.key === 'Enter') runStudioAi('draft') }} /><button type="button" onClick={() => runStudioAi('draft')} disabled={aiBusy === 'draft'}>{aiBusy === 'draft' ? 'Drafting…' : 'Ask AI'}</button></label>{aiResult && <small className="x-ai-source">AI: {aiResult.provider}/{aiResult.model}{aiResult.notes ? ` — ${aiResult.notes}` : ''}</small>}</section>
        <section className="x-card x-composer-card"><div className="x-compose-tabs"><strong>◉ Preview</strong><button type="button" onClick={() => runStudioAi('improve', format, 'Rewrite this for a higher X algorithm score while keeping my voice.') } disabled={!draft.trim() || aiBusy === 'draft'}>✧ Rewrite higher-score</button></div><div className="x-tweet-shell"><div className="x-avatar">{linkedLabel.slice(0, 1).replace('@', 'M') || 'M'}</div><div className="x-tweet-body"><button type="button" className="x-audience" title="X audience is chosen on X before posting">Everyone⌄</button><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setAiResult(null) }} placeholder="What's happening?" maxLength={280} /><div className="x-reply-rule">🌐 Everyone can reply</div></div></div><div className="x-compose-actions"><button type="button" title="Media upload is done on X after opening the composer">🖼️</button><button type="button" onClick={() => setDraft(`${draft}${draft.endsWith(' ') || !draft ? '' : ' '}✨`)}>😊</button><button type="button" onClick={copyDraft} disabled={!draft.trim()}>Save copy</button><a className={!draft.trim() ? 'disabled' : ''} href={composeUrl} target="_blank" rel="noreferrer">Open X with draft</a><a className={`dark ${!draft.trim() ? 'disabled' : ''}`} href={composeUrl} target="_blank" rel="noreferrer">Post manually</a></div></section>
      </div>
      <aside className="x-side-column"><section className="x-card x-prediction"><div><strong>ENGAGEMENT PREDICTION</strong><span>{draft.trim() ? (aiResult ? aiResult.provider : 'estimated') : 'waiting'}</span></div><h3>{draft.trim() ? predictedImpressions.toLocaleString() : '— — —'} <small>impressions</small></h3><p>{draft.trim() ? 'Predicted from draft length, hook shape, format, and local learning placeholders. Real accuracy starts after real post results are logged.' : 'Type a draft (15+ characters) to see a predicted impressions range for your account size.'}</p></section><section className="x-card x-algo"><strong>X ALGORITHM SCORE</strong><p>Score this draft and generate a higher-scoring rewrite for hook, clarity, reply potential, and profile-click intent.</p><button type="button" onClick={() => runStudioAi('score')} disabled={!draft.trim() || aiBusy === 'score'}>{aiBusy === 'score' ? 'Scoring…' : '✧ Score + suggest rewrite'}</button><button type="button" onClick={() => runStudioAi('improve')} disabled={!draft.trim() || aiBusy === 'draft'}>{aiBusy === 'draft' ? 'Rewriting…' : 'Apply higher-score rewrite'}</button><b>{score ? `${score} / 19` : 'waiting'}</b></section><section className="x-card x-coach"><strong>POST COACH</strong><p>{draft.trim() ? (aiResult?.coach || xCoachText(draft, format)) : 'Start typing to see how the draft scores against your voice rules plus learnings from your last 30 days.'}</p><button type="button" onClick={() => runStudioAi('coach')} disabled={!draft.trim() || aiBusy === 'coach'}>{aiBusy === 'coach' ? 'Coaching…' : 'Coach + rewrite'}</button>{aiResult?.draft && aiResult.draft !== draft && <button type="button" onClick={() => setDraft(aiResult.draft)}>Use suggested rewrite</button>}</section></aside>
    </div>
    <section className="x-profile-card"><div><strong>{linkedLabel.replace('@', '') || 'X profile'}</strong><span>{linkedLabel}</span></div><div><b>{analytics.postsTarget}</b><small>posts / day target</small></div><div><b>{analytics.replyTarget}</b><small>recommended replies / day</small></div><div><b>{analytics.followers}</b><small>followers</small></div></section>
    <div className="x-analytics-head"><div><h2>Your analytics</h2><p>What's working for your audience, learned from every post.</p></div><div><button type="button">Apr 16 - May 16, 2026 ◷</button><button type="button">▽ Filters</button></div></div>
    <section className="x-metric-row">{analytics.metrics.map((metric) => <article className="x-card x-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}</section>
    <section className="x-card x-format-table"><div><h3>Format performance</h3><p>Per-format breakdown across this period.</p></div><table><thead><tr><th>Format</th><th>Posts ↓</th><th>Replies</th><th>Impr.</th></tr></thead><tbody>{analytics.formats.map((row) => <tr key={row.format}><td><span>{row.icon}</span>{row.format}</td><td>{row.posts}</td><td>{row.replies}</td><td>{row.impressions}</td></tr>)}</tbody></table></section>
    <section className="x-bottom-grid"><div className="x-card"><h3>Audience insights</h3><p>{isOauthReady ? 'Real X audience insights can land here after API read access is wired.' : 'Lands once your X audience-insights data is OAuth connected.'}</p></div><div className="x-card"><h3>Takeaways</h3><p>Ship a handful of posts and this card fills with what is working for you specifically.</p></div></section>
    <details className="x-card x-advanced"><summary>Advanced radar setup</summary><div className="x-advanced-grid"><label className="radar-input-label"><strong>Topic lanes</strong><textarea value={topicText} onChange={(event) => setTopicText(event.target.value)} rows={5} placeholder="AI agents\nbuild in public\ncreator tools" /></label><label className="radar-input-label"><strong>High-profile watchlist</strong><textarea value={watchText} onChange={(event) => setWatchText(event.target.value)} rows={5} placeholder="Tier A @levelsio" /></label><div><button type="button" onClick={saveRadar} disabled={saving}>{saving ? 'Saving…' : 'Save topics + watchlist'}</button><button type="button" onClick={runScan} disabled={scanning}>{scanning ? 'Screening…' : 'Run screening now'}</button></div></div></details>
    <section className="twitter-radar-hero"><div><h2>Twitter Radar</h2><p>Manual-only reply radar. Find high-traffic AI conversations, draft smart replies, then copy/open X. No auto-commenting.</p></div><span>{radar.lastScanAt ? `Last scan ${new Date(radar.lastScanAt).toLocaleString()}` : 'Awaiting local scan'}</span></section>
    <section className="twitter-radar-card traffic-reply-card"><div><h3>Traffic reply queue</h3><p>Creates Top-search lanes for AI posts already showing visible engagement. Pick a real post, copy the Rex reply, and comment manually while the conversation is hot.</p></div><button className="primary" type="button" onClick={runTrafficQueue} disabled={trafficBusy}>{trafficBusy ? 'Finding traffic…' : 'Find high-traffic AI posts'}</button><small>Safe mode: no scraping, no mass replies, no blind OAuth posting. One human-approved reply at a time.</small></section>
    <section className="twitter-radar-card"><h3>Priority openings</h3><div className="radar-card-grid">{replyCards.slice(0, 8).map((item) => <article className="reply-draft manual-only" key={item.id}><span>{`${item.topic} · score ${item.score}`}</span><strong>{item.account || item.handle || 'Radar lead'}</strong><blockquote>{item.replyDraft}</blockquote><small>{item.reason}</small><div><a href={item.url} target="_blank" rel="noreferrer">Open X search</a><button type="button" onClick={() => copyReply(item.replyDraft)}>Copy reply</button></div></article>)}</div></section>
    <section className="twitter-radar-card"><h3>Manual check queue</h3><div className="manual-check-list">{manualQueue.map((account) => <article key={account.handle} className="twitter-watch-card"><div><span className="watch-tier">{`Tier ${account.tier || 'B'}`}</span><strong>{`@${account.handle}`}</strong><small>Next local check: {account.nextManualCheckAt ? new Date(account.nextManualCheckAt).toLocaleString() : 'not scheduled'}</small></div><a href={xSearchUrl(account.handle)} target="_blank" rel="noreferrer">Open X search</a><button type="button" onClick={() => markChecked(account.handle)}>Mark checked</button></article>)}</div></section>
    <section className="twitter-radar-card"><h3>No-API source adapters</h3><div className="radar-source-grid">{(radar.sourceAdapters || []).map((source) => <article key={source.id}><strong>{source.label}</strong><span>{source.latencyClass}</span><small>{source.note}</small></article>)}</div></section>
    <section className="twitter-radar-card"><h3>4-lane radar workers</h3><div className="radar-worker-grid">{(radar.workerLanes || []).map((lane) => <article key={lane.id}><strong>{lane.label}</strong><span>{lane.status}</span><small>{lane.focus}</small></article>)}</div></section>
    <section className="twitter-radar-card"><h3>Bulk watchlist import/export</h3><div className="radar-bulk-grid"><label><strong>Paste handles or CSV</strong><textarea value={bulkWatchText} onChange={(event) => setBulkWatchText(event.target.value)} rows={5} placeholder="handle,displayName,tier,tags" /></label><div><button type="button" onClick={importBulkWatchlist} disabled={!bulkWatchText.trim()}>Stage import locally</button><button type="button" onClick={copyCsvExport} disabled={!csvExport}>Copy CSV export</button><p>Imports are staged into the local editor only. Save topics + watchlist persists them; nothing fetches or posts to X.</p></div></div></section>
  </section>
}

function xHandleFromUrl(url = '') {
  const match = String(url).match(/(?:x\.com|twitter\.com)\/([^/?#]+)/i)
  return match ? `@${match[1]}` : ''
}
function xCoachText(draft: string, format: string) {
  if (draft.length < 55) return 'Good short punch. Add one concrete detail if you want more replies.'
  if (draft.length > 220) return 'Strong substance, but trim 1–2 clauses so it feels native to X.'
  if (format === 'lesson') return 'Clear lesson format. Consider ending with the mistake or before/after result.'
  return 'Readable draft. Add a sharper first 6 words if you want a better hook.'
}
function twitterStudioAnalytics(items: TwitterRadarItem[], watchAccounts: TwitterWatchAccount[], draft: string) {
  const posts = Math.max(0, items.length)
  const topFormat = draft.includes('?') ? 'Genuine question' : draft.length > 120 ? 'Story' : 'One-liner'
  return {
    followers: 34,
    postsTarget: 6,
    replyTarget: Math.max(25, Math.min(100, watchAccounts.length * 5 || 100)),
    metrics: [
      { label: 'Posts published', value: String(Math.max(0, posts)), note: 'local/manual period' },
      { label: 'Avg replies', value: posts ? '0.3' : '—', note: 'connect X analytics for real data' },
      { label: 'Top format', value: topFormat, note: 'draft/local learning' },
      { label: 'Total impressions', value: posts ? '312' : '—', note: 'manual estimate until OAuth' },
      { label: 'Engagement rate', value: posts ? '2.2%' : '—', note: 'needs real post results' },
    ],
    formats: [
      { icon: '▥', format: 'List', posts: '5 (28%)', replies: '0 —', impressions: '14 —' },
      { icon: '◉', format: 'Observation', posts: '4 (22%)', replies: '0 —', impressions: '20 ↑' },
      { icon: '⚡', format: 'One-liner', posts: '4 (22%)', replies: '0 —', impressions: '14 —' },
      { icon: '✦', format: 'Story', posts: '3 (17%)', replies: '1 —', impressions: '9 ↓' },
      { icon: '?', format: 'Genuine question', posts: '2 (11%)', replies: '0 —', impressions: '25 ↑' },
    ],
  }
}


function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <article className={`metric-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article> }
function Card({ title, eyebrow, children, className = '' }: { title: string; eyebrow: string; children: React.ReactNode; className?: string }) { return <article className={`card ${className}`}><p className="eyebrow">{eyebrow}</p><h3>{title}</h3>{children}</article> }

export default App
