# 🚀 Deployment Guide: ResearchAI

This document provides step-by-step instructions to deploy the Multi-Agent Research System.

---

## 1. Backend Deployment (Render)

Render will host your FastAPI application.

1. **Create a New Web Service**: Log in to [Render](https://dashboard.render.com/) and click **New > Web Service**.
2. **Connect Repository**: Connect your GitHub repository.
3. **Configure Service Settings**:
   - **Name**: `research-ai-backend`
   - **Region**: Select the one closest to you.
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app`
4. **Environment Variables**: Click the **Environment** tab and add:
   - `OPENAI_API_KEY`: Your OpenAI key.
   - `TAVILY_API_KEY`: Your Tavily API key.
   - `FRONTEND_URL`: Leave this blank for now (you'll update it after the frontend is live).
   - `PYTHON_VERSION`: `3.12.2`
5. **Deploy**: Render will start the build. Once finished, copy the provided URL (e.g., `https://research-ai-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

Vercel will host your React/Vite application.

1. **Import Project**: Log in to Vercel and click **Add New > Project**.
2. **Configure Project**:
   - **Root Directory**: Select `frontend`.
   - **Framework Preset**: `Vite`.
3. **Environment Variables**: Expand the environment variables section and add:
   - `VITE_API_URL`: Paste your Render backend URL (e.g., `https://research-ai-backend.onrender.com`).
4. **Deploy**: Click **Deploy**. Vercel will build your frontend.
5. **Final Step**: Once the deployment is finished, copy your Vercel URL (e.g., `https://research-ai-frontend.vercel.app`).

---

## 3. Connecting the Pieces (CORS)

For security, your backend only allows requests from trusted origins.

1. Go back to your **Render Dashboard**.
2. Navigate to your backend service > **Environment**.
3. Update the `FRONTEND_URL` variable with your actual Vercel URL.
4. Render will automatically redeploy with the new settings.

---

## 🛠 Troubleshooting

- **CORS Errors**: Ensure the `FRONTEND_URL` in Render matches your Vercel URL exactly (no trailing slash).
- **API Timeouts**: Render's free tier spins down after inactivity. The first request might take 30–60 seconds to wake up the server.
- **Build Failures**: Ensure `requirements.txt` is updated and `runtime.txt` specifies a stable Python version (like 3.12.2).

---
*Generated for ResearchAI — Multi-Agent Research System*
