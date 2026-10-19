# 02. Technology Stack — ToolKit

This document details every programming language, framework, library, API, and third-party service used in ToolKit, explaining **where it is used, why it was chosen, and its cost and licensing implications**.

---

## 1. Programming Languages

| Language | Primary Location | Purpose & Responsibility |
|---|---|---|
| **TypeScript (v5.x)** | `src/app/**/*.tsx`, `src/lib/**/*.ts`, `src/components/**/*.tsx` | Provides compile-time type safety, autocompletion, and catches interface bugs early across all 39 tool interfaces and API routes. |
| **JavaScript (ES2023)** | `public/js/*.js`, inline browser execution | Used for client-side vendor libraries (`pdf.min.js`, `docx-preview.min.js`, `mammoth.browser.min.js`) and runtime browser features. |
| **Python (v3.10+)** | `scripts/pdf2docx_convert.py` | Optional backend script used by `/api/convert/pdf-to-word` when running locally to execute high-fidelity PDF-to-Word conversions using `pdf2docx`. |
| **HTML5** | DOM structure across all pages | Semantic markup, file drop zones, canvas elements, video capture elements for QR scanning. |
| **CSS3** | `src/app/globals.css`, Tailwind utility classes | Design tokens, responsive grid/flexbox layouts, dark/light theme color switching, and print media rules for Word-to-PDF. |

---

## 2. Core Frameworks & Build Tools

### Next.js 16.4.0 (App Router & Turbopack)
- **Role**: The backbone web application framework.
- **Why Chosen**: 
  - Modern React Server Components architecture.
  - Native file-system routing under `src/app/`.
  - Next.js Turbopack build engine compiles all 59 static and dynamic routes in less than 4 seconds.
  - Serverless API routes (`/api/...`) live in the same codebase as frontend pages.
- **Licence**: MIT (Open Source).
- **Cost**: Free. Runs on Vercel's free tier with zero server costs.

### React 19.3.0 & React DOM
- **Role**: Frontend UI component rendering and reactive state management.
- **Why Chosen**: Industry standard declarative UI library. React 19 provides enhanced hooks (`useActionState`, optimized hydration, and concurrent rendering).
- **Licence**: MIT.

### Tailwind CSS v4 (`@tailwindcss/turbopack`)
- **Role**: Utility-first CSS styling engine.
- **Why Chosen**: Allows fast, consistent styling without writing thousands of lines of custom CSS. Version 4 features a pure CSS configuration with native Turbopack support.
- **Licence**: MIT.

---

## 3. Client-Side Libraries & Processing Engines

### 1. `pdf-lib` (v1.17.1)
- **Where Used**: `src/app/tools/pdf/merge`, `split`, `rotate`, `reorder`, `image-to-pdf`, `text-to-pdf`.
- **Purpose**: A pure JavaScript PDF creation and manipulation library.
- **Why Chosen**: It works 100% in the browser with zero external dependencies, zero Node.js native bindings, and zero C++ binaries. It can read, modify, and serialize PDFs in memory.
- **Licence**: MIT.

### 2. PDF.js (`pdfjsLib` v3.11.174)
- **Where Used**: `src/app/tools/pdf/to-jpg`, `to-ppt`, `to-text`, `compress`, `to-word`.
- **Purpose**: Mozilla's open-source PDF parsing and rendering engine.
- **Why Chosen**: The most battle-tested engine in existence for reading PDF binary streams, extracting text glyphs, identifying fonts, and rendering pages onto HTML5 `<canvas>` elements.
- **Licence**: Apache 2.0.

### 3. `jszip` (v3.10.2)
- **Where Used**: `src/app/tools/pdf/to-word`, `to-jpg`, `word-to-pdf`.
- **Purpose**: Creates, reads, and edits `.zip` archives directly in JavaScript.
- **Why Chosen**: Modern Microsoft Office documents (`.docx`, `.pptx`) are actually compressed ZIP archives containing XML files and assets. `jszip` allows ToolKit to build native `.docx` files by assembling WordprocessingML XML strings and zipping them in memory. It also bundles multi-page JPG exports into a single `.zip` download.
- **Licence**: MIT / GPLv3.

### 4. `qrcode` (v1.5.4)
- **Where Used**: `src/app/tools/qr/generator`, `wifi`, `vcard`, `file-share`.
- **Purpose**: QR code matrix calculation and rendering.
- **Why Chosen**: Extremely lightweight, highly customizable error correction levels (L, M, Q, H), supports direct rendering to HTML5 Canvas and Data URLs.
- **Licence**: MIT.

### 5. `docx-preview` (v0.3.4) & `mammoth` (v1.8.0)
- **Where Used**: `src/app/tools/pdf/word-to-pdf`.
- **Purpose**: Word document DOM rendering and HTML extraction.
- **Why Chosen**: `docx-preview` reads Microsoft Word `.docx` binary files and renders them as paginated HTML/CSS elements in the browser DOM. When paired with `@media print` CSS rules, users can export authentic PDFs directly from their browser print dialog. `mammoth` provides a resilient fallback parser.
- **Licence**: MIT.

### 6. `lucide-react` (v1.53.0)
- **Where Used**: Across all UI components, buttons, navigation, and badges.
- **Purpose**: Modern, consistent vector icons.
- **Why Chosen**: Lightweight, tree-shakeable SVG icons that inherit text colors and support responsive sizing.
- **Licence**: ISC (Open Source).

### 7. `next-themes` (v0.4.6)
- **Where Used**: `src/components/ThemeProvider.tsx`, `Header.tsx`.
- **Purpose**: Seamless light and dark mode switching without UI flashing.
- **Licence**: MIT.

---

## 4. Backend & Optional Services

### 1. Python `pdf2docx` Bridge (Optional Local Backend)
- **Where Used**: `scripts/pdf2docx_convert.py`, called by `src/app/api/convert/pdf-to-word/route.ts`.
- **Purpose**: PyMuPDF-based PDF to Word converter for self-hosted or local development environments.
- **Why Chosen**: Reconstructs tables, shapes, and paragraph flows with near-native desktop accuracy.
- **Safety / Fallback**: If Python is absent (such as on standard Vercel serverless), the API cleanly returns HTTP 503, and the user interface immediately engages its client-side JavaScript fallback without crashing.
- **Licence**: GPLv3.

### 2. File Sharing Storage Relays
- **Where Used**: `src/app/tools/qr/file-share`, `/api/file-share/upload`, `/api/file-share/download`.
- **Services**:
  1. **Primary**: `tmpfile.link` (Free Cloudflare R2 storage relay for files up to 100MB).
  2. **Fallback**: `upload.gofile.io` (Direct client-to-storage relay for oversized payloads).
- **Security Control**: Endpoints wrap all URLs in signed HMAC-SHA256 tokens and route downloads through in-app vanity links, blocking raw external redirects, private IPs, and malicious schemes.
- **Cost**: Free public tier, zero API billing accounts required.

---

## 5. Web Platform APIs (No Extra Dependencies Needed)

ToolKit intentionally leverages native browser APIs rather than adding bloated third-party dependencies:

1. **HTML5 Canvas API**: Used in `image/resize`, `image/compress`, `image/convert`, and `qr/generator` to manipulate pixel buffers, draw images, and export clean PNG/JPEG/WebP blobs.
2. **Web Crypto API (`window.crypto`)**: Generates cryptographically secure random values in `utilities/password-generator` and `developer/uuid`.
3. **Web Speech API (`window.speechSynthesis`)**: Powering `utilities/text-to-speech` with zero cloud API keys.
4. **MediaDevices API (`navigator.mediaDevices.getUserMedia`)**: Powers `qr/scanner` to capture live camera video frames for QR recognition.
5. **FileReader and Blob APIs**: Reads dropped user files as `ArrayBuffer`, `DataURL`, or `Text`, and creates downloadable objects via `URL.createObjectURL()`.

---

## 6. Financial & Licensing Summary

- **Total API Costs**: **$0.00** (Zero billable infrastructure, zero subscriptions).
- **Licence Type**: Permissive Open Source stack (primarily MIT and Apache 2.0).
- **Self-Hosting**: Completely portable. Can be run on any computer with `npm run dev` or deployed to Vercel, Netlify, Cloudflare Pages, or Docker with zero modification.
