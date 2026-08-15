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

### 1. Create Vercel Project

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Other` |
| **Root Directory** | `.` (root) |
| **Build Command** | `cd src/app && npm install && npm run build` |
| **Output Directory** | `src/app/dist` |
| **Install Command** | `npm install` |

### 2. Environment Variables

Configure in Vercel:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com` |

**Note**: The frontend expects the backend URL without `/api/v1` suffix. The API calls append `/api/v1` automatically.

### 3. Vercel Configuration

The `vercel.json` file at the repository root configures:
- Build command
- Output directory
- Rewrite rules for API and WebSocket proxying

Update `vercel.json` with your actual Render backend URL before deployment:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-actual-backend.onrender.com/api/:path*"
    }
  ]
}
```

### 4. Deploy

1. Click **Deploy**
2. Vercel will build and deploy the application
3. Access at `https://your-app.vercel.app`

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

- [ ] `VITE_API_URL` set to Render backend URL
- [ ] Build successful
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
| `VITE_API_URL` | ✅ | `/api/v1` | Backend API base URL |

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
cd src/app
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` for local development.

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
