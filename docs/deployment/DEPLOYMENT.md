# PEAAI V0.1 Staging Deployment Guide

> Deployment guide for PEAAI V0.1 to Vercel (Frontend) and Render (Backend)

---

## Overview

This guide covers the deployment of PEAAI V0.1 to a staging environment:
- **Frontend**: Vercel (React application)
- **Backend**: Render (FastAPI application)
- **Database**: PostgreSQL (external service required)
- **Cache**: Redis (external service required)
- **Storage**: Local filesystem (ephemeral on Render - see limitations)

---

## Architecture Summary

```
┌─────────────────┐         ┌─────────────────┐
│   Vercel        │         │   Render        │
│   (Frontend)    │────────▶│   (Backend)     │
│   React App     │  HTTPS  │   FastAPI       │
└─────────────────┘         └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────▼─────┐   ┌──────▼──────┐  ┌─────▼─────┐
              │ PostgreSQL│   │   Redis     │  │  Storage  │
              │ (external)│   │  (external) │  │ (ephemeral)│
              └───────────┘   └─────────────┘  └───────────┘
```

---

## Prerequisites

1. **Vercel Account** with appropriate permissions
2. **Render Account** with appropriate permissions
3. **PostgreSQL Database** (e.g., Render PostgreSQL, Supabase, Neon)
4. **Redis Instance** (e.g., Render Redis, Redis Cloud, Upstash)

---

## Backend Deployment (Render)

### 1. Create Render Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `peaai-backend` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Runtime** | `Python 3.11` |
| **Build Command** | `pip install -r backend/requirements.txt` |
| **Start Command** | `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT` |

### 2. Environment Variables

Configure the following environment variables in Render:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `APP_NAME` | Application name | `PEAAI API` |
| `APP_VERSION` | Application version | `1.0.0` |
| `DEBUG` | Debug mode | `false` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/peaai` |
| `SECRET_KEY` | JWT secret key (**REQUIRED**) | Generate a secure random string |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `PASSWORD_RESET_TOKEN_EXPIRE_HOURS` | Password reset TTL | `24` |
| `RATE_LIMIT_PER_MINUTE` | API rate limit | `60` |
| `RATE_LIMIT_PER_HOUR` | Hourly rate limit | `1000` |
| `ALLOWED_ORIGINS` | CORS origins | `["https://your-app.vercel.app"]` |
| `REDIS_URL` | Redis connection string | `redis://user:pass@host:6379/0` |
| `CDN_BASE_URL` | CDN base URL (optional) | Leave empty for local storage |
| `STORAGE_PATH` | Local storage path | `./storage` |

### 3. Health Check

The backend exposes health endpoints at:
- `/` - Root endpoint with basic info
- `/health` - Detailed health check (no secrets exposed)

Verify health check works: `https://your-backend.onrender.com/health`

### 4. Database Migrations

Run migrations after deployment:

```bash
# SSH into Render container or use cron
alembic upgrade head
```

Or add a migration script to the start command:
```bash
alembic upgrade head && uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT
```

---

## Frontend Deployment (Vercel)

> The frontend production build pipeline is established by FE-010 (T-FE-010-001).
> Vercel builds the frontend from the **repository root** using Vite.

### Architecture

```
Browser → index.html → src/main.tsx → src/App.tsx → existing PEAAI modules
                                                              ↓
                                          VITE_API_BASE_URL (host only)
                                                              ↓
                                          https://peaai.onrender.com/api/v1
                                          (the API client appends /api/v1)
```

The root application shell (`index.html`, `src/main.tsx`, `src/App.tsx`,
`vite.config.ts`) composes the existing PEAAI modules — UI-009's provider
hierarchy (`ErrorBoundary` > `ThemeProvider` > `ToastProvider` >
`ModuleProvider`) and the existing pages (Landing/Auth/Home). It reuses
UI-009's `src/app/` shell content; it does not duplicate or rewrite existing UI.

### 1. Create Vercel Project

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Other` |
| **Root Directory** | `.` (repository root) |
| **Build Command** | `npm run build` (runs `vite build`; configured in `vercel.json`) |
| **Output Directory** | `dist` (configured in `vercel.json`) |
| **Install Command** | `npm install` (configured in `vercel.json`) |

> The `vercel.json` at the repository root sets `buildCommand`, `outputDirectory`,
> and `installCommand`, so the Vercel dashboard defaults can also be used.

### 2. Environment Variables

Configure in Vercel (only public, frontend-safe values):

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `https://peaai.onrender.com` | **Host only.** Do NOT include `/api/v1` — the API client (`src/services/api-config.ts`) appends `/api/v1` structurally. |

> The previous `VITE_API_URL` env var (with `/api/v1` suffix) is **deprecated**.
> `vercel.json` now references `VITE_API_BASE_URL`. The Vercel secret should be
> named `vite-api-base-url` (referenced as `@vite-api-base-url` in `vercel.json`).
>
> Note: `src/components/auth/api.ts` (UI-003) still reads `VITE_API_URL` locally.
> This inconsistency is a UI-003 defect reported to the CA (category B) and is
> not fixed by FE-010. The canonical API client is `src/services/api-config.ts`,
> which uses `VITE_API_BASE_URL`.

### 3. Vercel Configuration (`vercel.json`)

The `vercel.json` at the repository root declares the build command, output
directory, and the `VITE_API_BASE_URL` env reference. The previous broken
`/api/:path*` rewrite to `your-backend.onrender.com` was **removed** — the
frontend talks to the backend directly over HTTPS via `VITE_API_BASE_URL`
(the client appends `/api/v1`). Vercel rewrites are not used for API proxying.

### 4. Deploy

1. Click **Deploy**
2. Vercel runs `npm install` → `npm run build` (`vite build`) → serves `dist/`
3. Access at `https://your-app.vercel.app`

### 5. Local Testing (Vercel-equivalent)

```bash
npm install
VITE_API_BASE_URL=https://peaai.onrender.com npm run build
```

The build produces `dist/index.html` + `dist/assets/*.js` + `dist/assets/*.css`.
A separate type-check is available via `npm run typecheck` (`tsc --noEmit`,
scoped to the application entry surface) — it is **not** part of `npm run build`
so genuine module-level type defects (owned by other employees) do not block
the production build.

---

## Configuration Checklist

### Backend (Render)

- [ ] PostgreSQL database created and connection string configured
- [ ] Redis instance created and connection string configured
- [ ] `SECRET_KEY` changed from default (generate secure random string)
- [ ] `ALLOWED_ORIGINS` set to Vercel frontend URL
- [ ] Health check verified at `/health`
- [ ] Database migrations run

### Frontend (Vercel)

- [ ] `VITE_API_BASE_URL` set to Render backend host (e.g. `https://peaai.onrender.com`, **no** `/api/v1`)
- [ ] Vercel secret `vite-api-base-url` created and referenced in `vercel.json`
- [ ] Build successful (`npm run build` → `vite build` → `dist/`)
- [ ] Application loads without errors

---

## Required Environment Variables Summary

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | localhost | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | (insecure) | JWT signing key |
| `REDIS_URL` | ❌ | localhost | Redis connection (falls back to in-memory) |
| `ALLOWED_ORIGINS` | ❌ | `*` | CORS allowed origins |
| `DEBUG` | ❌ | `false` | Debug mode |
| `CDN_BASE_URL` | ❌ | empty | CDN base URL |
| `STORAGE_PATH` | ❌ | `./storage` | Local storage path |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | ✅ | `http://localhost:8000` | Backend API host only (the client appends `/api/v1`). Do NOT include `/api/v1`. |

---

## Known Limitations

### 1. Ephemeral Filesystem (Render)

Render's free/hobby tier uses ephemeral disks. Files uploaded to the backend will be lost on:
- Instance restarts
- Deployments
- After ~30 days of inactivity

**Mitigation options:**
1. Use external object storage (S3, Cloudflare R2) for file uploads
2. Use Render's persistent disk (paid tier)
3. Accept temporary storage limitation for V0.1 staging

### 2. Session Storage

The backend defaults to `InMemorySessionStore` if Redis is not configured. For staging:
- **Production**: Use Redis (`REDIS_URL`)
- **Development**: In-memory is acceptable

### 3. WebSocket Client

No frontend WebSocket client implementation exists in V0.1. The backend exposes:
- `/ws/` - General WebSocket endpoint
- `/ws/chat/{room_id}` - Chat room WebSocket

**WebSocket Routing**: Vercel rewrites do NOT support WebSocket connections. For staging WebSocket:
1. Configure `VITE_WS_URL=wss://your-backend.onrender.com/ws` in frontend environment
2. Frontend connects directly to Render WebSocket endpoint (not through Vercel)

Frontend WebSocket integration requires additional development.

---

## Testing the Deployment

### 1. Health Check

```bash
curl https://your-backend.onrender.com/health
```

Expected response:
```json
{"status": "healthy", "version": "1.0.0"}
```

### 2. API Info

```bash
curl https://your-backend.onrender.com/api/v1
```

### 3. Frontend → Backend Integration

1. Open the Vercel frontend URL
2. Check browser console for API errors
3. Verify CORS allows the frontend origin
4. Test authentication flow

### 4. Local Testing

To test frontend with a local backend:

```bash
# Terminal 1: Start backend
cd backend
uvicorn backend.api.main:app --reload

# Terminal 2: Start frontend (development)
npm install
npm run dev   # Vite dev server from the repository root
```

Set `VITE_API_BASE_URL=http://localhost:8000` for local development (host only;
the client appends `/api/v1`).

---

## Troubleshooting

### CORS Errors

If the frontend cannot reach the backend:
1. Verify `ALLOWED_ORIGINS` includes the Vercel URL
2. Check for typos in the URL
3. Ensure the backend is running and accessible

### Database Connection Failed

1. Verify `DATABASE_URL` is correct
2. Check PostgreSQL server is accessible
3. Ensure database exists
4. Check connection pool settings

### Redis Connection Failed

1. Verify `REDIS_URL` is correct
2. Check Redis server is accessible
3. Session storage falls back to in-memory (acceptable for staging)

### Build Failures

#### Frontend
- Check Node.js version compatibility
- Verify all dependencies install correctly
- Review Vercel build logs

#### Backend
- Check Python version (3.11)
- Verify requirements.txt installs correctly
- Review Render build logs

---

## Security Notes

1. **Never commit secrets** - Use environment variables only
2. **Use strong SECRET_KEY** - Generate cryptographically secure keys
3. **Restrict ALLOWED_ORIGINS** - Don't use `*` in production
4. **Enable HTTPS** - Both Vercel and Render provide HTTPS automatically
5. **Validate database credentials** - Use least-privilege access

---

## Next Steps

After successful staging deployment:

1. **User Testing** - Have users test the application
2. **Performance Monitoring** - Add monitoring/logging
3. **Production Planning** - Plan production deployment architecture
4. **Storage Upgrade** - Consider external object storage for files
5. **WebSocket Client** - Implement frontend WebSocket support

---

## Contact

For deployment issues, review:
- [PEAAI README](../README.md)
- [Architecture](../architecture/ARCHITECTURE.md)
- [Interfaces](../interfaces/INTERFACES.md)
- Backend API docs at `/docs` endpoint
