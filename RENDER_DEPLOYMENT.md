# Render Deployment Guide

## Quick Setup

### Option 1: Static Site (Recommended - Free Tier)

1. **Push your code to GitHub/GitLab**

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Static Site"

3. **Connect Repository**
   - Select your repository
   - Click "Connect"

4. **Configure Build Settings**
   ```
   Name: pi-dev-frontend
   Branch: main (or your branch name)
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

5. **Add Environment Variables**
   - Click "Advanced"
   - Add environment variable:
     - Key: `VITE_API_URL`
     - Value: `https://pi-dev-backend.onrender.com`

6. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment to complete

### Option 2: Web Service (If you need server features)

1. **Push your code to GitHub/GitLab**

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

3. **Connect Repository**
   - Select your repository
   - Click "Connect"

4. **Configure Service**
   ```
   Name: pi-dev-frontend
   Region: Choose closest to your users
   Branch: main
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free (or Starter for better performance)
   ```

5. **Add Environment Variables**
   - Key: `VITE_API_URL`
   - Value: `https://pi-dev-backend.onrender.com`
   
   - Key: `NODE_VERSION`
   - Value: `18`

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment

## Using render.yaml (Automated)

If you have `render.yaml` in your repository:

1. **Go to Render Dashboard**
   - Click "New +" → "Blueprint"

2. **Connect Repository**
   - Select your repository
   - Render will automatically detect `render.yaml`

3. **Review Configuration**
   - Verify settings
   - Click "Apply"

## Troubleshooting

### Issue: Out of Memory Error

**Solution 1: Use Static Site instead of Web Service**
- Static sites use less memory
- They're also free!

**Solution 2: Optimize Build**
Add to `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-dialog'],
        }
      }
    }
  }
})
```

**Solution 3: Upgrade to Starter Plan**
- Free tier: 512MB RAM
- Starter tier: 2GB RAM

### Issue: Build Fails

**Check Node Version**
- Render uses Node 14 by default
- Add environment variable: `NODE_VERSION=18`

**Check Build Command**
- Should be: `npm install && npm run build`
- NOT: `npm run dev`

### Issue: 404 on Page Refresh

**For Static Site:**
- Render should handle this automatically with proper routing rules

**For Web Service:**
- Make sure `serve.json` exists with rewrite rules
- Or use `render.yaml` with proper routes configuration

### Issue: Environment Variables Not Working

**Solution:**
- Environment variables must be prefixed with `VITE_`
- Rebuild after adding/changing environment variables
- Check in Render dashboard: Environment → Environment Variables

### Issue: CORS Errors

**Solution:**
- Update your backend CORS configuration to allow your Render frontend URL
- Example for NestJS:
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend.onrender.com'
  ],
  credentials: true,
});
```

## Performance Tips

1. **Enable Compression**
   - Render automatically compresses static files
   - No additional configuration needed

2. **Use CDN**
   - Render provides global CDN for static sites
   - Automatically enabled

3. **Optimize Images**
   - Use WebP format when possible
   - Compress images before uploading

4. **Code Splitting**
   - Vite does this automatically
   - Check bundle size with: `npm run build`

## Monitoring

1. **Check Logs**
   - Go to your service in Render dashboard
   - Click "Logs" tab
   - Monitor for errors

2. **Check Metrics**
   - Click "Metrics" tab
   - Monitor memory usage, CPU, requests

3. **Set Up Alerts**
   - Go to service settings
   - Configure email alerts for failures

## Custom Domain

1. **Go to Service Settings**
   - Click "Settings" tab
   - Scroll to "Custom Domain"

2. **Add Domain**
   - Enter your domain name
   - Follow DNS configuration instructions

3. **SSL Certificate**
   - Render provides free SSL automatically
   - No configuration needed

## Automatic Deploys

Render automatically deploys when you push to your connected branch:

1. **Push to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```

2. **Render Detects Changes**
   - Automatically starts build
   - Deploys when build succeeds

3. **Monitor Progress**
   - Check Render dashboard
   - View logs in real-time

## Rollback

If deployment fails:

1. **Go to Service Dashboard**
2. **Click "Events" tab**
3. **Find previous successful deploy**
4. **Click "Rollback"**

## Cost Estimation

**Static Site:**
- Free tier: Unlimited
- Custom domain: Free
- SSL: Free

**Web Service:**
- Free tier: 750 hours/month (enough for 1 service)
- Starter: $7/month (better performance)
- Standard: $25/month (production-ready)

## Next Steps After Deployment

1. **Test Your Application**
   - Visit your Render URL
   - Test all features
   - Check browser console for errors

2. **Update Backend CORS**
   - Add your Render URL to backend CORS whitelist

3. **Monitor Performance**
   - Check Render metrics
   - Monitor user feedback

4. **Set Up Custom Domain** (Optional)
   - Follow custom domain instructions above

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Status Page: https://status.render.com
