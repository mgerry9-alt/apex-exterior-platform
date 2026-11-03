(function() {
  // Prevent duplicate execution
  if (window.ApexQuoteWidgetLoaded) return;
  window.ApexQuoteWidgetLoaded = true;

  // Determine host for API calls
  const currentScript = document.currentScript;
  let baseUrl = '';
  if (currentScript && currentScript.src) {
    const url = new URL(currentScript.src);
    baseUrl = `${url.protocol}//${url.host}`;
  } else {
    baseUrl = window.location.origin;
  }

  // Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    .apex-widget-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 999px;
      box-shadow: 0 10px 25px rgba(14, 165, 233, 0.4), 0 0 0 1px rgba(255,255,255,0.2);
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 700;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }
    .apex-widget-fab:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 14px 30px rgba(14, 165, 233, 0.5);
    }
    .apex-widget-fab .fab-icon {
      font-size: 18px;
      animation: apexPulse 2s infinite ease-in-out;
    }
    @keyframes apexPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    .apex-widget-modal {
      position: fixed;
      bottom: 84px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 110px);
      background: #090d16;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      box-shadow: 0 20px 45px rgba(0,0,0,0.7), 0 0 0 1px rgba(14,165,233,0.3);
      z-index: 999999;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
      animation: apexSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes apexSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .apex-widget-header {
      background: linear-gradient(135deg, #0b1528 0%, #032344 100%);
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .apex-widget-header h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .apex-widget-header p {
      margin: 2px 0 0;
      font-size: 11px;
      color: #94a3b8;
    }
    .apex-widget-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
      padding: 4px;
    }
    .apex-widget-close:hover { color: #fff; }
    .apex-widget-body {
      padding: 16px;
      overflow-y: auto;
      font-size: 13px;
    }
    .apex-widget-group {
      margin-bottom: 12px;
    }
    .apex-widget-group label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 5px;
    }
    .apex-widget-input {
      width: 100%;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      padding: 9px 12px;
      color: #fff;
      font-size: 13px;
      box-sizing: border-box;
    }
    .apex-widget-input:focus {
      outline: none;
      border-color: #0ea5e9;
      box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
    }
    .apex-price-banner {
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 10px;
      padding: 12px;
      text-align: center;
      margin-bottom: 14px;
    }
    .apex-price-val {
      font-size: 26px;
      font-weight: 900;
      color: #38bdf8;
      line-height: 1.1;
    }
    .apex-price-sub {
      font-size: 11px;
      color: #cbd5e1;
      margin-top: 3px;
    }
    .apex-check-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 8px;
      cursor: pointer;
      font-size: 12px;
    }
    .apex-check-pill input { cursor: pointer; accent-color: #0ea5e9; }
    .apex-submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: #fff;
      border: none;
      border-radius: 9px;
      padding: 11px;
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(14,165,233,0.35);
      transition: all 0.2s;
    }
    .apex-submit-btn:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);

  // Inject Markup
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="apex-widget-fab" id="apex-fab">
      <span class="fab-icon">⚡</span>
      <span>Instant Window Estimate</span>
    </div>

    <div class="apex-widget-modal" id="apex-modal">
      <div class="apex-widget-header">
        <div>
          <h4><span>✨</span> Gerry's Window Services</h4>
          <p>Instant 30-Second Exterior Estimate</p>
        </div>
        <button class="apex-widget-close" id="apex-close">&times;</button>
      </div>

      <div class="apex-widget-body" id="apex-form-body">
        <!-- Live Instant Price -->
        <div class="apex-price-banner">
          <div class="apex-price-val" id="apex-disp-price">$300</div>
          <div class="apex-price-sub" id="apex-disp-sub">Pure DI Water Exterior Wash (30 Panes)</div>
        </div>

        <div class="apex-widget-group">
          <label>Estimated Window Panes: <span id="apex-pane-count-label" style="color:#38bdf8;">30</span></label>
          <input type="range" id="apex-slider-panes" min="10" max="70" step="5" value="30" style="width:100%; accent-color:#0ea5e9;">
          <div style="display:flex; justify-content:space-between; font-size:10px; color:#64748b; margin-top:2px;">
            <span>10 panes ($100)</span>
            <span>40 panes ($390)</span>
            <span>70 panes ($660)</span>
          </div>
        </div>

        <div class="apex-widget-group">
          <label class="apex-check-pill">
            <input type="checkbox" id="apex-check-interior">
            <span>Add Full Interior Hand Detailing (+ $10/win)</span>
          </label>
          <label class="apex-check-pill">
            <input type="checkbox" id="apex-check-screens">
            <span>Clean Screens ($5 per screen)</span>
          </label>
        </div>

        <div style="background:rgba(234,179,8,0.1); border:1px solid rgba(234,179,8,0.25); border-radius:6px; padding:6px 8px; font-size:10px; color:#fef08a; margin-bottom:12px;">
          ⚠️ Hard-to-reach or 3rd-story glass assessed on-site based on severity.
        </div>

        <div class="apex-widget-group">
          <label>Property Address</label>
          <input type="text" id="apex-input-address" class="apex-widget-input" placeholder="e.g. 3400 Bushaway Rd, Wayzata" required>
        </div>

        <div class="apex-widget-group">
          <label>Your Name & Phone (For &lt;90s SMS Quote)</label>
          <div style="display:flex; gap:6px;">
            <input type="text" id="apex-input-name" class="apex-widget-input" placeholder="Your Name" style="flex:1;" required>
            <input type="tel" id="apex-input-phone" class="apex-widget-input" placeholder="Cell Phone" style="flex:1;" required>
          </div>
        </div>

        <button class="apex-submit-btn" id="apex-submit">
          🚀 Get Official 3-Tier Quote Link
        </button>
      </div>

      <div class="apex-widget-body" id="apex-success-body" style="display:none; text-align:center; padding:24px 16px;">
        <div style="font-size:36px; margin-bottom:8px;">🎉</div>
        <h3 style="margin:0 0 6px; color:#34d399; font-size:16px;">Quote Generated Instantly!</h3>
        <p style="color:#cbd5e1; font-size:12px; line-height:1.45; margin-bottom:16px;">
          Mason and the crew at Gerry's Window Services have received your request. An official 3-tier Good/Better/Best proposal is ready!
        </p>
        <a id="apex-view-proposal-btn" href="#" target="_blank" style="display:inline-block; background:linear-gradient(135deg, #059669, #10b981); color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:800; font-size:13px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">
          ⚡ View My 3-Tier Estimate & Select Date
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // Widget Logic & Calculation
  const fab = document.getElementById('apex-fab');
  const modal = document.getElementById('apex-modal');
  const closeBtn = document.getElementById('apex-close');
  const slider = document.getElementById('apex-slider-panes');
  const paneLabel = document.getElementById('apex-pane-count-label');
  const checkInt = document.getElementById('apex-check-interior');
  const checkScr = document.getElementById('apex-check-screens');
  const dispPrice = document.getElementById('apex-disp-price');
  const dispSub = document.getElementById('apex-disp-sub');
  const submitBtn = document.getElementById('apex-submit');
  const formBody = document.getElementById('apex-form-body');
  const successBody = document.getElementById('apex-success-body');
  const proposalBtn = document.getElementById('apex-view-proposal-btn');

  function calculatePrice() {
    const panes = parseInt(slider.value) || 30;
    paneLabel.innerText = panes;
    
    // Formula: 10=$100, 20=$200, 30=$300, 40=$390, 50=$480, 60=$570, 70=$660
    const ext = panes <= 30 ? (panes * 10) : (300 + (panes - 30) * 9);
    const interior = checkInt.checked ? (panes * 10) : 0;
    const screens = checkScr.checked ? (Math.round(panes * 0.5) * 5) : 0;
    const total = ext + interior + screens;

    dispPrice.innerText = '$' + total;
    let desc = `Exterior (${panes} Panes)`;
    if (checkInt.checked) desc += ' + Full Interior';
    if (checkScr.checked) desc += ' + Screens';
    dispSub.innerText = desc;
  }

  slider.addEventListener('input', calculatePrice);
  checkInt.addEventListener('change', calculatePrice);
  checkScr.addEventListener('change', calculatePrice);

  fab.addEventListener('click', () => {
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  });
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  submitBtn.addEventListener('click', async () => {
    const name = document.getElementById('apex-input-name').value.trim();
    const phone = document.getElementById('apex-input-phone').value.trim();
    const addr = document.getElementById('apex-input-address').value.trim();
    const panes = parseInt(slider.value) || 30;

    if (!name || !phone || !addr) {
      alert('Please enter your name, phone number, and address so we can route the quote!');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = 'Routing to Gerry\'s Windows...';

    try {
      const ext = panes <= 30 ? (panes * 10) : (300 + (panes - 30) * 9);
      const total = ext + (checkInt.checked ? panes * 10 : 0);

      const res = await fetch(`${baseUrl}/api/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          phone: phone,
          address: addr,
          service: checkInt.checked ? 'Interior & Exterior Window Wash' : 'Pure DI Exterior Window Wash',
          quote_amount: total,
          source: 'Website Quote Widget'
        })
      });

      const data = await res.json();
      formBody.style.display = 'none';
      successBody.style.display = 'block';
      proposalBtn.href = `${baseUrl}/estimate.html`;
    } catch (err) {
      alert('Estimate submitted! Our truck will reach out shortly.');
      modal.style.display = 'none';
    }
  });

  calculatePrice();
})();
