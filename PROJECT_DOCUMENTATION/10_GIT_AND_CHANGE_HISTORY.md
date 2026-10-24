# 10. Git and Change History — ToolKit

This document provides a chronological analysis of the ToolKit repository's evolution, establishing **how the project was built, key architectural pivots, and why major changes occurred** based strictly on Git commit records.

---

## 1. Commit Log Chronology

| Commit | Date | Summary | Key Impact |
|---|---|---|---|
| **`7427b7e`** | 2026-10-09 | `Initial commit from Create Next App` | Standard Next.js baseline project initialization. |
| **`9ebeedf`** | 2026-10-09 | `feat: complete ToolKit suite with 38 tools...` | Built the foundational suite across PDF, QR, Image, Student, Dev, and Utility categories with unified styling. |
| **`e14dde1`** | 2026-10-10 | `feat: convert all tools to 100% in-browser client-side architecture...` | **Major Architectural Shift #1**: Shifted processing from heavy server endpoints to in-browser WebAssembly/JavaScript for free Vercel deployment. |
| **`bd8d96b`** | 2026-10-10 | `fix: remove experimental config flags in next.config.ts...` | Streamlined Next.js configuration to eliminate build warnings on Vercel. |
| **`e4c1e1d`** | 2026-10-10 | `feat: add custom ToolKit favicon icon and fix metadataBase...` | Injected proper OpenGraph `metadataBase` URLs and custom toolbox branding. |
| **`0a13c0c`** | 2026-10-10 | `fix: replace favicon with uploaded transparent toolbox icon` | Replaced white-background favicon with crisp transparent PNG toolbox graphic. |
| **`8a1591f`** | 2026-10-14 | `fix: word-to-pdf pipeline, true PDF compression engine...` | Replaced dummy compression with actual canvas re-rasterization and updated PPT icons. |
| **`dcdf9f0`** | 2026-10-14 | `fix: word-to-pdf blank white page resolution...` | Positioned rendering container directly in DOM flow to fix blank white page bugs. |
| **`12b7047`** | 2026-10-14 | `fix(word-to-pdf): eliminate left text clipping...` | Removed artificial negative margins causing text truncation on exported PDFs. |
| **`b6ff6d2`** | 2026-10-14 | `fix(word-to-pdf): render visible paper container directly with 48px padding...` | Standardized visual paper aspect ratios and margins. |
| **`ec2d2a4`** | 2026-10-14 | `fix(word-to-pdf): authentic paginated page-by-page PDF generation...` | Preserved document section page breaks. |
| **`a66de8f`** | 2026-10-14 | `feat: rewrite word-to-pdf (print dialog), add pdf-to-word, add file-share-qr...` | Switched Word-to-PDF to browser print engine, introduced initial PDF-to-Word and File Share QR. |
| **`6ffa0dd`** | 2026-10-15 | `fix: word-to-pdf inject docx-preview CSS...; pdf-to-word preserve font size/bold/italic` | Enhanced font attribute preservation during PDF text extraction. |
| **`1cf099b`** | 2026-10-15 | `fix: support up to 100MB file share QR with real progress bar...` | Upgraded file transfer limit to 100MB and added XMLHttpRequest progress listener. |
| **`ec35290`** | 2026-10-15 | `fix: replace ad-filled storage with direct clean Cloudflare R2 file downloads...` | Replaced third-party ad-heavy download links with clean Cloudflare R2 temporary storage. |
| **`41c9e4c`** | 2026-10-15 | `fix: route file sharing QR through in-app trusted download page...` | **Major Architectural Shift #2**: Routed all QR codes through `/tools/qr/file-share/download` to eliminate smartphone browser security warnings. |
| **`3e17a40`** | 2026-10-15 | `fix(pdf): isolate pages 1:1 in word-to-pdf and pdf-to-word...` | Prevented text from bleed-through across adjacent pages. |
| **`3317a5f`** | 2026-10-15 | `fix: PDF-to-Word binary font map and no white pages; Word-to-PDF no forced heights` | Extracted binary BaseFont mappings to restore original fonts (Times New Roman, Arial). |
| **`5a432c0`** | 2026-10-15 | `feat: PDF-to-Word API-first engine (pdf2docx) with browser fallback...` | **Major Architectural Shift #3**: Introduced dual-engine approach (local Python bridge + browser fallback). |
| **`8e9b5d7`** | 2026-10-15 | `fix(security): resolve Cloudflare audit findings - SSRF protection...` | **Major Security Hardening**: Implemented Cloudflare Security Audit standard (SSRF blocking, constant-time HMAC, CSP, HSTS, XSS sanitization). |
| **`f3a8b21`** | 2026-10-24 | `feat: high-fidelity docx-preview reader & margin optimization for PDF/Word` | Integrated interactive `docx-preview` document viewer, side-by-side original/converted comparison tabs, tightened margins to 0.5 in, and eliminated blank pages. |
| **`e7b9c42`** | 2026-10-24 | `fix(qr): phone-ready domain routing for file share QR on localhost` | Automatically routes localhost QR links through public domain (`toolkit.sgscreations.in`) so phone cameras scan and download without connection errors, with 1-click domain switcher. |
| **`a3d9f71`** | 2026-10-24 | `refactor: remove Gotenberg & server deps — pure client-side Word↔PDF conversions` | **Major Architectural Shift #4**: Removed all Gotenberg and server-side PDF conversion routes. Word-to-PDF and PDF-to-Word are now 100% in-browser using `docx-preview` + browser print and PDF.js + `jszip` respectively. Added pro-tip banners encouraging local ToolKit install or upcoming native app for complex layout fidelity. |

---

## 2. Key Architectural Pivots (Why the Code Changed)

### Pivot 1: Transition from Server-Heavy to In-Browser Processing
- **Before (`Commit 9ebeedf`)**: Early prototypes relied on server-side processing for heavy tasks.
- **The Challenge**: Hosting server-side converters requires persistent compute servers, high bandwidth, and billable cloud infrastructure. Furthermore, users were hesitant to upload private documents.
- **The Solution (`Commit e14dde1`)**: The architecture was pivoted to execute 95% of operations in client-side WebAssembly/JavaScript (`pdf-lib`, `canvas`, `pdf.js`). This made ToolKit 100% free to host on Vercel while guaranteeing complete user privacy.

### Pivot 2: In-App Vanity Download Page for QR File Sharing
- **Before (`Commit ec35290`)**: Scanning the QR code linked directly to the raw third-party storage URL.
- **The Challenge**: Modern smartphone camera apps (iOS Safari, Android Chrome) flagged direct downloads from raw storage domains as potential security risks, frightening users.
- **The Solution (`Commit 41c9e4c`)**: QR codes now link exclusively to ToolKit's branded in-app download page (`/tools/qr/file-share/download?token=...`). The phone opens a clean, trusted interface displaying file details and a verified "Download File" button, completely eliminating security warnings.

### Pivot 3: Dual-Engine PDF-to-Word Architecture
- **Before (`Commit 3317a5f`)**: PDF-to-Word was exclusively client-side. Complex tables and multi-column academic papers were challenging to parse with JavaScript alone.
- **The Solution (`Commit 5a432c0`)**: Implemented an "API-First with Seamless Fallback" architecture. When running locally with Python installed, it leverages `pdf2docx` for desktop-grade conversion. When running on Vercel (where Python is unavailable), the client catches the 503 response and seamlessly engages its browser extraction engine.

### Pivot 4: Cloudflare Security Audit Hardening
- **Before (`Commit 5a432c0`)**: Token secrets were static, external URLs were unvalidated, and security headers were incomplete.
- **The Solution (`Commit 8e9b5d7`)**: Implemented the official Cloudflare Security Audit standards. Hardened against SSRF by blocking all private IPs (`127.0.0.1`, `169.254.169.254`), enforced `timingSafeEqual` for cryptographic signatures, added HSTS and strict CSP headers, and sanitized document preview HTML against DOM XSS.

### Pivot 5: Phone-Ready QR Generation for Localhost Environments
- **The Challenge**: When developing or testing locally on `http://localhost:3000`, scanning the generated QR code with a smartphone camera pointed the mobile browser to `http://localhost:3000` on the phone itself, causing "This site can't be reached / connection refused" because the phone does not host the local server.
- **The Solution**: ToolKit automatically detects localhost development environments and routes QR codes through the verified public production domain (`https://toolkit.sgscreations.in`), backed by a persistent token secret. It also provides an interactive 1-click domain toggle (Phone Ready vs Localhost vs Local Wi-Fi IP) directly above the QR link box so developers can test across devices seamlessly.
