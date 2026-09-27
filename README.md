# Freetopia

Freetopia is a social world built around freedom, expression, connection, discovery, and people. This repository now contains a cross-platform iOS and Android app built with Expo and React Native.

## Run the app

Requirements: Node.js LTS and npm. Install dependencies, then start Expo:

```sh
npm install
npm start
```

Use Expo Go or a configured iOS/Android simulator/device to open the app. `npm run ios` and `npm run android` launch on an available local simulator. Expo Router handles native routes and deep links.

## Project map

- `app/` — native screens and Expo Router layout.
- `public/brand/freetopia-mark.png` — supplied Freetopia brand mark used by the app and launch screen.
- `app.json` — app identity, native identifiers, icons, and router plugin configuration.
- `docs/implementation-audit.md` — Phase 0 audit, implementation map, checks, and remaining dependencies.

## Current product state

The app has a branded, accessible welcome screen and a truthful empty state. It does not display fabricated profiles, posts, communities, messages, or notifications. Accounts, social data, uploads, and messaging require a real backend, database, storage, and server-side authorization design before those screens can behave as product features.

## Checks

```sh
npm run lint
npm run check:android
npm run check:ios
```
