# 06. Setup and Commands — ToolKit

This guide explains how to set up, run, test, and troubleshoot ToolKit on your local development machine.

---

## 1. Prerequisites

Before installing the project, ensure you have the following installed on your operating system (Windows, macOS, or Linux):

1. **Node.js**: Version **20.x or higher** (LTS recommended).
   - Check version: `node -v`
2. **npm**: Version **10.x or higher** (bundled with Node.js).
   - Check version: `npm -v`
3. **Git**: Version control tool.
   - Check version: `git --version`
4. **Python 3.10+ (Optional)**:
   - Only needed if you want to run the offline local Python `pdf2docx` conversion engine. If Python is not installed, ToolKit still runs 100% of its features using its built-in browser fallback engine!
   - If using Python, install the converter dependency:
     ```bash
     pip install pdf2docx
     ```

---

## 2. Step-by-Step Installation

### Step 1: Open Terminal in Project Directory
Navigate into the `tool-kit` folder:
```bash
cd D:\PROGRAMS\TOOL_KIT\tool-kit
```

### Step 2: Install Node Dependencies
Install all required npm packages:
```bash
npm install
```
*This installs Next.js, React 19, Tailwind CSS, Lucide icons, pdf-lib, jszip, qrcode, and TypeScript definitions.*

### Step 3: (Optional) Set Environment Variables
ToolKit works out of the box with zero configuration! However, for production or custom setups, you can create a `.env.local` file in the root directory:

```env
# Optional: Secret salt used to sign File Share QR tokens
# If omitted, ToolKit generates a secure cryptographically random key on startup
FILE_SHARE_SECRET=your_super_secret_custom_salt_here
```

---

## 3. Daily Development Commands

All commands are defined in `package.json` under `"scripts"`:

### Start the Development Server
```bash
npm run dev
```
- Starts the Next.js local server at `http://localhost:3000`.
- Features instant Hot Module Reloading (HMR) powered by Next.js Turbopack.
- Any changes made to files in `src/` will instantly update in your open browser tab without losing state.

*Tip: If port 3000 is occupied by another app on your machine, specify a different port:*
```bash
npx next dev -p 3001
```

### Run ESLint Quality Check
```bash
npm run lint
```
- Scans all TypeScript and TSX files for syntax errors, React 19 hook violations, and unused variables.
- Configured via `eslint.config.mjs`.

### Run Strict TypeScript Typecheck
```bash
npx tsc --noEmit
```
- Performs a complete compile-time type verification across all 59 routes and libraries without generating output files.
- Should return exit code `0` with zero errors.

### Build the Production Application
```bash
npm run build
```
- Compiles the Next.js application using Turbopack.
- Generates optimized static HTML/CSS files for all pages and packages serverless API endpoints.
- Verifies that all dynamic routes (`generateStaticParams`) can be built cleanly.

### Start the Production Server Locally
```bash
npm run start
```
- Runs the compiled `.next` production bundle on `http://localhost:3000` to test performance before deploying.

---

## 4. Verification Checklist

Whenever you make changes to the codebase, run this 3-step verification pipeline in your terminal:

```bash
# 1. Verify TypeScript types
npx tsc --noEmit

# 2. Verify ESLint rules
npm run lint

# 3. Verify production compilation
npm run build
```
If all three commands exit with code `0`, your code is clean, stable, and ready to deploy!

---

## 5. Troubleshooting Common Issues

### Issue 1: `npm run dev` fails with `EADDRINUSE: address already in use :::3000`
- **Cause**: Another program (or a previously running instance of Next.js) is using port 3000.
- **Solution**:
  - Run on port 3001: `npx next dev -p 3001`
  - Or terminate the existing Node process in Task Manager (Windows) or `killall node` (Mac/Linux).

### Issue 2: `Python backend not available on this deployment` warning in PDF-to-Word
- **Cause**: The application is running on Vercel or on a machine where Python or `pdf2docx` is not installed.
- **Is it a bug?**: **No.** This is intentional design. ToolKit detects that the Python bridge is absent, catches the 503 response, and immediately switches to its in-browser JavaScript extraction engine. The conversion still completes.

### Issue 3: `LF will be replaced by CRLF` Git warning on Windows
- **Cause**: Windows uses CRLF (`\r\n`) line breaks while Linux/macOS uses LF (`\n`).
- **Solution**: This is a harmless Git notification and does not affect the code. You can configure Git to handle line endings automatically:
  ```bash
  git config core.autocrlf true
  ```

### Issue 4: Next.js Turbopack warnings about `dynamic filesystem access`
- **Cause**: Turbopack analyzes `fs.existsSync` or `child_process.spawn` calls in API routes.
- **Solution**: These calls have already been annotated with `/*turbopackIgnore: true*/` in `src/app/api/convert/pdf-to-word/route.ts` to ensure clean build logs.
