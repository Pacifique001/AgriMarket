# AgroMarket Deployment Guide (Free Tier)

## Architecture
- Frontend: Vercel (free)
- Backend API: Render Web Service (free)
- Database: Neon Postgres (free)

## 1) Deploy Database (Neon)
1. Create a Neon project.
2. Copy the Postgres connection string.
3. Keep it as `DATABASE_URL` for backend setup.

## 2) Deploy Backend (Render)
1. Push this repository to GitHub.
2. In Render: New -> Blueprint.
3. Select this repository. Render will detect [render.yaml](render.yaml).
4. Set secret env vars in Render dashboard:
   - `SECRET_KEY`
   - `DATABASE_URL`
   - `BACKEND_CORS_ORIGINS` (include your live Vercel origin, for example `https://pacifiquesynergy-agri-market.vercel.app,http://localhost:3000,http://127.0.0.1:3000`)
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`
5. Deploy and verify:
   - `https://<your-render-url>/docs`

## 3) Deploy Frontend (Vercel)
1. In Vercel: New Project -> import repository.
2. Set Root Directory to `FrontEnd`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://<your-render-url>/api/v1`
4. Deploy.

## 4) CORS and Production Wiring
- Ensure backend `BACKEND_CORS_ORIGINS` includes your Vercel domain, especially `https://pacifiquesynergy-agri-market.vercel.app`.
- If you use a custom domain, add it too.

## 5) Twilio Setup
Use either:
- `TWILIO_MESSAGING_SERVICE_SID` (recommended), or
- `TWILIO_FROM_NUMBER`

Required credentials:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

Optional toggle:
- `SMS_ENABLED=true|false`

## 6) Local Environment Files
- Backend template: [BackEnd/.env.example](BackEnd/.env.example)
- Frontend template: [FrontEnd/.env.example](FrontEnd/.env.example)

## 7) Common Checks
- Backend health: `/docs` loads.
- Frontend network calls point to deployed backend URL.
- Login works and API returns `200`.
- Buyer suggestions endpoint responds after migrations are applied.
