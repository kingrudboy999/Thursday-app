# Thursday — A quieter place to share

**Thursday** is a calm, intentional social space designed for the people you actually chose — featuring a photography-forward feed, edge-to-edge uncropped stories, full-screen vertical Reels, Circles, real-life Gatherings, and full-screen direct messaging with swipe-to-reply.

This repository contains the **Web PWA** (React 19 + TypeScript + Vite + Tailwind CSS v4 + Phosphor Icons), the **Railway PostgreSQL + SSE Backend** (`server/`, Node 22 + `pg`), and the **Native Mobile Client** (`mobile/`, built with React Native 0.76 + Expo SDK 52 and configured for ~24 MB slim per-ABI Android APKs).

---

## Project Structure

```text
Thursday-app/
├── index.html                      # Web entry HTML & PWA metadata
├── package.json                    # Web dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite + Tailwind v4 + optional single-file build
├── public/
│   ├── favicon.svg                 # Custom Thursday squircle brand mark
│   ├── favicon-32.png              # 32x32 PNG favicon
│   ├── apple-touch-icon.png        # iOS home-screen icon
│   ├── thursday-icon-192.png       # PWA 192x192 icon
│   ├── thursday-icon-512.png       # PWA 512x512 icon
│   ├── manifest.webmanifest        # Installable PWA manifest
│   └── sw.js                       # Offline cache service worker
├── src/
│   ├── main.tsx                    # React root & service worker registration
│   ├── App.tsx                     # Root state, routing, shortcuts & water-ripple feedback
│   ├── index.css                   # Warm daylight & late evening theme tokens + motion
│   ├── lib/
│   │   ├── cn.ts                   # Classname merge helper
│   │   ├── icons.tsx               # Unified Phosphor icon exports
│   │   ├── types.ts                # Core domain TypeScript interfaces
│   │   ├── storage.ts              # Persistent localStorage state & JSON export/reset
│   │   ├── share.ts                # Native Web Share API with clipboard fallback
│   │   ├── social.ts               # Seed people, posts, stories, DMs, reels & topics
│   │   ├── spaces.ts               # Circles, gatherings & community feed modes
│   │   ├── features.ts             # Highlights, drafts, audio library, prompts & guides
│   │   └── settings.ts             # Default theme, notification & privacy preferences
│   ├── components/
│   │   ├── brand.tsx               # BrandIcon, ColdStartSplash & BrandLockup
│   │   ├── social.tsx              # PostCard, StoriesStrip, Avatar, Modal & Toast
│   │   ├── features.tsx            # StoryComposer, Drafts, AudioLibrary, Prompts & Guides
│   │   ├── install.tsx             # Install PWA & native download card
│   │   └── social-shell.tsx        # Sidebar, TopBar, 5-slot MobileDock, Drawer & StoryViewer
│   └── views/
│       ├── Feed.tsx                # Home feed (For you, Following, Photos, Circles)
│       ├── Explore.tsx             # Discovery masonry grid, topic search & Saved view
│       ├── Reels.tsx               # Full-screen vertical Reels portal + local video upload
│       ├── Inbox.tsx               # Full-screen DM threads, swipe-to-reply & requests
│       ├── Connect.tsx             # Notifications & weekly circle recap
│       ├── Spaces.tsx              # Circles communities & Gatherings RSVPs
│       ├── Profile.tsx             # Profile header, highlights, pinned posts & tabs
│       └── SettingsView.tsx        # Theme, quiet hours, privacy, install & workspace export
├── server/                         # Railway Node 22 + PostgreSQL REST & SSE backend
│   ├── Dockerfile                  # Production multi-stage Alpine container
│   ├── package.json                # Backend scripts & pg driver
│   └── src/
│       ├── index.ts                # HTTP + SSE stream server (/api/*)
│       ├── db.ts                   # PostgreSQL persistence + local fallback
│       └── seed.ts                 # Canonical initial Thursday seed data
├── mobile/                         # Complete Expo / React Native iOS & Android app
│   ├── App.tsx                     # Native shell, 5-slot dock, drawer & modals
│   ├── app.json                    # Expo config + R8 / shrinkResources / ABI split plugin
│   ├── eas.json                    # EAS APK preview & Play Store AAB profiles
│   ├── plugins/withSmallApk.js     # Gradle ABI split & resource shrinking plugin (~24 MB APK)
│   ├── scripts/build-small-apk.sh  # One-command APK build helper
│   └── src/                        # Native theme, data, AsyncStorage & screens
└── .github/workflows/
    └── android-apk.yml             # Automated GitHub Actions Slim Android APK builder
```

---

## Running Locally

### 1. Web App

```bash
npm install
npm run dev
```

Production build:

```bash
npm run typecheck
npm run build
```

### 2. Mobile App (React Native / Expo)

```bash
cd mobile
npm install
npx expo start
```

To build the slim ~24 MB Android APK via EAS or GitHub Actions, see [`mobile/README.md`](./mobile/README.md).
