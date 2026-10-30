# Bharat HealthNet AI

An interactive, presentation-ready command-center prototype for a synthetic national healthcare operations network.

## Run locally

```bash
npm install
npm run dev
```

The prototype is intentionally dependency-light: the Vite dev server serves a responsive frontend with deterministic demo data and a server-side Groq AI proxy. The API key is read from `.env.local` and is never exposed to browser code.

## What works in the prototype

- Responsive command-center shell with dark navigation and presentation mode.
- Synthetic India network map with selectable regions and live operational context.
- KPI cards, demand chart, operational feed, and alert center.
- Seeded local demo registers: 30 hospitals, 5 blood banks, 30 medicines, 50 ambulances, 100 equipment records, and 4 integration feeds.
- Hospital capacity table with search, status filter, sort, clickable hospital detail modal, and add-facility form.
- Beds, blood, medicines, ambulances, equipment, AI, resource optimization, emergency, interoperability, audit, and system-health views.
- Simulator workflow: choose patient surge, blood shortage, medicine shortage, equipment overheating, or emergency; then update forecasts, alerts, and the command feed.
- Resource recommendation workflow: review and accept an 8-bed allocation recommendation.
- Network search modal, notification center, dismissible synthetic-data notice, and browser-local session persistence.
- CSV export for the synthetic hospital capacity register.
- Operations-only assistant with safe refusal language for diagnosis and treatment requests.
- Groq-powered operations assistant available from the dashboard and the AI Intelligence module, with a local fallback if the AI service is unavailable.

## Demo login

Use the login screen to test role-based navigation. For a passwordless demo entry, click **Enter workspace** on any role card. The password form remains available for testing credential validation:

- `admin@bharathealthnet.ai` / `Admin@123` — Super Admin
- `authority@bharathealthnet.ai` / `Authority@123` — Health Authority
- `hospital@bharathealthnet.ai` / `Hospital@123` — Hospital Administrator
- `analyst@bharathealthnet.ai` / `Analyst@123` — Healthcare Analyst

The browser stores only a local demo session. This is not production authentication; a real deployment should move login, JWT issuance, password hashing, and authorization to the backend.

## Important limitations

This is a UI and workflow demonstration, not a clinical system, government deployment, or validated AI product. All records are synthetic. The connected AI is limited to operational planning and must not be used for diagnosis, prescribing, treatment, or processing real patient information.

## Suggested full-stack extension

The interface is structured so the local state can be replaced by REST/WebSocket services, with JWT + RBAC, Prisma/PostgreSQL persistence, a Socket.IO simulator, and a separate deterministic FastAPI prediction service as described in the source brief. The current local `/api/ai` proxy can be moved to a serverless function for deployment.
