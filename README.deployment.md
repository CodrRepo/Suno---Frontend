# Deployment Guide

## Overview
- **Client**: Deployed on Vercel
- **Server**: Deployed on Render

## Environment Configuration

### Development (Localhost)
The client uses `.env.local` which points to `http://localhost:3000/api`

```bash
# Run development server
npm run dev
# or
pnpm dev
```

### Production (Vercel)

#### 1. Deploy Server to Render
1. Create a new Web Service on Render
2. Connect your server repository
3. Configure environment variables on Render dashboard
4. Note your Render service URL (e.g., `https://your-server-name.onrender.com`)

#### 2. Deploy Client to Vercel
1. Push your code to GitHub
2. Import project to Vercel
3. Configure environment variable in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-server-name.onrender.com/api`
   - Make sure it's set for Production environment
4. Deploy

#### 3. Update Production Environment File
Edit `.env.production` and replace `your-server-name` with your actual Render service name.

## How It Works

- **Development**: Vite proxy redirects `/api` requests to `http://localhost:3000`
- **Production**: Client uses `VITE_API_URL` from environment variables to make direct API calls to Render

## Important Notes

1. **CORS Configuration**: Make sure your server allows requests from your Vercel domain
   ```javascript
   // In your server code
   app.use(cors({
     origin: ['http://localhost:5173', 'https://your-vercel-app.vercel.app'],
     credentials: true
   }))
   ```

2. **Environment Variables**: 
   - `.env.local` is for local development only (gitignored)
   - `.env.production` is a template - actual values should be set in Vercel dashboard
   - Never commit sensitive data to git

3. **API Calls**: All axios calls should use relative paths (`/api/...`) or use `import.meta.env.VITE_API_URL` directly

## Vercel Configuration

The `vercel.json` file configures:
- SPA routing (all routes redirect to index.html)

## Testing Production Build Locally

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

This will use `.env.production` values.
