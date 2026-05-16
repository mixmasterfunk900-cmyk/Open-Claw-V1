const GRID = { cols: 12, rows: 8 };
const XP_PER_LEVEL = 10;
const TREX_XP_PER_LEVEL = 12;

const tasks = [
  'Route Telegram intake to Planner',
  'Audit clip template drift',
  'Summarize active queues',
  'Inspect local dashboard health',
  'Draft next build objective',
  'Verify no cron loops are stomping state',
  'Prepare social packaging notes',
  'Archive stale logs safely'
];

const agentIcons = {
  planner: '🧭',
  coder: '🛠️',
  critic: '🧪',
  memory: '📚',
  controller: '🛡️',
  social: '📡'
};

let agents = [
  {
    id: 'planner', name: 'Planner', role: 'High-level strategy', x: 2, y: 2, status: 'working', level: 3, xp: 4,
    currentTask: 'Breaking Masala’s goal into clean bot queues.', modules: ['Intent Router', 'Roadmap Sequencer', 'Conflict Radar'],
    logs: seedLogs('Planner booted with Telegram intake rules.')
  },
  {
    id: 'coder', name: 'Coder', role: 'Implementation engine', x: 5, y: 5, status: 'idle', level: 2, xp: 7,
    currentTask: 'Waiting for a scoped build ticket.', modules: ['Patch Writer', 'Test Runner', 'File Scout'],
    logs: seedLogs('Coder checked the workspace and is standing by.')
  },
  {
    id: 'critic', name: 'Critic', role: 'QA and regression hunter', x: 8, y: 3, status: 'working', level: 4, xp: 2,
    currentTask: 'Scanning for title-zone regressions.', modules: ['Visual Gate', 'Risk Notes', 'Ship Blocker'],
    logs: seedLogs('Critic found one weak visual assumption to revisit.')
  },
  {
    id: 'memory', name: 'Archivist', role: 'Long-term memory keeper', x: 10, y: 6, status: 'idle', level: 2, xp: 1,
    currentTask: 'Indexing reset rules and template locks.', modules: ['Memory Index', 'Daily Notes', 'Source Links'],
    logs: seedLogs('Archivist preserved the reset clarification.')
  },
  {
    id: 'controller', name: 'Controller', role: 'Shipping gate', x: 3, y: 6, status: 'idle', level: 3, xp: 8,
    currentTask: 'Watching for overlapping bot work.', modules: ['QA Gate', 'Merge Guard', 'Ship Log'],
    logs: seedLogs('Controller synced with Planner as routing fallback.')
  },
  {
    id: 'social', name: 'Social', role: 'Packaging signals', x: 7, y: 1, status: 'error', level: 1, xp: 6,
    currentTask: 'Waiting for platform lane cleanup.', modules: ['Hook Lab', 'Thumbnail Notes', 'Caption Voice'],
    logs: seedLogs('Social lane needs YouTube bot consolidation.')
  }
];

let selectedAgentId = null;
let totalTasksCompleted = 0;
let trex = { level: 1, xp: 0, mood: 'curious' };

const board = document.querySelector('#agent-board');
const inspector = document.querySelector('#brain-inspector');
const activeCount = document.querySelector('#active-count');
const taskCount = document.querySelector('#task-count');
const alertCount = document.querySelector('#alert-count');
const trexMood = document.querySelector('#trex-mood');
const trexSummary = document.querySelector('#trex-summary');
const trexLevel = document.querySelector('#trex-level');
const trexXp = document.querySelector('#trex-xp');
const trexProgress = document.querySelector('#trex-progress');
const trexAvatar = document.querySelector('#trex-avatar');

function seedLogs(first) {
  return [
    makeLog(first, -2),
    makeLog('Heartbeat stable. Awaiting next useful move.', -1)
  ];
}

function makeLog(text, minutesAgo = 0) {
  const date = new Date(Date.now() + minutesAgo * 60_000);
  return { at: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), text };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function statusCopy(status) {
  return status === 'working' ? 'Working' : status === 'error' ? 'Needs attention' : 'Idle';
}

function statusLog(status) {
  if (status === 'working') return 'Picked up a task and started thinking.';
  if (status === 'error') return 'Hit a snag; requesting a cleaner instruction.';
  return 'Returned to idle and is monitoring the lab.';
}

function renderBoard() {
  board.innerHTML = '';
  agents.forEach(agent => {
    const button = document.createElement('button');
    button.className = `agent-token ${selectedAgentId === agent.id ? 'selected' : ''}`;
    button.dataset.status = agent.status;
    button.style.left = `${((agent.x + 0.5) / GRID.cols) * 100}%`;
    button.style.top = `${((agent.y + 0.5) / GRID.rows) * 100}%`;
    button.type = 'button';
    button.setAttribute('aria-label', `${agent.name}, ${agent.role}, ${statusCopy(agent.status)}. Click to inspect brain.`);
    button.innerHTML = `
      <span class="agent-status-dot" aria-hidden="true"></span>
      <span class="agent-body" aria-hidden="true">${agentIcons[agent.id] || '🤖'}</span>
      <span class="agent-name">${agent.name}</span>
    `;
    button.addEventListener('click', () => selectAgent(agent.id, button));
    board.appendChild(button);
  });
}

function selectAgent(id, element) {
  selectedAgentId = id;
  if (element) {
    element.classList.remove('pulse');
    void element.offsetWidth;
    element.classList.add('pulse');
  }
  renderBoard();
  renderInspector();
}

function renderInspector() {
  const agent = agents.find(a => a.id === selectedAgentId);
  if (!agent) {
    inspector.innerHTML = `
      <div class="empty-state">
        <div>
          <strong>Select an agent</strong>
          <p>Click any tiny lab Sim to inspect its task, modules, XP, and recent brain logs.</p>
        </div>
      </div>
    `;
    return;
  }

  const xpPercent = (agent.xp / XP_PER_LEVEL) * 100;
  const logs = agent.logs.slice(-9).reverse().map(log => `<p class="log-line"><time>${log.at}</time> · ${escapeHtml(log.text)}</p>`).join('');
  const modules = agent.modules.map(module => `<span class="module">${escapeHtml(module)}</span>`).join('');

  inspector.innerHTML = `
    <div class="inspector-top">
      <div>
        <h3>${escapeHtml(agent.name)}</h3>
        <p>${escapeHtml(agent.role)}</p>
      </div>
      <span class="status-pill ${agent.status}">${statusCopy(agent.status)}</span>
    </div>
    <div class="task-card">
      <p class="card-label">Current task</p>
      <strong>${escapeHtml(agent.currentTask || 'Thinking about next move…')}</strong>
    </div>
    <div class="level-card">
      <p class="card-label">Growth</p>
      <div class="level-line"><span>Lv. ${agent.level}</span><span>${agent.xp} / ${XP_PER_LEVEL} XP</span></div>
      <div class="xp-bar"><div class="xp-fill" style="width:${xpPercent}%"></div></div>
    </div>
    <div class="modules-card">
      <p class="card-label">Brain modules</p>
      <div class="module-grid">${modules}</div>
    </div>
    <div class="logs-card">
      <p class="card-label">Recent brain logs</p>
      <div class="log-list">${logs}</div>
    </div>
  `;
}

function renderTrex() {
  const working = agents.filter(a => a.status === 'working').length;
  const errors = agents.filter(a => a.status === 'error').length;
  const progress = (trex.xp / TREX_XP_PER_LEVEL) * 100;
  trex.mood = getTrexMood(errors, working);

  activeCount.textContent = String(working);
  taskCount.textContent = String(totalTasksCompleted);
  alertCount.textContent = String(errors);
  trexMood.textContent = trex.mood;
  trexLevel.textContent = `Lv. ${trex.level}`;
  trexXp.textContent = `${trex.xp} / ${TREX_XP_PER_LEVEL} XP`;
  trexProgress.style.width = `${progress}%`;
  trexAvatar.dataset.level = String(trex.level);
  trexSummary.textContent = errors
    ? `${errors} agent${errors > 1 ? 's' : ''} need attention. Rex is guarding the lab door.`
    : `${working} agent${working === 1 ? ' is' : 's are'} working. ${totalTasksCompleted} task${totalTasksCompleted === 1 ? '' : 's'} completed across the habitat.`;
}

function getTrexMood(errors, working) {
  if (errors) return 'protective';
  if (trex.level >= 6) return 'ascended';
  if (trex.level >= 4) return 'unstoppable';
  if (working >= 4) return 'excited';
  if (totalTasksCompleted > 0) return 'proud';
  return 'curious';
}

function simulateTick() {
  agents = agents.map(agent => {
    const next = { ...agent, logs: [...agent.logs] };

    if (Math.random() < 0.45) {
      next.x = clamp(next.x + randomItem([-1, 0, 1]), 0, GRID.cols - 1);
      next.y = clamp(next.y + randomItem([-1, 0, 1]), 0, GRID.rows - 1);
    }

    if (Math.random() < 0.32) {
      next.status = randomItem(['idle', 'working', 'working', 'error']);
      pushLog(next, statusLog(next.status));
      if (next.status === 'working') next.currentTask = randomItem(tasks);
    }

    if (next.status === 'working' && Math.random() < 0.38) {
      completeTask(next);
    }

    trimLogs(next);
    return next;
  });

  renderAll();
}

function completeTask(agent) {
  totalTasksCompleted += 1;
  agent.xp += 2;
  pushLog(agent, `Completed: ${agent.currentTask}`);
  agent.currentTask = randomItem(tasks);
  if (agent.xp >= XP_PER_LEVEL) {
    agent.level += 1;
    agent.xp = agent.xp - XP_PER_LEVEL;
    pushLog(agent, `Level up. ${agent.name} reached Lv. ${agent.level}.`);
  }

  trex.xp += 3;
  if (trex.xp >= TREX_XP_PER_LEVEL) {
    trex.level += 1;
    trex.xp = trex.xp - TREX_XP_PER_LEVEL;
  }
}

function pushLog(agent, text) {
  agent.logs.push(makeLog(text));
}

function trimLogs(agent) {
  if (agent.logs.length > 80) agent.logs = agent.logs.slice(-80);
}

function renderAll() {
  renderBoard();
  renderInspector();
  renderTrex();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

/**
 * Future backend integration hook.
 * A later OpenClaw endpoint or WebSocket can call this with agent state from
 * `/agents/state` without changing rendering code.
 */
function updateAgentsFromState(newState) {
  if (!Array.isArray(newState)) return;
  agents = newState.map((incoming, index) => {
    const existing = agents.find(a => a.id === incoming.id) || agents[index] || {};
    return {
      ...existing,
      ...incoming,
      x: clamp(Number(incoming.x ?? existing.x ?? index), 0, GRID.cols - 1),
      y: clamp(Number(incoming.y ?? existing.y ?? index), 0, GRID.rows - 1),
      modules: Array.isArray(incoming.modules) ? incoming.modules : (existing.modules || []),
      logs: Array.isArray(incoming.logs) ? incoming.logs.slice(-80) : (existing.logs || [])
    };
  });
  if (selectedAgentId && !agents.some(a => a.id === selectedAgentId)) selectedAgentId = null;
  renderAll();
}

window.TrexAgentLab = {
  updateAgentsFromState,
  getState: () => ({ agents, trex, totalTasksCompleted })
};

renderAll();
setInterval(simulateTick, 1700);
