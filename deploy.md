# Deployment Guide

## Option 1: Render (Recommended)
1. Push to GitHub
2. Connect Render to your repo
3. Set build command: `npm install && cd client && npm install && npm run build`
4. Set start command: `npm start`
5. Deploy automatically

## Option 2: Railway
1. Push to GitHub
2. Connect Railway to repo
3. Auto-detects Node.js
4. Deploys with zero config

## Option 3: Vercel (Frontend + Serverless)
1. Deploy frontend: `cd client && vercel`
2. Deploy API as serverless functions
3. Update API endpoints in frontend

## Option 4: Docker
```bash
docker build -t cosma-beauty .
docker run -p 5000:5000 cosma-beauty
```

## Environment Variables
No environment variables needed - uses in-memory SQLite for demo purposes.