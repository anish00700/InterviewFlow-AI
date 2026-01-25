# Critical: Set Root Directory in Vercel

## The Problem

Vercel is trying to build from the repository root, but your frontend code is in the `interviewflow-frontend` subdirectory.

## The Solution

You **MUST** set the Root Directory in Vercel Dashboard:

### Steps:

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Open your project

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click **General** in the left sidebar

3. **Set Root Directory**
   - Scroll down to **Root Directory**
   - Click **Edit**
   - Enter: `interviewflow-frontend`
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Click **Redeploy**

## Why This is Needed

Your repository structure is:
```
InterviewFlow-AI/
├── interviewflow-backend/    (Backend)
├── interviewflow-frontend/     (Frontend - THIS is what Vercel needs)
└── README.md
```

Without setting Root Directory, Vercel tries to build from the root and can't find `package.json` or `vite.config.js`.

## After Setting Root Directory

Vercel will:
1. Look for `package.json` in `interviewflow-frontend/`
2. Run `npm install` in that directory
3. Run `npm run build` in that directory
4. Use `dist/` as output directory
5. Deploy successfully ✅

## Verification

After setting Root Directory and redeploying, the build log should show:
- `Running "install" command: npm install` (no `cd` command)
- Building from the correct directory
- Build succeeds

---

**This is the #1 most common issue with monorepo deployments on Vercel!**
