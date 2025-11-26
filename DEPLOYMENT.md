# 🚢 Deployment Guide - Render.com

This guide will walk you through deploying your full-stack application to Render.com.

---

## 📋 Prerequisites

- GitHub repository with your code
- Render.com account (free tier available)

---

## 🗄️ Step 1: Deploy PostgreSQL Database

### Option A: Use Render PostgreSQL (Recommended)

1. Go to your Render Dashboard
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `nearbynurse-db`
   - **Database**: `mydb`
   - **User**: `postgres` (default)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier or paid based on needs
4. Click **Create Database**
5. **Copy the Internal Database URL** (starts with `postgres://`)
   - You'll need this for the backend configuration

### Option B: Use Supabase PostgreSQL

If you prefer to use Supabase's PostgreSQL:

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Copy the **Connection String** (Direct connection)
3. Use this as your `DATABASE_URL`

---

## 🔧 Step 2: Deploy Backend (NestJS)

1. Go to Render Dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:

   **Basic Settings:**
   - **Name**: `nearbynurse-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Plan**: Free or paid

   **Docker Settings:**
   - Render will automatically detect the `Dockerfile` in the backend directory

5. **Add Environment Variables:**

   Click **Advanced** → **Add Environment Variable**

   ```
   DATABASE_URL=<your-postgres-connection-string>
   PORT=3000
   NODE_ENV=production
   ```

6. Click **Create Web Service**
7. Wait for deployment (usually 5-10 minutes)
8. **Copy your backend URL** (e.g., `https://nearbynurse-backend.onrender.com`)

---

## 🎨 Step 3: Deploy Frontend (React)

1. Go to Render Dashboard
2. Click **New +** → **Static Site**
3. Connect your GitHub repository
4. Configure:

   **Basic Settings:**
   - **Name**: `nearbynurse-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. **Add Environment Variables:**

   ```
   VITE_API_URL=https://nearbynurse-backend.onrender.com
   ```

6. Click **Create Static Site**
7. Wait for deployment
8. Your site will be live at `https://nearbynurse-frontend.onrender.com`

---

## 🔒 Step 4: Configure CORS (Backend)

Your backend already has CORS enabled in `main.ts`:

```typescript
app.enableCors();
```

For production, you may want to restrict CORS to your frontend domain:

```typescript
app.enableCors({
  origin: 'https://nearbynurse-frontend.onrender.com',
  credentials: true,
});
```

---

## 🔄 Step 5: Setup Automatic Deployments

Render automatically deploys when you push to your connected branch.

### Configure Deploy Settings:

1. Go to each service in Render
2. **Settings** → **Build & Deploy**
3. Enable **Auto-Deploy**: Yes
4. Set **Branch**: `main`

Now, every push to `main` will trigger a deployment!

---

## ✅ Step 6: Verify Deployment

### Test Backend

```bash
curl https://nearbynurse-backend.onrender.com
```

Expected: `"Hello World!"`

### Test Frontend

Visit: `https://nearbynurse-frontend.onrender.com`

### Test Protected Endpoint

```bash
curl https://nearbynurse-backend.onrender.com/me
```

Expected: `401 Unauthorized` (without token)

---

## 🎯 Step 7: Configure Custom Domain (Optional)

### For Frontend:

1. Go to your Static Site in Render
2. **Settings** → **Custom Domain**
3. Click **Add Custom Domain**
4. Enter your domain (e.g., `app.yourdomain.com`)
5. Add the CNAME record to your DNS provider:
   ```
   CNAME: app → nearbynurse-frontend.onrender.com
   ```
6. Wait for DNS propagation (can take up to 48 hours)

### For Backend:

1. Go to your Web Service in Render
2. Follow the same process
3. Use a subdomain like `api.yourdomain.com`
4. Update your frontend `VITE_API_URL` environment variable

---

## 💰 Pricing Overview

### Free Tier Limitations:

**Web Services (Backend):**
- Spins down after 15 minutes of inactivity
- First request after inactivity takes ~30 seconds (cold start)
- 750 hours/month free

**Static Sites (Frontend):**
- Always active
- Unlimited bandwidth
- 100GB bandwidth/month free

**PostgreSQL:**
- 90 days free trial
- Then $7/month for starter plan

### Upgrade Options:

For production apps, consider:
- **Backend**: $7-25/month for always-on instances
- **Database**: $7-20/month based on storage needs

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check Logs:**
1. Go to your Web Service in Render
2. Click **Logs**
3. Look for error messages

**Common Issues:**
- Missing environment variables
- Database connection string incorrect
- Port configuration (must use PORT env variable)

### Frontend Build Fails

**Check Build Logs:**
1. Go to your Static Site
2. Click **Events** → View latest deploy logs

**Common Issues:**
- Environment variables not set
- Node version incompatibility
- Build command incorrect

### Database Connection Issues

**Verify Connection String:**
- Must use **Internal Database URL** from Render (for Render DB)
- Format: `postgresql://user:password@host:5432/database`
- Check that backend can reach database (must be in same region)

### CORS Errors

If you see CORS errors in browser console:

1. Check backend CORS configuration
2. Ensure frontend URL is allowed
3. Verify environment variables are correct

---

## 🔐 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use Render's environment variable management
- Rotate secrets regularly

### 2. Database Security
- Use strong passwords
- Enable SSL connections in production
- Regularly backup your database

### 3. API Security
- Always validate Supabase tokens
- Implement rate limiting
- Use HTTPS only in production

---

## 📊 Monitoring

### Render Dashboard

Monitor your services:
- **Metrics**: CPU, Memory, Response times
- **Logs**: Real-time application logs
- **Events**: Deployment history

### Setup Alerts

1. Go to service **Settings**
2. **Notifications**
3. Configure email/Slack alerts for:
   - Deploy failures
   - Service crashes
   - High resource usage

---

## 🔄 CI/CD Pipeline

Your GitHub Actions workflows will run on every push:

1. **Code pushed to GitHub**
2. **GitHub Actions runs** (lint, test, build)
3. **If successful** → Render auto-deploys
4. **If failed** → Deployment blocked

To view workflow status:
- Go to your GitHub repo
- Click **Actions** tab
- View latest workflow runs

---

## 📈 Scaling Your Application

### When to Scale:

- Response times > 1 second consistently
- Memory usage > 80%
- Database connections maxed out
- Increased traffic

### How to Scale:

1. **Vertical Scaling** (Upgrade instance)
   - Render: Upgrade to larger instance type
   - Database: Increase RAM/CPU

2. **Horizontal Scaling** (Multiple instances)
   - Not available on free tier
   - Requires paid plan

3. **Database Scaling**
   - Connection pooling
   - Read replicas
   - Caching layer (Redis)

---

## 🎓 Next Steps

1. **Setup Monitoring**
   - Add Sentry for error tracking
   - Setup application analytics

2. **Performance Optimization**
   - Enable caching
   - Optimize database queries
   - Add CDN for static assets

3. **Backup Strategy**
   - Regular database backups
   - Disaster recovery plan

4. **Documentation**
   - API documentation with Swagger
   - User guides
   - Developer onboarding

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Deploying NestJS to Render](https://render.com/docs/deploy-nestjs)
- [Deploying Vite Apps](https://render.com/docs/deploy-vite)
- [Render Community Forum](https://community.render.com/)

---

**Your app is now live! 🎉**

Need help? Check the troubleshooting section or reach out to support.
