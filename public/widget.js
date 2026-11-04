(() => {
  if (document.getElementById('apex-demo-widget-hold')) return;
  const notice = document.createElement('div');
  notice.id = 'apex-demo-widget-hold';
  notice.setAttribute('role', 'status');
  notice.textContent = 'Online quote widget unavailable: this prototype is not configured for customer estimates or bookings.';
  Object.assign(notice.style, {
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    zIndex: '2147483647',
    maxWidth: '360px',
    padding: '14px 18px',
    border: '1px solid #b45309',
    borderRadius: '10px',
    background: '#451a03',
    color: '#fde68a',
    font: '600 14px/1.5 system-ui, sans-serif',
    boxShadow: '0 8px 24px rgba(0,0,0,.28)'
  });
  if (document.body) document.body.appendChild(notice);
  else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(notice), { once: true });
})();
