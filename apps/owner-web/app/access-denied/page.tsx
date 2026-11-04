export default function AccessDeniedPage() {
  return <main className="auth-page"><section className="auth-card"><div className="brand-mark">A</div><p className="eyebrow">APEX FIELD OS <span>PRIVATE OWNER ACCESS</span></p><h1>Access denied.</h1><p className="muted">This account is not the configured founding-owner identity. Field Hub access is restricted.</p><form action="/sign-out" method="post"><button className="button secondary">Sign out</button></form></section></main>;
}
