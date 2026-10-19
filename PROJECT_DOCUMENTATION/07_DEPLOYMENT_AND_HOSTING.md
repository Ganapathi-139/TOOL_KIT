# 07. Deployment and Hosting — ToolKit

This guide explains how to deploy ToolKit to production, how it handles serverless platform constraints, required environment variables, and hosting alternatives.

---

## 1. Primary Deployment Platform: Vercel

ToolKit is natively optimized for **1-click deployment on Vercel**, the cloud platform built by the creators of Next.js.

### How the Automated Deployment Works
The repository is linked via GitHub integration:
```
Git Commit -> Push to `master` branch -> Vercel Webhook triggers -> Turbopack Build -> Live Global CDN
```

### Vercel Deployment Settings
- **Framework Preset**: Next.js
- **Root Directory**: `tool-kit` (if repository root has parent folders) or `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node.js Version**: `20.x`

---

## 2. Serverless Platform Constraints & How ToolKit Solves Them

Deploying on free cloud serverless tiers (like Vercel Hobby) involves two key constraints that would break ordinary file utility apps:

### Constraint 1: The 4.5 MB Serverless Payload Limit
- **The Problem**: On Vercel free tier, serverless API routes (`/api/...`) enforce a strict **4.5 MB maximum request body size**. If a user tries to upload a 20 MB file to `/api/file-share/upload`, Vercel immediately terminates the request with `413 Payload Too Large`.
- **How ToolKit Solves It**:
  In `src/app/tools/qr/file-share/page.tsx`:
  - If the file is **≤ 4.5 MB**, it uploads via standard multipart form data to `/api/file-share/upload`.
  - If the file is **> 4.5 MB (up to 100 MB)**, ToolKit automatically switches to client-side direct upload via `uploadViaGofile()`. The file is uploaded directly from the browser to the storage server, and only the resulting secure link metadata is sent to `/api/file-share/upload` as a lightweight JSON payload (a few bytes).
  - This completely bypasses the 4.5 MB serverless limit without failing!

### Constraint 2: Absence of Python on Vercel
- **The Problem**: Standard Vercel serverless functions run only Node.js / JavaScript. Python and libraries like `pdf2docx` or `PyMuPDF` are not installed in the serverless container.
- **How ToolKit Solves It**:
  In `src/app/api/convert/pdf-to-word/route.ts`:
  - The endpoint first checks `if (!existsSync(PYTHON_SCRIPT))`.
  - If running on Vercel, it immediately and cleanly returns HTTP `503 Service Unavailable`.
  - The client in `src/app/tools/pdf/to-word/page.tsx` catches the 503 response and seamlessly engages its browser-side JavaScript reconstruction engine.
  - The user receives an editable Word document with zero server crash!

---

## 3. Environment Variables

ToolKit operates with sensible, safe defaults if no variables are configured. For production clusters or multi-instance deployments, configure the following:

| Variable Name | Required? | Default (if unset) | Description |
|---|---|---|---|
| **`FILE_SHARE_SECRET`** | Optional (Recommended for Production) | Secure per-process random 32-byte hex string | Salt used to generate and verify HMAC-SHA256 tokens for QR file sharing. When multiple server instances run behind a load balancer, setting this ensures all instances share the same secret key. |
| **`PORT`** | Optional | `3000` | Port used by `npm run start` or Node.js server. |
| **`NODE_ENV`** | Automatic | `production` | Set automatically by Next.js during build. |

### How to Add Variables on Vercel:
1. Go to your project dashboard on **vercel.com**.
2. Navigate to **Settings > Environment Variables**.
3. Add Key: `FILE_SHARE_SECRET`, Value: `<your-random-64-character-string>`.
4. Click **Save** and trigger a redeploy.

---

## 4. Alternative Hosting: Self-Hosted Node.js / VPS / Docker

If you want the full native Python `pdf2docx` conversion engine active on the server:

### Option A: Traditional Linux VPS (Ubuntu / Debian)
1. **Install Prerequisites**:
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm python3 python3-pip
   pip3 install pdf2docx
   ```
2. **Clone & Build**:
   ```bash
   git clone https://github.com/Ganapathi-139/TOOL_KIT.git
   cd TOOL_KIT/tool-kit
   npm install
   npm run build
   ```
3. **Run with PM2 Process Manager**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "toolkit" -- start
   ```

### Option B: Docker Container
A standard Next.js Dockerfile with Python bundled:
```dockerfile
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*
RUN pip3 install --break-system-packages pdf2docx
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 5. Domain Configuration & SSL

- **Custom Domain**: You can bind any custom domain (e.g. `toolkit.yourdomain.com`) in Vercel under **Settings > Domains**.
- **SSL / HTTPS**: Vercel automatically provisions and renews free SSL certificates via Let's Encrypt.
- **HSTS Enforcement**: Because ToolKit includes `Strict-Transport-Security` headers in `next.config.ts`, browsers will automatically enforce secure HTTPS connections for all visitors.
