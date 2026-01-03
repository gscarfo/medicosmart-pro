# MedicoSmart Pro - Render Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy MedicoSmart Pro on Render.com using their free tier. The deployment includes:

- **PostgreSQL Database** (Free)
- **Backend API** (Node.js Web Service - Free)
- **Frontend** (React Static Site - Free)

Render.com is ideal for this project because it offers:
- Free PostgreSQL database with up to 1GB storage
- Free web services that auto-scale to zero when idle
- Automatic HTTPS with custom domain support
- Seamless GitHub integration

---

## Prerequisites

Before starting, ensure you have:

1. **GitHub Account** - Your `medicosmart-pro` repository is already uploaded
2. **Render.com Account** - Sign up at [render.com](https://render.com) using GitHub
3. **GitHub Personal Access Token** - For potential future CI/CD setup (optional)

---

## Step 1: Create PostgreSQL Database

### 1.1 Create the Database

1. Log in to your Render dashboard at [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** button in the top navigation
3. Select **"PostgreSQL"** from the dropdown menu

### 1.2 Configure Database Settings

Fill in the following configuration:

| Field | Value |
|-------|-------|
| **Name** | `medicosmart-db` |
| **Database Name** | `medicosmart` |
| **User** | `medicosmart` |
| **Plan** | Select **"Free"** (should be selected by default) |
| **Region** | Choose the region closest to your users (e.g., "Frankfurt" for EU) |

### 1.3 Create Database

Click **"Create PostgreSQL Database"** button.

### 1.4 Important: Copy Connection String

After creation, wait for the database status to show **"Available"** (green indicator). Then:

1. Scroll to the **"Connection"** section
2. Find the **"Internal Connection String"** field
3. Click the **"Copy"** button
4. **Save this string** - you will need it for the backend configuration

The connection string will look like:
```
postgres://medicosmart:randompassword@hostname.render.com:5432/medicosmart
```

> **Security Note**: The internal connection string is safe to use within Render's network. Do not expose this publicly.

---

## Step 2: Deploy Backend API

### 2.1 Create Web Service

1. In your Render dashboard, click **"New +"**
2. Select **"Web Service"**

### 2.2 Connect GitHub Repository

1. Under **"GitHub"** section, click **"Connect"** next to your `medicosmart-pro` repository
2. If prompted, authorize Render to access your GitHub repositories
3. Select the `medicosmart-pro` repository

### 2.3 Configure Basic Settings

Set the following configuration:

| Field | Value |
|-------|-------|
| **Name** | `medicosmart-api` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Select **"Node"** |
| **Version** | Select **"20"** (or latest LTS) |

### 2.4 Configure Build and Start Commands

| Field | Value |
|-------|-------|
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `node src/index.js` |

The build command installs all dependencies and generates the Prisma client. The start command launches the Express server.

### 2.5 Configure Environment Variables

Scroll to the **"Environment Variables"** section and add the following variables:

#### Required Variables

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste the PostgreSQL connection string you copied earlier |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

#### Security Variables (Generate Secure Values)

| Key | Value |
|-----|-------|
| `JWT_SECRET` | Generate a strong random string (at least 32 characters) |
| `ENCRYPTION_KEY` | Generate a 32-character string (used for encrypting sensitive patient data) |

**How to generate secure keys** (you can use these commands in your terminal):
```bash
# Generate JWT_SECRET (64 random characters)
openssl rand -hex 32

# Generate ENCRYPTION_KEY (32 characters)
openssl rand -hex 16
```

#### Optional Variables

| Key | Value | Description |
|-----|-------|-------------|
| `CORS_ORIGIN` | `*` | Frontend URL for CORS (update to your frontend URL after deployment) |
| `FRONTEND_URL` | (leave empty for now) | Update after frontend deployment |

### 2.6 Select Plan

1. Scroll to the **"Plan"** section
2. Select **"Free"** (should be selected by default)

### 2.7 Create Web Service

Click **"Create Web Service"** button.

### 2.8 Wait for Deployment

Render will now:
1. Clone your repository
2. Install dependencies
3. Generate Prisma client
4. Run database migrations
5. Start the server

This process typically takes **2-5 minutes**. You can monitor progress in the **"Logs"** tab.

### 2.9 Verify Backend is Running

After deployment completes:
1. Click the **"URL"** link in the top-right corner (should look like `https://medicosmart-api-xxxx.onrender.com`)
2. The browser should display a JSON response or API information
3. Test the health endpoint (if available) at `https://your-api-url.onrender.com/health`

---

## Step 3: Deploy Frontend

### 3.1 Create Static Site

1. In your Render dashboard, click **"New +"**
2. Select **"Static Site"**

### 3.2 Connect GitHub Repository

1. Under **"GitHub"** section, click **"Connect"**
2. Select the `medicosmart-pro` repository

### 3.3 Configure Basic Settings

| Field | Value |
|-------|-------|
| **Name** | `medicosmart-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |

### 3.4 Configure Build Settings

| Field | Value |
|-------|-------|
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### 3.5 Configure Environment Variables

Add the following environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your backend URL (e.g., `https://medicosmart-api-xxxx.onrender.com`) |

> **Important**: Use the exact URL of your deployed backend, without trailing slash.

### 3.6 Configure Redirects/Rewrites

1. Scroll to the **"Redirects"** section
2. Click **"Add Rewrite Rule"**
3. Add the following rule:

| Source | Destination | Status |
|--------|-------------|--------|
| `/*` | `/index.html` | 200 |

This rule ensures that React Router works correctly with client-side routing.

### 3.7 Select Plan

Select **"Free"** plan.

### 3.8 Create Static Site

Click **"Create Static Site"** button.

### 3.9 Wait for Deployment

The build process will:
1. Install frontend dependencies
2. Build the React application
3. Deploy static files to CDN

### 3.10 Verify Frontend

After deployment, click the **"URL"** link to open your application. You should see the MedicoSmart Proregistration page.

---

## Step 4 login/: Update CORS Configuration

After both services are deployed, you need to allow the frontend URL in the backend's CORS configuration.

### 4.1 Get Frontend URL

1. Go to your **medicosmart-frontend** service in Render
2. Copy the service URL (e.g., `https://medicosmart-frontend-xxxx.onrender.com`)

### 4.2 Update Backend Environment Variable

1. Go to your **medicosmart-api** service
2. Click **"Environment"** tab
3. Update the `CORS_ORIGIN` variable:
   - **Key**: `CORS_ORIGIN`
   - **Value**: Your frontend URL (e.g., `https://medicosmart-frontend-xxxx.onrender.com`)

4. Click **"Save Changes"**
5. The backend will automatically restart with the new configuration

---

## Step 5: Test the Application

### 5.1 Create Admin Account

The first user to register will need admin privileges. To create an admin account:

1. Register a new account at `https://your-frontend-url.onrender.com/register`
2. After registration, manually update the user role in the database:
   - Connect to your PostgreSQL database using a tool like TablePlus, pgAdmin, or psql
   - Find the `User` table
   - Update the `role` field to `ADMIN` for your user

### 5.2 Test Core Features

Test the following functionality:

| Feature | Expected Result |
|---------|----------------|
| User Registration | Account created successfully |
| Login | Redirected to dashboard |
| Profile Management | Can update doctor information |
| Patient Registration | New patient appears in list |
| Prescription Creation | Prescription generated successfully |
| PDF Generation | PDF downloads correctly |
| Logout | Redirected to login page |

---

## Troubleshooting Common Issues

### Issue: Build Fails with "Cannot find module"

**Cause**: Missing dependencies or incorrect root directory.

**Solution**:
1. Check that **Root Directory** is set correctly (`backend` for API, `frontend` for frontend)
2. Verify `package.json` exists in the specified root directory
3. Check the build logs for specific error messages

### Issue: Database Connection Error

**Cause**: Invalid or missing DATABASE_URL.

**Solution**:
1. Go to your database service
2. Verify the connection string is correct and hasn't changed
3. Update the `DATABASE_URL` environment variable in the backend service
4. Ensure the database status is "Available"

### Issue: Backend Returns 503 (Service Unavailable)

**Cause**: Backend is starting up (cold start) or crashed.

**Solution**:
1. Check the **"Logs"** tab for error messages
2. Verify all environment variables are set correctly
3. Check that Prisma migrations ran successfully during build
4. If crashed, the logs will indicate the specific error

### Issue: Frontend Cannot Connect to API

**Cause**: Incorrect VITE_API_URL or CORS issues.

**Solution**:
1. Verify `VITE_API_URL` points to your deployed backend (not localhost)
2. Check that `CORS_ORIGIN` on backend includes your frontend URL
3. Clear browser cache and hard reload (Ctrl+F5)

### Issue: React Router Not Working (404 on Refresh)

**Cause**: Missing rewrite rule for SPA routing.

**Solution**:
1. Go to your frontend service settings
2. Add a rewrite rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Status**: 200

### Issue: Slow Initial Load (Cold Start)

**Cause**: Free tier services spin down after 15 minutes of inactivity.

**Solution**:
This is expected behavior for free tier. The first request after inactivity may take 30-60 seconds to respond. Subsequent requests will be fast.

To keep the service active, you can:
1. Use a free uptime monitoring service (like UptimeRobot)
2. Configure a cron job to ping your API every 10-15 minutes

---

## Free Tier Limitations

### Service Limits

| Service | Limit |
|---------|-------|
| Backend | 750 hours/month, spins down after 15 min inactivity |
| Frontend | Unlimited (but idle after 15 min) |
| Database | 1GB storage, 250 connections max |

### Expected Behavior

- **First Request Delay**: After 15 minutes of inactivity, the backend will "wake up" on the first request. This takes approximately 30-60 seconds.
- **Monthly Usage**: 750 hours is sufficient for moderate usage (approximately 1 request per minute on average)
- **Storage**: 1GB is plenty for text-based prescription data (each prescription is only a few KB)

---

## Environment Variable Reference

### Backend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens (keep secure!) |
| `ENCRYPTION_KEY` | Yes | 32-character key for encrypting sensitive data |
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Set to `10000` for Render |
| `CORS_ORIGIN` | No | Frontend URL for CORS headers |
| `FRONTEND_URL` | No | Frontend URL for email/communication links |

### Frontend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |

---

## Updating Your Application

### Automatic Updates (Recommended)

Render automatically deploys when you push changes to the `main` branch.

### Manual Redeploy

1. Go to the service in Render dashboard
2. Click the **"Manual Deploy"** button
3. Select **"Deploy latest commit"**

### Database Migrations

When you update the Prisma schema:

1. Make schema changes in `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev` locally to create migration files
3. Commit and push the migration files to GitHub
4. Render will automatically apply migrations during the next deployment

---

## Backup and Recovery

### Manual Database Backup

1. Go to your PostgreSQL service in Render dashboard
2. Click **"Backups"** tab
3. Click **"Create Backup"**
4. Download the backup file for safekeeping

### Restoring from Backup

To restore a backup, you'll need to use psql or a PostgreSQL GUI tool:

```bash
psql -h hostname.render.com -U medicosmart -d medicosmart -f backup_file.sql
```

---

## Security Best Practices

1. **Keep Secrets Secret**: Never commit `JWT_SECRET`, `ENCRYPTION_KEY`, or `DATABASE_URL` to GitHub
2. **Regular Password Changes**: Periodically rotate your database password and update environment variables
3. **Monitor Usage**: Check Render dashboard regularly for unusual activity
4. **HTTPS**: Render automatically provides SSL certificates for all services
5. **Rate Limiting**: The backend includes rate limiting to prevent abuse

---

## Support and Next Steps

### Getting Help

If you encounter issues:
1. Check the **"Logs"** tab in Render dashboard for error messages
2. Review the **Troubleshooting** section above
3. Search for similar issues in the project documentation

### Future Enhancements

Consider these improvements for production:
1. Set up a custom domain
2. Configure email/SMS services (requires Twilio/SendGrid account)
3. Implement comprehensive logging and monitoring
4. Set up automated backups
5. Configure a CI/CD pipeline with GitHub Actions

---

## Quick Reference

| Service | URL | Status |
|---------|-----|--------|
| Frontend | `https://medicosmartxxxx.onrender.com-frontend-` | |
| Backend API | `https://medicosmart-api-xxxx.onrender.com` | |
| Database | (Internal connection only) | |

**Deployment Date**: ____________________

**Admin Account Email**: ____________________

**Database Connection String**: ________________________________

---

**Happy Prescribing! 🩺**

Your MedicoSmart Pro application is now live on Render.com!
