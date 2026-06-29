# Laika Customer Portal — Knowledge Base

> **Purpose:** Operator Angular app reference.

## Executive summary

| Item | Value |
|------|--------|
| **Role** | Operator inbox, handoff, human reply |
| **Stack** | Angular 19, Chart.js |
| **Deploy** | GitHub Pages |
| **APIs** | Main proxy (auth, sendHumanResponse), conversations API (inbox), WebSocket |

## WebSocket flow

`src/app/services/websocket/weksocket.service.ts`:

1. Connect with JWT in query string
2. `onopen` → `send({ action: 'register' })`
3. `connect_ack` sets connection context (operators use fan-out, not `connection_id` in sendMessage)
4. Subscribe to `events$` for `new_message`, `handoff`

## Routes

| Path | Guard | Purpose |
|------|-------|---------|
| `/login` | guest | Operator JWT |
| `/chat` | auth | Inbox + replies |
| `/cockpit`, `/charts` | auth | Mock KPIs |

## Environments

`src/environments/environment.ts` — `apiLoginUrl`, `apiConversationsUrl`, `apiProxyUrl`. WebSocket URL may be hardcoded in websocket service (align with infra `websocket_url` for prod).

## Change recipes

| If you change… | Also update… |
|----------------|--------------|
| WS event types | `model/websocket`, notification KB payloads |
| Inbox API shapes | conversations API, `laika-data-models` Chat |
| Human reply route | API proxy `sendHumanResponse`, brain handler |

## File index

| File | Why |
|------|-----|
| `src/app/pages/chat/` | Thread UI |
| `src/app/services/chatService/` | Conversations API client |
| `src/app/core/auth/` | JWT interceptor |
