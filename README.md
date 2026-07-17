# ChatApp — Frontend

Modern realtime chat client built with **Angular (standalone components)** and **Socket.IO**.
Works against the companion backend in `Chat App Backend/Chat-app-node-socket.io`.

## Features

- Phone-based sign in / registration with avatar picker
- Realtime 1-to-1 messaging with optimistic sends and retry on failure
- Message status ticks: sending → sent → delivered → read (blue)
- Presence (online / last seen) and live typing indicators
- Unread badges, last-message previews, conversation search
- Photo messages with client-side compression, preview and lightbox
- Emoji picker, date separators, auto-scroll, message grouping
- Dark / light theme (persisted, respects `prefers-color-scheme`)
- Loading skeletons, empty states, toast notifications
- Fully responsive — dedicated mobile layout with slide-in conversation

## Quick start

```bash
# 1. start the backend first (see its README) on http://localhost:3000
# 2. then:
npm install
npm start          # http://localhost:4200
```

Production API URL lives in `src/environments/environment.prod.ts`;
dev URL in `src/environments/environment.ts`.

## Architecture

```
src/app/
  app.routes.ts            lazy routes: /login (guest), /chat (auth)
  core/
    models/                typed API + socket contracts
    services/              api (REST), auth (JWT session), socket (leak-free
                           event streams), chat-store (single state facade),
                           theme, toast
    guards/                authGuard, guestGuard (functional)
    interceptors/          Bearer token + global 401 handling
    utils/                 generated SVG avatars, emoji data
  features/
    auth/                  login / register page
    chat/                  chat shell: sidebar, conversation, message bubble,
                           emoji picker, profile drawer, image lightbox
  shared/                  avatar, toast container, timeAgo pipe
```

State management: all chat state flows through `ChatStoreService`
(BehaviorSubjects + async pipe, OnPush components). Components hold no
copies of server state.

## Build & deploy

```bash
npm run build      # production build into dist/
firebase deploy    # hosting config in firebase.json
```
