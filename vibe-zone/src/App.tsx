import { useMemo, useState } from 'react'
import './App.css'

type PageId =
  | 'dashboard'
  | 'clip-factory'
  | 'viral-research'
  | 'studio-feedback'
  | 'social-dashboard'
  | 'live-chat'
  | 'rex-jobs'
  | 'settings'

type NavItem = {
  id: PageId
  label: string
  icon: string
  kicker: string
}

type JobStatus = 'running' | 'queued' | 'done' | 'needs-review'

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', kicker: 'Today' },
  { id: 'clip-factory', label: 'Clip Factory', icon: '🎬', kicker: 'Video ops' },
  { id: 'viral-research', label: 'Viral Research', icon: '📈', kicker: 'Ideas' },
  { id: 'studio-feedback', label: 'Studio Feedback', icon: '🎙️', kicker: 'Stream quality' },
  { id: 'social-dashboard', label: 'Social Dashboard', icon: '📣', kicker: 'Drafts only' },
  { id: 'live-chat', label: 'Live Chat Co-Pilot', icon: '💬', kicker: 'Assist mode' },
  { id: 'rex-jobs', label: 'Rex Activity / Jobs', icon: '🦖', kicker: 'Agent work' },
  { id: 'settings', label: 'Settings', icon: '⚙️', kicker: 'Local-first' },
]

const youtubeChannel = 'https://www.youtube.com/@ModernResponsibility'

const stats = [
  { label: 'Clips ready', value: '12', detail: '+4 from last stream', tone: 'green' },
  { label: 'Ideas queued', value: '37', detail: '8 strong hooks', tone: 'purple' },
  { label: 'Draft posts', value: '9', detail: '0 auto-posting', tone: 'amber' },
  { label: 'Agent jobs', value: '5', detail: '2 running locally', tone: 'blue' },
]

const streamPlan = [
  { time: '19:45', title: 'Warm-up + roadmap recap', status: 'ready' },
  { time: '20:05', title: 'Build Vibe Zone settings schema', status: 'next' },
  { time: '21:10', title: 'Clip review: 5 strongest moments', status: 'queued' },
  { time: '21:30', title: 'Ship notes + tomorrow plan', status: 'queued' },
]

const clips = [
  {
    title: '“Cheap-first dashboard stack”',
    source: 'Stream 012 • 00:14:22-00:15:09',
    score: 92,
    hook: 'Stop overbuilding your creator tools.',
    platforms: ['TikTok', 'Shorts', 'Reels'],
  },
  {
    title: 'Rex explains local-first agents',
    source: 'Stream 012 • 01:03:18-01:04:01',
    score: 88,
    hook: 'Your AI assistant should not need the cloud for everything.',
    platforms: ['YouTube', 'LinkedIn'],
  },
  {
    title: 'Debugging live without panicking',
    source: 'Stream 011 • 00:48:05-00:49:12',
    score: 81,
    hook: 'The stream-safe way to handle broken builds.',
    platforms: ['TikTok', 'X'],
  },
]

const trends = [
  { topic: 'AI agents that actually do work', heat: 'High', angle: 'Show a real local workflow, not a demo prompt.' },
  { topic: 'Build in public dashboards', heat: 'Rising', angle: 'From messy stream notes to product roadmap.' },
  { topic: 'Creator automation boundaries', heat: 'Medium', angle: 'Draft everything, auto-post nothing.' },
  { topic: 'Cheap SaaS architecture', heat: 'High', angle: 'Start SQLite/local JSON before buying platforms.' },
]

const feedback = [
  { area: 'Audio', grade: 'A-', note: 'Voice clear. Add peak warning if music overlaps mic.' },
  { area: 'Pacing', grade: 'B+', note: 'Strong build momentum; add chapter cards every 20 minutes.' },
  { area: 'Privacy', grade: 'A', note: 'Keep stream-safe warning banner near secret/env surfaces.' },
  { area: 'Chat', grade: 'B', note: 'Add “question parking lot” for catch-up moments.' },
]

const posts = [
  { platform: 'YouTube Shorts', status: 'Draft', copy: 'I built a local-first control room for my livestream workflow.' },
  { platform: 'X', status: 'Needs review', copy: 'Tiny product idea: one dashboard for clips, research, chat, and agent jobs.' },
  { platform: 'LinkedIn', status: 'Draft', copy: 'Local-first tooling is underrated for creators building in public.' },
]

const chatPrompts = [
  'Summarize the last 10 minutes for a new viewer.',
  'Turn this bug into a teachable moment.',
  'Ask chat which feature should ship next.',
  'Create a privacy-safe explanation of the config screen.',
]

const jobs: Array<{ name: string; status: JobStatus; owner: string; detail: string }> = [
  { name: 'Scan transcript for clip candidates', status: 'running', owner: 'Rex', detail: 'Chunking local transcript files.' },
  { name: 'Draft tomorrow stream outline', status: 'queued', owner: 'Rex', detail: 'Waiting for product priorities.' },
  { name: 'Build Vibe Zone scaffold', status: 'running', owner: 'Rex', detail: 'Creating first usable version.' },
  { name: 'Check social post wording', status: 'needs-review', owner: 'Masala', detail: 'Human approval required before anything external.' },
  { name: 'Export 3 vertical clip drafts', status: 'done', owner: 'Local tool', detail: 'Mock export complete.' },
]

const settings = [
  { key: 'Default YouTube channel', value: youtubeChannel, safe: true },
  { key: 'Storage mode', value: 'Local JSON / browser state first', safe: true },
  { key: 'Posting mode', value: 'Draft-only; manual approval required', safe: true },
  { key: 'Secrets policy', value: 'Use .env.local, never commit keys', safe: true },
  { key: 'Future integrations', value: 'GitHub, OBS, YouTube, Twitch, local clipper', safe: false },
]

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const current = useMemo(() => navItems.find((item) => item.id === activePage) ?? navItems[0], [activePage])

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Vibe Zone navigation">
        <div className="brand-card">
          <div className="brand-mark">VZ</div>
          <div>
            <p className="eyebrow">Masala's local control room</p>
            <h1>Vibe Zone</h1>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              className={item.id === activePage ? 'nav-item active' : 'nav-item'}
              key={item.id}
              onClick={() => setActivePage(item.id)}
              type="button"
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.kicker}</small>
              </span>
            </button>
          ))}
        </nav>
        <div className="stream-safe">
          <strong>Stream-safe mode</strong>
          <span>No secrets, no logins, no external posting from this UI.</span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{current.kicker}</p>
            <h2>{current.icon} {current.label}</h2>
          </div>
          <div className="status-pill"><span /> Local-first prototype</div>
        </header>
        <Page page={activePage} />
      </main>
    </div>
  )
}

function Page({ page }: { page: PageId }) {
  switch (page) {
    case 'clip-factory':
      return <ClipFactory />
    case 'viral-research':
      return <ViralResearch />
    case 'studio-feedback':
      return <StudioFeedback />
    case 'social-dashboard':
      return <SocialDashboard />
    case 'live-chat':
      return <LiveChat />
    case 'rex-jobs':
      return <RexJobs />
    case 'settings':
      return <Settings />
    default:
      return <Dashboard />
  }
}

function Dashboard() {
  return (
    <section className="page-grid">
      <div className="hero-card full-span">
        <div>
          <p className="eyebrow">Today's mission</p>
          <h3>Turn livestream chaos into a product-building cockpit.</h3>
          <p>Track clips, research, social drafts, chat help, and Rex's local jobs without paying for a pile of SaaS before the workflow earns it.</p>
        </div>
        <button type="button">Plan next stream</button>
      </div>
      <div className="stat-grid full-span">
        {stats.map((stat) => <MetricCard key={stat.label} {...stat} />)}
      </div>
      <Card title="Run of show" eyebrow="Next stream">
        <ol className="timeline">
          {streamPlan.map((item) => (
            <li key={item.title}>
              <time>{item.time}</time>
              <span><strong>{item.title}</strong><small>{item.status}</small></span>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Quick actions" eyebrow="Low-friction">
        <div className="action-list">
          <button type="button">Import transcript</button>
          <button type="button">Review best clips</button>
          <button type="button">Draft social pack</button>
          <button type="button">Create Rex job</button>
        </div>
      </Card>
    </section>
  )
}

function ClipFactory() {
  return (
    <section className="page-grid">
      <Card title="Candidate clips" eyebrow="Mock scoring" className="full-span">
        <div className="clip-list">
          {clips.map((clip) => (
            <article className="clip-card" key={clip.title}>
              <div className="clip-score">{clip.score}</div>
              <div>
                <h3>{clip.title}</h3>
                <p>{clip.source}</p>
                <blockquote>{clip.hook}</blockquote>
                <div className="tag-row">{clip.platforms.map((platform) => <span key={platform}>{platform}</span>)}</div>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </section>
  )
}

function ViralResearch() {
  return (
    <section className="page-grid">
      {trends.map((trend) => (
        <Card key={trend.topic} title={trend.topic} eyebrow={`Heat: ${trend.heat}`}>
          <p>{trend.angle}</p>
        </Card>
      ))}
    </section>
  )
}

function StudioFeedback() {
  return (
    <section className="page-grid">
      {feedback.map((item) => (
        <Card key={item.area} title={item.area} eyebrow={`Grade ${item.grade}`}>
          <p>{item.note}</p>
        </Card>
      ))}
    </section>
  )
}

function SocialDashboard() {
  return (
    <section className="page-grid">
      <Card title="Draft queue" eyebrow="Manual approval only" className="full-span">
        <div className="table-list">
          {posts.map((post) => (
            <div className="table-row" key={post.platform}>
              <strong>{post.platform}</strong>
              <span>{post.status}</span>
              <p>{post.copy}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}

function LiveChat() {
  return (
    <section className="page-grid">
      <Card title="Co-pilot prompts" eyebrow="Copy/paste helpers" className="full-span">
        <div className="prompt-grid">
          {chatPrompts.map((prompt) => <button type="button" key={prompt}>{prompt}</button>)}
        </div>
      </Card>
      <Card title="Question parking lot" eyebrow="Mock inbox">
        <p>“Can you explain why local-first matters for stream tools?”</p>
      </Card>
      <Card title="Chat pulse" eyebrow="Sentiment">
        <p>Curious, technical, wants more visuals and fewer setup details.</p>
      </Card>
    </section>
  )
}

function RexJobs() {
  return (
    <section className="page-grid">
      <Card title="Agent activity" eyebrow="Local job board" className="full-span">
        <div className="job-list">
          {jobs.map((job) => (
            <article className="job-row" key={job.name}>
              <span className={`dot ${job.status}`} />
              <div>
                <h3>{job.name}</h3>
                <p>{job.detail}</p>
              </div>
              <small>{job.owner} • {job.status}</small>
            </article>
          ))}
        </div>
      </Card>
    </section>
  )
}

function Settings() {
  return (
    <section className="page-grid">
      <Card title="Operating principles" eyebrow="Guardrails" className="full-span">
        <div className="settings-grid">
          {settings.map((item) => (
            <div className="setting-card" key={item.key}>
              <strong>{item.key}</strong>
              <span>{item.value}</span>
              <small>{item.safe ? 'Enabled now' : 'Future integration'}</small>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Environment variables" eyebrow="Planned">
        <code>VITE_APP_MODE=local</code>
        <code>VITE_ENABLE_MOCKS=true</code>
      </Card>
      <Card title="Data path" eyebrow="Planned">
        <p>Start with committed mock data, then move to local JSON/SQLite behind an API when workflows stabilize.</p>
      </Card>
    </section>
  )
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function Card({ title, eyebrow, children, className = '' }: { title: string; eyebrow: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={`card ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      {children}
    </article>
  )
}

export default App
