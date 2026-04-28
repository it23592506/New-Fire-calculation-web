# Deployment Guide

## Frontend (Vercel)

1. Import the `frontend` folder as a Vercel project.
2. Framework preset: Vite.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable:
   - `VITE_API_URL=https://<your-render-backend>/api`

`frontend/vercel.json` already rewrites all routes to `index.html` for SPA routing.

## Backend (Render)

1. Create a Render Web Service from this repo.
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm run start`
5. Add environment variables:
   - `JWT_SECRET` (required)
   - `CORS_ORIGIN=https://<your-vercel-frontend>` (required)
   - `SQLITE_DB_PATH=/opt/render/project/src/data/fire-safety.db` (recommended)
   - `ADMIN_EMAIL=admin@example.com` (optional)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (for email report)

You can use `render.yaml` at repo root for Blueprint-based deployment.
