# 🚀 Hosting Guide

## GitHub Setup (2 minutes)

```bash
# 1. Initialize git
git init
git add .
git commit -m "Initial commit"

# 2. Create GitHub repo
# Go to github.com → New repository → "cosma-beauty-demo"

# 3. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/cosma-beauty-demo.git
git branch -M main
git push -u origin main
```

## Vercel Deployment (3 minutes)

### Option 1: Vercel CLI (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: cosma-beauty-demo
# - Directory: ./
# - Override settings? N
```

### Option 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect GitHub account
4. Select "cosma-beauty-demo" repo
5. Click "Deploy"

## Alternative: Render (Easier for full-stack)

1. Go to [render.com](https://render.com)
2. Connect GitHub account
3. Select repo → "Web Service"
4. Settings:
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `npm start`
5. Click "Create Web Service"

## 🔗 Result

- **GitHub**: `https://github.com/YOUR_USERNAME/cosma-beauty-demo`
- **Live Demo**: `https://cosma-beauty-demo.vercel.app`

## 📱 Test Deployment

1. Visit live URL
2. Search "dark circles"
3. Submit enquiry
4. Check admin dashboard

**Done!** 🎉