# Deployment Guide - Backend URL Configuration

## Summary of Changes

The project has been updated to use the new backend URL: `https://pi-dev-backend.onrender.com`

### Files Modified

1. **Environment Configuration**
   - Created `.env` - Default configuration with production backend URL
   - Created `.env.development` - Local development configuration
   - Created `.env.production` - Production configuration
   - Created `.env.example` - Template for environment variables
   - Created `src/config/api.config.ts` - Centralized API configuration

2. **Core API Files**
   - `src/api/axiosInstance.ts` - Updated base URL and refresh endpoint
   - `src/services/platform/platformAxios.ts` - Updated platform API base URL

3. **WebSocket Configuration**
   - `src/hooks/useWebSocket.ts` - Updated WebSocket connection URL

4. **Component Updates** (using getAssetUrl helper)
   - `src/layouts/BackOfficeLayout.tsx` - Avatar URLs
   - `src/pages/backoffice/Team.tsx` - Team member avatars
   - `src/pages/backoffice/TenantSettings.tsx` - Tenant logo
   - `src/pages/backoffice/TenantView.tsx` - Tenant logo
   - `src/pages/backoffice/BusinessView.tsx` - Business logo
   - `src/pages/backoffice/BusinessManagement.tsx` - Business logos
   - `src/pages/backoffice/ProfileSettings.tsx` - User avatar
   - `src/pages/frontoffice/AcceptInvitationPage.tsx` - Business logo

5. **Payment & Portal Pages**
   - `src/pages/PaymentPage.tsx` - Payment endpoints
   - `src/components/payment/PaymentForm.tsx` - Payment confirmation
   - `src/pages/frontoffice/SubscriptionManagePage.tsx` - Subscription management
   - `src/pages/frontoffice/SalesOrderClientPortal.tsx` - Client portal
   - `src/pages/frontoffice/LoginPage.tsx` - Google OAuth URL

6. **Other Components**
   - `src/components/sales/SendInvoiceEmailModal.tsx` - Email sending
   - `src/hooks/usePresence.ts` - Presence API
   - `src/components/ThreadPanel.tsx` - Thread API
   - `src/pages/backoffice/Collaboration.tsx` - Collaboration API

## Environment Variables

### VITE_API_URL
The main backend API URL. This is used throughout the application.

**Values:**
- Development: `http://localhost:3001`
- Production: `https://pi-dev-backend.onrender.com`

### VITE_STRIPE_PUBLIC_KEY
Your Stripe public key for payment processing (if applicable).

## Deployment Steps

### For Render.com

1. **Set Environment Variable in Render Dashboard**
   - Go to your Render service dashboard
   - Navigate to "Environment" section
   - Add environment variable:
     - Key: `VITE_API_URL`
     - Value: `https://pi-dev-backend.onrender.com`

2. **Deploy**
   - Push your changes to your repository
   - Render will automatically rebuild and deploy

### For Other Platforms (Vercel, Netlify, etc.)

1. **Set Environment Variable**
   - Add `VITE_API_URL=https://pi-dev-backend.onrender.com` in your platform's environment variables section

2. **Build Command**
   ```bash
   npm install && npx vite build
   ```

3. **Output Directory**
   ```
   dist
   ```

## Local Development

To run locally with the production backend:

```bash
# Use the default .env file
npm run dev
```

To run locally with local backend:

```bash
# The .env.development file will be used automatically in dev mode
npm run dev
```

Or manually set the environment variable:

```bash
# Windows PowerShell
$env:VITE_API_URL="http://localhost:3001"
npm run dev

# Windows CMD
set VITE_API_URL=http://localhost:3001
npm run dev

# Linux/Mac
VITE_API_URL=http://localhost:3001 npm run dev
```

## Build for Production

```bash
# Build with production environment
npx vite build
```

The built files will be in the `dist` folder.

## Testing the Configuration

After deployment, verify:

1. **API Calls** - Check browser console for API requests going to correct URL
2. **WebSocket** - Check WebSocket connection in Network tab
3. **Images** - Verify avatars and logos load correctly
4. **Authentication** - Test login/logout functionality
5. **Payments** - Test payment flows (if applicable)

## Troubleshooting

### Issue: API calls still going to localhost

**Solution:** 
- Clear browser cache
- Check that environment variable is set correctly
- Rebuild the application
- Verify `.env` file exists and has correct value

### Issue: Images not loading

**Solution:**
- Check that backend URL is accessible
- Verify image paths in database start with `/uploads/` or similar
- Check CORS settings on backend

### Issue: WebSocket not connecting

**Solution:**
- Verify backend supports WebSocket connections
- Check that backend URL is correct (should not include `/api` suffix for WebSocket)
- Verify firewall/proxy settings allow WebSocket connections

## Important Notes

1. **Environment Variables in Vite**
   - Only variables prefixed with `VITE_` are exposed to the client
   - Changes to `.env` files require rebuild
   - `.env.local` takes precedence over `.env`

2. **Security**
   - Never commit `.env` files with sensitive data
   - Use `.env.example` as a template
   - `.env` is already in `.gitignore`

3. **CORS Configuration**
   - Ensure backend allows requests from your frontend domain
   - Backend should have proper CORS headers configured

## Backend Requirements

Your NestJS backend should:

1. Accept requests from your frontend domain
2. Have CORS properly configured
3. Support WebSocket connections on `/notifications` endpoint
4. Serve uploaded files (avatars, logos) from the correct paths

Example CORS configuration for NestJS:

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.com'
  ],
  credentials: true,
});
```
