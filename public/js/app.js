// ApexExterior Outreach & Response Intelligence Platform Frontend
let state = {
  currentTab: 'overview',
  activeContactId: null,
  activeContact: null,
  activeThreadMessages: [],
  activeThreadResponses: [],
  researchData: null,
  searchTimer: null
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  loadDashboard();
  loadIoTTelemetry();
  loadResearchData();
  loadCampaigns();
  loadInbox();
  loadLeads();
  loadSettings();
  loadGrowthIdeas();
  loadInvoicesData();
}

// -------------------------------------------------------------
// Navigation & Topbar State
// -------------------------------------------------------------
const TAB_TITLES = {
  overview: { title: "Operations Dashboard", sub: "Twin Cities Fleet Dispatch, Revenue Pulse & IoT Telematics" },
  schedule: { title: "Dispatch & Routes", sub: "Daily Fleet Stops & Technician Workday Manifest" },
  d2d: { title: "Door-to-Door Canvass Hub", sub: "60-Second Doorstep Knock Entry & Territory Tracker" },
  leads: { title: "Customer Leads & CRM", sub: "Homeowner Property Database & Quote Pipeline" },
  invoices: { title: "Invoicing & Tiered Estimates", sub: "3-Tier Estimate Matrix, Payments & Crew Tips" },
  growth: { title: "Growth Vault & Playbooks", sub: "VIP Memberships & Route Density Neighbor Campaigns" },
  inbox: { title: "SMS Inbox & AI Copilot", sub: "2-Way Customer Texting & Instant AI Rebuttals" },
  research: { title: "Response Intelligence", sub: "Objection Mining, Sentiment Analysis & Sandbox" },
  playbook: { title: "Research Playbook", sub: "Conversion Benchmarks & Homeowner Buyer Psychology" },
  campaigns: { title: "Outreach Campaigns", sub: "Multi-Channel Drip Sequences & Compliance Window" },
  settings: { title: "System Settings", sub: "SMTP, Twilio API Keys & Quiet Hours Configuration" },
  investor: { title: "Investor Pitch & Slide Deck", sub: "Phase 2 Presentation • 7-Minute Pitch, Live Slide Player & Speaker Teleprompter" }
};

function toggleSidebar() {
  const sidebar = document.getElementById('appSidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabId}`);
  });

  // Update topbar title & subtitle
  const titleInfo = TAB_TITLES[tabId] || { title: "APEX Field OS", sub: "Gerry's Window Services" };
  const titleEl = document.getElementById('topbarPageTitle');
  const subEl = document.getElementById('topbarPageSubtitle');
  if (titleEl) titleEl.innerText = titleInfo.title;
  if (subEl) subEl.innerText = titleInfo.sub;

  // Close mobile sidebar if open
  const sidebar = document.getElementById('appSidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }

  if (tabId === 'overview') { loadDashboard(); loadIoTTelemetry(); }
  if (tabId === 'd2d') loadD2DData();
  if (tabId === 'schedule') { loadScheduleData(); loadIoTTelemetry(); }
  if (tabId === 'invoices') loadInvoicesData();
  if (tabId === 'growth') loadGrowthIdeas();
  if (tabId === 'research') loadResearchData();
  if (tabId === 'campaigns') loadCampaigns();
  if (tabId === 'inbox') loadInbox();
  if (tabId === 'leads') loadLeads();
  if (tabId === 'settings') loadSettings();
  if (tabId === 'investor') initInvestorPitchDeck();
}

// -------------------------------------------------------------
// Toast Notifications
// -------------------------------------------------------------
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

// -------------------------------------------------------------
// Dashboard & Metrics
// -------------------------------------------------------------
async function loadDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();

    document.getElementById('kpi-contacts').innerText = data.contacts_count || 0;
    document.getElementById('kpi-sent').innerText = data.sent_count || 0;
    document.getElementById('kpi-reply-rate').innerText = `${data.reply_rate || 0}%`;
    document.getElementById('kpi-sentiment').innerText = `${data.positive_sentiment_rate || 0}%`;
    document.getElementById('kpi-booked').innerText = data.booked_count || 0;
    document.getElementById('kpi-pipeline').innerText = `$${(data.pipeline_value || 0).toLocaleString()}`;

    // Quiet hours indicator
    const quietDot = document.getElementById('quiet-hours-indicator');
    const quietText = document.getElementById('quiet-hours-text');
    if (data.quiet_hours_active) {
      quietDot.querySelector('.status-dot').className = 'status-dot amber';
      quietText.innerText = 'Quiet Hours Protection Active (8PM - 8AM local)';
    } else {
      quietDot.querySelector('.status-dot').className = 'status-dot green';
      quietText.innerText = 'Compliant Outreach Window Active (8AM - 8PM)';
    }
    const creditsLeft = Math.max(0, 10000 - (data.sent_count || 0));
    const pillCredits = document.getElementById('header-credits-left');
    if (pillCredits) pillCredits.innerText = `${creditsLeft.toLocaleString()} left`;
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

// -------------------------------------------------------------
// Settings & Provider Presets
// -------------------------------------------------------------
function selectPreset(preset) {
  document.querySelectorAll('.provider-preset-btn').forEach(btn => btn.classList.remove('active-preset'));
  const dnsGuide = document.getElementById('zeptomail-dns-guide');

  if (preset === 'zeptomail') {
    if (event && event.currentTarget) event.currentTarget.classList.add('active-preset');
    document.getElementById('setting-smtp-host').value = 'smtp.zeptomail.com';
    document.getElementById('setting-smtp-port').value = '587';
    document.getElementById('setting-smtp-user').value = 'emailapikey';
    document.getElementById('setting-smtp-pass').value = '';
    document.getElementById('setting-smtp-pass').placeholder = 'Paste ZeptoMail Send Mail Token (starts with PHtE...)';
    if (dnsGuide) dnsGuide.classList.remove('hidden');
    showToast('⚡ Zoho ZeptoMail preset applied! Paste your Send Mail Token.');
  } else if (preset === 'brevo') {
    if (event && event.currentTarget) event.currentTarget.classList.add('active-preset');
    document.getElementById('setting-smtp-host').value = 'smtp-relay.brevo.com';
    document.getElementById('setting-smtp-port').value = '587';
    document.getElementById('setting-smtp-user').value = 'bd52ae001@smtp-brevo.com';
    document.getElementById('setting-smtp-pass').value = 'xsmtpsib-74faa5afed0b2f32aa2795e6b4ba82ab95f2b8a0bf7b4b78c749933390ee91e6-sAS14WBzcxH8ZRdV';
    if (dnsGuide) dnsGuide.classList.add('hidden');
    showToast('📧 Brevo Free Relay preset applied!');
  } else if (preset === 'google') {
    if (event && event.currentTarget) event.currentTarget.classList.add('active-preset');
    document.getElementById('setting-smtp-host').value = 'smtp.gmail.com';
    document.getElementById('setting-smtp-port').value = '587';
    document.getElementById('setting-smtp-pass').value = '';
    document.getElementById('setting-smtp-pass').placeholder = '16-character Google App Password';
    if (dnsGuide) dnsGuide.classList.add('hidden');
    showToast('🌐 Google Workspace preset applied!');
  }
}

async function triggerTestEmail() {
  const btn = document.getElementById('btn-test-email');
  const resultDiv = document.getElementById('test-email-result');
  const toEmail = document.getElementById('test-email-recipient').value.trim();

  if (!toEmail) {
    showToast('Please enter a test recipient email address');
    return;
  }

  const payload = {
    to: toEmail,
    settings: {
      smtp_host: document.getElementById('setting-smtp-host').value,
      smtp_port: document.getElementById('setting-smtp-port').value,
      smtp_user: document.getElementById('setting-smtp-user').value,
      smtp_password: document.getElementById('setting-smtp-pass').value,
      company_email: document.getElementById('setting-company-email').value,
      company_name: document.getElementById('setting-company-name').value
    }
  };

  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Connecting & Testing...</span>';
  resultDiv.className = 'hidden';

  try {
    const res = await fetch('/api/settings/test_email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      resultDiv.className = 'test-result-banner success';
      resultDiv.innerHTML = `
        <span style="font-size:1.2rem;">🟢</span>
        <div>
          <strong>Handshake & SMTP Delivery Succeeded!</strong><br>
          Verified test message was successfully accepted by <code>${payload.settings.smtp_host}</code> and delivered to <code>${toEmail}</code>.
        </div>
      `;
      showToast('Test email sent successfully!');
    } else {
      resultDiv.className = 'test-result-banner error';
      resultDiv.innerHTML = `
        <span style="font-size:1.2rem;">🔴</span>
        <div>
          <strong>Connection Failed:</strong> ${data.error || 'Check authentication token and domain records'}<br>
          <span style="font-size:0.75rem; color:#fca5a5; display:block; margin-top:4px;">
            Troubleshooting Tip: If using ZeptoMail, make sure <em>gerryswindows.com</em> domain is verified in your ZeptoMail Mail Agent, and your Send Mail Token has full active permissions.
          </span>
        </div>
      `;
      showToast('Test connection failed - see error details');
    }
  } catch (err) {
    resultDiv.className = 'test-result-banner error';
    resultDiv.innerHTML = `<span>🔴</span><div><strong>Network Error:</strong> Failed to reach test endpoint.</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Send Test Email</span>';
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const s = await res.json();
    document.getElementById('setting-company-name').value = s.company_name || '';
    document.getElementById('setting-company-phone').value = s.company_phone || '';
    document.getElementById('setting-company-email').value = s.company_email || '';
    document.getElementById('setting-quiet-hours-start').value = s.quiet_hours_start || '20:00';
    document.getElementById('setting-quiet-hours-end').value = s.quiet_hours_end || '08:00';
    document.getElementById('setting-twilio-sid').value = s.twilio_account_sid || '';
    document.getElementById('setting-twilio-phone').value = s.twilio_phone_number || '';
    document.getElementById('setting-smtp-host').value = s.smtp_host || 'smtp.zeptomail.com';
    document.getElementById('setting-smtp-port').value = s.smtp_port || '587';
    document.getElementById('setting-smtp-user').value = s.smtp_user || 'emailapikey';
    if (s.smtp_password) {
      document.getElementById('setting-smtp-pass').value = s.smtp_password;
    }
    const isAutopilot = (s.ai_autopilot_enabled === 'true' || s.ai_autopilot_enabled === true || s.ai_autopilot_enabled === undefined);
    updateAutopilotUI(isAutopilot);
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const payload = {
    company_name: document.getElementById('setting-company-name').value,
    company_phone: document.getElementById('setting-company-phone').value,
    company_email: document.getElementById('setting-company-email').value,
    quiet_hours_start: document.getElementById('setting-quiet-hours-start').value,
    quiet_hours_end: document.getElementById('setting-quiet-hours-end').value,
    twilio_account_sid: document.getElementById('setting-twilio-sid').value,
    twilio_auth_token: document.getElementById('setting-twilio-auth').value,
    twilio_phone_number: document.getElementById('setting-twilio-phone').value,
    smtp_host: document.getElementById('setting-smtp-host').value,
    smtp_port: document.getElementById('setting-smtp-port').value,
    smtp_user: document.getElementById('setting-smtp-user').value,
    smtp_password: document.getElementById('setting-smtp-pass').value
  };

  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showToast('Settings saved successfully!');
  } catch (err) {
    showToast('Failed to save settings');
  }
}
async function loadResearchData() {
  try {
    const res = await fetch('/api/research');
    const data = await res.json();
    state.researchData = data;

    // Render Intent Breakdown
    const intentList = document.getElementById('intent-breakdown-list');
    intentList.innerHTML = (data.intents || []).map(i => `
      <div class="intent-row">
        <div class="intent-row-header">
          <span class="intent-row-label">
            <span class="intent-dot" style="background-color: ${i.color}"></span>
            ${i.label}
          </span>
          <span class="intent-row-val">${i.count} replies (${i.percentage}%)</span>
        </div>
        <div class="intent-progress-bg">
          <div class="intent-progress-fill" style="width: ${i.percentage}%; background-color: ${i.color}"></div>
        </div>
      </div>
    `).join('');

    // Render Top Objections
    const objList = document.getElementById('top-objections-list');
    objList.innerHTML = (data.top_objections || []).map(o => `
      <div class="objection-item">
        <span class="objection-title">${o.objection_detail}</span>
        <span class="objection-count-badge">${o.count} prospects</span>
      </div>
    `).join('') || '<p class="text-muted">No objections recorded yet.</p>';

    // Render Recommendations
    const recsContainer = document.getElementById('recommendations-container');
    recsContainer.innerHTML = (data.recommendations || []).map(r => `
      <div class="rec-card">
        <div>
          <div class="rec-cat">${r.category}</div>
          <div class="rec-title">${r.title}</div>
          <div class="rec-finding"><strong>Finding:</strong> ${r.finding}</div>
          <div class="rec-action-box">
            <strong>Recommended Marketing Action:</strong><br/>
            ${r.recommendation}
          </div>
        </div>
        <div class="rec-footer">
          <span class="rec-impact">⚡ Impact: ${r.impact}</span>
          <span class="badge ${r.priority === 'High' ? 'red' : 'amber'}">${r.priority} Priority</span>
        </div>
      </div>
    `).join('') || '<p class="text-muted">Analyzing inbound patterns for recommendations...</p>';

    // Render Battlecards
    const bcContainer = document.getElementById('battlecards-container');
    bcContainer.innerHTML = (data.battlecards || []).map(b => `
      <div class="battlecard">
        <div class="bc-header">
          <div class="bc-title">${b.objection}</div>
          <span class="bc-lift">${b.conversion_lift} Lift</span>
        </div>
        <div class="bc-cause"><strong>Root Psychological Trigger:</strong> ${b.root_cause}</div>
        <div class="bc-script">
          <strong>Field-Tested Rebuttal:</strong><br/>
          "${b.rebuttal_script}"
        </div>
      </div>
    `).join('');

    // Channel stats on overview
    if (data.channel_metrics) {
      const sms = data.channel_metrics.sms;
      const eml = data.channel_metrics.email;
      document.getElementById('sms-sent-stat').innerText = sms.sent;
      document.getElementById('sms-reply-rate-badge').innerText = `${sms.reply_rate}% Reply`;
      document.getElementById('sms-bar').style.width = `${Math.min(sms.reply_rate * 2, 100)}%`;
      document.getElementById('sms-received-text').innerText = `${sms.received} replies received (Fast reply median: ~9 min)`;

      document.getElementById('email-sent-stat').innerText = eml.sent;
      document.getElementById('email-reply-rate-badge').innerText = `${eml.reply_rate}% Reply`;
      document.getElementById('email-bar').style.width = `${Math.min(eml.reply_rate * 2, 100)}%`;
      document.getElementById('email-received-text').innerText = `${eml.received} replies received (Best for rich photo quotes)`;
    }
  } catch (err) {
    console.error('Error loading research data:', err);
  }
}

// -------------------------------------------------------------
// Interactive Response Sandbox
// -------------------------------------------------------------
function testPreset(text) {
  document.getElementById('sandbox-input').value = text;
  runSandboxAnalysis();
}

async function runSandboxAnalysis() {
  const text = document.getElementById('sandbox-input').value.trim();
  if (!text) {
    showToast('Please type or select a message to analyze');
    return;
  }

  try {
    const res = await fetch('/api/research/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const result = await res.json();

    document.getElementById('res-intent').innerText = result.intent_category;
    document.getElementById('res-sentiment').innerText = `${result.sentiment} (${result.sentiment_score})`;
    document.getElementById('res-objection').innerText = result.objection_detail || 'None';
    document.getElementById('res-outcome').innerText = result.conversion_outcome;
    document.getElementById('res-rebuttal').innerText = `"${result.recommended_reply}"`;

    document.getElementById('sandbox-results').classList.remove('hidden');
  } catch (err) {
    console.error('Sandbox error:', err);
    showToast('Failed to analyze response');
  }
}

function copyRebuttal() {
  const script = document.getElementById('res-rebuttal').innerText.replace(/^"|"$/g, '');
  navigator.clipboard.writeText(script).then(() => {
    showToast('Rebuttal script copied to clipboard!');
  });
}

// -------------------------------------------------------------
// Campaigns & Drips
// -------------------------------------------------------------
async function loadCampaigns() {
  try {
    const res = await fetch('/api/campaigns');
    const campaigns = await res.json();

    const container = document.getElementById('campaigns-list-container');
    container.innerHTML = campaigns.map(c => `
      <div class="campaign-card">
        <div>
          <div class="campaign-header">
            <div>
              <div class="campaign-name">${c.name}</div>
              <span class="badge ${c.channel === 'SMS' ? 'blue' : (c.channel === 'Email' ? 'purple' : 'teal')}">${c.channel}</span>
            </div>
            <button class="btn btn-sm ${c.status === 'Active' ? 'btn-secondary' : 'btn-primary'}" onclick="toggleCampaign(${c.id})">
              ${c.status === 'Active' ? '⏸ Pause' : '▶ Activate'}
            </button>
          </div>
          <div class="campaign-desc">${c.description}</div>

          <div class="drip-steps-timeline">
            ${(c.steps || []).map(s => `
              <div class="drip-step-item">
                <span class="step-num">${s.step_order}</span>
                <div class="step-meta">
                  <div class="step-title">${s.channel}: ${s.subject ? s.subject.substring(0, 36) + '...' : s.body_template.substring(0, 40) + '...'}</div>
                  <div class="step-delay">Delay: ${s.delay_hours === 0 ? 'Instant Trigger' : '+' + s.delay_hours + ' hours'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="campaign-footer">
          <span class="campaign-enrolled-stats">
            👥 <strong>${c.active_enrolled || 0}</strong> active in sequence • <strong>${c.completed_enrolled || 0}</strong> completed
          </span>
          <span class="badge ${c.status === 'Active' ? 'green' : 'amber'}">${c.status}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading campaigns:', err);
  }
}

async function toggleCampaign(campId) {
  try {
    const res = await fetch(`/api/campaigns/${campId}/toggle`, { method: 'POST' });
    const data = await res.json();
    showToast(`Campaign is now ${data.new_status}`);
    loadCampaigns();
  } catch (err) {
    showToast('Failed to toggle campaign');
  }
}

async function triggerDripDispatcher() {
  try {
    showToast('Evaluating pending drip sequence steps...');
    const res = await fetch('/api/campaigns/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bypass_quiet_hours: true })
    });
    const data = await res.json();
    showToast(`Dispatched ${data.count} scheduled messages!`);
    loadDashboard();
    loadCampaigns();
    loadInbox();
  } catch (err) {
    showToast('Dispatcher run failed');
  }
}

// -------------------------------------------------------------
// Two-Way Communications Inbox
// -------------------------------------------------------------
async function loadInbox() {
  try {
    const res = await fetch('/api/inbox');
    const threads = await res.json();

    document.getElementById('inbox-badge-count').innerText = threads.length;
    renderInboxThreads(threads);

    if (threads.length > 0 && !state.activeContactId) {
      selectInboxThread(threads[0].id);
    }
  } catch (err) {
    console.error('Error loading inbox:', err);
  }
}

function renderInboxThreads(threads) {
  const container = document.getElementById('inbox-threads-list');
  container.innerHTML = threads.map(t => {
    let intentBadge = '';
    if (t.last_intent) {
      const color = t.last_intent === 'BOOKING_READY' ? 'green' :
                    (t.last_intent === 'PRICE_OBJECTION' ? 'amber' :
                    (t.last_intent === 'SAFETY_CONCERN' ? 'purple' : 'blue'));
      intentBadge = `<span class="badge ${color} btn-xs">${t.last_intent.replace('_', ' ')}</span>`;
    }

    return `
      <div class="thread-item ${state.activeContactId === t.id ? 'active' : ''}" onclick="selectInboxThread(${t.id})">
        <div class="thread-item-header">
          <span class="thread-item-name">${t.first_name} ${t.last_name}</span>
          <span class="thread-item-time">${formatTimeAgo(t.last_activity)}</span>
        </div>
        <div class="thread-item-preview">${t.last_message ? t.last_message.substring(0, 50) + '...' : 'No message yet'}</div>
        <div class="thread-item-badges">
          <span class="badge ${t.status === 'Booked' ? 'green' : 'blue'}">${t.status}</span>
          ${intentBadge}
        </div>
      </div>
    `;
  }).join('') || '<div class="p-4 text-muted text-center">No conversations found</div>';
}

function filterInboxThreads(query) {
  fetch('/api/inbox').then(r => r.json()).then(threads => {
    const q = query.toLowerCase();
    const filtered = threads.filter(t => 
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
      (t.last_message && t.last_message.toLowerCase().includes(q))
    );
    renderInboxThreads(filtered);
  });
}

async function selectInboxThread(contactId) {
  state.activeContactId = contactId;
  document.querySelectorAll('.thread-item').forEach(el => el.classList.remove('active'));

  try {
    const res = await fetch(`/api/messages?contact_id=${contactId}`);
    const data = await res.json();
    state.activeContact = data.contact;
    state.activeThreadMessages = data.messages || [];
    state.activeThreadResponses = data.responses || [];

    document.getElementById('inbox-placeholder').classList.add('hidden');
    document.getElementById('inbox-thread-content').classList.remove('hidden');

    // Header info
    document.getElementById('thread-contact-name').innerText = `${data.contact.first_name} ${data.contact.last_name}`;
    document.getElementById('thread-contact-meta').innerText = 
      `${data.contact.phone} • ${data.contact.address} • ${data.contact.service_interest} ($${data.contact.quote_amount || 0})`;

    // Render bubbles
    const bubblesContainer = document.getElementById('thread-bubbles-container');
    bubblesContainer.innerHTML = data.messages.map(m => {
      const isInbound = m.direction === 'inbound';
      const matchingResponse = data.responses.find(r => r.message_id === m.id);

      let analysisTag = '';
      if (matchingResponse) {
        analysisTag = `<span class="bubble-analysis-tag">AI: ${matchingResponse.intent_category} (${matchingResponse.sentiment})</span>`;
      }

      return `
        <div class="bubble ${isInbound ? 'inbound' : 'outbound'}">
          <div>${m.body.replace(/\n/g, '<br/>')}</div>
          <div class="bubble-meta">
            <span>${m.channel} • ${m.sent_at}</span>
            ${analysisTag}
          </div>
        </div>
      `;
    }).join('');
    bubblesContainer.scrollTop = bubblesContainer.scrollHeight;

    // AI Assist box
    const lastResp = data.responses[data.responses.length - 1];
    if (lastResp && lastResp.recommended_reply) {
      document.getElementById('thread-ai-assist-box').classList.remove('hidden');
      document.getElementById('assist-intent-label').innerText = lastResp.intent_category.replace('_', ' ');
      document.getElementById('assist-rebuttal-text').innerText = `"${lastResp.recommended_reply}"`;
    } else {
      document.getElementById('thread-ai-assist-box').classList.add('hidden');
    }
  } catch (err) {
    console.error('Error fetching thread messages:', err);
  }
}

function useSuggestedRebuttal() {
  const rebuttal = document.getElementById('assist-rebuttal-text').innerText.replace(/^"|"$/g, '');
  document.getElementById('reply-input').value = rebuttal;
}

async function sendInboxReply() {
  if (!state.activeContactId) return;
  const body = document.getElementById('reply-input').value.trim();
  if (!body) return;

  const channel = document.querySelector('input[name="reply-channel"]:checked').value;

  try {
    const res = await fetch('/api/inbox/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: state.activeContactId,
        body: body,
        channel: channel
      })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('reply-input').value = '';
      showToast(`Outbound ${channel} sent!`);
      selectInboxThread(state.activeContactId);
      loadDashboard();
    } else {
      showToast(`Failed: ${result.error}`);
    }
  } catch (err) {
    showToast('Failed to send reply');
  }
}

function openSimulateReplyModal() {
  if (!state.activeContactId) return;
  document.getElementById('sim-text').value = '';
  document.getElementById('modal-sim-reply').classList.remove('hidden');
}

function applySimPreset(val) {
  if (val) {
    document.getElementById('sim-text').value = val;
  }
}

async function submitSimulateReply(e) {
  e.preventDefault();
  const text = document.getElementById('sim-text').value.trim();
  const channel = document.getElementById('sim-channel').value;
  if (!text) return;

  try {
    const res = await fetch('/api/inbox/simulate_inbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: state.activeContactId,
        text: text,
        channel: channel
      })
    });
    const result = await res.json();
    closeModal('modal-sim-reply');
    showToast(`Received inbound response: ${result.analysis.intent_category}`);
    selectInboxThread(state.activeContactId);
    loadResearchData();
    loadDashboard();
  } catch (err) {
    showToast('Failed to simulate customer message');
  }
}

// -------------------------------------------------------------
// Leads & Directory
// -------------------------------------------------------------
async function loadLeads() {
  const search = document.getElementById('lead-search') ? document.getElementById('lead-search').value : '';
  const status = document.getElementById('lead-status-filter') ? document.getElementById('lead-status-filter').value : 'All';

  try {
    const res = await fetch(`/api/contacts?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);
    const leads = await res.json();

    const tbody = document.getElementById('leads-table-body');
    tbody.innerHTML = leads.map(l => `
      <tr>
        <td>
          <div class="lead-name-col">${l.first_name} ${l.last_name}</div>
          <div class="lead-phone-sub">${l.phone || l.email}</div>
        </td>
        <td>${l.address}, ${l.city}</td>
        <td>
          <strong>${l.service_interest}</strong><br/>
          <span class="text-muted" style="font-size:0.75rem">${l.property_type} (${l.property_sqft} sq ft)</span>
        </td>
        <td><strong>$${(l.quote_amount || 0).toLocaleString()}</strong></td>
        <td><span class="badge ${l.status === 'Booked' ? 'green' : (l.status === 'Lost' ? 'red' : 'blue')}">${l.status}</span></td>
        <td>
          ${l.opt_out_sms ? '<span class="badge red">SMS Opt-Out</span>' : '<span class="badge green">SMS Active</span>'}
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-xs btn-secondary" onclick="openCallModal(${l.id}, '${l.first_name} ${l.last_name}', '${l.phone}', '${l.address}')">📞 Call</button>
            <button class="btn btn-xs btn-secondary" onclick="openLeadInThread(${l.id})">Chat</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" class="text-center p-4 text-muted">No leads found</td></tr>';
  } catch (err) {
    console.error('Error loading leads:', err);
  }
}

function debounceLeadSearch() {
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(loadLeads, 300);
}

function openLeadInThread(contactId) {
  switchTab('inbox');
  selectInboxThread(contactId);
}

function openAddLeadModal() {
  document.getElementById('modal-add-lead').classList.remove('hidden');
}

async function submitAddLead(e) {
  e.preventDefault();
  const payload = {
    first_name: document.getElementById('new-lead-first-name').value,
    last_name: document.getElementById('new-lead-last-name').value,
    phone: document.getElementById('new-lead-phone').value,
    email: document.getElementById('new-lead-email').value,
    address: document.getElementById('new-lead-address').value,
    property_type: document.getElementById('new-lead-property-type').value,
    property_sqft: parseInt(document.getElementById('new-lead-sqft').value),
    service_interest: document.getElementById('new-lead-service').value,
    quote_amount: parseFloat(document.getElementById('new-lead-quote').value),
    campaign_id: parseInt(document.getElementById('new-lead-campaign').value)
  };

  try {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    closeModal('modal-add-lead');
    showToast('New lead added & enrolled in campaign!');
    loadLeads();
    loadDashboard();
    loadCampaigns();
  } catch (err) {
    showToast('Failed to add lead');
  }
}


// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T'));
  const diffSec = Math.floor((new Date() - d) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// -------------------------------------------------------------
// Bulk Import Contacts & HOAs
// -------------------------------------------------------------
function openImportModal() {
  document.getElementById('import-csv-text').value = '';
  document.getElementById('modal-import-leads').classList.remove('hidden');
}

function loadSampleHOAData() {
  const sampleHOAs = `Karen Bennett, k.bennett@associahillcountry.com, (512) 555-3101, 12500 Steiner Ranch Blvd, HOA Clubhouse Wash, 2400
David Vance, david.vance@fsresidential.com, (512) 555-3102, 6800 Escarpment Common, Pool Deck & Tennis Court, 3100
Lisa Morgan, lisa.morgan@realmanage.com, (512) 555-3103, 10500 Avery Club Dr, Common Elements & Fencing, 1950
Michael Torres, michael.torres@inframark.com, (512) 555-3104, 5300 Sweetwater Clubhouse, Stucco SoftWash & Curbs, 1650
Jennifer Ross, jross@ccmcnet.com, (512) 555-3105, 17700 Rough Hollow Way, Marina Pavilion & Walkways, 3800`;
  document.getElementById('import-csv-text').value = sampleHOAs;
}

function handleCsvFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const fileNameEl = document.getElementById('import-file-name');
  if (fileNameEl) fileNameEl.innerText = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  const reader = new FileReader();
  reader.onload = function(evt) {
    document.getElementById('import-csv-text').value = evt.target.result;
    showToast(`Loaded ${file.name}! Review below and tap Import.`);
  };
  reader.readAsText(file);
}

async function submitBulkImport(e) {
  e.preventDefault();
  const rawText = document.getElementById('import-csv-text').value.trim();
  const campaignId = parseInt(document.getElementById('import-campaign-id').value);
  if (!rawText) return;

  const lines = rawText.split('\n').filter(l => l.trim().length > 0);
  const contacts = [];

  lines.forEach(line => {
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      contacts.push({
        name: parts[0] || 'Property Manager',
        email: parts[1] || '',
        phone: parts[2] || '',
        address: parts[3] || 'Austin, TX',
        service_interest: parts[4] || 'Commercial Exterior Maintenance',
        quote_amount: parseFloat(parts[5]) || 1500.0,
        property_type: 'HOA / Commercial',
        lead_source: 'Bulk Import'
      });
    }
  });

  if (contacts.length === 0) {
    showToast('No valid contact lines detected');
    return;
  }

  try {
    const res = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaignId,
        contacts: contacts
      })
    });
    const result = await res.json();
    closeModal('modal-import-leads');
    showToast(`Successfully imported & enrolled ${result.count} contacts!`);
    loadLeads();
    loadCampaigns();
    loadDashboard();
  } catch (err) {
    showToast('Failed to import contacts');
  }
}

// -------------------------------------------------------------
// D2D Field Canvassing Hub
// -------------------------------------------------------------
async function loadD2DData() {
  try {
    const res = await fetch('/api/d2d');
    const data = await res.json();

    // Stats
    document.getElementById('d2d-stat-total').innerText = data.stats.total_knocks || 0;
    document.getElementById('d2d-stat-booked').innerText = data.stats.booked_knocks || 0;
    document.getElementById('d2d-stat-interested').innerText = data.stats.interested_knocks || 0;
    document.getElementById('d2d-stat-revenue').innerText = `$${(data.stats.total_revenue || 0).toLocaleString()}`;

    // Leaderboard
    const tbody = document.getElementById('d2d-leaderboard-body');
    tbody.innerHTML = (data.leaderboard || []).map(r => `
      <tr>
        <td><strong>${r.rep_name}</strong></td>
        <td>${r.total_knocks}</td>
        <td><span class="badge green">${r.booked}</span></td>
        <td>${r.total_knocks > 0 ? ((r.booked / r.total_knocks) * 100).round || Math.round((r.booked / r.total_knocks) * 100) : 0}%</td>
        <td><strong>$${(r.revenue || 0).toLocaleString()}</strong></td>
      </tr>
    `).join('') || '<tr><td colspan="5" class="text-center p-3 text-muted">No canvassing data recorded yet</td></tr>';

    // Activity feed
    const feed = document.getElementById('d2d-activity-feed');
    feed.innerHTML = (data.knocks || []).map(k => {
      let statusClass = 'interested';
      if (k.status === 'Booked on Spot') statusClass = 'booked';
      else if (k.status === 'Door Hanger Left') statusClass = 'hanger';
      else if (k.status === 'Not Home') statusClass = 'nothome';

      return `
        <div class="knock-card">
          <div>
            <div style="font-weight:700; font-size:0.92rem;">${k.address}, ${k.city}</div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
              ${k.homeowner_name || 'Homeowner'} ${k.phone ? '• ' + k.phone : ''} • Rep: <strong>${k.rep_name}</strong> • ${k.services} (${k.panes_estimate} Panes)
            </div>
            ${k.notes ? `<div style="font-size:0.75rem; color:#94a3b8; font-style:italic; margin-top:3px;">"${k.notes}"</div>` : ''}
          </div>
          <div style="text-align:right;">
            <span class="knock-status-pill ${statusClass}">${k.status}</span>
            <div style="font-weight:800; font-size:1.05rem; color:#38bdf8; margin-top:4px;">$${(k.quote_amount || 0).toLocaleString()}</div>
          </div>
        </div>
      `;
    }).join('') || '<p class="text-muted p-4 text-center">No knocks logged yet today. Use the form on the left to log your first door!</p>';

  } catch (err) {
    console.error('Error loading D2D data:', err);
  }
}

function autoFillNeighborhood() {
  const city = document.getElementById('d2d-city').value;
  const addr = document.getElementById('d2d-address');
  if (city === 'Wayzata' && !addr.value) addr.placeholder = 'e.g. 3400 Bushaway Rd';
  if (city === 'Edina' && !addr.value) addr.placeholder = 'e.g. 5100 Interlachen Blvd';
  if (city === 'Minnetonka' && !addr.value) addr.placeholder = 'e.g. 2800 Cedar Ridge Way';
}

function toggleD2DScheduleFields() {
  const status = document.getElementById('d2d-status').value;
  const bookingBox = document.getElementById('d2d-booking-fields');
  const dateInput = document.getElementById('d2d-job-date');

  if (status === 'Booked on Spot') {
    bookingBox.classList.remove('hidden');
    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  } else {
    bookingBox.classList.add('hidden');
  }
}

async function submitD2DKnock(e) {
  e.preventDefault();
  const status = document.getElementById('d2d-status').value;
  const payload = {
    rep_name: document.getElementById('d2d-rep-name').value,
    city: document.getElementById('d2d-city').value,
    address: document.getElementById('d2d-address').value,
    homeowner_name: document.getElementById('d2d-homeowner').value || 'Homeowner',
    phone: document.getElementById('d2d-phone').value,
    email: document.getElementById('d2d-email').value,
    status: status,
    panes_estimate: parseInt(document.getElementById('d2d-panes').value) || 30,
    quote_amount: parseFloat(document.getElementById('d2d-quote').value) || 0,
    services: document.getElementById('d2d-services').value,
    notes: document.getElementById('d2d-notes').value,
    job_date: status === 'Booked on Spot' ? document.getElementById('d2d-job-date').value : null,
    time_slot: status === 'Booked on Spot' ? document.getElementById('d2d-time-slot').value : null,
    technician_id: status === 'Booked on Spot' ? parseInt(document.getElementById('d2d-tech-id').value) : null
  };

  try {
    const res = await fetch('/api/d2d/knocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(status === 'Booked on Spot' ? '🎉 Job booked & added to Technician Schedule!' : 'Doorstep lead saved to CRM!');
      document.getElementById('d2d-address').value = '';
      document.getElementById('d2d-homeowner').value = '';
      document.getElementById('d2d-phone').value = '';
      document.getElementById('d2d-email').value = '';
      document.getElementById('d2d-notes').value = '';
      loadD2DData();
      loadScheduleData();
      loadLeads();
      loadDashboard();
    }
  } catch (err) {
    showToast('Failed to save door knock');
  }
}

// -------------------------------------------------------------
// Technician Dispatch & Calendar Schedule
// -------------------------------------------------------------
state.selectedTechFilter = 'all';

async function loadScheduleData() {
  try {
    const res = await fetch('/api/schedule');
    const data = await res.json();
    state.scheduleJobs = data.jobs || [];
    state.technicians = data.technicians || [];

    renderScheduleBoard();
    loadIoTTelemetry();
  } catch (err) {
    console.error('Error loading schedule:', err);
  }
}

function filterTechSchedule(techId) {
  state.selectedTechFilter = techId;
  document.querySelectorAll('.tech-pill-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
  renderScheduleBoard();
}

function renderScheduleBoard() {
  const container = document.getElementById('schedule-board-container');
  let jobs = state.scheduleJobs || [];

  if (state.selectedTechFilter !== 'all') {
    jobs = jobs.filter(j => j.technician_id === parseInt(state.selectedTechFilter));
  }

  // Group by date
  const groups = {};
  jobs.forEach(j => {
    const d = j.job_date || 'Upcoming';
    if (!groups[d]) groups[d] = [];
    groups[d].push(j);
  });

  const dates = Object.keys(groups).sort();
  if (dates.length === 0) {
    container.innerHTML = '<div class="card p-6 text-center text-muted" style="grid-column:1/-1;">No field jobs scheduled. Click "+ Book New Job" or log a booked knock from the D2D tab.</div>';
    return;
  }

  container.innerHTML = dates.map(d => {
    const dayJobs = groups[d];
    const totalDayAmt = dayJobs.reduce((sum, j) => sum + (j.amount || 0), 0);

    return `
      <div class="schedule-day-column">
        <div class="schedule-day-header">
          <div>
            <h3 style="font-size:1.05rem; font-weight:800;">📅 ${d}</h3>
            <span class="text-muted" style="font-size:0.75rem;">${dayJobs.length} Truck Stops</span>
          </div>
          <span style="font-weight:800; font-size:1.1rem; color:#34d399;">$${totalDayAmt.toLocaleString()}</span>
        </div>

        <div class="day-jobs-list">
          ${dayJobs.map(j => `
            <div class="job-card" style="border-left-color: ${j.tech_color || '#3b82f6'};">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                <span class="job-time-badge">${j.time_slot}</span>
                <select class="job-status-select" onchange="updateJobStatus(${j.id}, this.value)">
                  <option value="Scheduled" ${j.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                  <option value="En Route" ${j.status === 'En Route' ? 'selected' : ''}>En Route</option>
                  <option value="In Progress" ${j.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Completed" ${j.status === 'Completed' ? 'selected' : ''}>Completed</option>
                  <option value="Cancelled" ${j.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </div>

              <div style="font-weight:700; font-size:0.95rem; margin-bottom:2px;">
                ${j.customer_name} ${j.phone ? `<span style="font-weight:normal; font-size:0.8rem; color:#94a3b8;">(${j.phone})</span>` : ''}
              </div>
              <div style="font-size:0.8rem; color:#38bdf8; margin-bottom:6px;">
                📍 ${j.address}, ${j.city}
              </div>

              <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;">
                • ${j.services}
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; pt-2; border-top:1px solid rgba(255,255,255,0.05); font-size:0.75rem;">
                <span style="color:${j.tech_color || '#60a5fa'}; font-weight:600;">
                  🚛 ${j.truck_name || 'Truck 1'}
                </span>
                <span style="font-weight:800; font-size:0.95rem; color:#f8fafc;">
                  $${(j.amount || 0).toLocaleString()}
                </span>
              </div>
              ${j.notes ? `<div style="font-size:0.72rem; color:#94a3b8; font-style:italic; margin-top:4px;">"${j.notes}"</div>` : ''}

              <div style="display:flex; gap:6px; margin-top:8px; pt-1; border-top:1px solid rgba(255,255,255,0.06);">
                ${j.status !== 'Completed' && j.status !== 'Cancelled' ? `
                  <button class="btn btn-xs btn-primary" style="flex:1; justify-content:center; background:linear-gradient(135deg, #0284c7, #0ea5e9); border:none;" onclick="sendOnMyWay(${j.id}, '${escapeHtml(j.customer_name)}')">
                    🚗 On My Way (15m)
                  </button>
                ` : ''}
                ${j.status === 'Completed' ? `
                  <a href="/certificate.html" target="_blank" class="btn btn-xs btn-primary" style="background:#10b981; border:none; text-decoration:none; padding:4px 8px; display:inline-flex; align-items:center; gap:4px;">
                    🏆 Clarity Cert
                  </a>
                ` : ''}
                <button class="btn btn-xs btn-secondary" style="padding:4px 8px;" onclick="openCallModal(null, '${escapeHtml(j.customer_name)}', '${escapeHtml(j.phone || '')}', '${escapeHtml(j.address)}')">
                  📞 Call
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function sendOnMyWay(jobId, customerName) {
  try {
    const res = await fetch('/api/scheduled_jobs/on_my_way', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, eta_minutes: 15 })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`🚗 "On My Way" SMS dispatched to ${customerName || 'customer'}!`);
      loadScheduleData();
      if (typeof loadInbox === 'function') loadInbox();
      if (typeof loadDashboard === 'function') loadDashboard();
    } else {
      showToast('Failed to send notification');
    }
  } catch (err) {
    showToast('Network error sending On-My-Way alert');
  }
}

async function updateJobStatus(jobId, newStatus) {
  try {
    const res = await fetch('/api/schedule/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, status: newStatus })
    });
    const result = await res.json();
    if (result.success) {
      if (result.auto_enrolled) {
        showToast(`Job Completed! Autonomous 5-Star Review & Referral Campaign triggered for client.`);
      } else {
        showToast(`Job status updated: ${newStatus}`);
      }
      loadScheduleData();
      loadDashboard();
      loadInbox();
    }
  } catch (err) {
    showToast('Failed to update job status');
  }
}

function openAddJobModal() {
  const dateInput = document.getElementById('job-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  document.getElementById('modal-add-job').classList.remove('hidden');
}

async function submitAddJob(e) {
  e.preventDefault();
  const payload = {
    customer_name: document.getElementById('job-customer-name').value,
    phone: document.getElementById('job-phone').value,
    address: document.getElementById('job-address').value,
    city: document.getElementById('job-city').value,
    job_date: document.getElementById('job-date').value,
    time_slot: document.getElementById('job-time-slot').value,
    technician_id: parseInt(document.getElementById('job-tech-id').value) || 1,
    amount: parseFloat(document.getElementById('job-amount').value) || 450,
    services: document.getElementById('job-services').value,
    notes: document.getElementById('job-notes').value,
    booked_by: 'Direct CRM'
  };

  try {
    const res = await fetch('/api/schedule/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      closeModal('modal-add-job');
      showToast('New job dispatched onto Technician Schedule!');
      loadScheduleData();
      loadDashboard();
    }
  } catch (err) {
    showToast('Failed to book job');
  }
}

// -------------------------------------------------------------
// Phone Dialer & Call Disposition Assistant
// -------------------------------------------------------------
state.activeCallContactId = null;

function openCallModal(contactId, name, phone, address) {
  state.activeCallContactId = contactId;
  document.getElementById('call-contact-name').innerText = name || 'Customer';
  document.getElementById('call-contact-phone').innerText = phone || 'No phone on file';
  document.getElementById('call-contact-addr').innerText = address || 'Twin Cities';
  document.getElementById('call-notes').value = '';
  setCallDisposition('Left Voicemail');
  document.getElementById('modal-log-call').classList.remove('hidden');
}

function setCallDisposition(val) {
  document.getElementById('call-disposition-val').value = val;
  document.querySelectorAll('.disposition-btn').forEach(btn => {
    btn.classList.toggle('booked', btn.innerText.includes(val) || (val === 'Booked on Spot' && btn.innerText.includes('Booked')));
  });
}

async function submitCallLog(e) {
  e.preventDefault();
  if (!state.activeCallContactId) return;

  const disposition = document.getElementById('call-disposition-val').value;
  const notes = document.getElementById('call-notes').value;
  const triggerFollowup = document.getElementById('call-trigger-followup').checked;

  try {
    const res = await fetch('/api/calls/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: state.activeCallContactId,
        disposition: disposition,
        notes: notes,
        trigger_followup: triggerFollowup
      })
    });
    const result = await res.json();
    if (result.success) {
      closeModal('modal-log-call');
      showToast(`Call logged: ${disposition}${triggerFollowup ? ' (Follow-up email sent via ZeptoMail!)' : ''}`);
      loadLeads();
      loadInbox();
      loadDashboard();
    }
  } catch (err) {
    showToast('Failed to log call');
  }
}

// -------------------------------------------------------------
// Growth Vault & Unique Marketing Playbooks
// -------------------------------------------------------------
state.growthIdeas = [];
state.activeGrowthCategory = 'All';

const CATEGORY_COLORS = {
  'Luxury Lakeside Niche': { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: '#8b5cf6' },
  'Route Density Hack': { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6' },
  'Realtor Referral Engine': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '#f59e0b' },
  'Commercial Retainer': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '#10b981' },
  'Canvass Psychology': { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: '#ec4899' },
  'Customer Retention': { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: '#06b6d4' },
  'Eco Add-On Service': { bg: 'rgba(234, 179, 8, 0.15)', text: '#fde047', border: '#eab308' },
  'Commercial B2B Growth': { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: '#6366f1' }
};

async function loadGrowthIdeas(category = 'All') {
  state.activeGrowthCategory = category;
  try {
    const url = category && category !== 'All' 
      ? `/api/growth_ideas?category=${encodeURIComponent(category)}`
      : '/api/growth_ideas';
    const res = await fetch(url);
    const result = await res.json();
    if (result.success && result.ideas) {
      state.growthIdeas = result.ideas;
      renderGrowthIdeas(result.ideas);
    }
  } catch (err) {
    console.error('Failed to load growth ideas:', err);
  }
}

function filterGrowthCategory(cat) {
  state.activeGrowthCategory = cat;
  document.querySelectorAll('#growth-category-pills .tech-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.includes(cat) || (cat === 'All' && btn.innerText.includes('All')));
  });
  loadGrowthIdeas(cat);
}

function renderGrowthIdeas(ideas) {
  const container = document.getElementById('growth-playbooks-container');
  if (!container) return;

  if (!ideas || ideas.length === 0) {
    container.innerHTML = '<div style="padding:40px; text-align:center; color:#94a3b8; grid-column: 1/-1;">No playbooks found in this category.</div>';
    return;
  }

  container.innerHTML = ideas.map(p => {
    const theme = CATEGORY_COLORS[p.category] || { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6' };
    return `
      <div class="growth-card" style="border-top: 4px solid ${theme.border};">
        <div class="growth-card-top">
          <span class="growth-card-category" style="background:${theme.bg}; color:${theme.text};">
            ${escapeHtml(p.category)}
          </span>
          <span class="badge ${p.difficulty === 'Easy' ? 'green' : 'amber'}">${escapeHtml(p.difficulty)}</span>
        </div>

        <h3 class="growth-card-title">${escapeHtml(p.title)}</h3>
        
        <div class="growth-card-hook">
          <strong>Strategic Hook:</strong> "${escapeHtml(p.hook)}"
        </div>

        <p class="growth-card-desc">${escapeHtml(p.description)}</p>

        <div style="font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:4px;">
          Execution Blueprint:
        </div>
        <div class="growth-card-blueprint">${escapeHtml(p.blueprint)}</div>

        <div class="growth-card-script-wrap">
          <div class="growth-card-script-header">
            <span>💬 1-Click Outreach Script:</span>
            <button class="btn btn-xs btn-secondary" onclick="copyIdeaScript(${p.id})">
              📋 Copy Script
            </button>
          </div>
          <div class="growth-card-script" id="script-text-${p.id}">${escapeHtml(p.script_template)}</div>
        </div>

        <div class="growth-card-bottom">
          <div class="growth-metric-badge">
            <span>📈</span>
            <span>${escapeHtml(p.metric_impact)}</span>
          </div>

          <div class="growth-action-row">
            <button class="btn btn-primary btn-sm flex-1" onclick="launchGrowthIdea(${p.id})">
              🚀 Deploy Playbook
            </button>
            <button class="btn btn-secondary btn-sm" onclick="copyIdeaScript(${p.id})">
              Copy Text
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function copyIdeaScript(id) {
  const el = document.getElementById(`script-text-${id}`);
  if (!el) return;
  const text = el.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Outreach script copied to clipboard! Ready to paste into SMS or Email.');
  }).catch(() => {
    showToast('Script selected. Press Ctrl+C / Cmd+C to copy.');
  });
}

async function launchGrowthIdea(id) {
  try {
    const res = await fetch('/api/growth_ideas/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: id })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Playbook "${result.idea.title}" deployed! ${result.enrolled_count} eligible prospects enrolled into automated drip.`);
      loadDashboard();
      loadCampaigns();
    } else {
      showToast(result.error || 'Failed to deploy playbook');
    }
  } catch (err) {
    showToast('Error deploying growth playbook');
  }
}

// -------------------------------------------------------------
// Connect Quotes & Share Modal Helpers
// -------------------------------------------------------------
function openConnectQuotesModal() {
  const modal = document.getElementById('modal-connect-quotes');
  if (modal) modal.classList.remove('hidden');
}

function copyShareUrl(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(() => {
    showToast('Rep portal URL copied to clipboard! Text or email it to your reps.');
  }).catch(() => {
    showToast('Press Cmd+C / Ctrl+C to copy');
  });
}

function copyShareUrlText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Webhook URL copied to clipboard!');
  }).catch(() => {
    showToast('Press Cmd+C / Ctrl+C to copy');
  });
}

// -------------------------------------------------------------
// Invoicing & Tiered Estimator (Flyra / Jobber Reverse-Engineered)
// -------------------------------------------------------------
async function loadInvoicesData() {
  try {
    const res = await fetch('/api/invoices');
    const data = await res.json();
    if (!data.success) return;

    if (data.stats) {
      const paidEl = document.getElementById('inv-kpi-paid');
      const pendEl = document.getElementById('inv-kpi-pending');
      const tipsEl = document.getElementById('inv-kpi-tips');
      if (paidEl) paidEl.innerText = '$' + (data.stats.paid_total || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
      if (pendEl) pendEl.innerText = '$' + (data.stats.pending_total || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
      if (tipsEl) tipsEl.innerText = '$' + (data.stats.tips_total || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
    }

    const tbody = document.getElementById('invoices-table-body');
    if (!tbody) return;

    if (!data.invoices || data.invoices.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-muted">No invoices generated yet. Mark a scheduled job Completed to auto-generate!</td></tr>';
      return;
    }

    tbody.innerHTML = data.invoices.map(inv => {
      const isPaid = inv.status === 'Paid';
      const statusBadge = isPaid
        ? '<span class="badge green">Paid</span>'
        : '<span class="badge amber">Payment Due</span>';

      return `
        <tr>
          <td><strong>${escapeHtml(inv.invoice_number)}</strong></td>
          <td>
            <strong>${escapeHtml(inv.customer_name)}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(inv.address)}</div>
          </td>
          <td style="font-family:var(--font-mono); font-weight:700;">$${inv.total_amount ? inv.total_amount.toFixed(2) : '0.00'}</td>
          <td style="color:#38bdf8; font-weight:700; font-family:var(--font-mono);">${inv.tip_amount > 0 ? '+$' + inv.tip_amount.toFixed(2) : '—'}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <a href="/invoice.html?id=${inv.id}" target="_blank" class="btn btn-xs btn-secondary" style="text-decoration:none;">
                View
              </a>
              ${!isPaid ? `<button class="btn btn-xs btn-primary" onclick="markInvoicePaidDirect(${inv.id})">Mark Paid</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load invoices:', err);
  }
}

async function markInvoicePaidDirect(invId) {
  try {
    const res = await fetch('/api/invoices/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invId, tip_amount: 0.0, payment_method: 'Direct CRM' })
    });
    const result = await res.json();
    if (result.success) {
      showToast('Invoice marked Paid!');
      loadInvoicesData();
      loadDashboard();
    }
  } catch (err) {
    showToast('Failed to update invoice');
  }
}

function runEstimatorCalculation() {
  const panes = Math.max(10, parseInt(document.getElementById('calc-panes')?.value) || 30);
  const screens = parseInt(document.getElementById('calc-screens')?.value) || 0;

  // Exterior pricing:
  // 10 = $100, 20 = $200, 30 = $300, 40 = $390, 50 = $480, 60 = $570, 70 = $660
  // Panes <= 30: panes * $10. Panes > 30: $300 + (panes - 30) * $9
  const baseExt = panes <= 30 ? (panes * 10) : (300 + (panes - 30) * 9);
  
  // Interior: $10 per window flat
  const interiorCost = panes * 10;
  const inOutTotal = baseExt + interiorCost;

  // Screens: $5 per screen
  const screenCost = screens * 5;
  const masterTotal = inOutTotal + screenCost;

  const bEl = document.getElementById('calc-tier-bronze');
  const sEl = document.getElementById('calc-tier-silver');
  const gEl = document.getElementById('calc-tier-gold');

  if (bEl) bEl.innerText = '$' + Math.round(baseExt);
  if (sEl) sEl.innerText = '$' + Math.round(inOutTotal);
  if (gEl) gEl.innerText = '$' + Math.round(masterTotal);

  const subExt = document.getElementById('calc-sub-ext');
  const subInt = document.getElementById('calc-sub-int');
  const subScr = document.getElementById('calc-sub-scr');
  if (subExt) subExt.innerText = `Exterior Only (${panes} panes @ $10/pane up to 30, $9/pane after)`;
  if (subInt) subInt.innerText = `Exterior + Interior Hand Detailing (+$10/window = +$${interiorCost})`;
  if (subScr) subScr.innerText = `Full Inside/Out + Screens (${screens} screens @ $5/ea = +$${screenCost})`;
}

// -------------------------------------------------------------
// Call Feature & Discovery Assistant
// -------------------------------------------------------------
let activeCallContactId = null;

function openCallModal(contactId, name, phone, address) {
  activeCallContactId = contactId || null;
  const nameInput = document.getElementById('call-modal-name');
  const phoneInput = document.getElementById('call-modal-phone');
  const addrSpan = document.getElementById('call-modal-address');
  const dialBtn = document.getElementById('call-modal-dial-btn');
  const notesArea = document.getElementById('call-modal-notes');
  const outcomeSel = document.getElementById('call-modal-outcome');

  const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');

  if (nameInput) nameInput.value = name || 'Homeowner';
  if (phoneInput) {
    phoneInput.value = phone || '';
    phoneInput.oninput = () => {
      const p = phoneInput.value.replace(/[^0-9+]/g, '');
      if (dialBtn) dialBtn.href = p ? `tel:${p}` : '#';
    };
  }
  if (addrSpan) addrSpan.innerText = address ? `📍 ${address}` : 'Twin Cities Metro';
  if (dialBtn) dialBtn.href = cleanPhone ? `tel:${cleanPhone}` : '#';
  if (notesArea) notesArea.value = '';
  if (outcomeSel) outcomeSel.value = 'Connected';

  const modal = document.getElementById('modal-call-feature');
  if (modal) modal.classList.remove('hidden');
}

function closeCallModal() {
  const modal = document.getElementById('modal-call-feature');
  if (modal) modal.classList.add('hidden');
}

async function saveCallLog() {
  const name = document.getElementById('call-modal-name')?.value || 'Homeowner';
  const phone = document.getElementById('call-modal-phone')?.value || '';
  const outcome = document.getElementById('call-modal-outcome')?.value || 'Connected';
  const notes = document.getElementById('call-modal-notes')?.value || '';
  const duration = document.getElementById('call-modal-duration')?.value || '2m';

  try {
    const res = await fetch('/api/calls/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: activeCallContactId,
        customer_name: name,
        phone: phone,
        outcome: outcome,
        notes: notes,
        duration: duration
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`📞 Call recorded: ${outcome}`);
      closeCallModal();
      if (typeof loadLeads === 'function') loadLeads();
      if (typeof loadDashboard === 'function') loadDashboard();
    } else {
      showToast('Failed to save call log');
    }
  } catch (err) {
    showToast('Network error saving call');
  }
}

function toggleCallQuestionsHelper() {
  const helper = document.getElementById('call-questions-guide');
  if (helper) {
    helper.classList.toggle('hidden');
  }
}

// -------------------------------------------------------------
// Autonomous Auto-Pilot & Voice Agent Controls
// -------------------------------------------------------------
let isAutopilotActive = true;

function updateAutopilotUI(active) {
  isAutopilotActive = active;
  const dot = document.getElementById('autopilot-status-dot');
  const text = document.getElementById('autopilot-status-text');
  if (dot && text) {
    if (active) {
      dot.style.background = '#10b981';
      dot.style.boxShadow = '0 0 8px rgba(16,185,129,0.6)';
      text.innerText = 'AI Auto-Pilot: ON';
      text.style.color = '#34d399';
    } else {
      dot.style.background = '#f59e0b';
      dot.style.boxShadow = '0 0 8px rgba(245,158,11,0.6)';
      text.innerText = 'Copilot Mode: Manual';
      text.style.color = '#fbbf24';
    }
  }
}

async function toggleAutoPilot() {
  const newStatus = !isAutopilotActive;
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_autopilot_enabled: newStatus ? 'true' : 'false' })
    });
    const data = await res.json();
    if (data.success) {
      updateAutopilotUI(newStatus);
      showToast(newStatus ? '🤖 AI Auto-Pilot ON: Autonomous 2-Way Replies Active' : '⚡ Copilot ON: 1-Click Approval Active');
    }
  } catch (err) {
    showToast('Failed to switch AI mode');
  }
}

async function dispatchAIVoiceAgent() {
  const name = document.getElementById('call-modal-name')?.value || 'Homeowner';
  const phone = document.getElementById('call-modal-phone')?.value || '';

  if (!phone || phone.trim() === '') {
    showToast('Please enter a valid phone number to call');
    return;
  }

  try {
    showToast(`🤖 Dispatching Voice AI 'Alex' to ${phone}...`);
    const res = await fetch('/api/calls/dispatch_voice_agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: activeCallContactId,
        customer_name: name,
        phone: phone
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`📞 Voice AI connected to ${phone}!`);
      closeCallModal();
      if (typeof loadInbox === 'function') loadInbox();
      if (typeof loadDashboard === 'function') loadDashboard();
    } else {
      showToast(result.error || 'Failed to dispatch voice agent');
    }
  } catch (err) {
    showToast('Network error dispatching voice agent');
  }
}

// -------------------------------------------------------------
// IoT Fleet Telemetry & Pure Water Telematics
// -------------------------------------------------------------
async function loadIoTTelemetry() {
  try {
    const res = await fetch('/api/iot/telemetry');
    const data = await res.json();
    if (data.success && data.telemetry) {
      data.telemetry.forEach(t => {
        const prefix = t.technician_id === 1 ? 'truck1' : 'truck2';
        const inEl = document.getElementById(`${prefix}-inflow`);
        const outEl = document.getElementById(`${prefix}-outflow`);
        const flowEl = document.getElementById(`${prefix}-flow`);
        const galsEl = document.getElementById(`${prefix}-gals`);
        const resinEl = document.getElementById(`${prefix}-resin`);
        const resinBarEl = document.getElementById(`${prefix}-resin-bar`);

        if (inEl) inEl.innerHTML = `${t.inflow_ppm} <span style="font-size:0.8rem; font-weight:400; color:#94a3b8;">PPM</span>`;
        if (outEl) outEl.innerHTML = `${String(t.outflow_ppm).padStart(3, '0')} <span style="font-size:0.8rem; font-weight:400; color:#34d399;">PPM</span>`;
        if (flowEl) flowEl.innerText = `${t.flow_rate_gpm} GPM (${t.system_pressure_psi || 65} PSI)`;
        if (galsEl) galsEl.innerText = `${t.gallons_filtered_today} Gal`;
        if (resinEl) resinEl.innerText = `${t.resin_life_percent}% Capacity`;
        if (resinBarEl) resinBarEl.style.width = `${t.resin_life_percent}%`;
      });
    }
  } catch (err) {
    console.error('Error loading IoT telemetry:', err);
  }
}

function openCertModal() {
  document.getElementById('modal-cert').classList.remove('hidden');
}

async function submitGenerateCert(e) {
  e.preventDefault();
  const payload = {
    customer_name: document.getElementById('cert-customer-name').value,
    phone: document.getElementById('cert-phone').value,
    address: document.getElementById('cert-address').value,
    city: document.getElementById('cert-city').value,
    panes_cleaned: parseInt(document.getElementById('cert-panes').value) || 30,
    gallons_used: parseFloat(document.getElementById('cert-gallons').value) || 42.0,
    truck_name: document.getElementById('cert-truck').value,
    technician_name: document.getElementById('cert-tech').value
  };

  try {
    const res = await fetch('/api/iot/generate_certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      closeModal('modal-cert');
      showToast(`🏆 Digital Clarity Certificate ${result.certificate_number} Issued & SMS Dispatched!`);
      window.open(result.certificate_url, '_blank');
      loadScheduleData();
      if (typeof loadDashboard === 'function') loadDashboard();
    } else {
      showToast('Failed to issue certificate');
    }
  } catch (err) {
    showToast('Network error issuing certificate');
  }
}

// Initial polling for IoT fleet telematics
setInterval(loadIoTTelemetry, 15000);





// =============================================================
// INVESTOR PITCH DECK & 7-MINUTE SLIDE PLAYER
// =============================================================
let currentPitchSlide = 0;
let pitchTimerInterval = null;
let pitchTimerSeconds = 0;
let pitchTimerRunning = false;

const INVESTOR_SLIDES = [
  {
    num: 1,
    title: "GERRY'S WINDOW SERVICES",
    subtitle: "The 60-Second, Spot-Free Home Cleaning Experience",
    category: "IDEA & STORY OVERVIEW",
    speaker: "Mason Gerry (Founder & CEO)",
    targetTime: "0:30 (Cumulative: 0:30)",
    rubricTag: "Rubric: Idea/Story Overview (15 Points) • Target: < 30s Hook",
    html: `
      <div style="display:flex; flex-direction:column; gap:20px; height:100%;">
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">&lt; 60s</div>
            <div style="font-size:1.05rem; font-weight:700; color:#fff; margin-top:6px;">Speed-to-Lead</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Instant automated mobile quote</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">WATER-FED</div>
            <div style="font-size:1.05rem; font-weight:700; color:#fff; margin-top:6px;">Pure-Water Poles</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Zero ladder damage or soap film</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">100%</div>
            <div style="font-size:1.05rem; font-weight:700; color:#fff; margin-top:6px;">Spot-Free Clean</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">48-Hour Rain Shield Guarantee</div>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid rgba(56,189,248,0.3); border-radius:12px; padding:22px; flex:1;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">
            RE-ENGINEERING RESIDENTIAL WINDOW CLEANING FOR THE CONSUMER
          </div>
          <p style="font-size:1.05rem; color:#e2e8f0; line-height:1.6; margin:0 0 10px 0;">
            Born on an aluminum ladder in Wayzata, MN missing quote calls. We replaced slow callbacks with sub-60-second automated quotes and modernized cleaning with water-fed filtration poles.
          </p>
          <div style="font-size:0.85rem; color:#94a3b8;">
            📍 Live Proving Ground: Gerry's Window Services (Lake Minnetonka & Twin Cities Metro, MN)
          </div>
        </div>
      </div>
    `,
    script: `Last May, I was twenty-four feet in the air on an aluminum ladder in Wayzata, scraping a second-story picture window with municipal water from a customer's garden hose. My phone was vibrating non-stop in my pocket. <span class="pause-cue">[PAUSE]</span> By the time I climbed down two hours later, I had three missed calls from local homeowners wanting window cleaning quotes. When I called them back, two of them had already hired the competitor who answered their text in under two minutes, and the job I just finished dried with cloudy spots. That day, I realized home services are fundamentally broken for consumers. Homeowners are stuck waiting days for a quote, dealing with flaky contractors, and getting streaky windows. We built Gerry’s Window Services, powered by our APEX platform, to change that. We combine grounded AI with truck filtration systems to deliver an instant quote, self-booking in seconds, and laboratory-verified spot-free windows.`,
    transition: `Let’s look at why consumers are so frustrated with traditional services.`
  },
  {
    num: 2,
    title: "HOME SERVICES ARE BROKEN FOR CONSUMERS",
    subtitle: "Slow Callbacks, Zero Transparency, and Friction at Every Step",
    category: "THE CONSUMER PROBLEM",
    speaker: "Mason Gerry (Founder & Operations Lead)",
    targetTime: "0:40 (Cumulative: 1:10)",
    rubricTag: "Rubric: Problem & Research (20 Points) • N=45 Surveys & N=18 Interviews",
    html: `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:3.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">4.2 HOURS</div>
            <div style="font-size:1.15rem; font-weight:700; color:#fff; margin-top:8px;">Average Callback Delay</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Homeowners are stuck waiting while contractors work on ladders</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:3.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">78%</div>
            <div style="font-size:1.15rem; font-weight:700; color:#fff; margin-top:8px;">Hire First Responder</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Speed is the #1 deciding factor for residential homeowners</div>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid #1e293b; border-radius:12px; padding:22px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
            PRIMARY CONSUMER AUDIT (N = 45 HOMEOWNER SURVEYS | N = 18 IN-DEPTH INTERVIEWS)
          </div>
          <p style="font-size:1.1rem; color:#fff; font-style:italic; margin:0 0 10px 0; border-left:3px solid #38bdf8; padding-left:14px;">
            "I always hire whoever gives me a confirmed price first. I don't have time to wait 24 hours for three contractors to call me back."
            <span style="font-size:0.85rem; color:#94a3b8; font-style:normal; display:block; margin-top:4px;">— Lake Minnetonka Homeowner</span>
          </p>
          <div style="font-size:0.85rem; color:#94a3b8;">
            • Homeowners wait an average of 14 hours for traditional estimates • Win rates drop 3.9x after 30 minutes
          </div>
        </div>
      </div>
    `,
    script: `Let’s look at why consumers are frustrated. Across our primary research—including forty-five quantitative homeowner surveys and eighteen in-depth interviews across Lake Minnetonka and the Twin Cities—the single largest pain point is speed. <span class="pause-cue">[PAUSE]</span> Seventy-eight percent of homeowners hire the very first service company that delivers a confirmed price. Yet the industry average callback time is 4.2 hours. Why? Because solo contractors are physically on ladders, pressure washing driveways, or driving. If a homeowner doesn't get a response in thirty minutes, their frustration spikes, and probability of booking drops by nearly four times. Over sixty-four percent of surveyed homeowners told us: they don't want to play phone tag—they want an instant, transparent price on their phone.`,
    transition: `And the second major consumer frustration is the outdated cleaning process itself.`
  },
  {
    num: 3,
    title: "ALWAYS OPTIMIZING: SQUEEGEE TO FILTER",
    subtitle: "How Gerry’s Window Services Re-Engineered the Cleaning Process for Speed, Safety & Quality",
    category: "CONTINUOUS OPTIMIZATION",
    speaker: "Mason Gerry (Founder & Operations Lead)",
    targetTime: "0:35 (Cumulative: 1:45)",
    rubricTag: "Rubric: Problem & Opportunity (20 Points) • Process Optimization",
    html: `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:1.15rem; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:8px;">
              The Old Way: Squeegee & Bucket
            </div>
            <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
              <li>Dangerous 24ft ladder climbing against homeowner siding</li>
              <li>Soapy bucket water leaves sticky film that attracts dust</li>
              <li>Slow manual hand-wiping: 2 to 3 hours per house</li>
              <li>Squeegee drips leave dirty runoff on frames and tracks</li>
            </ul>
          </div>

          <div style="background:#0e1420; border:1px solid #38bdf8; border-radius:12px; padding:22px;">
            <div style="font-size:1.15rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:8px;">
              Gerry's Optimization: Pure-Water Filtration
            </div>
            <ul style="color:#e2e8f0; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
              <li>Safe ground-level carbon fiber reach up to 3 stories</li>
              <li>Pure deionized water dissolves dirt naturally without soap</li>
              <li>Rinses glass, frames, and sills completely clean</li>
              <li>Dries naturally spot-free in half the turnaround time</li>
            </ul>
          </div>
        </div>

        <div style="background:#111827; border:1px solid #1e293b; border-radius:10px; padding:14px 20px; font-size:0.92rem; color:#e2e8f0;">
          <strong style="color:#38bdf8;">Continuous Optimization:</strong> 2.5x faster turnaround per home, zero ladder damage risk, and glass that stays clean longer.
        </div>
      </div>
    `,
    script: `At Gerry’s Window Services, we are obsessed with continuous optimization. For decades, the window cleaning industry has been stuck doing things the exact same way: lugging heavy aluminum ladders against people’s siding, dipping squeegees into soapy buckets, and wiping glass by hand. It’s slow, it’s dangerous, and it leaves soapy film that attracts dust right after it dries. <span class="pause-cue">[PAUSE]</span> We completely optimized our field process by switching from traditional squeegees to high-tech water-fed filtration poles. Instead of climbing ladders, our technicians use lightweight carbon fiber poles connected directly to our truck's filtration system. The pure filtered water breaks down dirt, washes the frames and sills, and rinses everything completely clean—drying naturally spot-free without a single drop of soap or chemical. It’s safer, it cuts time-on-site in half, and it gives the homeowner a dramatically better result. To show how our software and technology power this, here is our Technical Lead.`,
    transition: `(Verbal Handoff to Speaker 2: Technical Lead)`
  },
  {
    num: 4,
    title: "INSTANT PRICING. INSTANT BOOKING.",
    subtitle: "Transparent 3-Tier Proposals Sent to Your Phone in Under 60 Seconds",
    category: "THE CONSUMER EXPERIENCE",
    speaker: "Technical Lead",
    targetTime: "0:35 (Cumulative: 2:20)",
    rubricTag: "Rubric: Solution (20 Points) • Frictionless Booking",
    html: `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#94a3b8;">BRONZE</div>
            <div style="font-size:2rem; font-weight:900; color:#fff; margin:6px 0;">$300</div>
            <div style="font-size:0.95rem; font-weight:700; color:#38bdf8; margin-bottom:8px;">Exterior Detailing</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Exterior pure-water clean, frame rinse, and 48-Hour Rain Shield.</div>
          </div>
          <div style="background:#0e1420; border:1.5px solid #38bdf8; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8;">SILVER (MOST POPULAR)</div>
            <div style="font-size:2rem; font-weight:900; color:#fff; margin:6px 0;">$450</div>
            <div style="font-size:0.95rem; font-weight:700; color:#38bdf8; margin-bottom:8px;">Inside & Outside</div>
            <div style="font-size:0.85rem; color:#e2e8f0; line-height:1.5;">Exterior pure-water + interior detail + track vacuum.</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#94a3b8;">GOLD</div>
            <div style="font-size:2rem; font-weight:900; color:#fff; margin:6px 0;">$650</div>
            <div style="font-size:0.95rem; font-weight:700; color:#38bdf8; margin-bottom:8px;">Complete Estate Care</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Full detail + deep screen restoration + priority scheduling.</div>
          </div>
        </div>

        <div style="background:#111827; border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px 20px; font-size:0.92rem; color:#e2e8f0; text-align:center;">
          <strong style="color:#38bdf8;">Zero Friction:</strong> Enter Address ➔ Instant 3-Tier Quote in &lt; 60s ➔ 1-Tap Mobile Slot Booking
        </div>
      </div>
    `,
    script: `Thank you, Mason. We designed the customer experience from the ground up to eliminate every point of friction. When a homeowner reaches out—through our website, a text message, or scanning a QR code—our platform instantly calculates an exact quote in under sixty seconds. The homeowner receives a clean mobile proposal with three clear options: Bronze for exterior glass, Silver for inside and out, and Gold for the full estate including screens and tracks. There's no waiting for someone to drive to your house to measure. The homeowner selects their tier, taps an arrival time slot on their phone, and their appointment is locked in with zero double-booking. It’s as fast and simple as ordering an Uber.`,
    transition: `Now let's examine how our technology powers our service trucks.`
  },
  {
    num: 5,
    title: "HOW OUR TECHNOLOGY POWERS THE TRUCK",
    subtitle: "Grounded AI Intake + On-Board Water Filtration Telematics",
    category: "4TH INDUSTRIAL REVOLUTION TECH",
    speaker: "Technical Lead",
    targetTime: "0:40 (Cumulative: 3:00)",
    rubricTag: "Rubric: 4th IR Technologies (5 Points) • AI + IoT Hardware",
    html: `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:1.15rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:10px;">
              Pillar 1: Grounded AI Auto-Pilot
            </div>
            <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
              <li>&lt; 60-Second Lead Response via SMS and web intake</li>
              <li>Parametric dynamic pricing calculates pane counts instantly</li>
              <li>TCPA Quiet Hours Shield (Compliant 8:00 AM – 8:00 PM local)</li>
              <li>Objection battlecard copilot answers customer questions</li>
            </ul>
          </div>

          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:1.15rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:10px;">
              Pillar 2: On-Board Truck Telematics
            </div>
            <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
              <li>Dual inline conductivity sensors monitor filtration in real time</li>
              <li>Pure filtered water stream ensures zero residue on glass</li>
              <li>Encrypted Digital Clarity Certificate sent via SMS upon completion</li>
              <li>Automated 48-Hour Rain Shield guarantee activates with 1 tap</li>
            </ul>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px 20px; font-size:0.92rem; color:#e2e8f0;">
          <strong style="color:#38bdf8;">Objective Proof:</strong> Sensors confirm our filtration is operating at 100% purity before water ever touches customer glass.
        </div>
      </div>
    `,
    script: `Our platform leverages two core Fourth Industrial Revolution technologies: Grounded AI and Industrial IoT. On the software side, our AI assistant parses property details, handles customer questions with instant battlecards, and enforces strict TCPA quiet hours. On the hardware side, we install industrial IoT telemetry units directly onto our service trucks. Dual inline conductivity sensors measure tap water entering our filtration tanks and compare it against the purified deionized water leaving our tanks, streaming an objective reading directly to the cloud. When the job is done, the homeowner receives an encrypted Digital Clarity Certificate on their phone proving their glass was cleaned with zero-mineral water, backed by an automated 48-Hour Rain Shield Guarantee. Now, here is our Head of Growth to discuss our customers and route flywheel.`,
    transition: `(Verbal Handoff to Speaker 3: Growth Lead)`
  },
  {
    num: 6,
    title: "OUR CONSUMER: "SUBURBAN SARAH & DAVID"",
    subtitle: "Luxury Single-Family Homes Across Lake Minnetonka & The Twin Cities",
    category: "TARGET CUSTOMER & MARKET",
    speaker: "Growth Lead",
    targetTime: "0:45 (Cumulative: 3:45)",
    rubricTag: "Rubric: Target Market (20 Points) • ICP Profile & Sizing",
    html: `
      <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:20px;">
        <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:6px;">
            Target Homeowner Profile
          </div>
          <div style="font-size:1.6rem; font-weight:900; color:#fff; margin-bottom:12px;">
            "Suburban Sarah & David"
          </div>
          <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
            <li><strong>Homes:</strong> $650,000 to $2.5 Million home value with 35 to 60 windows</li>
            <li><strong>Geography:</strong> Lake Minnetonka, Wayzata, Edina, Eden Prairie</li>
            <li><strong>Mindset:</strong> High pride of ownership, strict HOA compliance, zero free time</li>
            <li><strong>Preferences:</strong> Value speed and verified quality over cheap bids. Enthusiastic adopters of $42–$65/mo auto-pay subscriptions</li>
          </ul>
        </div>

        <div style="background:#0e1420; border:1px solid #1e293b; border-radius:12px; padding:24px; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:12px;">
              Market Opportunity
            </div>
            <div style="margin-bottom:14px;">
              <div style="font-size:1.5rem; font-weight:900; color:#fff;">$42 MILLION</div>
              <div style="font-size:0.82rem; color:#94a3b8;">Twin Cities Beachhead SOM (140,000 Luxury Homes)</div>
            </div>
            <div>
              <div style="font-size:1.5rem; font-weight:900; color:#fff;">$18.4 BILLION</div>
              <div style="font-size:0.82rem; color:#94a3b8;">US Exterior Surface Care & Window Cleaning SAM</div>
            </div>
          </div>
        </div>
      </div>
    `,
    script: `Thank you. Let’s talk about who our customers are. Our ideal customer is 'Suburban Sarah and David'—busy homeowners living in luxury single-family homes valued between $650,000 and $2.5 Million across suburban hubs like Lake Minnetonka, Wayzata, Edina, and Eden Prairie. These homes have 35 to 60 large windows. They have strict HOA standards and heavy suburban dust. Most importantly, these homeowners value their time: they don't want to spend their weekend calling three contractors and waiting for callbacks. They want an effortless, high-trust solution. In the Twin Cities metro alone, this luxury segment represents a $42 Million beachhead market, sitting inside an $18.4 Billion national exterior surface care industry.`,
    transition: `Now let's examine our neighborhood route clustering strategy.`
  },
  {
    num: 7,
    title: "THE 500-METER CUL-DE-SAC FLYWHEEL",
    subtitle: "Passing Transit Efficiency Directly Back to Neighborhood Homeowners",
    category: "NEIGHBORHOOD ROUTE CLUSTERING",
    speaker: "Growth Lead",
    targetTime: "0:45 (Cumulative: 4:30)",
    rubricTag: "Rubric: Go-to-Market (5 Points) • Route Density Stacking",
    html: `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8;">STEP 1</div>
            <div style="font-size:1.2rem; font-weight:800; color:#fff; margin:6px 0;">Anchor Booking</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Home A on Bushaway Rd books a window clean on the portal.</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8;">STEP 2</div>
            <div style="font-size:1.2rem; font-weight:800; color:#fff; margin:6px 0;">30 Neighbors Alerted</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Auto-texts neighbors: "Our truck is on your street Thursday for $40 off."</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8;">STEP 3</div>
            <div style="font-size:1.2rem; font-weight:800; color:#fff; margin:6px 0;">$0 Drive Time</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Clustered stops convert at 3.2x; crew rolls hose across driveway.</div>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px 20px; font-size:0.92rem; color:#e2e8f0; text-align:center;">
          <strong style="color:#38bdf8;">The Win-Win:</strong> Homeowners save $40 on their clean; our service trucks eliminate 60% of windshield drive time.
        </div>
      </div>
    `,
    script: `Our customer acquisition engine is built on solving the biggest cost in field services: windshield drive time. When a homeowner on a cul-de-sac books a job, our platform automatically identifies nearby homes within 500 meters and sends a geo-targeted route offer: 'Our pure-water truck is already on your block this Thursday—tap here to claim an automatic $40 neighbor discount.' Neighbors see our branded Ford Transit rig and carbon fiber poles right outside their window. These clustered leads convert at 3.2 times the industry average. And because our crew just rolls the hose across the driveway, our transit time drops from 45 minutes to zero. We pass those savings directly back to the homeowner as a discount while increasing our daily revenue per truck.`,
    transition: `Let's see how our consumer experience compares to traditional cleaners.`
  },
  {
    num: 8,
    title: "WHY HOMEOWNERS CHOOSE US",
    subtitle: "Contrasting Modern Convenience Against Traditional Cleaners",
    category: "COMPETITIVE COMPARISON",
    speaker: "Growth Lead",
    targetTime: "0:40 (Cumulative: 5:10)",
    rubricTag: "Rubric: Competition (5 Points) • Consumer Experience Contrast",
    html: `
      <div>
        <table class="data-table" style="font-size:0.9rem; margin-bottom:16px;">
          <thead>
            <tr>
              <th>CUSTOMER EXPERIENCE</th>
              <th>TRADITIONAL CLEANERS</th>
              <th style="color:#38bdf8;">GERRY'S WINDOW SERVICES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Speed to Quote</strong></td>
              <td style="color:#94a3b8;">4+ Hours / 2-Day Wait</td>
              <td style="color:#38bdf8; font-weight:700;">&lt; 60 Seconds Instant Mobile Quote</td>
            </tr>
            <tr>
              <td><strong>Cleaning Method</strong></td>
              <td style="color:#94a3b8;">Ladders, squeegees, soapy runoff</td>
              <td style="color:#38bdf8; font-weight:700;">Water-Fed Filtration Poles (Ground-Level)</td>
            </tr>
            <tr>
              <td><strong>Booking & Pricing</strong></td>
              <td style="color:#94a3b8;">Paper door hanger or static PDF</td>
              <td style="color:#38bdf8; font-weight:700;">Transparent 3-Tier Interactive Proposal</td>
            </tr>
            <tr>
              <td><strong>Customer Guarantee</strong></td>
              <td style="color:#94a3b8;">None / "All Sales Final"</td>
              <td style="color:#38bdf8; font-weight:700;">48-Hour Automated Rain Shield Guarantee</td>
            </tr>
          </tbody>
        </table>

        <div style="background:#0e1420; border:1px solid #1e293b; border-radius:10px; padding:12px 18px; font-size:0.88rem; color:#e2e8f0;">
          <strong style="color:#38bdf8;">The Consumer Verdict:</strong> Traditional window cleaning is slow, risky, and inconsistent. Gerry's delivers speed, safety, and guaranteed clarity.
        </div>
      </div>
    `,
    script: `When homeowners look for window cleaning, their current options are frustrating: unverified solo handymen with clipboards or large franchises using outdated scheduling systems. Traditional cleaners take hours or days to quote, show up with garden hoses and ladders, leave soapy film on glass, and offer zero guarantees. We offer a completely modern consumer experience: sub-60-second instant quotes, transparent 3-tier pricing, ground-level pure-water filtration cleaning, zero software surcharges, and an automated 48-Hour Rain Shield. We don’t just clean windows; we give homeowners peace of mind.`,
    transition: `Now let's examine our recurring model and the data asset.`
  },
  {
    num: 9,
    title: "RECURRING CARE & THE DATA FLYWHEEL",
    subtitle: "$42–$65/mo Memberships Fueling Proprietary Field Intelligence",
    category: "RECURRING CARE & DATA ENGINE",
    speaker: "Growth Lead",
    targetTime: "0:40 (Cumulative: 5:50)",
    rubricTag: "Rubric: Revenue Model & Data (5 Points) • Subscriptions & Data Flywheel",
    html: `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:8px;">
            Recurring Homeowner Care
          </div>
          <div style="font-size:2rem; font-weight:900; color:#fff; margin-bottom:12px;">
            $42–$65/mo Autopay
          </div>
          <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
            <li>42% of homeowners convert from 1-off clean to recurring care</li>
            <li>68% Field Gross Margin with efficient water-fed pole cleaning</li>
            <li>$14,800/mo revenue per active service truck</li>
            <li>Smooth recurring cash flow completely eliminates the winter cliff</li>
          </ul>
        </div>

        <div style="background:#0e1420; border:1px solid #1e293b; border-radius:12px; padding:24px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:8px;">
            The Proprietary Data Asset
          </div>
          <div style="font-size:1.5rem; font-weight:900; color:#fff; margin-bottom:12px;">
            Platform Usage Intelligence
          </div>
          <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
            <li>Route density modeling maps cluster conversion in real time</li>
            <li>Pricing elasticity algorithms optimize quotes by zip code</li>
            <li>Equipment telematics monitors filtration life and flow rates</li>
            <li>Every wash trains our algorithms, widening our competitive moat</li>
          </ul>
        </div>
      </div>
    `,
    script: `Our financial model converts one-off seasonal cleans into predictable recurring cash flow. A single service truck generates $14,800 per month at a 68% field gross margin. By anchoring homeowners at a $300 initial clean and converting forty-two percent into $42 to $65 per month memberships, we eliminate the seasonal winter cliff. But just as importantly: we are focused on getting customers and technicians onto the platform to capture proprietary operating data. Every wash captures route density, pricing elasticity by neighborhood, and real-time filtration performance. This data continuously trains our algorithms—making our pricing sharper, our routes denser, and our operations more efficient with every customer we serve. Now, back to our founder, Mason Gerry.`,
    transition: `(Verbal Handoff to Speaker 1: Mason Gerry)`
  },
  {
    num: 10,
    title: "OPERATING DAILY IN THE TWIN CITIES",
    subtitle: "Real Homes. Real Paying Customers. Proven Operational Metrics.",
    category: "EMPIRICAL FIELD VALIDATION",
    speaker: "Mason Gerry (Founder & Operations Lead)",
    targetTime: "0:40 (Cumulative: 6:30)",
    rubricTag: "Rubric: Traction & Verification (20 Points) • 53/53 Tests Passing",
    html: `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.8rem; font-weight:900; color:#38bdf8; font-family:monospace;">61%</div>
            <div style="font-size:1rem; font-weight:700; color:#fff; margin-top:6px;">Quote-to-Close Rate</div>
            <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">Nearly triple industry ~22% average</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.8rem; font-weight:900; color:#38bdf8; font-family:monospace;">42%</div>
            <div style="font-size:1rem; font-weight:700; color:#fff; margin-top:6px;">Recurring Memberships</div>
            <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">Enrolled in $42–$65/mo autopay</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.8rem; font-weight:900; color:#38bdf8; font-family:monospace;">100%</div>
            <div style="font-size:1rem; font-weight:700; color:#fff; margin-top:6px;">Spot-Free Quality</div>
            <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">Zero callbacks or streak disputes</div>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid rgba(56,189,248,0.3); border-radius:12px; padding:22px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
            TECHNICAL & OPERATIONAL VALIDATION (53 / 53 TESTS PASSING)
          </div>
          <p style="font-size:0.95rem; color:#e2e8f0; line-height:1.6; margin:0;">
            • Production-hardened backend verified by 53 automated regression tests in test_platform.rb.<br>
            • Strict double-booking prevention ensures customer arrival windows are guaranteed.<br>
            • Operating live right now in the Twin Cities — real trucks, real customers, real clean glass.
          </p>
        </div>
      </div>
    `,
    script: `What sets us apart is that this is not an academic exercise or a mock prototype. We are operating live right now in the Twin Cities with real paying homeowners. Our instant 3-tier proposals have achieved a sixty-one percent quote-to-close rate—nearly triple the industry average. Forty-two percent of our customers are already enrolled in recurring monthly maintenance. Our platform backend is battle-tested: fifty-three automated regression tests pass with zero failures, proving our double-booking prevention, AI policy guardrails, and IoT sensor envelopes are fully production-grade. Consumers love the speed, and technicians love the efficiency.`,
    transition: `Now, let's look at our next step and expansion.`
  },
  {
    num: 11,
    title: "EXPANDING TO DENVER SPRING 2027",
    subtitle: "Fast Response. Quick Quotes. Guaranteed Perfect Job Done.",
    category: "EXPANSION & CALL TO ACTION",
    speaker: "Mason Gerry (Founder & Operations Lead)",
    targetTime: "0:30 (Cumulative: 7:00)",
    rubricTag: "Rubric: Closing & Call to Action (5 Points) • Strict 7:00 Execution",
    html: `
      <div style="background:#0e1420; border:1.5px solid #38bdf8; border-radius:14px; padding:32px; height:100%; display:flex; flex-direction:column; justify-content:center;">
        <div style="font-size:0.9rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
          Next Expansion Market: Spring 2027
        </div>
        <div style="font-size:3rem; font-weight:900; color:#fff; margin-bottom:18px;">
          DENVER, COLORADO
        </div>
        <div style="font-size:1.35rem; font-weight:700; color:#38bdf8; line-height:1.5; border-left:4px solid #38bdf8; padding-left:16px; margin-bottom:24px;">
          "If you want a fast response, a quick quote, and a guaranteed perfect job done, consider us for next spring when we open up our Denver location!"
        </div>
        <div style="font-size:0.95rem; color:#94a3b8; line-height:1.6;">
          📍 Proving Ground: Lake Minnetonka & Twin Cities, MN &nbsp;|&nbsp; Contact: Mason Gerry • Founder & CEO<br>
          🌐 Live Platform: http://localhost:3000 &nbsp;|&nbsp; Ready for Investor Q&A
        </div>
      </div>
    `,
    script: `Our proving ground in Minnesota has validated the model. By combining instant AI speed-to-lead with connected pure-water truck rigs, we've created a residential window washing experience that consumers love and recommend. Next spring, we are taking this proven playbook to our first expansion market: Denver, Colorado. <span class="pause-cue">[PAUSE]</span> So if you want a fast response, a quick quote, and a guaranteed perfect job done, consider us for next spring when we open up our Denver location! Thank you, and we look forward to your questions.`,
    transition: `End of Presentation. Total Time: Exactly 7 Minutes (420 Seconds).`
  }
];

function initInvestorPitchDeck() {
  renderInvestorSlide(currentPitchSlide);
}

function renderInvestorSlide(index) {
  if (index < 0) index = 0;
  if (index >= INVESTOR_SLIDES.length) index = INVESTOR_SLIDES.length - 1;
  currentPitchSlide = index;

  const slide = INVESTOR_SLIDES[index];

  // Update pills
  const pillsContainer = document.getElementById('slidePillsContainer');
  if (pillsContainer) {
    pillsContainer.innerHTML = INVESTOR_SLIDES.map((s, idx) => `
      <button class="slide-pill-btn ${idx === currentPitchSlide ? 'active' : ''}" onclick="jumpToInvestorSlide(${idx})">
        <span>#${s.num}</span>
        <span>${s.category.split(' ')[0]}</span>
      </button>
    `).join('');
  }

  // Update Slide Stage Meta
  const catEl = document.getElementById('slideCategoryBadge');
  const titleEl = document.getElementById('slideTitleDisplay');
  const subEl = document.getElementById('slideSubtitleDisplay');
  const speakerEl = document.getElementById('slideSpeakerBadge');
  const timeEl = document.getElementById('slideTargetTimeBadge');
  const rubricEl = document.getElementById('slideRubricBadge');
  const bodyEl = document.getElementById('slideCanvasBody');
  const countEl = document.getElementById('slideCounterDisplay');

  if (catEl) catEl.innerText = slide.category;
  if (titleEl) titleEl.innerText = slide.title;
  if (subEl) subEl.innerText = slide.subtitle;
  if (speakerEl) speakerEl.innerText = `🎙️ ${slide.speaker}`;
  if (timeEl) timeEl.innerText = `⏱️ ${slide.targetTime}`;
  if (rubricEl) rubricEl.innerText = slide.rubricTag;
  if (bodyEl) bodyEl.innerHTML = slide.html;
  if (countEl) countEl.innerText = `Slide ${slide.num} of ${INVESTOR_SLIDES.length}`;

  // Update Teleprompter
  const promptSpeaker = document.getElementById('promptSpeakerName');
  const promptTime = document.getElementById('promptTimeWindow');
  const promptText = document.getElementById('promptScriptText');
  const promptTrans = document.getElementById('promptTransitionCue');

  if (promptSpeaker) promptSpeaker.innerText = slide.speaker;
  if (promptTime) promptTime.innerText = slide.targetTime;
  if (promptText) promptText.innerHTML = slide.script;
  if (promptTrans) promptTrans.innerText = `👉 ${slide.transition}`;
}

function nextInvestorSlide() {
  if (currentPitchSlide < INVESTOR_SLIDES.length - 1) {
    renderInvestorSlide(currentPitchSlide + 1);
  }
}

function prevInvestorSlide() {
  if (currentPitchSlide > 0) {
    renderInvestorSlide(currentPitchSlide - 1);
  }
}

function jumpToInvestorSlide(index) {
  renderInvestorSlide(index);
}

// Presentation Stopwatch Timer
function togglePitchTimer() {
  const btn = document.getElementById('pitchTimerToggleBtn');
  if (pitchTimerRunning) {
    clearInterval(pitchTimerInterval);
    pitchTimerRunning = false;
    if (btn) btn.innerHTML = `<span>▶ Resume</span>`;
  } else {
    pitchTimerRunning = true;
    if (btn) btn.innerHTML = `<span>⏸ Pause</span>`;
    pitchTimerInterval = setInterval(() => {
      pitchTimerSeconds++;
      updatePitchTimerUI();
    }, 1000);
  }
}

function resetPitchTimer() {
  clearInterval(pitchTimerInterval);
  pitchTimerRunning = false;
  pitchTimerSeconds = 0;
  const btn = document.getElementById('pitchTimerToggleBtn');
  if (btn) btn.innerHTML = `<span>▶ Start Timer</span>`;
  updatePitchTimerUI();
}

function updatePitchTimerUI() {
  const digits = document.getElementById('pitchClockDigits');
  const status = document.getElementById('pitchTimerStatusBadge');
  if (!digits) return;

  const mins = Math.floor(pitchTimerSeconds / 60);
  const secs = pitchTimerSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  digits.innerText = formatted;

  // Rubric check: Target window is 6:50 (410s) to 7:10 (430s)
  digits.className = 'pitch-clock-digits';
  if (pitchTimerSeconds >= 410 && pitchTimerSeconds <= 430) {
    digits.classList.add('target-window');
    if (status) {
      status.className = 'badge green';
      status.innerText = '🎯 TARGET 7-MIN WINDOW (100% TIMING SCORE)';
    }
  } else if (pitchTimerSeconds > 430) {
    digits.classList.add('over-time');
    if (status) {
      status.className = 'badge red';
      status.innerText = '⚠️ OVERTIME PENALTY (> 7:10)';
    }
  } else if (pitchTimerSeconds >= 390) {
    if (status) {
      status.className = 'badge yellow';
      status.innerText = '⏳ WRAPPING UP (APPROACHING 6:50)';
    }
  } else {
    if (status) {
      status.className = 'badge blue';
      status.innerText = '⏱️ PRESENTING... (TARGET: 7:00)';
    }
  }
}

function copyCurrentSlideScript() {
  const slide = INVESTOR_SLIDES[currentPitchSlide];
  const text = `SLIDE ${slide.num}: ${slide.title}\nSPEAKER: ${slide.speaker}\nTARGET TIME: ${slide.targetTime}\n\nSPEAKER SCRIPT:\n${slide.script.replace(/<[^>]*>?/gm, '')}\n\nTRANSITION:\n${slide.transition}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`📋 Copied Slide #${slide.num} script to clipboard!`);
  }).catch(() => {
    showToast(`Copied text to clipboard`);
  });
}

function copyGoogleSlidesDeck() {
  window.open('/INVESTOR_PITCH_SLIDES.md', '_blank');
  showToast(`📄 Master INVESTOR_PITCH_SLIDES.md opened for Google Slides import!`);
}

function toggleFullscreenDeck() {
  const stage = document.getElementById('slideViewportStage');
  if (!stage) return;
  if (!document.fullscreenElement) {
    stage.requestFullscreen().catch(err => {
      console.warn("Fullscreen request error:", err);
    });
  } else {
    document.exitFullscreen();
  }
}

// Keyboard shortcuts for slides
window.addEventListener('keydown', (e) => {
  if (state.currentTab !== 'investor') return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    e.preventDefault();
    nextInvestorSlide();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    prevInvestorSlide();
  }
});
