import './styles.css';
import './assistant.css';
import './product.css';
import './realtime.css';
import { hospitals as seedHospitals, bloodBanks, medicines, ambulances, equipment, integrations, seedSummary } from './demoData.js';
import { demoAccounts, demoLogin, authenticate, canAccess, roleModules } from './auth.js';
import { renderLoginScreen } from './loginView.js';
import { createRealtimeStream } from './realtime.js';
import { askOperationsAI } from './ai.js';
import './login.css';

const icons = {
  grid: '▦', network: '⌘', hospital: '✚', bed: '▥', blood: '◉', pharmacy: '⊞', ambulance: '⌁', equipment: '▣', brain: '✦', optimize: '⇄', emergency: '⚠', analytics: '◒', alert: '◌', plug: '↔', shield: '◈', pulse: '⌁', settings: '⚙', search: '⌕', bell: '◔', arrow: '→', check: '✓', close: '×', trend: '↗', download: '⇩', lock: '⌑', menu: '☰'
};

const navGroups = [
  { label: 'Core Command', items: [
    ['dashboard', 'Dashboard', 'grid'], ['network', 'Healthcare Network', 'network'], ['hospitals', 'Hospitals', 'hospital'], ['beds', 'Beds & ICU', 'bed']
  ]},
  { label: 'Resources', items: [
    ['blood', 'Blood Banks', 'blood'], ['medicines', 'Pharmacies', 'pharmacy'], ['ambulances', 'Ambulances', 'ambulance'], ['equipment', 'Medical Equipment', 'equipment']
  ]},
  { label: 'Intelligence', items: [
    ['ai', 'AI Intelligence', 'brain'], ['resources', 'Resource Optimization', 'optimize'], ['emergency', 'Emergency Command', 'emergency'], ['analytics', 'Analytics', 'analytics']
  ]},
  { label: 'Governance', items: [
    ['alerts', 'Alerts', 'alert'], ['interop', 'Data Interoperability', 'plug'], ['audit', 'Consent & Audit', 'shield'], ['health', 'System Health', 'pulse']
  ]}
];

const stateData = {
  'Tamil Nadu': { code: 'TN', hospitals: 184, beds: '12,480', icu: '1,248', load: '78%', blood: '14.2k', medicine: '92%', level: 'Elevated', tone: 'amber', x: 234, y: 315 },
  Kerala: { code: 'KL', hospitals: 112, beds: '8,920', icu: '894', load: '71%', blood: '11.8k', medicine: '96%', level: 'Normal', tone: 'green', x: 198, y: 285 },
  Karnataka: { code: 'KA', hospitals: 165, beds: '11,360', icu: '1,102', load: '74%', blood: '13.4k', medicine: '89%', level: 'Normal', tone: 'green', x: 196, y: 240 },
  Maharashtra: { code: 'MH', hospitals: 240, beds: '21,840', icu: '2,060', load: '82%', blood: '18.9k', medicine: '86%', level: 'Watch', tone: 'amber', x: 157, y: 159 },
  Telangana: { code: 'TG', hospitals: 108, beds: '7,840', icu: '810', load: '69%', blood: '9.8k', medicine: '94%', level: 'Normal', tone: 'green', x: 226, y: 216 },
  'Andhra Pradesh': { code: 'AP', hospitals: 132, beds: '9,740', icu: '924', load: '76%', blood: '10.6k', medicine: '91%', level: 'Elevated', tone: 'amber', x: 239, y: 250 },
  Gujarat: { code: 'GJ', hospitals: 143, beds: '10,240', icu: '978', load: '67%', blood: '12.3k', medicine: '97%', level: 'Normal', tone: 'green', x: 95, y: 135 },
  Rajasthan: { code: 'RJ', hospitals: 127, beds: '9,830', icu: '836', load: '63%', blood: '10.1k', medicine: '90%', level: 'Normal', tone: 'green', x: 112, y: 88 },
  Delhi: { code: 'DL', hospitals: 76, beds: '7,450', icu: '1,184', load: '88%', blood: '7.4k', medicine: '83%', level: 'High', tone: 'red', x: 168, y: 67 },
  'Uttar Pradesh': { code: 'UP', hospitals: 214, beds: '18,620', icu: '1,540', load: '81%', blood: '16.2k', medicine: '88%', level: 'Watch', tone: 'amber', x: 205, y: 100 },
  'West Bengal': { code: 'WB', hospitals: 156, beds: '13,240', icu: '1,120', load: '73%', blood: '12.8k', medicine: '93%', level: 'Normal', tone: 'green', x: 310, y: 132 }
};

const hospitals = [...seedHospitals];

const initialAlerts = [
  { id: 1, title: 'ICU capacity tightening', detail: 'National Care Medical Centre · New Delhi', severity: 'Critical', time: '4 min ago', read: false },
  { id: 2, title: 'Patient demand trending upward', detail: 'Tamil Nadu region · +12% in last 24h', severity: 'Warning', time: '18 min ago', read: false },
  { id: 3, title: 'Integration sync completed', detail: 'Synthetic Hospital API · all records reconciled', severity: 'Info', time: '31 min ago', read: true }
];

const state = {
  active: 'dashboard', selectedRegion: 'Tamil Nadu', query: '', statusFilter: 'All', sortBy: 'capacity', alerts: initialAlerts, surge: 0, accepted: false, presentation: false,
  noticeVisible: true, mobileNav: false, modal: null, toast: null, loginError: '', notificationsOpen: false, session: null, livePaused: false, liveTick: 0, lastUpdated: new Date(), aiStatus: 'ready', aiBusy: false, assistant: [{ from: 'bot', text: 'Hello. I can help you explore synthetic healthcare operations data, capacity, resources, and alerts.' }]
};

try {
  const savedSession = JSON.parse(localStorage.getItem('bhn-auth-session') || 'null');
  if (savedSession?.role) state.session = savedSession;
  const saved = JSON.parse(localStorage.getItem('bhn-demo-session') || '{}');
  if (saved.selectedRegion && stateData[saved.selectedRegion]) state.selectedRegion = saved.selectedRegion;
  if (Number.isInteger(saved.surge)) state.surge = saved.surge;
  if (typeof saved.accepted === 'boolean') state.accepted = saved.accepted;
} catch { /* private browsing can disable local storage; the prototype still works in memory */ }

const app = document.querySelector('#app');
const fmt = (n) => n.toLocaleString('en-IN');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const assistantText = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
const iconPaths = { grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>', network: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 7.3 10.8 16M16 7.3 13.2 16M8 6h8"/>', hospital: '<path d="M4 20h16M6 20V6h12v14M9 9h6M12 6v6M9 12h6"/>', bed: '<path d="M4 18v-7h16v7M4 14h16M7 11V8h5a3 3 0 0 1 3 3"/>', blood: '<path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z"/>', pharmacy: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>', ambulance: '<path d="M3 16V7h11v9M14 10h3l4 4v2h-7M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>', equipment: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v8H8zM8 12h8"/>', brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 3 5h2V4ZM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-3 5h-2V4ZM9 8h6M9 12h6M9 16h6"/>', optimize: '<path d="M4 7h12M4 7l3-3M4 7l3 3M20 17H8M20 17l-3-3M20 17l-3 3"/>', emergency: '<path d="m12 3 9 17H3L12 3Z"/><path d="M12 9v5M12 17h.01"/>', analytics: '<path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7"/>', alert: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16h.01"/>', plug: '<path d="M9 7V3M15 7V3M7 7h10v3a5 5 0 0 1-10 0V7ZM12 15v6"/>', shield: '<path d="M12 3 19 6v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/>', pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>', settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 12H2m20 0h-2M12 4V2m0 20v-2M5 5l-1-1m16 16-1-1M19 5l1-1M4 20l1-1"/>', search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>', bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>', arrow: '<path d="M4 12h15M14 7l5 5-5 5"/>', check: '<path d="m5 12 4 4L19 6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>', trend: '<path d="m4 16 6-6 4 4 6-7M15 7h5v5"/>', download: '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>', lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>' };
const icon = (name) => `<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || '<circle cx="12" cy="12" r="2"/>'}</svg></span>`;
iconPaths.pause = '<path d="M8 5v14M16 5v14"/>';
const persistState = () => { try { localStorage.setItem('bhn-demo-session', JSON.stringify({ selectedRegion: state.selectedRegion, surge: state.surge, accepted: state.accepted })); } catch { /* ignore storage failures */ } };
const persistSession = () => { try { if (state.session) localStorage.setItem('bhn-auth-session', JSON.stringify(state.session)); else localStorage.removeItem('bhn-auth-session'); } catch { /* ignore storage failures */ } };
const canSimulate = () => ['Super Admin', 'Health Authority'].includes(state.session?.role);
const liveStream = createRealtimeStream(event => { if (state.livePaused || !state.session) return; state.liveTick = event.sequence; state.lastUpdated = new Date(event.receivedAt); if (state.active === 'dashboard') render(); });
const liveTime = () => state.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const liveDateLabel = () => `${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()} · ${liveTime()} IST`;
const pulseValue = (base, swing = 1) => base + ((state.liveTick % 5) - 2) * swing;

function renderLogin() {
  return renderLoginScreen({ accounts: demoAccounts, error: state.loginError, esc, icon });
  return `<div class="login-shell"><section class="login-brand-panel"><div class="login-brand"><div class="brand-mark">BH<span>+</span></div><div><strong>BHARAT HEALTHNET AI</strong><small>NATIONAL HEALTHCARE INTELLIGENCE PLATFORM</small></div></div><div class="login-intro"><span class="section-kicker">SYNTHETIC OPERATIONS ENVIRONMENT</span><h1>See the whole network. Act with confidence.</h1><p>A command center for capacity, resource coordination, and operational intelligence across a simulated national healthcare network.</p><div class="login-flow"><span>Connect <b>→</b></span><span>Analyze <b>→</b></span><span>Predict <b>→</b></span><span>Optimize <b>→</b></span></div></div><p class="login-disclaimer">Demo only. This workspace uses synthetic healthcare records and is not connected to government systems, hospitals, or real patients.</p></section><section class="login-form-panel"><div class="login-card"><span class="section-kicker">SECURE ACCESS</span><h2>Welcome back</h2><p>Sign in to your role-based command workspace.</p>${state.loginError ? `<div class="login-error" role="alert">${esc(state.loginError)}</div>` : ''}<form class="login-form"><label>Email address<input name="email" type="email" autocomplete="username" required placeholder="you@bharathealthnet.ai" /></label><label>Password<input name="password" type="password" autocomplete="current-password" required placeholder="Enter your password" /></label><button class="button primary login-submit" type="submit">Sign in to command center ${icon('arrow')}</button></form><div class="demo-access"><div><strong>Demo accounts</strong><small>Choose a role to prefill its email</small></div>${demoAccounts.map(account => `<button type="button" class="demo-account" data-demo-email="${account.email}"><span class="avatar">${account.role.split(' ').map(part => part[0]).join('').slice(0, 2)}</span><span><strong>${account.role}</strong><small>${account.email}</small></span><i>${icon('arrow')}</i></button>`).join('')}<p class="password-note">Passwords are checked against local SHA-256 hashes for this prototype. Use the demo passwords from the project README.</p></div><p class="login-footer">BHARAT HEALTHNET AI · v0.1 · Demo environment</p></div></section></div>`;
}

function metricCard(label, value, change, iconName, tone = 'blue') {
  return `<article class="metric-card ${tone}">
    <div class="metric-top"><span class="metric-label">${label}</span><span class="metric-icon">${icon(iconName)}</span></div>
    <div class="metric-value">${value}</div>
    <div class="metric-foot"><span class="change ${change.startsWith('-') ? 'down' : ''}">${icon('trend')} ${change}</span><span class="muted">vs last 24h</span></div>
    <div class="sparkline"><i style="height: 34%"></i><i style="height: 50%"></i><i style="height: 42%"></i><i style="height: 64%"></i><i style="height: 58%"></i><i style="height: 82%"></i><i style="height: ${tone === 'red' ? 94 : 76}%"></i></div>
  </article>`;
}

function renderSidebar() {
  return `<aside class="sidebar ${state.mobileNav ? 'mobile-open' : ''}">
    <div class="brand"><img class="brand-logo" src="/brand-mark.svg" alt="Bharat HealthNet AI mark" /><div><strong>BHARAT</strong><b>HEALTHNET <em>AI</em></b></div></div>
    <div class="demo-pill"><span class="live-dot"></span> DEMO ENVIRONMENT</div>
    <nav>${navGroups.map(group => { const visibleItems = group.items.filter(([id]) => canAccess(state.session.role, id)); return visibleItems.length ? `<div class="nav-group"><span class="nav-label">${group.label}</span>${visibleItems.map(([id, label, ico]) => `<button class="nav-item ${state.active === id ? 'active' : ''}" data-nav="${id}">${icon(ico)}<span>${label}</span>${id === 'alerts' && state.alerts.some(a => !a.read) ? '<small>2</small>' : ''}</button>`).join('')}</div>` : ''; }).join('')}</nav>
    <div class="sidebar-footer"><div class="secure"><span>${icon('shield')}</span><div><strong>Secure network</strong><small>All systems operational</small></div><i class="status-dot green"></i></div><button class="user-chip" data-action="profile"><span class="avatar">${state.session.initials}</span><span><strong>${state.session.name}</strong><small>${state.session.role}</small></span><span class="chevron">⌄</span></button></div>
  </aside>`;
}

function renderTopbar() {
  const unread = state.alerts.filter(a => !a.read).length;
  return `<header class="topbar"><div class="mobile-brand"><img class="brand-logo" src="/brand-mark.svg" alt="Bharat HealthNet AI mark" /><strong>BHARAT <em>AI</em></strong></div><button class="mobile-menu" data-action="sidebar" aria-label="Open navigation">${icon('menu')}</button><div class="topbar-title"><span class="eyebrow">NATIONAL COMMAND CENTER</span><h1>${pageTitle()}</h1></div><div class="top-actions"><div class="live-status"><span class="live-dot"></span> Live network <b>99.98%</b></div><button class="ai-shortcut" data-action="open-ai">${icon('brain')} <span>Ask AI</span></button><button class="presentation-button ${state.presentation ? 'selected' : ''}" data-action="presentation">${icon('grid')} <span>Presentation mode</span></button><button class="icon-button search-button" data-action="search" aria-label="Search">${icon('search')}</button><button class="icon-button notification-button" data-action="notifications" aria-label="Notifications">${icon('bell')}<small>${unread}</small></button><button class="profile-button" data-action="profile"><span class="avatar">${state.session.initials}</span><span class="profile-copy"><strong>${state.session.name}</strong><small>${state.session.role}</small></span><span class="chevron">⌄</span></button></div></header>`;
}

function pageTitle() {
  const titles = { dashboard: 'National Healthcare Intelligence', network: 'Healthcare Network', hospitals: 'Hospital Capacity', beds: 'Beds & ICU Monitoring', blood: 'Blood Bank Readiness', medicines: 'Medicine Inventory', ambulances: 'Ambulance Operations', equipment: 'Medical Equipment', ai: 'AI Intelligence Center', resources: 'Resource Optimization', emergency: 'Emergency Command', analytics: 'Network Analytics', alerts: 'Alert Center', interop: 'Data Interoperability', audit: 'Consent & Audit', health: 'System Health' };
  return titles[state.active] || 'Settings';
}

function regionMap() {
  const markers = Object.entries(stateData).map(([name, item]) => `<button class="map-marker ${item.tone} ${state.selectedRegion === name ? 'selected' : ''}" style="left:${item.x}px;top:${item.y}px" data-region="${name}" aria-label="${name}"><span></span><b>${item.code}</b></button>`).join('');
  return `<div class="map-art"><svg viewBox="0 0 390 390" role="img" aria-label="Stylized map of India with synthetic healthcare network markers"><path class="india-shape" d="M111 20 160 14 187 34 222 36 247 61 292 68 330 103 344 142 326 174 334 209 305 227 292 260 273 267 268 307 247 343 216 369 194 334 169 315 155 279 131 262 120 229 94 207 80 169 62 150 73 116 58 86 83 61Z"/><path class="india-detail" d="M92 88c50 10 84 8 135-8M80 150c66-12 122 8 195-16M118 207c42-13 106 13 174-12M160 267c31-10 64-9 107-2"/></svg><div class="map-legend"><span><i class="dot green"></i> Normal</span><span><i class="dot amber"></i> Watch</span><span><i class="dot red"></i> High risk</span></div>${markers}</div>`;
}

function situationBrief() {
  const liveText = state.livePaused ? 'Live stream paused by operator.' : `Last network event received at ${liveTime()} from the synthetic IoT gateway.`;
  return `<section class="panel situation-panel"><div class="panel-heading"><div><span class="section-kicker">HOW TO READ THIS SCREEN</span><h3>Current operating picture</h3><p>Three things the command team needs to know right now.</p></div><span class="updated-chip"><i class="live-dot ${state.livePaused ? 'paused' : ''}"></i>${state.livePaused ? 'Stream paused' : 'Updated live'} · ${liveText}</span></div><div class="situation-grid"><article class="situation-item risk"><div class="situation-index">01</div><div><span class="situation-label">WHAT CHANGED</span><h4>Demand is rising in Chennai</h4><p>Emergency visits are trending <b>18.9% higher</b> and two facilities are above the watch threshold.</p><button class="text-button" data-nav="hospitals">View affected facilities ${icon('arrow')}</button></div></article><article class="situation-item action"><div class="situation-index">02</div><div><span class="situation-label">WHAT TO DO NEXT</span><h4>Protect 8 ICU beds</h4><p>The allocation engine recommends moving reserve capacity into the Tamil Nadu surge pool within 4 hours.</p><button class="text-button" data-action="open-recommendation">Review action plan ${icon('arrow')}</button></div></article><article class="situation-item stable"><div class="situation-index">03</div><div><span class="situation-label">WHAT IS SAFE</span><h4>National network is online</h4><p>${seedSummary.hospitals} seeded facilities are reporting locally. Blood and medicine systems remain within operating range.</p><button class="text-button" data-nav="health">Check system health ${icon('arrow')}</button></div></article></div></section>`;
}

function dashboardView() {
  const region = stateData[state.selectedRegion];
  return `<div class="page-stack">
    <section class="hero-row"><div><p class="section-kicker">WEDNESDAY · 26 AUGUST 2026 · 21:48 IST</p><h2>Good evening, Arjun <span class="wave">✦</span></h2><p class="subtitle">A live view of India's simulated healthcare ecosystem.</p></div><div class="hero-actions"><button class="button secondary" data-action="export">${icon('download')} Export brief</button><button class="button primary" data-action="simulate">${icon('trend')} Run simulation</button></div></section>
    ${state.noticeVisible ? `<section class="notice-bar"><span class="notice-icon">${icon('shield')}</span><span><strong>Synthetic data environment</strong> · ${seedSummary.hospitals} hospitals, ${seedSummary.bloodBanks} blood banks, ${seedSummary.medicines} medicines, ${seedSummary.ambulances} ambulances, and ${seedSummary.equipment} equipment records seeded locally. No real patient or government records are connected.</span><button data-action="dismiss-notice" aria-label="Dismiss synthetic data notice">×</button></section>` : ''}
    <section class="metric-grid">${metricCard('Total hospitals', '1,842', '+4.2%', 'hospital', 'blue')}${metricCard('Available beds', fmt(84720 + state.surge * -620 - (state.liveTick % 6) * 18), '+6.8%', 'bed', 'green')}${metricCard('ICU availability', `${Math.max(52, (state.surge ? 63 : 71) - (state.liveTick % 3))}%`, state.surge ? '-8.3%' : '+3.1%', 'pulse', state.surge ? 'amber' : 'green')}${metricCard('Active ambulances', fmt(428 - (state.liveTick % 4)), '+11.5%', 'ambulance', 'blue')}${metricCard('Blood units', fmt(142600 - (state.liveTick % 5) * 38), '+2.4%', 'blood', 'red')}${metricCard('Medicine stock health', `${state.surge ? 86 : 92}%`, state.surge ? '-4.6%' : '+1.8%', 'pharmacy', state.surge ? 'amber' : 'green')}${metricCard('AI forecast confidence', '92.4%', '+1.2%', 'brain', 'purple')}${metricCard('Active alerts', `${state.alerts.filter(a => !a.read).length + (state.surge ? 1 : 0)}`, state.surge ? '+1 critical' : '-2 resolved', 'alert', state.surge ? 'red' : 'amber')}</section>
    ${situationBrief()}
    <section class="dashboard-grid main-grid"><article class="panel map-panel"><div class="panel-heading"><div><span class="section-kicker">NETWORK PULSE</span><h3>Healthcare network across India</h3></div><span class="panel-chip green"><i class="dot green"></i> 1,842 facilities online</span></div>${regionMap()}<div class="map-insight"><div><span class="section-kicker">SELECTED REGION</span><h4>${state.selectedRegion}</h4><p>${region.level} demand signal · ${region.hospitals} facilities reporting</p></div><div class="region-stats"><span><b>${region.beds}</b><small>Beds</small></span><span><b>${region.icu}</b><small>ICU beds</small></span><span><b>${region.load}</b><small>Patient load</small></span><span><b>${region.blood}</b><small>Blood units</small></span></div></div></article><article class="panel feed-panel"><div class="panel-heading"><div><span class="section-kicker">REAL-TIME FEED</span><h3>Operational signals</h3></div><button class="text-button" data-nav="alerts">View all ${icon('arrow')}</button></div><div class="signal-list">${signals().join('')}</div></article></section>
    <section class="dashboard-grid lower-grid"><article class="panel chart-panel"><div class="panel-heading"><div><span class="section-kicker">DEMAND FORECAST · 7 DAYS</span><h3>Patient visits & capacity</h3></div><span class="confidence">${icon('brain')} 92% confidence</span></div><div class="chart-legend"><span><i class="legend-line blue"></i>Actual visits</span><span><i class="legend-line purple"></i>AI forecast</span><span class="chart-select">All India ⌄</span></div>${lineChart()}</article><article class="panel optimization-panel"><div class="panel-heading"><div><span class="section-kicker">AI RECOMMENDATION</span><h3>Suggested next action</h3></div><span class="ai-badge">AI</span></div><div class="recommendation"><div class="rec-icon">${icon('optimize')}</div><div><strong>Prepare capacity in Tamil Nadu</strong><p>Demand is trending <b>18.9% higher</b> across Chennai. Shift 8 ICU beds from low-utilization facilities to the regional surge pool.</p></div></div><div class="rec-meta"><span><b>High impact</b><small>Priority</small></span><span><b>87%</b><small>Confidence</small></span><span><b>4 hrs</b><small>Time window</small></span></div><button class="button primary full" data-action="open-recommendation">Review recommendation ${icon('arrow')}</button></article></section>
    <section class="bottom-strip"><div class="strip-title"><span class="section-kicker">PLATFORM SIGNALS</span><strong>Connect <i>→</i> Collect <i>→</i> Analyze <i>→</i> Predict <i>→</i> Optimize</strong></div><div class="strip-stat"><span class="mini-icon blue">${icon('network')}</span><span><b>24,680</b><small>data points / min</small></span></div><div class="strip-stat"><span class="mini-icon purple">${icon('brain')}</span><span><b>68</b><small>AI insights today</small></span></div><div class="strip-stat"><span class="mini-icon green">${icon('shield')}</span><span><b>100%</b><small>audit coverage</small></span></div></section>
  </div>`;
}

function signals() {
  const base = [
    ['green', 'Network stable', 'All facility gateways reporting normally', 'Now', 'pulse'],
    ['amber', 'Demand watch', 'Emergency visits rising in Tamil Nadu', '6 min', 'trend'],
    ['blue', 'Inventory synced', 'Pharmacy stock reconciliation complete', '12 min', 'pharmacy'],
    ['purple', 'AI model refreshed', 'Forecasts recalculated from live signals', '18 min', 'brain']
  ];
  if (state.surge) base.unshift(['red', 'Patient surge simulated', 'Tamil Nadu demand +18.9% · capacity action needed', 'Now', 'alert']);
  return base.slice(0, 4).map(([tone, title, text, time, ico]) => `<div class="signal"><span class="signal-icon ${tone}">${icon(ico)}</span><div><strong>${title}</strong><p>${text}</p></div><time>${time}</time></div>`);
}

function lineChart() {
  const liveShift = state.liveTick % 4;
  const points = state.surge ? `8,${133 - liveShift} 50,126 92,${119 - liveShift} 134,112 176,103 218,92 260,${73 - liveShift} 302,65 344,51` : `8,${143 - liveShift} 50,136 92,${128 - liveShift} 134,120 176,112 218,104 260,${91 - liveShift} 302,78 344,68`;
  const forecast = state.surge ? `218,92 260,${81 - liveShift} 302,55 344,40 386,27` : `218,104 260,${93 - liveShift} 302,82 344,70 386,60`;
  return `<div class="line-chart"><svg viewBox="0 0 400 180" preserveAspectRatio="none"><defs><linearGradient id="fillBlue" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2f7df4" stop-opacity=".18"/><stop offset="1" stop-color="#2f7df4" stop-opacity="0"/></linearGradient></defs><path class="chart-area" d="M ${points.replaceAll(' ', ' L ')} L 344 180 L 8 180 Z"/><path class="chart-line blue" d="M ${points.replaceAll(' ', ' L ')}"/><path class="chart-line purple" d="M ${forecast.replaceAll(' ', ' L ')}"/><line x1="218" x2="218" y1="15" y2="160" class="today-line"/>${[8,50,92,134,176,218,260,302,344,386].map((x, i) => `<circle cx="${x}" cy="${i < 6 ? [143,136,128,120,112,104][i] : 90}" r="3.5" class="data-point"/>`).join('')}</svg><div class="axis"><span>20 Aug</span><span>22 Aug</span><span>24 Aug</span><span>Today</span><span>30 Aug</span></div></div>`;
}

function tableView(kind) {
  const filtered = [...hospitals].filter(h => Object.values(h).join(' ').toLowerCase().includes(state.query.toLowerCase())).filter(h => state.statusFilter === 'All' || h.status === state.statusFilter).sort((a, b) => state.sortBy === 'name' ? a.name.localeCompare(b.name) : (b.occupied / b.beds) - (a.occupied / a.beds));
  if (kind === 'hospitals') return `<div class="page-stack"><section class="page-heading"><div><span class="section-kicker">FACILITY DIRECTORY · ${hospitals.length} SYNTHETIC RECORDS</span><h2>Hospital capacity</h2><p>Monitor synthetic capacity signals across the connected network.</p></div><button class="button primary" data-action="open-hospital">${icon('hospital')} Add facility</button></section><div class="toolbar"><div class="input-wrap">${icon('search')}<input data-search aria-label="Search hospitals" placeholder="Search hospitals, cities, or states" value="${esc(state.query)}" /></div><select class="filter-button" data-filter="status" aria-label="Filter hospital status"><option>All</option><option ${state.statusFilter === 'Normal' ? 'selected' : ''}>Normal</option><option ${state.statusFilter === 'Warning' ? 'selected' : ''}>Warning</option><option ${state.statusFilter === 'Critical' ? 'selected' : ''}>Critical</option></select><select class="filter-button" data-filter="sort" aria-label="Sort hospitals"><option value="capacity" ${state.sortBy === 'capacity' ? 'selected' : ''}>Sort: Capacity</option><option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Sort: Name</option></select><span class="toolbar-count">${filtered.length} results</span></div><div class="panel table-panel"><table><thead><tr><th>Facility</th><th>Location</th><th>Type</th><th>Bed utilization</th><th>ICU available</th><th>Clinical staff</th><th>Status</th></tr></thead><tbody>${filtered.map(h => `<tr data-hospital="${h.id}" tabindex="0"><td><strong>${h.name}</strong><small>${h.id} · synced ${h.lastSync || 'now'}</small></td><td>${h.city}<small>${h.state}</small></td><td>${h.type}</td><td><div class="table-progress"><span><i style="width:${Math.round(h.occupied / h.beds * 100)}%"></i></span><b>${Math.round(h.occupied / h.beds * 100)}%</b></div><small>${fmt(h.occupied)} / ${fmt(h.beds)} beds</small></td><td><strong class="${h.available < 10 ? 'critical-text' : ''}">${h.available}</strong><small>of ${h.icu} ICU</small></td><td>${h.doctors} doctors</td><td>${statusBadge(h.status)}</td></tr>`).join('')}</tbody></table></div></div>`;
  const titles = { beds: ['REAL-TIME CAPACITY', 'Beds & ICU monitoring', 'Occupancy is calculated from synthetic facility feeds.'], blood: ['BLOOD READINESS', 'Blood bank inventory', 'Current availability and simulated demand signals.'], medicines: ['SUPPLY CHAIN', 'Medicine inventory', 'Reorder intelligence across the synthetic pharmacy network.'], ambulances: ['MOBILITY NETWORK', 'Ambulance operations', 'Coordinate the right response vehicle to the right facility.'], equipment: ['IOT TELEMETRY', 'Medical equipment health', 'Sensor-derived status from simulated connected equipment.'] };
  const [kicker, title, desc] = titles[kind];
  return `<div class="page-stack"><section class="page-heading"><div><span class="section-kicker">${kicker}</span><h2>${title}</h2><p>${desc}</p></div><button class="button secondary" data-action="export">${icon('download')} Export data</button></section><section class="metric-grid compact">${metricCard(kind === 'blood' ? 'Units available' : kind === 'ambulances' ? 'Vehicles online' : 'Total monitored', kind === 'blood' ? '142,680' : kind === 'ambulances' ? '428' : kind === 'equipment' ? '1,904' : '84,720', '+6.8%', kind === 'blood' ? 'blood' : kind === 'ambulances' ? 'ambulance' : kind === 'equipment' ? 'equipment' : 'bed', 'green')}${metricCard(kind === 'medicines' ? 'At risk in 7 days' : kind === 'blood' ? 'Below threshold' : 'Utilization', kind === 'medicines' ? '12' : kind === 'blood' ? '3' : kind === 'ambulances' ? '74%' : '71%', '-2.4%', kind === 'medicines' ? 'pharmacy' : 'alert', 'amber')}${metricCard('Active alerts', state.alerts.filter(a => !a.read).length, '-2 resolved', 'alert', 'purple')}</section>${resourceTable(kind)}</div>`;
}

function resourceTable(kind) {
  const rows = {
    beds: [['Emergency beds', 'Regional surge pool', '1,248', '18%', 'Stable'], ['ICU beds', 'Tamil Nadu', '184', '82%', 'Watch'], ['Isolation beds', 'All India', '2,840', '46%', 'Normal'], ['Reserved capacity', 'National reserve', '6,420', '—', 'Protected']],
    blood: [['O+', '2,840 units', '1,920 / month', '14 days', 'Normal'], ['B+', '1,640 units', '1,280 / month', '9 days', 'Normal'], ['A-', '420 units', '510 / month', '6 days', 'Low'], ['AB-', '86 units', '120 / month', '4 days', 'Critical']],
    medicines: [['Paracetamol 500mg', 'Analgesic', '24,600', '6 days', 'Healthy'], ['Insulin glargine', 'Endocrine', '4,280', '11 days', 'Healthy'], ['Ceftriaxone', 'Antibiotic', '1,140', '4 days', 'Low'], ['Amoxicillin', 'Antibiotic', '620', '2 days', 'Critical']],
    ambulances: [['AMB-042', 'Chennai · 4.2 km', 'Emergency', 'Bharat General', '04 min'], ['AMB-118', 'Bengaluru · 8.7 km', 'On duty', 'Aarogya City', '12 min'], ['AMB-204', 'New Delhi · Station 04', 'Available', 'National Care', '—'], ['AMB-336', 'Kochi · 2.1 km', 'Maintenance', 'Coastal Life', '—']],
    equipment: [['VNT-104', 'Ventilator', 'Bharat General', '72.4°C', 'High risk'], ['MRI-021', 'MRI', 'Aarogya City', 'Normal', 'Low risk'], ['CT-088', 'CT Scanner', 'National Care', 'Normal', 'Medium risk'], ['OXY-031', 'Oxygen Generator', 'Jan Seva', 'Normal', 'Low risk']]
  }[kind] || [];
  const headers = { beds: ['Resource', 'Region', 'Available', 'Utilization', 'Signal'], blood: ['Blood group', 'Current stock', 'Monthly demand', 'Coverage', 'Status'], medicines: ['Medicine', 'Category', 'Current stock', 'Days remaining', 'Status'], ambulances: ['Vehicle', 'Last signal', 'Status', 'Assigned facility', 'ETA'], equipment: ['Equipment', 'Type', 'Facility', 'Sensor signal', 'Predicted risk'] }[kind];
  return `<div class="panel table-panel"><div class="panel-heading"><div><span class="section-kicker">LIVE REGISTER</span><h3>${kind === 'equipment' ? 'Predictive maintenance signals' : 'Resource register'}</h3></div><span class="panel-chip"><i class="dot green"></i> Auto-refreshing</span></div><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, i) => `<td>${i === row.length - 1 ? statusBadge(cell) : i === 0 ? `<strong>${cell}</strong>` : cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function aiView() {
  const cards = [['Patient demand forecast', '14,820', '+18.9%', '92%', 'Prepare additional emergency capacity.', 'purple'], ['Bed demand forecast', '2,480', '+11.2%', '89%', 'Protect 320 beds in the regional reserve pool.', 'blue'], ['Medicine shortage prediction', '12 items', 'Within 7 days', '91%', 'Reorder antibiotic inventory in 3 facilities.', 'amber'], ['Blood demand prediction', '18.4k units', '+8.6%', '86%', 'Coordinate O-negative reserve before Friday.', 'red'], ['Equipment failure risk', '7 devices', 'High signal', '88%', 'Schedule maintenance for VNT-104 and CT-088.', 'green'], ['Emergency risk index', '0.38', 'Moderate', '84%', 'Keep ambulance surge team on standby.', 'blue']];
  const aiLabel = state.aiStatus === 'offline' ? 'Fallback answers available' : state.aiStatus === 'thinking' ? 'AI is thinking…' : 'Groq AI connected';
  return `<div class="page-stack"><section class="page-heading"><div><span class="section-kicker">DEMONSTRATION MODELS · NOT CLINICALLY VALIDATED</span><h2>AI Healthcare Intelligence Center</h2><p>Live operational copilot plus deterministic planning signals. No diagnosis or treatment advice.</p></div><span class="ai-model-label">${icon('brain')} ${aiLabel}</span></section><section class="ai-explainer panel"><div class="ai-explainer-heading"><span class="section-kicker">HOW THIS AI WORKS</span><h3>From live signal to human-reviewed action</h3><p>The assistant reads the current synthetic command-center context, then explains operational options in plain language.</p></div><div class="ai-steps"><div class="ai-step"><span>01</span><strong>Collect</strong><small>Live beds, alerts, inventory, and equipment signals.</small></div><div class="ai-step"><span>02</span><strong>Ground</strong><small>Only the selected region and synthetic records are sent with your question.</small></div><div class="ai-step"><span>03</span><strong>Explain</strong><small>Groq AI returns a concise operations answer, not clinical advice.</small></div><div class="ai-step"><span>04</span><strong>Review</strong><small>An authorized human decides whether any action is appropriate.</small></div></div></section><div class="ai-grid">${cards.map(([label, value, trend, confidence, rec, tone]) => `<article class="ai-card"><div class="ai-card-top"><span class="ai-card-icon ${tone}">${icon(tone === 'red' ? 'blood' : tone === 'green' ? 'equipment' : tone === 'amber' ? 'pharmacy' : 'brain')}</span><span class="confidence">${confidence} confidence</span></div><span class="section-kicker">${label}</span><div class="ai-value">${value}</div><div class="ai-trend ${tone}">${icon('trend')} ${trend}</div><div class="ai-recommendation"><span>Recommendation</span><p>${rec}</p></div></article>`).join('')}</div><section class="panel chart-panel"><div class="panel-heading"><div><span class="section-kicker">PATIENT DEMAND · DEMONSTRATION PREDICTION</span><h3>Historical visits + 7-day forecast</h3></div><div class="chart-controls"><button class="filter-button">Tamil Nadu ⌄</button><button class="filter-button">Emergency ⌄</button></div></div>${lineChart()}</section></div>`;
}

function resourcesView() {
  const accepted = state.accepted;
  return `<div class="page-stack"><section class="page-heading"><div><span class="section-kicker">DECISION SUPPORT ENGINE</span><h2>Resource optimization</h2><p>Recommended allocations are simulated and require human review before action.</p></div><span class="panel-chip green"><i class="dot green"></i> 4 recommendations ready</span></section><section class="optimization-layout"><article class="panel recommendation-panel"><div class="panel-heading"><div><span class="section-kicker">HIGH IMPACT RECOMMENDATION</span><h3>Rebalance ICU capacity</h3></div><span class="ai-badge">AI</span></div><div class="route"><div class="route-node"><span class="node-icon blue">${icon('hospital')}</span><div><small>Source facility</small><strong>Coastal Life Sciences</strong><span>Kochi · 24 available ICU beds</span></div></div><div class="route-line"><i></i><span>${icon('arrow')}</span></div><div class="route-node"><span class="node-icon red">${icon('hospital')}</span><div><small>Priority facility</small><strong>Bharat General Hospital</strong><span>Chennai · 18 available ICU beds</span></div></div></div><div class="big-rec">Shift <b>8 ICU beds</b> to the Tamil Nadu surge pool based on projected demand.</div><div class="rec-meta"><span><b>87%</b><small>Model confidence</small></span><span><b>+18.9%</b><small>Demand signal</small></span><span><b>4 hrs</b><small>Action window</small></span></div><div class="action-row">${accepted ? '<span class="accepted-state">✓ Recommendation accepted · allocation recorded</span>' : '<button class="button primary" data-action="accept-recommendation">Accept recommendation</button><button class="button secondary" data-action="reject-recommendation">Reject</button>'}<button class="text-button" data-action="open-recommendation">View details ${icon('arrow')}</button></div></article><article class="panel side-panel"><div class="panel-heading"><div><span class="section-kicker">TODAY'S ACTIONS</span><h3>Optimization ledger</h3></div></div><div class="ledger-list"><div><span class="ledger-number">01</span><p><strong>Blood reserve protected</strong><small>O-negative · West region</small></p><span class="ledger-status green">Done</span></div><div><span class="ledger-number">02</span><p><strong>Ambulance re-routed</strong><small>AMB-042 · Chennai</small></p><span class="ledger-status green">Done</span></div><div><span class="ledger-number">03</span><p><strong>ICU rebalancing</strong><small>8 beds · Tamil Nadu</small></p><span class="ledger-status amber">Review</span></div></div></article></section></div>`;
}

function emergencyView() {
  return `<div class="page-stack"><section class="page-heading emergency-heading"><div><span class="section-kicker red-text">PRIORITY RESPONSE NETWORK</span><h2>Emergency command center</h2><p>Coordinating synthetic response signals across high-priority regions.</p></div><span class="emergency-clock"><i class="live-dot red"></i> Response window · 02:48:16</span></section><section class="emergency-hero"><div class="emergency-pulse"><span>${icon('emergency')}</span><div><small>ACTIVE SCENARIO · DEMONSTRATION</small><h3>Dengue surge — Chennai region</h3><p>Patient demand has crossed the simulated regional threshold. Coordinated action recommended.</p></div></div><div class="severity">HIGH <span>Level 3</span></div></section><section class="emergency-grid"><article class="panel"><div class="panel-heading"><div><span class="section-kicker">SITUATION REPORT</span><h3>Resource requirements</h3></div><span class="panel-chip amber"><i class="dot amber"></i> Monitoring</span></div><div class="requirement-grid"><div><span>${icon('hospital')}</span><b>30</b><small>Additional beds</small></div><div><span>${icon('pulse')}</span><b>8</b><small>ICU beds</small></div><div><span>${icon('ambulance')}</span><b>4</b><small>Ambulances</small></div><div><span>${icon('blood')}</span><b>420</b><small>Blood units</small></div></div><div class="emergency-facts"><span><small>Patient increase</small><b>+18.9%</b></span><span><small>Affected facilities</small><b>14</b></span><span><small>Last updated</small><b>60 sec ago</b></span></div></article><article class="panel emergency-action"><div class="panel-heading"><div><span class="section-kicker">AI RESPONSE PLAN</span><h3>Recommended action</h3></div><span class="ai-badge">AI</span></div><div class="big-rec">Activate <b>30 additional beds</b> and redirect <b>4 ambulances</b> to the Chennai response corridor.</div><p class="muted">This plan is an operational simulation. Confirm with authorized health officials before execution.</p><button class="button primary full" data-action="accept-emergency">Acknowledge & create response plan ${icon('arrow')}</button></article></section></div>`;
}

function alertsView() {
  return `<div class="page-stack"><section class="page-heading"><div><span class="section-kicker">SIGNAL MANAGEMENT</span><h2>Alert center</h2><p>Review and resolve synthetic network events.</p></div><button class="button secondary" data-action="mark-all">${icon('check')} Mark all read</button></section><div class="alert-list-panel panel">${state.alerts.concat(state.surge ? [{ id: 99, title: 'Bed shortage risk detected', detail: 'Chennai response corridor · AI forecast', severity: 'Critical', time: 'Now', read: false }] : []).map(a => `<div class="alert-row ${a.read ? 'read' : ''}"><span class="alert-severity ${a.severity.toLowerCase()}">${icon(a.severity === 'Critical' ? 'alert' : a.severity === 'Warning' ? 'trend' : 'check')}</span><div><strong>${a.title}</strong><p>${a.detail}</p></div><time>${a.time}</time><span class="severity-tag ${a.severity.toLowerCase()}">${a.severity}</span>${!a.read ? `<button class="icon-button small" data-alert="${a.id}" aria-label="Mark alert read">${icon('check')}</button>` : '<span class="read-label">Read</span>'}</div>`).join('')}</div></div>`;
}

function genericView() {
  const content = {
    network: ['Connected healthcare network', '11 states · 1,842 facilities · 24,680 data points per minute', ['Facility gateways', 'Data pipelines', 'Regional coverage']],
    analytics: ['Network analytics', 'Explore synthetic trends across capacity, demand, and resources.', ['Patient visits', 'Occupancy trend', 'Regional demand']],
    interop: ['Data interoperability', 'FHIR-compatible exchange concepts, shown as a demonstration only.', ['Hospital API', 'Laboratory API', 'Pharmacy API']],
    audit: ['Consent & audit', 'Trace every simulated access, allocation, and consent decision.', ['Audit coverage', 'Consent requests', 'Trust ledger']],
    health: ['System health', 'Demo infrastructure telemetry for the command center.', ['API service', 'AI inference', 'Realtime gateway']],
    settings: ['Workspace settings', 'Manage the presentation environment and demo controls.', ['Profile & role', 'Notifications', 'Demo controls']]
  }[state.active] || ['Workspace', 'A focused view of the healthcare intelligence platform.', ['Connected systems', 'Operational signals', 'Recent activity']];
  return `<div class="page-stack"><section class="page-heading"><div><span class="section-kicker">BHARAT HEALTHNET AI · DEMO MODULE</span><h2>${content[0]}</h2><p>${content[1]}</p></div><button class="button primary" data-action="simulate">Run data simulation ${icon('arrow')}</button></section><section class="generic-grid">${content[2].map((x, i) => `<article class="panel generic-card"><span class="generic-icon ${['blue','purple','green'][i]}">${icon(['network','brain','shield'][i])}</span><span class="section-kicker">OPERATIONAL VIEW 0${i + 1}</span><h3>${x}</h3><p>Healthy signal across the synthetic national network. Drill into this view to explore the operational story.</p><div class="generic-stat"><b>${['99.98%', '2.4m', '100%'][i]}</b><span>current status ${icon('trend')}</span></div><button class="text-button">Explore module ${icon('arrow')}</button></article>`).join('')}</section></div>`;
}

function renderMain() {
  if (state.active === 'dashboard') return `${dashboardView()}${assistantPanel()}`;
  if (state.active === 'hospitals') return tableView('hospitals');
  if (['beds', 'blood', 'medicines', 'ambulances', 'equipment'].includes(state.active)) return tableView(state.active);
  if (state.active === 'ai') return `${aiView()}${assistantPanel()}`;
  if (state.active === 'resources') return resourcesView();
  if (state.active === 'emergency') return emergencyView();
  if (state.active === 'alerts') return alertsView();
  return genericView();
}

function assistantPanel() {
  const status = state.aiStatus === 'thinking' ? 'Thinking…' : state.aiStatus === 'offline' ? 'Fallback mode' : 'Groq AI connected';
  const statusTone = state.aiStatus === 'offline' ? 'offline' : state.aiStatus === 'thinking' ? 'thinking' : '';
  return `<section class="assistant-panel panel"><div class="assistant-header"><div><span class="section-kicker">OPERATIONS ANALYTICS ASSISTANT</span><h3>Bharat HealthNet intelligence assistant</h3><p>Ask about this live synthetic network. Answers are operational only and require human review.</p></div><span class="assistant-status ${statusTone}"><i class="dot ${state.aiStatus === 'offline' ? 'amber' : 'green'}"></i> ${status}</span></div><div class="assistant-messages">${state.assistant.map(message => `<div class="assistant-message ${message.from}"><span class="assistant-avatar">${message.from === 'bot' ? icon('brain') : 'AR'}</span><p>${assistantText(message.text)}</p></div>`).join('')}</div><div class="assistant-suggestions"><button class="assistant-suggestion" data-question="Which states have the highest bed utilization?" ${state.aiBusy ? 'disabled' : ''}>Highest bed utilization</button><button class="assistant-suggestion" data-question="Which medicines are at risk of shortage?" ${state.aiBusy ? 'disabled' : ''}>Medicine shortage risk</button><button class="assistant-suggestion" data-question="What resources are needed for the Chennai emergency?" ${state.aiBusy ? 'disabled' : ''}>Chennai emergency plan</button></div><form class="assistant-form"><input aria-label="Ask the operations assistant" placeholder="Ask an operations question…" ${state.aiBusy ? 'disabled' : ''} /><button class="button primary" type="submit" ${state.aiBusy ? 'disabled' : ''}>${state.aiBusy ? 'Thinking…' : `Send ${icon('arrow')}`}</button></form></section>`;
}

function renderModal() {
  if (!state.modal) return '';
  if (state.modal.type === 'simulator') {
    const scenarios = [['surge', 'Patient surge', 'Increase demand in Tamil Nadu and recalculate capacity risk.', 'trend', 'Critical'], ['blood', 'Blood shortage', 'Lower O-negative reserve and create a supply warning.', 'blood', 'Warning'], ['medicine', 'Medicine shortage', 'Push antibiotic consumption past the reorder threshold.', 'pharmacy', 'Warning'], ['equipment', 'Equipment overheating', 'Raise telemetry risk for a ventilator cluster.', 'equipment', 'Critical'], ['emergency', 'Emergency scenario', 'Open a Chennai response plan with coordinated resources.', 'emergency', 'High']];
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal simulator-modal" role="dialog" aria-modal="true" aria-label="Healthcare data simulator" data-modal-content><div class="modal-header"><div><span class="section-kicker">ADMIN-ONLY DEMO CONTROL</span><h2>Healthcare data simulator</h2><p>Inject a synthetic operational event into the live command center.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close simulator">${icon('close')}</button></div><div class="scenario-grid">${scenarios.map(([id, title, desc, ico, severity]) => `<button class="scenario-card ${state.modal.scenario === id ? 'selected' : ''}" data-scenario="${id}"><span class="scenario-icon ${severity.toLowerCase()}">${icon(ico)}</span><span><strong>${title}</strong><small>${desc}</small></span><i>${state.modal.scenario === id ? icon('check') : icon('arrow')}</i></button>`).join('')}</div><div class="simulator-footnote">Simulation updates the local demo session, forecast chart, alert feed, and audit trail. No external systems are contacted.</div><div class="modal-footer"><button class="button secondary" data-action="close-modal">Cancel</button><button class="button primary" data-action="confirm-modal">Run selected simulation ${icon('arrow')}</button></div></section></div>`;
  }
  if (state.modal.type === 'facility') {
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal small-modal" role="dialog" aria-modal="true" aria-label="Add synthetic facility" data-modal-content><div class="modal-header"><div><span class="section-kicker">SYNTHETIC DIRECTORY</span><h2>Add facility</h2><p>Create a local demo facility record.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close add facility">${icon('close')}</button></div><form class="facility-form"><label>Facility name<input name="facilityName" required placeholder="e.g. Riverfront Care Hospital" /></label><label>City<input name="city" required placeholder="e.g. Madurai" /></label><label>State<select name="facilityState"><option>Tamil Nadu</option><option>Kerala</option><option>Karnataka</option><option>Maharashtra</option><option>Delhi</option></select></label><div class="form-row"><label>Total beds<input name="beds" type="number" min="20" value="420" required /></label><label>ICU beds<input name="icu" type="number" min="2" value="32" required /></label></div><div class="modal-footer"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button type="submit" class="button primary">Save synthetic facility ${icon('arrow')}</button></div></form></section></div>`;
  }
  if (state.modal.type === 'search') {
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal small-modal" role="dialog" aria-modal="true" aria-label="Search network" data-modal-content><div class="modal-header"><div><span class="section-kicker">NETWORK SEARCH</span><h2>Find in the network</h2><p>Search synthetic facilities by name, city, or state.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close search">${icon('close')}</button></div><form class="global-search-form"><div class="input-wrap">${icon('search')}<input name="networkQuery" aria-label="Network search query" autofocus placeholder="Search hospitals, cities, states…" /></div><div class="search-hints"><span>Try</span><button type="button" data-query="Chennai">Chennai</button><button type="button" data-query="Critical">Critical</button><button type="button" data-query="Bengaluru">Bengaluru</button></div><div class="modal-footer"><button type="button" class="button secondary" data-action="close-modal">Cancel</button><button type="submit" class="button primary">Search records ${icon('arrow')}</button></div></form></section></div>`;
  }
  if (state.modal.type === 'hospital') {
    const h = hospitals.find(x => x.id === state.modal.id) || hospitals[0];
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-label="Hospital details" data-modal-content><div class="modal-header"><div><span class="section-kicker">FACILITY DETAIL · ${h.id}</span><h2>${h.name}</h2><p>${h.city}, ${h.state} · ${h.type} facility</p></div><button class="icon-button" data-action="close-modal">${icon('close')}</button></div><div class="modal-status-row">${statusBadge(h.status)}<span class="panel-chip green"><i class="dot green"></i> Data synced 42 sec ago</span></div><div class="modal-metrics"><div><small>Bed utilization</small><b>${Math.round(h.occupied / h.beds * 100)}%</b><span>${fmt(h.occupied)} occupied of ${fmt(h.beds)}</span></div><div><small>ICU available</small><b>${h.available}</b><span>of ${h.icu} total ICU beds</span></div><div><small>Patient count</small><b>${fmt(h.occupied + 86)}</b><span>+12% vs 24h ago</span></div><div><small>Clinical staff</small><b>${h.doctors}</b><span>doctors on roster</span></div></div><div class="modal-columns"><div><span class="section-kicker">CAPACITY SIGNAL</span><h3>Current operational picture</h3><div class="detail-bar"><span><b>General beds</b><i><em style="width:${Math.round(h.occupied / h.beds * 100)}%"></em></i><small>${fmt(h.beds - h.occupied)} available</small></span><span><b>ICU beds</b><i><em style="width:${Math.round((h.icu - h.available) / h.icu * 100)}%"></em></i><small>${h.available} available</small></span></div></div><div><span class="section-kicker">AI SIGNAL</span><h3>Demand outlook</h3><p class="ai-note">${h.status === 'Critical' ? 'High utilization detected. Consider activating reserve capacity within 4 hours.' : 'Stable operating range. No immediate capacity action is required.'}</p></div></div><div class="modal-footer"><button class="button secondary" data-action="close-modal">Close detail</button><button class="button primary" data-action="open-recommendation">View allocation options ${icon('arrow')}</button></div></section></div>`;
  }
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal small-modal" role="dialog" aria-modal="true" data-modal-content><div class="modal-header"><div><span class="section-kicker">DEMO ACTION</span><h2>${state.modal.title || 'Command action'}</h2></div><button class="icon-button" data-action="close-modal">${icon('close')}</button></div><p>${state.modal.body || 'This action updates the synthetic command-center state and records an audit event.'}</p><div class="modal-footer"><button class="button secondary" data-action="close-modal">Cancel</button><button class="button primary" data-action="confirm-modal">Confirm action ${icon('arrow')}</button></div></section></div>`;
}

function statusBadge(status) {
  const s = String(status).toLowerCase();
  const tone = s.includes('critical') || s.includes('high') ? 'red' : s.includes('warning') || s.includes('low') || s.includes('medium') || s.includes('watch') ? 'amber' : 'green';
  return `<span class="status-badge ${tone}"><i class="dot ${tone}"></i>${status}</span>`;
}

function renderToast() { return state.toast ? `<div class="toast ${state.toast.tone || 'success'}"><span>${icon(state.toast.tone === 'warning' ? 'alert' : 'check')}</span><div><strong>${state.toast.title}</strong><small>${state.toast.text}</small></div><button data-action="clear-toast">${icon('close')}</button></div>` : ''; }

function renderNotifications() { return state.notificationsOpen ? `<div class="notification-popover"><div class="popover-heading"><strong>Notifications</strong><button class="text-button" data-nav="alerts">View all</button></div>${state.alerts.slice(0, 3).map(a => `<div class="popover-item"><span class="alert-severity ${a.severity.toLowerCase()}">${icon('alert')}</span><div><strong>${a.title}</strong><small>${a.time}</small></div></div>`).join('')}</div>` : ''; }

function renderProfile() { return state.modal?.type === 'profile' ? `<div class="modal-backdrop" data-action="close-modal"><section class="modal small-modal" role="dialog" aria-modal="true" data-modal-content><div class="modal-header"><div><span class="section-kicker">CURRENT SESSION</span><h2>${state.session.name}</h2><p>${state.session.role} · Demo role</p></div><button class="icon-button" data-action="close-modal" aria-label="Close profile">${icon('close')}</button></div><div class="profile-session"><span class="avatar large">${state.session.initials}</span><div><strong>${state.session.role}</strong><span>Role access · ${roleModules(state.session.role).length} modules</span><span>Last login: ${new Date(state.session.loginAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></div><div class="modal-footer"><button class="button secondary" data-action="logout">Sign out</button><button class="button primary" data-action="close-modal">Continue ${icon('arrow')}</button></div></section></div>` : ''; }

function render() {
  if (!state.session) { app.innerHTML = renderLogin(); bindEvents(); return; }
  if (!canAccess(state.session.role, state.active)) state.active = 'dashboard';
  let mainHtml = renderMain().replace('Good evening, Arjun', `Good evening, ${state.session.name.split(' ')[0]}`).replace('WEDNESDAY · 26 AUGUST 2026 · 21:48 IST', liveDateLabel());
  if (!canSimulate()) mainHtml = mainHtml.replace(/<button[^>]*data-action="simulate"[^>]*>[\s\S]*?<\/button>/g, '');
  const topbarHtml = renderTopbar().replace('Live network <b>99.98%</b>', `${state.livePaused ? 'Stream paused' : 'Live network'} <b>${state.livePaused ? '—' : '99.98%'}</b>`).replace('</header>', `<button class="live-control ${state.livePaused ? 'paused' : ''}" data-action="toggle-live">${icon(state.livePaused ? 'pulse' : 'pause')} ${state.livePaused ? 'Resume stream' : 'Pause stream'}</button></header>`);
  app.innerHTML = `<div class="app-shell ${state.presentation ? 'presentation' : ''} ${state.mobileNav ? 'mobile-nav-open' : ''}">${renderSidebar()}${state.mobileNav ? '<button class="mobile-overlay" data-action="sidebar" aria-label="Close navigation"></button>' : ''}<main class="main-content">${topbarHtml}<div class="content-scroll">${mainHtml}</div></main>${renderNotifications()}${renderModal()}${renderProfile()}${renderToast()}</div>`;
  bindEvents();
  liveStream.start();
}

function showToast(title, text, tone = 'success') { state.toast = { title, text, tone }; render(); window.setTimeout(() => { if (state.toast?.title === title) { state.toast = null; render(); } }, 4200); }

function performSimulation(type = 'surge') {
  state.surge = Math.min(state.surge + 1, 3);
  const title = type === 'medicine' ? 'Medicine shortage simulated' : type === 'blood' ? 'Blood shortage simulated' : type === 'equipment' ? 'Equipment overheating simulated' : type === 'emergency' ? 'Emergency scenario activated' : 'Patient surge simulated';
  const detail = type === 'blood' ? 'O-negative reserve · supply threshold crossed' : type === 'medicine' ? 'Antibiotic inventory · reorder threshold crossed' : type === 'equipment' ? 'Ventilator cluster · sensor risk elevated' : 'Tamil Nadu regional model · synthetic event created';
  state.alerts.unshift({ id: Date.now(), title, detail, severity: type === 'surge' || type === 'equipment' || type === 'emergency' ? 'Critical' : 'Warning', time: 'Now', read: false });
  if (type === 'emergency') state.active = 'emergency';
  state.modal = null;
  persistState();
  showToast(title, 'Dashboard, forecasts, alerts, and audit trail updated.');
}

function localAssistantReply(message) {
  const text = message.toLowerCase();
  let reply = 'I can provide healthcare operations and resource information, but I cannot provide medical diagnosis or treatment advice.';
  if (text.includes('bed') || text.includes('icu')) reply = 'The highest ICU utilization is in Delhi at 88%, followed by Tamil Nadu at 82%. Bharat General Hospital has 18 synthetic ICU beds available.';
  else if (text.includes('medicine') || text.includes('shortage')) reply = 'Three medicine signals need attention: Amoxicillin has 2 days remaining, Ceftriaxone has 4 days, and Paracetamol is forecast to reach threshold in 6 days.';
  else if (text.includes('state') || text.includes('utilization')) reply = 'Delhi currently shows the highest simulated bed utilization at 88%. Maharashtra is at 82%, Uttar Pradesh at 81%, and Tamil Nadu at 78%.';
  else if (text.includes('chennai') || text.includes('emergency')) reply = 'The Chennai demonstration scenario calls for 30 additional beds, 8 ICU beds, 4 ambulances, and 420 blood units. An AI plan is ready for review in Emergency Command.';
  return reply;
}

function assistantContext() {
  const region = stateData[state.selectedRegion];
  return {
    page: pageTitle(),
    selectedRegion: state.selectedRegion,
    region: { level: region.level, hospitals: region.hospitals, beds: region.beds, icu: region.icu, load: region.load, blood: region.blood, medicine: region.medicine },
    network: { seededHospitals: seedSummary.hospitals, bloodBanks: seedSummary.bloodBanks, medicines: seedSummary.medicines, ambulances: seedSummary.ambulances, equipment: seedSummary.equipment, liveEvent: liveTime() },
    currentSignals: { surgeSimulations: state.surge, unreadAlerts: state.alerts.filter(a => !a.read).length, alerts: state.alerts.slice(0, 4).map(({ title, detail, severity }) => ({ title, detail, severity })) },
    operationalRules: ['Use only synthetic records in this demo.', 'Do not provide diagnosis, prescriptions, or treatment instructions.', 'Recommendations require authorized human review before action.']
  };
}

async function assistantReply(message) {
  state.assistant.push({ from: 'user', text: message }, { from: 'bot', text: 'Reading the latest network signals…', pending: true });
  state.aiBusy = true;
  state.aiStatus = 'thinking';
  render();
  setTimeout(() => document.querySelector('.assistant-messages')?.scrollTo(0, 9999), 0);
  const pending = state.assistant.findLast?.(item => item.pending) || state.assistant[state.assistant.length - 1];
  try {
    pending.text = await askOperationsAI(message, assistantContext());
    state.aiStatus = 'ready';
  } catch {
    pending.text = `${localAssistantReply(message)}\n\nLive AI is temporarily unavailable, so this answer came from the local demo fallback.`;
    state.aiStatus = 'offline';
  } finally {
    pending.pending = false;
    state.aiBusy = false;
    render();
    setTimeout(() => document.querySelector('.assistant-messages')?.scrollTo(0, 9999), 0);
  }
}

function exportCsv() {
  const rows = [['Facility ID', 'Facility', 'City', 'State', 'Beds', 'Occupied', 'ICU Available', 'Status'], ...hospitals.map(h => [h.id, h.name, h.city, h.state, h.beds, h.occupied, h.available, h.status])];
  const blob = new Blob([rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'bharat-healthnet-demo-hospitals.csv'; link.click(); URL.revokeObjectURL(link.href);
  showToast('CSV export ready', 'Synthetic hospital capacity report downloaded.');
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  state.loginError = '';
  if (button) { button.disabled = true; button.textContent = 'Checking access…'; }
  const session = await authenticate(data.get('email')?.toString() || '', data.get('password')?.toString() || '');
  if (!session) {
    state.loginError = 'Email or password is incorrect. Use one of the synthetic demo accounts below.';
    render();
    return;
  }
  state.session = session;
  state.loginError = '';
  state.active = 'dashboard';
  persistSession();
  render();
}

function bindEvents() {
  const loginForm = document.querySelector('.login-form');
  if (!state.session) {
    if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    document.querySelectorAll('[data-demo-email]').forEach(el => el.addEventListener('click', () => { const input = loginForm.querySelector('[name="email"]'); input.value = el.dataset.demoEmail; input.focus(); }));
    }
    document.querySelectorAll('[data-demo-login]').forEach(el => el.addEventListener('click', () => { const session = demoLogin(el.dataset.demoLogin); if (session) { state.session = session; state.loginError = ''; persistSession(); render(); } }));
    return;
  }
  document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => { if (!canAccess(state.session.role, el.dataset.nav)) { showToast('Access restricted', 'This module is not enabled for the current demo role.', 'warning'); return; } state.active = el.dataset.nav; state.notificationsOpen = false; state.mobileNav = false; render(); }));
  document.querySelectorAll('[data-region]').forEach(el => el.addEventListener('click', () => { state.selectedRegion = el.dataset.region; persistState(); render(); }));
  document.querySelectorAll('[data-hospital]').forEach(el => el.addEventListener('click', () => { state.modal = { type: 'hospital', id: el.dataset.hospital }; render(); }));
  document.querySelectorAll('[data-search]').forEach(el => el.addEventListener('input', e => { state.query = e.target.value; render(); const input = document.querySelector('[data-search]'); input?.focus(); input?.setSelectionRange(state.query.length, state.query.length); }));
  document.querySelector('[data-filter="status"]')?.addEventListener('change', e => { state.statusFilter = e.target.value; render(); });
  document.querySelector('[data-filter="sort"]')?.addEventListener('change', e => { state.sortBy = e.target.value; render(); });
  document.querySelectorAll('[data-alert]').forEach(el => el.addEventListener('click', () => { const alert = state.alerts.find(a => String(a.id) === el.dataset.alert); if (alert) alert.read = true; render(); }));
  document.querySelectorAll('[data-scenario]').forEach(el => el.addEventListener('click', () => { state.modal.scenario = el.dataset.scenario; render(); }));
  document.querySelectorAll('[data-query]').forEach(el => el.addEventListener('click', () => { const input = document.querySelector('[name="networkQuery"]'); if (input) input.value = el.dataset.query; }));
  document.querySelectorAll('[data-modal-content]').forEach(el => el.addEventListener('click', e => e.stopPropagation()));
  document.querySelector('[data-action="logout"]')?.addEventListener('click', () => { liveStream.stop(); state.session = null; state.modal = null; state.active = 'dashboard'; persistSession(); render(); });
  document.querySelector('[data-action="toggle-live"]')?.addEventListener('click', () => { state.livePaused = !state.livePaused; render(); });
  document.querySelectorAll('[data-action="simulate"]').forEach(el => el.addEventListener('click', e => { if (!canSimulate()) { e.stopImmediatePropagation(); showToast('Access restricted', 'Only Super Admin and Health Authority demo roles can run simulations.', 'warning'); } }, true));
  document.querySelector('.facility-form')?.addEventListener('submit', e => { e.preventDefault(); const data = new FormData(e.currentTarget); const beds = Number(data.get('beds')); const icu = Number(data.get('icu')); hospitals.unshift({ id: `BHN-${String(hospitals.length + 1).padStart(3, '0')}`, name: data.get('facilityName'), city: data.get('city'), state: data.get('facilityState'), district: `${data.get('city')} district`, type: 'Multi-specialty', beds, occupied: Math.round(beds * .54), icu, available: Math.round(icu * .46), doctors: 84, status: 'Normal', lastSync: 'now' }); state.modal = null; persistState(); state.active = 'hospitals'; showToast('Facility added', `${data.get('facilityName')} was added to the synthetic directory.`); });
  document.querySelector('.global-search-form')?.addEventListener('submit', e => { e.preventDefault(); const value = new FormData(e.currentTarget).get('networkQuery')?.toString().trim(); if (value) { state.query = value; state.active = 'hospitals'; state.modal = null; render(); } });
  document.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', e => { if (el.closest('[data-modal-content]') && el.dataset.action === 'close-modal') { state.modal = null; render(); return; } const action = el.dataset.action; if (action === 'presentation') { state.presentation = !state.presentation; render(); } if (action === 'sidebar') { state.mobileNav = !state.mobileNav; render(); } if (action === 'search') { state.modal = { type: 'search' }; render(); } if (action === 'open-ai') { state.active = 'ai'; state.notificationsOpen = false; state.mobileNav = false; render(); } if (action === 'notifications') { state.notificationsOpen = !state.notificationsOpen; render(); } if (action === 'profile') { state.modal = { type: 'profile' }; state.notificationsOpen = false; render(); } if (action === 'close-modal') { state.modal = null; render(); } if (action === 'dismiss-notice') { state.noticeVisible = false; render(); } if (action === 'simulate') { state.modal = { type: 'simulator', scenario: 'surge' }; render(); } if (action === 'open-hospital') { state.modal = { type: 'facility' }; render(); } if (action === 'confirm-modal' && state.modal?.type === 'simulator') { const scenario = state.modal.scenario; performSimulation(scenario); } if (action === 'export') exportCsv(); if (action === 'open-recommendation') { state.active = 'resources'; state.modal = null; render(); } if (action === 'accept-recommendation') { state.accepted = true; persistState(); showToast('Recommendation accepted', '8 ICU beds allocated to the Tamil Nadu surge pool.'); } if (action === 'reject-recommendation') showToast('Recommendation held', 'No allocation was made. It remains available for review.', 'warning'); if (action === 'accept-emergency') showToast('Response plan acknowledged', 'Emergency response workflow and audit event created.'); if (action === 'mark-all') { state.alerts.forEach(a => a.read = true); render(); showToast('Alerts marked as read', 'Your alert center is up to date.'); } if (action === 'switch-role') { state.modal = null; showToast('Demo role switcher', 'Role management is available in the full platform build.'); } if (action === 'clear-toast') { state.toast = null; render(); } }));
  document.querySelector('.assistant-form')?.addEventListener('submit', e => { e.preventDefault(); const input = e.currentTarget.querySelector('input'); if (input.value.trim()) { const value = input.value.trim(); input.value = ''; assistantReply(value); } });
  document.querySelectorAll('[data-question]').forEach(el => el.addEventListener('click', () => assistantReply(el.dataset.question)));
}

render();
