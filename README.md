# Freetopia

Freetopia is a social world built around freedom, expression, connection, discovery, and people.

## Current state

This repository began as a README-only project. The current implementation establishes the brand foundation and accessible, reusable UI primitives. Authentication, social data, media, and messaging are intentionally not simulated; those phases require a real backend and authorization model.

## Run locally

Requirements: Node.js 20 or newer.

```sh
npm install
npm run dev
```

Use `npm run build` for the production build and `npm run lint` for static checks.

## Project map

- `src/styles/tokens.css` — color, type, spacing, radius, motion, and breakpoint foundations.
- `public/brand/freetopia-mark.png` — transparent 512 px app-optimized version of the supplied Freetopia logo and icon.
- `src/components/ui/` — reusable accessible design primitives.
- `src/App.jsx` — responsive foundation and component showcase.
- `docs/implementation-audit.md` — Phase 0 audit and phase status.

## Product integrity

Visible controls in this foundation either demonstrate a local UI state or navigate to a real section. It does not claim to provide live accounts, posts, search, communities, notifications, or messaging.
