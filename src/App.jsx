import { useState } from 'react'
import { Avatar, Badge, Button, Drawer, Dropdown, EmptyState, ErrorState, Icon, Input, Modal, Skeleton, Tabs, Toast, Tooltip } from './components/ui.jsx'

export default function App() {
  const [activeTab, setActiveTab] = useState('primitives')
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState(false)
  const [menuNote, setMenuNote] = useState('')

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  return <>
    <a href="#main" className="skip-link">Skip to main content</a>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Freetopia home"><span className="brand__mark"><img className="brand__image" src="/brand/freetopia-mark.png" alt=""/></span><span>freetopia</span></a>
      <span className="topbar__status"><span className="status-dot"/> Product foundations</span>
      <a className="topbar__link" href="#foundations">Explore the foundations <Icon name="arrow" size={16}/></a>
    </header>

    <main id="main">
      <section className="hero wrap" id="top">
        <div className="hero__copy">
          <Badge tone="brand">A social world in the making</Badge>
          <h1>Your world.<br/><span>Your voice.</span></h1>
          <p className="hero__lede">A place for people, ideas, and connection. Freetopia starts with room to be yourself.</p>
          <a className="button button--primary button--lg" href="#foundations">Discover the foundations <Icon name="arrow" size={18}/></a>
          <p className="hero__note">Built around expression, discovery, and belonging.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art__halo hero-art__halo--one"/><div className="hero-art__halo hero-art__halo--two"/>
          <div className="hero-art__orb"><span className="hero-art__orb-inner"><img className="hero-art__brand-mark" src="/brand/freetopia-mark.png" alt=""/></span></div>
          <span className="hero-art__label hero-art__label--one">EXPRESS</span><span className="hero-art__label hero-art__label--two">DISCOVER</span><span className="hero-art__label hero-art__label--three">BELONG</span>
          <span className="hero-art__dot hero-art__dot--one"/><span className="hero-art__dot hero-art__dot--two"/>
        </div>
      </section>

      <section className="foundations wrap" id="foundations">
        <div className="section-heading"><div><p className="eyebrow">PHASES 1–2 · FOUNDATION</p><h2>Made to feel like Freetopia.</h2><p>A considered visual language and a small set of reusable building blocks.</p></div><span className="section-heading__aside">01 / 02</span></div>
        <div className="showcase">
          <aside className="showcase__rail" aria-label="Foundation sections">
            <span className="showcase__rail-label">FOUNDATION</span>
            {[['primitives', 'UI primitives'], ['states', 'States & feedback'], ['tokens', 'Design tokens']].map(([value, label], index) => <button key={value} className={`rail-item ${activeTab === value ? 'is-active' : ''}`} aria-current={activeTab === value ? 'page' : undefined} onClick={() => setActiveTab(value)}><span className="rail-item__number">0{index + 1}</span>{label}</button>)}
            <div className="showcase__rail-bottom"><span className="status-dot"/> Foundations in progress</div>
          </aside>
          <div className="showcase__content">
            <div className="showcase__topline"><span>DESIGN SYSTEM</span><span>INTERACTIVE PREVIEW</span></div>
            <Tabs label="Foundation showcase" items={[{ value: 'primitives', label: 'Primitives' }, { value: 'states', label: 'States' }, { value: 'tokens', label: 'Tokens' }]} value={activeTab} onChange={setActiveTab}/>
            {activeTab === 'primitives' && <div className="showcase-grid">
              <section className="demo-card demo-card--wide"><h3>Actions</h3><p>Clear hierarchy. One expressive accent.</p><div className="demo-row"><Button variant="primary" onClick={() => notify('Action confirmed')}>Primary action <Icon name="arrow" size={16}/></Button><Button onClick={() => notify('Changes saved')}>Secondary</Button><Button variant="quiet" onClick={() => notify('More information selected')}>Quiet action</Button></div><div className="demo-row demo-row--spaced"><Badge tone="brand">Selected</Badge><Badge>Member</Badge><Badge tone="success">Ready</Badge><Dropdown label="Options"><button type="button" role="menuitem" onClick={() => setMenuNote('Settings selected')}>Settings</button><button type="button" role="menuitem" onClick={() => setMenuNote('Help selected')}>Help</button></Dropdown></div>{menuNote && <p className="demo-note" role="status">{menuNote}</p>}</section>
              <section className="demo-card"><h3>Identity</h3><p>Human, simple, recognizable.</p><div className="identity-row"><Avatar initials="FT" label="Illustrative initials placeholder" size="lg"/><Avatar initials="••" label="Illustrative avatar placeholder"/><span className="identity-caption">Identity, without the noise.</span></div></section>
              <section className="demo-card"><h3>Form fields</h3><p>Helpful labels and clear focus.</p><Input label="Your name" placeholder="How should we call you?" hint="You can change this later."/><div className="demo-row demo-row--spaced"><Button onClick={() => setModalOpen(true)}>Open dialog</Button><Button onClick={() => setDrawerOpen(true)}>Open side panel</Button><Tooltip label="Helpful context"><Icon name="spark" size={13}/></Tooltip></div></section>
            </div>}
            {activeTab === 'states' && <div className="showcase-grid showcase-grid--states"><section className="demo-card"><h3>Loading</h3><p>Quiet placeholders while content arrives.</p><div className="loading-preview"><Skeleton width="40%" height={13}/><Skeleton width="100%" height={12}/><Skeleton width="78%" height={12}/></div></section><section className="demo-card"><h3>Empty</h3><p>Helpful direction when a space has no content.</p><EmptyState title="A little room to begin">This space is ready for its first conversation.</EmptyState></section><section className="demo-card demo-card--wide"><h3>Error recovery</h3><p>Say what happened and offer a next step.</p>{error ? <ErrorState title="That didn’t load. Give it another try." onRetry={() => setError(false)}/> : <Button onClick={() => setError(true)}>Preview an error state</Button>}</section></div>}
            {activeTab === 'tokens' && <div className="tokens-panel"><section className="demo-card"><h3>Monochrome first</h3><p>Dark surfaces keep attention on people and ideas.</p><div className="swatches">{[['Canvas', 'var(--color-bg)'], ['Surface', 'var(--color-surface)'], ['Raised', 'var(--color-surface-raised)'], ['Border', 'var(--color-border)']].map(([name, color]) => <div key={name}><span className="swatch" style={{ background: color }}/><small>{name}</small></div>)}</div></section><section className="demo-card"><h3>Selective accent</h3><p>Blue to violet, reserved for chosen moments.</p><div className="gradient-swatch"/><p className="gradient-caption">#6D8CFF <span>→</span> #A978FF</p></section><section className="demo-card demo-card--wide"><h3>Type & rhythm</h3><p className="type-sample">A clear voice has room to breathe.</p><div className="spacing-bars"><i/><i/><i/><i/><i/></div><small className="muted">Consistent spacing · restrained radii · reduced motion support</small></section></div>}
          </div>
        </div>
      </section>

      <section className="closing wrap"><div><p className="eyebrow">A PLACE FOR PEOPLE AND IDEAS</p><h2>Come as you are.</h2><p>Freetopia is being built from its foundations upward.</p></div><span className="closing__mark"><img className="brand__image" src="/brand/freetopia-mark.png" alt=""/></span></section>
    </main>
    <footer className="footer wrap"><a className="brand brand--small" href="#top"><span className="brand__mark"><img className="brand__image" src="/brand/freetopia-mark.png" alt=""/></span><span>freetopia</span></a><span>Freedom to express. Space to connect.</span><span>© 2026 Freetopia</span></footer>
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="A space for conversation"><p className="modal__copy">This dialog shows the shared Freetopia modal pattern. Its content is only a design preview; account and conversation features will be connected in later phases.</p><Button variant="primary" onClick={() => setModalOpen(false)}>Got it</Button></Modal>
    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="A flexible side panel"><p className="modal__copy">Drawers keep supporting actions close by while leaving the current page in view.</p><Button variant="primary" onClick={() => setDrawerOpen(false)}>Close panel</Button></Drawer>
    <Toast message={toast} onDismiss={() => setToast('')}/>
  </>
}
