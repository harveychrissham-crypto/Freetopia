import { useEffect, useRef, useState } from 'react'

export function Icon({ name, size = 20, ...props }) {
  const paths = {
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    chevron: <path d="m7 10 5 5 5-5"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name]}</svg>
}

export function Button({ variant = 'secondary', size = 'md', className = '', children, type = 'button', ...props }) {
  return <button type={type} className={`button button--${variant} button--${size} ${className}`} {...props}>{children}</button>
}

export function Avatar({ label, initials, size = 'md' }) {
  return <span className={`avatar avatar--${size}`} aria-label={label} role="img">{initials || label?.slice(0, 1)?.toUpperCase()}</span>
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Input({ label, hint, id, ...props }) {
  const inputId = id || `input-${props.name || 'field'}`
  return <div className="field"><label className="field__label" htmlFor={inputId}>{label}</label><input className="input" id={inputId} aria-describedby={hint ? `${inputId}-hint` : undefined} {...props} />{hint && <span className="field__hint" id={`${inputId}-hint`}>{hint}</span>}</div>
}

export function Tabs({ items, value, onChange, label }) {
  return <div className="tabs" role="tablist" aria-label={label}>{items.map(item => <button key={item.value} className={`tabs__tab ${value === item.value ? 'is-active' : ''}`} role="tab" aria-selected={value === item.value} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>
}

export function Dropdown({ label = 'More options', children }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  useEffect(() => {
    const onPointer = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    const onKey = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [])
  return <div className="dropdown" ref={root}><Button aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>{label}<Icon name="chevron" size={16}/></Button>{open && <div className="dropdown__menu" role="menu">{children}</div>}</div>
}

export function Modal({ open, onClose, title, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && dialog && !dialog.open) dialog.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onClose={onClose} onClick={event => { if (event.target === ref.current) onClose() }}><div className="modal__header"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>
}

export function Drawer({ open, onClose, title, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && dialog && !dialog.open) dialog.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return <dialog ref={ref} className="drawer" aria-labelledby="drawer-title" onClose={onClose} onClick={event => { if (event.target === ref.current) onClose() }}><div className="modal__header"><h2 id="drawer-title">{title}</h2><button type="button" className="icon-button" aria-label="Close panel" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>
}

export function Tooltip({ label, children }) {
  return <span className="tooltip" tabIndex="0" aria-label={label}><span className="tooltip__content">{children}</span><span role="tooltip" className="tooltip__bubble">{label}</span></span>
}

export function Skeleton({ width = '100%', height = 16 }) {
  return <span className="skeleton" aria-hidden="true" style={{ width, height }} />
}

export function EmptyState({ title, children }) {
  return <section className="state-card"><span className="state-card__icon"><Icon name="spark" size={22}/></span><h3>{title}</h3><p>{children}</p></section>
}

export function ErrorState({ title, onRetry }) {
  return <section className="state-card state-card--error" role="alert"><h3>{title}</h3><Button onClick={onRetry}>Try again</Button></section>
}

export function Toast({ message, onDismiss }) {
  if (!message) return null
  return <div className="toast" role="status"><Icon name="check" size={17}/>{message}<button className="icon-button" aria-label="Dismiss notification" onClick={onDismiss}><Icon name="close" size={17}/></button></div>
}
