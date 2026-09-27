# Freetopia

Freetopia is a social world built around freedom, expression, connection, discovery, and people. This repository now contains a cross-platform iOS and Android app built with Expo and React Native.

## Run the app

Requirements: Node.js LTS and npm. Install dependencies, configure Supabase, then start Expo:

```sh
npm install
copy .env.example .env
npm start
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env`. The publishable key is intended for client apps; database access is protected by Supabase Auth and Row Level Security. Do not put service-role keys in the mobile app.

Use Expo Go or a configured iOS/Android simulator/device to open the app. `npm run ios` and `npm run android` launch on an available local simulator. Expo Router handles native routes and deep links.

## Project map

- `app/` — native screens and Expo Router layout.
- `public/brand/freetopia-mark.png` — supplied Freetopia brand mark used by the app and launch screen.
- `app.json` — app identity, native identifiers, icons, and router plugin configuration.
- `docs/implementation-audit.md` — Phase 0 audit, implementation map, checks, and remaining dependencies.

## Current product state

The app now has a branded authentication flow backed by Supabase Auth, session-protected Expo Router navigation, real profile loading/editing, real post creation, and a Supabase-backed feed. It still keeps communities, messaging, notifications, media uploads, reactions, and comments as truthful UI states until their corresponding data flows are wired.

## Checks

```sh
npm run lint
npm run check:android
npm run check:ios
```
