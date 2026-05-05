# 🚀 Render Deployment - Quick Start

## The Problem You Had

Render was running `npm run dev` which:
- Starts a development server (not for production)
- Uses too much memory (512MB limit on free tier)
- Doesn't expose the correct port

## The Solution

Use **Static Site** deployment (recommended) or **Web Service** with proper build.

---

## ✅ RECOMMENDED: Deploy as Static Site

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### Step 2: Create Static Site on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. Connect your repository
4. Configure:
   - **Name**: `pi-dev-frontend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. Click **"Advanced"** and add environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://pi-dev-backend.onrender.com`

6. Click **"Create Static Site"**

### Step 3: Wait for Deployment
- Build takes 2-5 minutes
- You'll get a URL like: `https://pi-dev-frontend.onrender.com`

---

## Alternative: Deploy as Web Service

If you need server-side features:

### Configure in Render Dashboard:

```
Service Type: Web Service
Name: pi-dev-frontend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

**Environment Variables:**
- `VITE_API_URL` = `https://pi-dev-backend.onrender.com`
- `NODE_VERSION` = `18`

---

## What Changed in Your Code

1. **package.json** - Updated scripts:
   ```json
   "build": "vite build",
   "start": "serve -s dist -l $PORT"
   ```

2. **Added Files:**
   - `render.yaml` - Automated deployment config
   - `serve.json` - Static file server config
   - `.env` - Environment variables

3. **Dependencies:**
   - Added `serve` package for static file serving

---

## After Deployment

### 1. Update Backend CORS

Add your Render URL to backend CORS whitelist:

```typescript
// In your NestJS backend
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://pi-dev-frontend.onrender.com', // Add this
  ],
  credentials: true,
});
```

### 2. Test Your App

Visit your Render URL and test:
- ✅ Login/Authentication
- ✅ API calls (check Network tab)
- ✅ WebSocket connections
- ✅ Image loading
- ✅ All features

### 3. Check for Errors

Open browser DevTools → Console and check for:
- CORS errors
- API connection errors
- Missing environment variables

---

## Troubleshooting

### Build Fails
- Check logs in Render dashboard
- Verify `NODE_VERSION=18` is set
- Make sure build command is correct

### 404 on Page Refresh
- For Static Site: Should work automatically
- For Web Service: Check `serve.json` exists

### API Calls Fail
- Verify `VITE_API_URL` is set correctly
- Check backend CORS configuration
- Check backend is running

### Out of Memory
- Use Static Site instead (uses less memory)
- Or upgrade to Starter plan ($7/month)

---

## Cost

**Static Site (Recommended):**
- ✅ **FREE** forever
- ✅ Unlimited bandwidth
- ✅ Global CDN
- ✅ Free SSL

**Web Service:**
- Free tier: 750 hours/month
- Starter: $7/month (better performance)

---

## Next Steps

1. ✅ Deploy to Render (follow steps above)
2. ✅ Update backend CORS
3. ✅ Test all features
4. ✅ Set up custom domain (optional)
5. ✅ Monitor logs and metrics

---

## Need Help?

- Full guide: See `RENDER_DEPLOYMENT.md`
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com

---

## Summary

**Before:** Running dev server → Out of memory ❌

**After:** Build static files → Serve with CDN → Works perfectly ✅
