# Corridor Production Deployment Guide 🚀

This comprehensive guide covers the deployment of every component of the Corridor platform. Follow these steps to set up a professional, scalable, and secure production environment.

---

## 🏗 Component Architecture

| Component | Responsibility | Technology | Hosting (Recommended) |
| :--- | :--- | :--- | :--- |
| **Backend** | Core Business Logic & API | Go (Monolith) | Render / Koyeb / K8s |
| **Frontend** | User Interface | React + Vite | Vercel |
| **Database** | Persistent Storage | PostgreSQL | Supabase / Neon |
| **Cache** | OTP & Rate Limiting | Redis | Upstash |
| **CI/CD** | Automation | GitHub Actions | GitHub |

---

## 🗄 1. Infrastructure (Database & Cache)

Before deploying any code, set up your stateful services.

### A. PostgreSQL (Supabase)
1. **Create Project**: Sign up at [Supabase](https://supabase.com) and create a new project.
2. **Schema Init**: Go to the **SQL Editor**, create a new query, and paste the contents of `backend/init.sql`. Run it to build your tables.
3. **Connection String**: 
   - Navigate to **Project Settings > Database**.
   - Copy the **Connection String** (use the "Transaction" mode/PgBouncer URL for better performance: `port 6543`).
   - Add this to your environment variables as `DATABASE_URL`.

### B. Redis (Upstash)
1. **Create Database**: Sign up at [Upstash](https://upstash.com) and create a "Serverless Redis" database.
2. **Setup**: Copy the **Redis URL** (it should start with `rediss://` for TLS).
3. **Usage**: The backend uses this for non-persistent data like OTP codes and rate-limit counters.

---

## ⚙️ 2. Backend (Go API)

The backend is containerized. Choose one of the two paths below:

### Option A: PaaS (Render / Koyeb) - *Recommended for Startups*
1. **Connect**: Link your GitHub repo to [Render](https://render.com) or [Koyeb](https://koyeb.com).
2. **Define Service**: Create a new "Web Service".
3. **Docker Settings**:
   - Dockerfile: `backend/Dockerfile`
   - Docker Context: `backend/`
   - Or deploy via `render.yaml` in the repo root.
4. **Environment Variables**: Set at least:
   - `PORT=10000` (Render web services)
   - `DATABASE_URL` (Supabase pooler URL, port `6543`)
   - `REDIS_URL`
   - `JWT_SECRET`
   - `ALLOWED_ORIGINS`
   - `PUBLIC_APP_URL`
   - `PAY_BASE_URL`
5. **Auto-Deploy**: Every push to `main` will trigger a new build and zero-downtime deployment.

### Option B: Kubernetes (K8s) - *Professional Grade*
1. **Registry**: Images are built and pushed to `ghcr.io` via GitHub Actions.
2. **Secrets**: Create a K8s secret for your sensitive data:
   ```bash
   kubectl create secret generic corridor-secrets --from-literal=DATABASE_URL="..." --from-literal=JWT_SECRET="..."
   ```
3. **Apply Manifests**:
   ```bash
   kubectl apply -f k8s/config.yaml
   kubectl apply -f k8s/api-deployment.yaml
   kubectl apply -f k8s/api-service.yaml
   ```

---

## 🎨 3. Frontend (React/Vite)

The frontend is served as a static SPA.

### Deployment (Vercel)
1. **Import**: Import your repository into [Vercel](https://vercel.com).
2. **Framework Preset**: Vercel will detect "Vite" automatically.
3. **Root Directory**: `frontend/`
4. **Build Settings**: 
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variable**: 
   - Add `VITE_API_URL`: The URL of your deployed Backend API.

---

## 🤖 4. CI/CD & Security

All configuration and secrets management.

### Platform Secrets
Set deployment secrets in your hosting platforms:
- **Render (backend)**: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `PUBLIC_APP_URL`, `PAY_BASE_URL`
- **Vercel (frontend)**: `VITE_API_URL`

---

## 🛠 5. Developer Experience (MCP)

To enable AI agents and developer tools to interact with your production database cleanly, add the **Supabase MCP server** to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=zcaooeylcnptxiqygtqv"
    }
  }
}
```

---

## 🔍 Monitoring & Health

- **API Health Check**: `GET /api/auth/check`
- **Frontend Status**: Monitor via Vercel Dashboard logs.
- **Backend Logs**: Use `kubectl logs` or the Render/Koyeb dashboard log stream.

**Stay fast. Stay efficient. Built with ❤️ by the Corridor Team.**
