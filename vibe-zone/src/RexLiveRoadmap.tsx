import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'

type JobStatus = 'running' | 'queued' | 'done' | 'needs-review' | 'failed'
type RexOverallStatus = 'idle' | 'thinking' | 'building' | 'checking' | 'reporting' | 'blocked'
type WorkshopStatus = 'sleeping' | 'warming' | 'active' | 'blocked' | 'complete'
type SkillStatus = 'active' | 'learning' | 'locked' | 'ready'

type RexJob = { id: string; title?: string; step?: string; status: JobStatus; detail: string; createdAt: string; command?: string }
type RexClip = { id: string; title: string; renderStatus?: JobStatus; status?: string; renderPreset?: string }
type RexSettings = { channelUrl?: string; streamSafeMode?: boolean; guardrails?: string[]; activeClipWorkflow?: { id?: string; label?: string; activeBatch?: string } }
type RexAppState = { mediaJobs: RexJob[]; jobs: RexJob[]; clips: RexClip[]; videos: { id: string; title: string; kind?: string }[]; settings?: RexSettings }
type Agent = { id: string; name: string; role: string; status: RexOverallStatus; focus: string }
type PipelineStage = { id: string; label: string; status: WorkshopStatus; count: number; detail: string }
type Workshop = { id: string; label: string; icon: string; status: WorkshopStatus; description: string; tasks: string[]; recentOutput: string[]; skills: string[]; signal: number }
type ActivityEvent = { id: string; title: string; detail: string; status: JobStatus; time: string; workshopId?: string }
type RexEvolution = { level: number; title: string; xp: number; nextXp: number; stage: string; nextStage: string; unlocks: string[] }
type SkillNode = { id: string; label: string; category: string; description: string; confidence: number; lastUsed: string; relatedTasks: string[]; status: SkillStatus; x: number; y: number }
type RexAgentState = { overallStatus: RexOverallStatus; activeAgents: Agent[]; currentTask?: ActivityEvent; pipeline: PipelineStage[]; workshops: Workshop[]; skills: SkillNode[]; evolution: RexEvolution; activityFeed: ActivityEvent[]; mood: string; improvements: string[] }
type LabAgentStatus = 'idle' | 'working' | 'error'
type LabAgent = { id: string; name: string; role: string; x: number; y: number; status: LabAgentStatus; level: number; xp: number; currentTask: string; modules: string[]; logs: string[] }

type PanelMode = { type: 'rex' } | { type: 'workshop'; id: string } | { type: 'skill-map' }
const statusRank: Record<WorkshopStatus, number> = { sleeping: 0, warming: 1, active: 2, blocked: 3, complete: 4 }

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
function jobTitle(job?: RexJob) { return job ? job.title || job.step || 'Rex task' : 'Waiting for useful work' }
function isBusy(status?: JobStatus) { return status === 'running' || status === 'queued' }
function workshopStatusFromJobs(jobs: RexJob[], patterns: RegExp[]): WorkshopStatus {
  if (jobs.some((job) => patterns.some((pattern) => pattern.test(`${jobTitle(job)} ${job.detail}`)) && job.status === 'failed')) return 'blocked'
  if (jobs.some((job) => patterns.some((pattern) => pattern.test(`${jobTitle(job)} ${job.detail}`)) && isBusy(job.status))) return 'active'
  if (jobs.some((job) => patterns.some((pattern) => pattern.test(`${jobTitle(job)} ${job.detail}`)) && job.status === 'done')) return 'complete'
  return jobs.some((job) => patterns.some((pattern) => pattern.test(`${jobTitle(job)} ${job.detail}`))) ? 'warming' : 'sleeping'
}

function useRexAgentState(state: RexAppState): RexAgentState {
  return useMemo(() => {
    // Adapter seam: replace the mock/workshop derivation below with websocket/SSE agent events when available.
    const allJobs = [...(state.mediaJobs || []), ...(state.jobs || [])].sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''))
    const busyJobs = allJobs.filter((job) => isBusy(job.status))
    const failedJobs = allJobs.filter((job) => job.status === 'failed')
    const latest = busyJobs[0] || allJobs[0]
    const renderedClips = (state.clips || []).filter((clip) => clip.renderStatus === 'done' || clip.status === 'exported').length
    const doneJobs = allJobs.filter((job) => job.status === 'done').length
    const workflow = state.settings?.activeClipWorkflow?.label || 'Confirmed Template #1 workflow'
    const overallStatus: RexOverallStatus = failedJobs.length ? 'blocked' : busyJobs.some((job) => /render|build|clip|code|fix|patch/i.test(`${jobTitle(job)} ${job.detail}`)) ? 'building' : busyJobs.length ? 'thinking' : latest?.status === 'done' ? 'reporting' : 'idle'
    const workshopSpecs = [
      { id: 'code-forge', label: 'Code Forge', icon: '⚒️', description: 'Implementation, refactors, page upgrades, and production wiring.', patterns: [/code|build|patch|component|frontend|css|app/i], skills: ['React components', 'Refactoring', 'API integration'] },
      { id: 'debug-den', label: 'Debug Den', icon: '🐛', description: 'Error tracing, broken media, failed builds, and regression fixes.', patterns: [/error|failed|fix|debug|crash|audio|broken|probe/i], skills: ['Error tracing', 'Console/log analysis', 'Regression fixes'] },
      { id: 'research-nest', label: 'Research Nest', icon: '🪺', description: 'Docs lookup, requirements analysis, competitive patterns, and source reading.', patterns: [/scan|research|docs|inspect|graph|search/i], skills: ['Docs lookup', 'Requirements analysis', 'Competitive patterns'] },
      { id: 'design-lab', label: 'Design Lab', icon: '🎛️', description: 'Premium UI, animation, layout systems, responsive behavior, and polish.', patterns: [/design|style|thumbnail|layout|template|animation|responsive/i], skills: ['Layout', 'Animation', 'Responsive UI', 'Accessibility'] },
      { id: 'test-track', label: 'Test Track', icon: '✅', description: 'Builds, linting, media probes, caption QA, and validation checks.', patterns: [/test|lint|build|verify|qa|ffprobe|validation|caption/i], skills: ['Unit checks', 'Build checks', 'Integration checks'] },
      { id: 'memory-vault', label: 'Memory Vault', icon: '🧠', description: 'Past decisions, reusable patterns, user preferences, and project knowledge.', patterns: [/memory|remember|decision|preference|workflow/i], skills: ['Past decisions', 'Known files', 'Reusable patterns'] },
      { id: 'dispatch-tower', label: 'Dispatch Tower', icon: '📡', description: 'Reports, summaries, posting queue, manual upload gates, and user updates.', patterns: [/dispatch|report|upload|queue|post|ready|send/i], skills: ['Reports', 'Release notes', 'Manual gates'] },
    ]
    const workshops = workshopSpecs.map((spec, index): Workshop => {
      const status = workshopStatusFromJobs(allJobs, spec.patterns)
      const related = allJobs.filter((job) => spec.patterns.some((pattern) => pattern.test(`${jobTitle(job)} ${job.detail}`))).slice(0, 3)
      return {
        id: spec.id,
        label: spec.label,
        icon: spec.icon,
        status,
        description: spec.description,
        skills: spec.skills,
        signal: statusRank[status] + index,
        tasks: related.length ? related.map((job) => streamSafeText(jobTitle(job))) : [`${spec.label} ${status === 'sleeping' ? 'sleeping' : 'warming up'}`],
        recentOutput: related.length ? related.map((job) => streamSafeText(job.detail)) : [`No live ${spec.label.toLowerCase()} task right now.`],
      }
    })
    const pipeline: PipelineStage[] = [
      { id: 'thinking', label: 'Thinking', status: overallStatus === 'thinking' ? 'active' : busyJobs.length ? 'warming' : 'complete', count: busyJobs.length, detail: 'Requirements, plan, safety gates.' },
      { id: 'building', label: 'Building', status: overallStatus === 'building' ? 'active' : renderedClips ? 'complete' : 'sleeping', count: renderedClips, detail: 'Code, media renders, UI changes.' },
      { id: 'checking', label: 'Checking', status: allJobs.some((job) => /build|lint|probe|verify|qa/i.test(job.detail)) ? 'complete' : 'warming', count: doneJobs, detail: 'Builds, lint, probes, QA.' },
      { id: 'reporting', label: 'Ready to Report', status: overallStatus === 'reporting' || !busyJobs.length ? 'active' : 'sleeping', count: state.clips.length, detail: 'Clean summary for Masala.' },
    ]
    const activityFeed = allJobs.slice(0, 12).map((job, index): ActivityEvent => ({ id: job.id || `activity-${index}`, title: jobTitle(job), detail: streamSafeText(job.detail), status: job.status, time: job.createdAt, workshopId: workshops.find((workshop) => workshop.recentOutput.some((output) => output === streamSafeText(job.detail)))?.id }))
    const xp = Math.min(980, 180 + doneJobs * 12 + renderedClips * 34 + workshops.filter((workshop) => workshop.status === 'complete').length * 30)
    const level = Math.min(5, Math.max(1, Math.floor(xp / 220) + 1))
    const stages = ['Hatchling Helper', 'Junior Builder', 'Code Ranger', 'Systems Rex', 'Master Architect']
    const skillCategories = [
      ['Coding', ['React components', 'State management', 'API integration', 'Refactoring']],
      ['Design', ['Layout', 'Animation', 'Responsive UI', 'Accessibility']],
      ['Debugging', ['Error tracing', 'Console/log analysis', 'Regression fixes']],
      ['Research', ['Docs lookup', 'Requirements analysis', 'Competitive patterns']],
      ['Testing', ['Unit tests', 'Integration checks', 'Build checks']],
      ['Product', ['Roadmap', 'User stories', 'Release notes']],
      ['Project Memory', ['Past decisions', 'Known files', 'Reusable patterns']],
    ] as const
    const skills: SkillNode[] = skillCategories.flatMap(([category, labels], catIndex) => labels.map((label, skillIndex) => {
      const angle = ((catIndex / skillCategories.length) * Math.PI * 2) + (skillIndex - 1.5) * 0.12
      const radius = 34 + skillIndex * 8
      const active = workshops.some((workshop) => workshop.status === 'active' && workshop.skills.includes(label))
      return { id: `${category}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label, category, description: `${label} confidence grows as Rex completes ${category.toLowerCase()} work.`, confidence: Math.min(98, 52 + level * 7 + skillIndex * 4 + (active ? 12 : 0)), lastUsed: active ? 'now' : doneJobs ? 'recently' : 'waiting', relatedTasks: activityFeed.slice(0, 3).map((event) => event.title), status: active ? 'active' : level >= 4 || skillIndex < 2 ? 'ready' : skillIndex === 3 ? 'learning' : 'locked', x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius }
    }))
    return {
      overallStatus,
      activeAgents: busyJobs.length ? busyJobs.slice(0, 4).map((job, index) => ({ id: job.id, name: ['Rex Planner', 'Forge Agent', 'QA Scout', 'Dispatch Rex'][index] || 'Rex Worker', role: jobTitle(job), status: overallStatus, focus: streamSafeText(job.detail) })) : [{ id: 'rex-watch', name: 'Rex', role: 'Command center watch', status: overallStatus, focus: latest ? streamSafeText(latest.detail) : 'Waiting for the next useful move.' }],
      currentTask: activityFeed[0], pipeline, workshops, skills,
      evolution: { level, title: stages[level - 1], xp, nextXp: Math.min(1100, level * 220), stage: stages[level - 1], nextStage: stages[Math.min(stages.length - 1, level)] || 'Max evolution', unlocks: ['Gotham seed frames', 'Wrapped-title guard', 'Raw-source audio path', workflow].slice(0, 4) },
      activityFeed,
      mood: overallStatus === 'blocked' ? 'Alert but calm' : overallStatus === 'building' ? 'Laser-focused' : overallStatus === 'reporting' ? 'Proud and ready' : 'Watching the workshop',
      improvements: ['Cleaner active pipeline', 'Audio rebuild path', 'Wrapped title rules', 'Seed-frame workflow'].slice(0, Math.max(2, level)),
    }
  }, [state])
}

export default function RexLiveRoadmap({ state }: { state: RexAppState }) {
  const rex = useRexAgentState(state)
  const [panel, setPanel] = useState<PanelMode | null>(null)
  const [selectedSkillId, setSelectedSkillId] = useState<string>(rex.skills.find((skill) => skill.status === 'active')?.id || rex.skills[0]?.id || '')
  const selectedWorkshop = panel?.type === 'workshop' ? rex.workshops.find((workshop) => workshop.id === panel.id) : undefined
  const selectedSkill = rex.skills.find((skill) => skill.id === selectedSkillId) || rex.skills[0]
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') setPanel(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const statusLine = rex.overallStatus === 'building' ? 'Agents are building' : rex.overallStatus === 'blocked' ? 'Rex found a blocker' : rex.overallStatus === 'reporting' ? 'Ready to report' : 'Rex is watching'
  return <section className={`rex-command-page rex-status-${rex.overallStatus}`}>
    <div className="rex-showpiece-intro" aria-label="Rex dashboard design direction">
      <div className="rex-showpiece-copy">
        <p className="eyebrow">Competition-grade command habitat</p>
        <h2>Rex’s live ops arena</h2>
        <p>A cinematic control room for the bots: intake, build lanes, QA gates, media output, and Rex’s evolving brain in one stream-safe cockpit.</p>
      </div>
      <div className="rex-showpiece-metrics" aria-label="Rex dashboard summary">
        <span><strong>{rex.workshops.filter((workshop) => workshop.status === 'active').length}</strong><small>Active lanes</small></span>
        <span><strong>{rex.evolution.level}</strong><small>Rex level</small></span>
        <span><strong>{rex.pipeline.filter((stage) => stage.status === 'complete').length}</strong><small>Checked gates</small></span>
      </div>
    </div>
    <TrexAgentLabDashboard />
    <div className="rex-command-hero" aria-label="Rex Command Center"><div className="rex-hero-grid" aria-hidden="true" />
      <div className="rex-brand-row"><button className="rex-brand-button" type="button" onClick={() => setPanel({ type: 'skill-map' })} aria-label="Open Rex Skill Map"><span className="rex-brand-orb">🦖</span><span><small>Rex Command Center</small><strong>Roadmap + Activity + Jobs</strong></span><em>Open Skill Map</em></button><RexStatusBadge status={rex.overallStatus} label={statusLine} /></div>
      <div className="rex-command-layout"><div className="rex-orbit-field"><RexWorkshops workshops={rex.workshops} onOpen={(id) => setPanel({ type: 'workshop', id })} /><RexCharacter rex={rex} onOpen={() => setPanel({ type: 'rex' })} /><RexWorkBeams workshops={rex.workshops} /></div><aside className="rex-side-stack"><RexEvolutionPanel evolution={rex.evolution} mood={rex.mood} /><RexPipeline stages={rex.pipeline} /></aside></div>
    </div>
    <div className="rex-command-lower"><RexActivityFeed events={rex.activityFeed} /><div className="rex-agent-card"><p className="eyebrow">Active agents</p>{rex.activeAgents.map((agent) => <article key={agent.id}><strong>{agent.name}</strong><span>{agent.role}</span><small>{agent.focus}</small></article>)}</div></div>
    {panel ? <div className="rex-modal-backdrop" role="presentation" onMouseDown={() => setPanel(null)}><section className={`rex-modal rex-modal-${panel.type}`} role="dialog" aria-modal="true" aria-label={panel.type === 'skill-map' ? 'Rex Skill Map' : panel.type === 'rex' ? 'Rex Core' : 'Workshop details'} onMouseDown={(event) => event.stopPropagation()}><button className="rex-modal-close" type="button" onClick={() => setPanel(null)} aria-label="Close Rex panel">×</button>{panel.type === 'rex' ? <RexCore rex={rex} /> : panel.type === 'skill-map' ? <RexSkillMap skills={rex.skills} selectedSkill={selectedSkill} onSelect={setSelectedSkillId} /> : selectedWorkshop ? <RexWorkshopPanel workshop={selectedWorkshop} /> : null}</section></div> : null}
  </section>
}

function RexStatusBadge({ status, label }: { status: RexOverallStatus; label: string }) { return <div className={`rex-status-badge ${status}`}><span /><strong>{label}</strong></div> }

const labTasks = ['Route Telegram intake', 'Review bot queue health', 'Protect template assets', 'Draft next build slice', 'Check local dashboard', 'Summarize controller handoff']
const labIcons: Record<string, string> = { planner: '🧭', controller: '🛡️', rex: '🦖', media: '🎞️', social: '📡', core: '🏗️', ceo: '👑', youtube: '🎯' }
const initialLabAgents: LabAgent[] = [
  { id: 'planner', name: 'Planner', role: 'Primary intake/router', x: 2, y: 2, status: 'working', level: 3, xp: 5, currentTask: 'Turning Telegram asks into queue items.', modules: ['Intent Router', 'Priority Map', 'Queue Writer'], logs: ['Planner restored as primary intake.', 'Controller set as QA fallback.'] },
  { id: 'controller', name: 'Controller', role: 'QA + routing fallback', x: 5, y: 5, status: 'idle', level: 3, xp: 8, currentTask: 'Watching for overlapping bot work.', modules: ['Ship Gate', 'Conflict Check', 'Audit Trail'], logs: ['Old cron loops disabled.', 'Purge guardrails active.'] },
  { id: 'rex', name: 'Rex', role: 'Mascot/co-builder', x: 8, y: 3, status: 'working', level: 4, xp: 2, currentTask: 'Evolving the command center.', modules: ['Builder Brain', 'Memory Recall', 'Taste Guard'], logs: ['T‑REX Lab mounted into live dashboard.'] },
  { id: 'media', name: 'Media', role: 'Clip/asset factory', x: 10, y: 6, status: 'idle', level: 2, xp: 4, currentTask: 'Idle until new logic system lands.', modules: ['Clip Factory', 'Caption QA', 'Render Notes'], logs: ['Uploaded media cleanup requires confirmation.'] },
  { id: 'social', name: 'Social', role: 'Social packaging lane', x: 3, y: 6, status: 'idle', level: 2, xp: 1, currentTask: 'Waiting for platform strategy cleanup.', modules: ['Hook Lab', 'Thumbnail Pack', 'Dispatch Drafts'], logs: ['YouTube bot folded toward social packaging.'] },
  { id: 'ceo', name: 'CEO', role: 'Direction + priority', x: 7, y: 1, status: 'working', level: 1, xp: 7, currentTask: 'Keeping product direction clean.', modules: ['Decision Gate', 'Scope Knife', 'North Star'], logs: ['CEO terminal bot re-enabled.'] },
]

function TrexAgentLabDashboard() {
  const [agents, setAgents] = useState<LabAgent[]>(initialLabAgents)
  const [selectedId, setSelectedId] = useState(initialLabAgents[0].id)
  const [completed, setCompleted] = useState(0)
  const selected = agents.find((agent) => agent.id === selectedId) || agents[0]
  const rexLevel = Math.max(1, Math.floor(completed / 4) + 1)
  const rexXp = completed % 4
  useEffect(() => {
    const timer = window.setInterval(() => {
      setAgents((current) => current.map((agent) => {
        if (Math.random() > 0.45) return agent
        const status: LabAgentStatus = Math.random() < 0.12 ? 'error' : Math.random() < 0.72 ? 'working' : 'idle'
        const completedTask = status === 'working' && Math.random() < 0.38
        if (completedTask) setCompleted((value) => value + 1)
        const xp = agent.xp + (completedTask ? 2 : 0)
        const levelUp = xp >= 10
        const log = completedTask ? `Completed: ${agent.currentTask}` : status === 'error' ? 'Needs human/controller check.' : status === 'working' ? 'Picked up a live lab task.' : 'Monitoring quietly.'
        return {
          ...agent,
          status,
          x: Math.max(0, Math.min(11, agent.x + [-1, 0, 1][Math.floor(Math.random() * 3)])),
          y: Math.max(0, Math.min(7, agent.y + [-1, 0, 1][Math.floor(Math.random() * 3)])),
          xp: levelUp ? xp - 10 : xp,
          level: agent.level + (levelUp ? 1 : 0),
          currentTask: status === 'working' ? labTasks[Math.floor(Math.random() * labTasks.length)] : agent.currentTask,
          logs: [log, ...agent.logs].slice(0, 8),
        }
      }))
    }, 1800)
    return () => window.clearInterval(timer)
  }, [])
  return <section className="trex-live-lab" aria-label="T-Rex Agent Lab live board">
    <div className="trex-lab-head"><div><p className="eyebrow">Live agent habitat</p><h2>T‑REX Agent Lab</h2><span>Click a Sim to inspect its brain. This is the live dashboard, not the standalone prototype.</span></div><div className="trex-lab-meter"><strong>Rex Lv {rexLevel}</strong><i><b style={{ width: `${(rexXp / 4) * 100}%` }} /></i><small>{completed} lab tasks completed</small></div></div>
    <div className="trex-lab-grid-shell"><div className="trex-lab-board">{agents.map((agent) => <button key={agent.id} type="button" className={`trex-lab-agent ${agent.status} ${agent.id === selected.id ? 'selected' : ''}`} style={{ left: `${((agent.x + 0.5) / 12) * 100}%`, top: `${((agent.y + 0.5) / 8) * 100}%` }} onClick={() => setSelectedId(agent.id)} aria-label={`Inspect ${agent.name}, ${agent.role}, ${agent.status}`}><span>{labIcons[agent.id] || '🤖'}</span><strong>{agent.name}</strong></button>)}</div><aside className="trex-brain-panel"><p className="eyebrow">Brain inspector</p><div className="brain-title"><h3>{selected.name}</h3><em className={selected.status}>{selected.status}</em></div><p>{selected.role}</p><div className="brain-task"><small>Current task</small><strong>{selected.currentTask}</strong></div><div className="brain-xp"><span>Lv {selected.level}</span><i><b style={{ width: `${(selected.xp / 10) * 100}%` }} /></i><span>{selected.xp}/10 XP</span></div><div className="brain-modules">{selected.modules.map((module) => <span key={module}>{module}</span>)}</div><div className="brain-logs">{selected.logs.map((log, index) => <p key={`${log}-${index}`}>› {log}</p>)}</div></aside></div>
  </section>
}

function RexCharacter({ rex, onOpen }: { rex: RexAgentState; onOpen: () => void }) { return <button className={`rex-character ${rex.overallStatus}`} type="button" onClick={onOpen} aria-label="Open Rex Core details"><span className="rex-thoughts"><i /><i /><i /></span><span className="rex-scan-ring" /><span className="rex-dino" aria-hidden="true">🦖</span><span className="rex-tail" /><span className="rex-sparks"><i /><i /><i /></span><strong>{rex.mood}</strong><small>{rex.currentTask?.title || 'Waiting for work'}</small></button> }
function RexWorkshops({ workshops, onOpen }: { workshops: Workshop[]; onOpen: (id: string) => void }) { return <div className="rex-workshop-orbit">{workshops.map((workshop, index) => <button key={workshop.id} type="button" className={`rex-workshop-node ${workshop.status}`} style={{ '--node-index': index, '--node-count': workshops.length } as CSSProperties} onClick={() => onOpen(workshop.id)} aria-label={`Open ${workshop.label}, status ${workshop.status}`} title={`${workshop.label}: ${workshop.status}`}><span className="workshop-icon">{workshop.icon}</span><strong>{workshop.label}</strong><small>{workshop.status.replace('-', ' ')}</small><i className="worker-dot" /><i className="worker-dot second" /></button>)}</div> }
function RexWorkBeams({ workshops }: { workshops: Workshop[] }) { return <div className="rex-work-beams" aria-hidden="true">{workshops.map((workshop, index) => <i key={workshop.id} className={workshop.status} style={{ '--beam-index': index, '--beam-opacity': workshop.status === 'active' ? 1 : 0.35 } as CSSProperties} />)}</div> }
function RexPipeline({ stages }: { stages: PipelineStage[] }) { return <div className="rex-panel-card rex-pipeline"><p className="eyebrow">Status pipeline</p>{stages.map((stage, index) => <div className={`rex-pipeline-stage ${stage.status}`} key={stage.id}><span>{index + 1}</span><div><strong>{stage.label}</strong><small>{stage.detail}</small></div><em>{stage.count}</em></div>)}</div> }
function RexEvolutionPanel({ evolution, mood }: { evolution: RexEvolution; mood: string }) { const pct = Math.min(100, Math.round((evolution.xp / Math.max(evolution.nextXp, 1)) * 100)); return <div className="rex-panel-card rex-evolution"><p className="eyebrow">Evolution</p><div className="evolution-top"><strong>Lv {evolution.level}</strong><span>{evolution.title}</span></div><div className="rex-xp-bar"><i style={{ width: `${pct}%` }} /></div><small>{evolution.xp}/{evolution.nextXp} XP • Mood: {mood}</small><ul>{evolution.unlocks.map((unlock) => <li key={unlock}>Skill unlocked: {unlock}</li>)}</ul><em>Next: {evolution.nextStage}</em></div> }
function eventTimeLabel(value: string) {
  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime()) ? 'now' : timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function RexActivityFeed({ events }: { events: ActivityEvent[] }) { return <div className="rex-panel-card rex-feed"><p className="eyebrow">Live activity feed</p>{events.length ? events.map((event) => <article key={event.id} className={`feed-event ${event.status}`}><span /><div><strong>{event.title}</strong><small>{event.detail}</small></div><time>{eventTimeLabel(event.time)}</time></article>) : <p>Rex is watching. Activity appears here as agents work.</p>}</div> }
function RexCore({ rex }: { rex: RexAgentState }) { return <div className="rex-core-panel"><p className="eyebrow">Rex Core</p><h3>{rex.evolution.title}</h3><div className="rex-core-grid"><Info label="Current status" value={rex.overallStatus} /><Info label="Active task" value={rex.currentTask?.title || 'Idle watch'} /><Info label="Agent mode" value={rex.activeAgents.map((agent) => agent.name).join(', ')} /><Info label="XP / Level" value={`${rex.evolution.xp} XP • Level ${rex.evolution.level}`} /><Info label="Mood" value={rex.mood} /><Info label="Next evolution" value={rex.evolution.nextStage} /></div><h4>Recent improvements</h4><ul>{rex.improvements.map((item) => <li key={item}>{item}</li>)}</ul><h4>Unlocked skills</h4><div className="skill-pill-row">{rex.skills.filter((skill) => skill.status !== 'locked').slice(0, 12).map((skill) => <span key={skill.id}>{skill.label} {skill.confidence}%</span>)}</div></div> }
function RexWorkshopPanel({ workshop }: { workshop: Workshop }) { return <div className="rex-workshop-panel"><p className="eyebrow">Workshop online</p><h3>{workshop.icon} {workshop.label}</h3><RexStatusBadge status={workshop.status === 'blocked' ? 'blocked' : workshop.status === 'active' ? 'building' : workshop.status === 'complete' ? 'reporting' : 'idle'} label={workshop.status} /><p>{workshop.description}</p><h4>Current tasks</h4><ul>{workshop.tasks.map((task) => <li key={task}>{task}</li>)}</ul><h4>Recent output</h4><ul>{workshop.recentOutput.map((output) => <li key={output}>{output}</li>)}</ul><h4>Related skills</h4><div className="skill-pill-row">{workshop.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div> }
function RexSkillMap({ skills, selectedSkill, onSelect }: { skills: SkillNode[]; selectedSkill?: SkillNode; onSelect: (id: string) => void }) { const categories = Array.from(new Set(skills.map((skill) => skill.category))); const onKey = (event: KeyboardEvent<HTMLButtonElement>, id: string) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(id) } }; return <div className="rex-skill-map-panel"><p className="eyebrow">Rex Skill Map</p><h3>Clickable agent mind map</h3><div className="skill-map-canvas"><div className="skill-map-center">🦖<strong>Rex</strong></div>{categories.map((category, index) => <span className="skill-branch-label" key={category} style={{ '--branch-index': index, '--branch-count': categories.length } as CSSProperties}>{category}</span>)}{skills.map((skill) => <button key={skill.id} type="button" className={`skill-node ${skill.status} ${selectedSkill?.id === skill.id ? 'selected' : ''}`} style={{ left: `${skill.x}%`, top: `${skill.y}%` }} onClick={() => onSelect(skill.id)} onKeyDown={(event) => onKey(event, skill.id)} aria-label={`${skill.label}, ${skill.confidence} percent confidence`}><span>{skill.label}</span></button>)}</div>{selectedSkill ? <aside className="skill-detail"><strong>{selectedSkill.label}</strong><span>{selectedSkill.category} • {selectedSkill.status}</span><p>{selectedSkill.description}</p><div className="rex-xp-bar"><i style={{ width: `${selectedSkill.confidence}%` }} /></div><small>Confidence {selectedSkill.confidence}% • Last used {selectedSkill.lastUsed}</small><ul>{selectedSkill.relatedTasks.map((task) => <li key={task}>{task}</li>)}</ul></aside> : null}</div> }
function Info({ label, value }: { label: string; value: string }) { return <div className="info-tile"><span>{label}</span><strong>{value}</strong></div> }
