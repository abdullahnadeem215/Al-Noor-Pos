# Al-Noor Mart Deployment Guide (Render Backend + Vercel Frontend)

This guide provides step-by-step instructions for deploying the **Laravel 11 API Backend on Render.com** and connecting it to your **Next.js Frontend on Vercel**.

---

## Part 1: Deploy Backend on Render.com

### Step 1: Push Code to GitHub
Ensure your repository containing the backend and `Dockerfile` / `render.yaml` is pushed to GitHub.

---

### Step 2: Create Managed PostgreSQL Database on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **PostgreSQL**.
2. Set the following details:
   - **Name**: `al-noor-postgres`
   - **Database**: `al_noor_grocery`
   - **User**: `postgres`
   - **Region**: Singapore (or nearest to your users)
   - **Plan**: Free
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (e.g. `postgresql://postgres:pass@dpg-xxx-a/al_noor_grocery`).

---

### Step 3: Create Web Service for Laravel API
1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Choose **Docker** as the Runtime environment.
4. Set Environment Variables in Render:
   - `APP_NAME` = `Al-Noor Mart POS`
   - `APP_ENV` = `production`
   - `APP_DEBUG` = `false`
   - `APP_KEY` = Generate via local `php artisan key:generate --show` or leave blank for Render auto-key
   - `DB_CONNECTION` = `pgsql`
   - `DATABASE_URL` = *(Paste Internal Database URL from Step 2)*
   - `FRONTEND_URL` = `https://your-frontend.vercel.app`
5. Click **Create Web Service**.

Render will automatically build the Docker image, run migrations (`php artisan migrate --force`), seed demo products/users, and launch your API on a live URL such as:
```
https://al-noor-mart-api.onrender.com
```

Your API Base URL will be:
```
https://al-noor-mart-api.onrender.com/api/v1
```

---

## Part 2: Connect Vercel Frontend to Render Backend

### Step 1: Deploy Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** -> **Project**.
2. Import your repository and set the **Root Directory** to `frontend`.

---

### Step 2: Configure Environment Variable on Vercel
In your Vercel Project Settings -> **Environment Variables**, add:

- **Key**: `NEXT_PUBLIC_API_BASE_URL`
- **Value**: `https://al-noor-mart-api.onrender.com/api/v1` *(Replace with your Render API URL)*
- **Target Environments**: Production, Preview, Development.

---

### Step 3: Redeploy Frontend
1. Click **Deploy** (or push a new commit).
2. Vercel will build your Next.js application.
3. Access your live store frontend at: `https://your-app.vercel.app`.

---

## Summary of URL Configuration Matrix

| Environment | Frontend URL | Backend API Base URL |
| :--- | :--- | :--- |
| **Local Development** | `http://localhost:3000` | `http://127.0.0.1:8000/api/v1` |
| **Production (Vercel + Render)** | `https://your-app.vercel.app` | `https://al-noor-mart-api.onrender.com/api/v1` |

---

## Demo Credentials (Production & Local)
- **Owner Role**: `owner@alnoormart.com` / Password: `password123`
- **Cashier Role**: `cashier@alnoormart.com` / Password: `password123`
