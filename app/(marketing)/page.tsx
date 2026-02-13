import Link from 'next/link';

export default function MarketingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">AUVEA</div>
        <nav className="landing-nav">
          <a href="#workflow">Workflow</a>
          <a href="#features">Features</a>
          <a href="#control">Control</a>
          <Link href="/app">Dashboard</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <p className="landing-kicker">Resume Job Assistant</p>
        <h1>Upload your resume once. Discover and apply to jobs faster.</h1>
        <p className="landing-subtitle">
          AUVEA refreshes jobs every 24 hours from your selected career pages, ranks them in one
          dashboard, and helps you apply with saved answers and final confirmation.
        </p>
        <div className="landing-actions">
          <Link className="landing-button primary" href="/app">
            Open Dashboard
          </Link>
          <a className="landing-button secondary" href="#workflow">
            View Workflow
          </a>
        </div>
      </section>

      <section id="workflow" className="landing-section">
        <h2>How your flow works</h2>
        <div className="landing-grid">
          <article className="landing-card">
            <h3>Sign in and upload your resume</h3>
            <p>Parse your PDF into profile fields for faster, consistent applications.</p>
          </article>
          <article className="landing-card">
            <h3>Add company career pages</h3>
            <p>Track companies you care about and keep job listings updated automatically.</p>
          </article>
          <article className="landing-card">
            <h3>Review and apply</h3>
            <p>Queue assisted apply and confirm details before final submission.</p>
          </article>
        </div>
      </section>

      <section id="features" className="landing-section">
        <h2>What you get</h2>
        <div className="landing-grid">
          <article className="landing-card">
            <h3>24-hour refresh</h3>
            <p>New openings are fetched on schedule and marked in your dashboard.</p>
          </article>
          <article className="landing-card">
            <h3>Manual filters</h3>
            <p>Sort by status, company, and role so you can focus on what matters.</p>
          </article>
          <article className="landing-card">
            <h3>Question memory</h3>
            <p>New questions are saved once, then reused in future applications.</p>
          </article>
          <article className="landing-card">
            <h3>Assisted apply</h3>
            <p>Auto-fill where supported, pause for review, then submit with your confirmation.</p>
          </article>
        </div>
      </section>

      <section id="control" className="landing-section landing-section-accent">
        <h2>You stay in control</h2>
        <ul className="landing-list">
          <li>Private resume storage by account.</li>
          <li>Final review before any submission.</li>
          <li>Fallback to manual apply when unsupported.</li>
        </ul>
        <Link className="landing-button primary" href="/app">
          Start Using AUVEA
        </Link>
      </section>
    </div>
  );
}
