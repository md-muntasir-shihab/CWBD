# DEPLOY_CHECKLIST

Date: March 2, 2026

## 1) Pre-Deploy Validation
- [ ] Backend build passes: `cd backend && npm run build`
- [ ] Frontend build passes: `cd frontend && npm run build`
- [ ] Smoke e2e passes: `cd frontend && npm run e2e:smoke`
- [ ] Backend health endpoint returns OK in target env: `/api/health`

## 2) Environment Variables

### Backend (`backend/.env`)
- [ ] `PORT`
- [ ] `MONGODB_URI` (or `MONGO_URI`)
- [ ] `JWT_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `ADMIN_SECRET_PATH`
- [ ] `CORS_ORIGIN`
- [ ] `FRONTEND_URL`
- [ ] `ADMIN_ORIGIN`
- [ ] Mail keys if email features are enabled

### Frontend (`frontend/.env`)
- [ ] `VITE_API_BASE_URL` points to production backend API base

## 3) Backend Deployment
- [ ] Install deps: `npm ci`
- [ ] Build: `npm run build`
- [ ] Start: `npm run start`
- [ ] Confirm logs show DB connected
- [ ] Confirm `/api/health` => `{"status":"OK", ...}`

## 4) Frontend Deployment
- [ ] Install deps: `npm ci`
- [ ] Build static assets: `npm run build`
- [ ] Serve `dist/` via CDN/web server
- [ ] Configure SPA fallback to `index.html` for client routes

## 5) Reverse Proxy / CORS
- [ ] API routed to backend origin
- [ ] CORS allows only expected frontend/admin origins
- [ ] Cookies/auth headers forwarded correctly

## 6) Database / Storage
- [ ] MongoDB connectivity verified from backend host
- [ ] Upload storage path/permissions validated
- [ ] Private proof files restricted to admin-authorized access

## 7) Post-Deploy Smoke
- [ ] Public: `/`, `/news`, `/services`, `/exams`
- [ ] Student: login, dashboard, exam start/submit/result
- [ ] Admin: login, dashboard tabs, news console
- [ ] Payment dashboard list loads without API errors

## 8) Rollback Readiness
- [ ] Keep previous backend build artifact available
- [ ] Keep previous frontend static build available
- [ ] DB backup snapshot created before schema-affecting deploy