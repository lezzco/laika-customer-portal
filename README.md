# Laika Customer Portal

Angular operator web application ("Chatbot Cockpit") for Hairesia V1: monitor WhatsApp conversations, receive real-time notifications, handle handoff, and reply as a human operator.

Cross-repo docs: [laika-info/v1-use-cases-and-workflows.md](../laika-info/v1-use-cases-and-workflows.md) (UC-2, UC-3, UC-7).

## Version and stack

| | |
|---|---|
| Framework | Angular **19** |
| Node | **20** (CI) |
| Key deps | Chart.js, ng2-charts, RxJS |

## Repository structure

```
src/app/
├── core/auth/           # JWT login, guards, HTTP interceptor
├── pages/
│   ├── login/           # Operator authentication
│   ├── chat/            # Inbox + thread UI (real APIs)
│   ├── cockpit/         # Dashboard shell (KPI mock data)
│   └── chart-kpi/       # Charts (mock data)
├── services/
│   ├── chatService/     # Conversations API client
│   └── websocket/       # Real-time notifications
├── model/               # Chat, WebSocket event types
└── app.routes.ts

src/environments/        # API Gateway base URLs
```

## Routes

| Path | Guard | Purpose |
|------|-------|---------|
| `/login` | guest | Operator login (main API JWT) |
| `/chat` | auth | Conversation inbox and replies |
| `/cockpit` | auth | Dashboard (mock KPIs) |
| `/charts` | auth | Chart KPIs (mock data) |
| `/**` | — | Redirect to `/login` |

## Backend dependencies

| Service | URL source | Used for |
|---------|------------|----------|
| Main API (`apiProxyUrl`) | `environment.ts` | Login, `POST /chat/sendHumanResponse/` |
| Conversations API (`apiConversationsUrl`) | `environment.ts` | Inbox, messages, read status |
| WebSocket API | hardcoded in `websocket.service.ts` | `new_message`, `handoff` events |

Configure API Gateway IDs in [src/environments/environment.ts](src/environments/environment.ts). WebSocket URL should use stage **`v1`** (match [laika-infra](../laika-infra/) `websocket_url` output).

Example dev values:

```typescript
export const environment = {
  production: false,
  apiLoginUrl: 'https://{main-api-id}.execute-api.eu-central-1.amazonaws.com/v1/',
  apiConversationsUrl: 'https://{chat-api-id}.execute-api.eu-central-1.amazonaws.com/v1/',
  apiProxyUrl: 'https://{main-api-id}.execute-api.eu-central-1.amazonaws.com/v1/',
};
```

## Features

| Feature | Status |
|---------|--------|
| JWT login | Implemented |
| Chat inbox + messages | Implemented (Conversations API) |
| WebSocket `new_message` | Implemented |
| Handoff WebSocket handling | Implemented |
| Operator human reply | Implemented |
| Read status | Implemented |
| Cockpit / charts KPIs | Mock data only |

## Local development

```bash
npm ci
ng serve
```

Open `http://localhost:4200/`. Default route redirects to login.

## Deploy

GitHub Actions deploys to **GitHub Pages** on push to `main` (`.github/workflows/deploy-pages.yml`).

Base href: `/laika-customer-portal/`

## Related repositories

- [laika-api-proxy-codebase](../laika-api-proxy-codebase/) — auth and human reply
- [laika-conversations-api-codebase](../laika-conversations-api-codebase/) — inbox read API
- [laika-notification-module-codebase](../laika-notification-module-codebase/) — WebSocket notifier
- [laika-info](../laika-info/) — platform documentation
