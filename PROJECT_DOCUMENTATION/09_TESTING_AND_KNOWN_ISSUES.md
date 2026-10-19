# 09. Testing and Known Issues — ToolKit

This document outlines the tests actually executed on ToolKit, the results obtained, known technical limitations, and recommendations for automated test coverage.

---

## 1. Tests Actually Executed & Verified

Every check below was physically run against the actual codebase:

| Test / Check | Tool / Command | Result | Notes |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | **PASSED (0 errors)** | Verified strict compile-time type safety across all 59 routes and libraries. |
| **ESLint Static Analysis** | `npm run lint` | **PASSED (0 errors)** | Checked React 19 hook rules, unused variables, and Next.js Core Web Vitals. Only 1 non-blocking image optimization suggestion was reported. |
| **Production Build** | `npm run build` | **PASSED (Exit 0)** | Compiled all 59 static and dynamic pages with Turbopack in under 4 seconds. |
| **Static Route Generation** | `next build` | **PASSED (59/59)** | Successfully generated SSG pages for all category hubs (`/tools/pdf`, `/tools/qr`, etc.) and tools. |
| **Security Audit** | Cloudflare Security Audit Skill | **AUDITED & FIXED** | Addressed SSRF, Open Redirect, Timing Attacks, XSS, and missing HSTS/CSP headers. |

---

## 2. Known Limitations & Technical Realities

To maintain intellectual honesty, the following constraints in the current implementation are explicitly documented:

### 1. Scanned (Image-Only) PDFs Cannot Extract Text Without OCR
- **Context**: In PDF-to-Word or PDF-to-Text, users often upload scanned documents (e.g. photos of printed book pages).
- **The Reality**: In scanned PDFs, text glyphs do not exist in the PDF binary; the file is simply a JPEG or TIFF image wrapped inside a PDF container.
- **How ToolKit Handles It**: ToolKit detects when `totalTextItems === 0` and `totalImageItems > 0` and presents an honest, informative alert:
  > *"This PDF contains scanned images, not selectable text. Text extraction is not possible without OCR. Try uploading a text-based PDF, or use a dedicated OCR tool first."*
  This prevents the tool from generating blank or corrupt `.docx` files.

### 2. In-Browser Word-to-PDF Pagination vs. Microsoft Word
- **Context**: Converting `.docx` to `.pdf` directly in the browser without uploading to a remote Microsoft Word server.
- **The Reality**: ToolKit uses `docx-preview` and your browser's native print-to-PDF engine (`window.print()`). While visually authentic for standard documents, subtle differences in proprietary font kerning, margins, or complex nested table borders may occasionally occur compared to desktop Microsoft Word.

### 3. PPTX Slide Export Format
- **Context**: The `pdf-to-ppt` tool exports PDF pages into a PowerPoint `.pptx` presentation.
- **The Reality**: Because PDF does not contain native PowerPoint shape vectors or editable master slide templates, ToolKit exports each PDF page as a high-resolution 16:9 slide image embedded inside the `.pptx` container.

### 4. Absence of Automated Unit Test Runner in `package.json`
- **Context**: Currently, `package.json` contains `"scripts": { "dev": "...", "build": "...", "start": "...", "lint": "..." }`.
- **The Reality**: There is no `npm test` script configured with a test runner like `vitest` or `jest`. Quality is currently verified through TypeScript compiler checking, ESLint AST analysis, and production build checks.

---

## 3. Recommended Testing Roadmap

To elevate ToolKit to enterprise-grade continuous integration, we recommend implementing the following test suites:

### Phase 1: Pure Unit Tests with Vitest
Install `vitest` to test algorithmic logic without running a browser:
```bash
npm install -D vitest
```
Create test files for:
1. `src/lib/file-share.test.ts`: Verify token creation, HMAC verification, expiration enforcement, and timing-safe rejection of forged tokens.
2. `src/app/tools/student/scientific-calculator`: Verify mathematical parsing order of operations (PEMDAS), trigonometry, roots, and error handling for division by zero.
3. `src/app/tools/utilities/unit-converter`: Verify floating-point conversion accuracy across length, temperature, and digital storage units.

### Phase 2: End-to-End Browser Tests with Playwright
Install `playwright` to simulate actual user actions in Chromium and Firefox:
```bash
npm install -D @playwright/test
```
Create automated workflows for:
1. Dragging a file into `src/app/tools/pdf/merge` and verifying the download button becomes active.
2. Generating a Wi-Fi QR code and verifying the canvas renders non-zero pixel data.
3. Switching between light and dark mode and asserting CSS variable updates on `document.documentElement`.
