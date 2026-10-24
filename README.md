# ToolKit — Free, Privacy-First Online Tools Suite

<p align="center">
  <img src="public/icon.png" width="96" height="96" alt="ToolKit Logo" />
</p>

<p align="center">
  <strong>39 fast, free, in-browser utilities for students, developers, and office workers.</strong><br>
  No sign-ups. No subscriptions. No ads. 100% client-side processing by design.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4.0-black?style=flat&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
</p>

---

## 🌟 Why ToolKit?

Most online tool websites force you to upload sensitive contracts, student papers, or personal photos to remote cloud servers laden with subscription paywalls and invasive banner ads.

**ToolKit does things differently:**
- 🔒 **Privacy-First**: 100% of document processing happens inside your browser's RAM using WebAssembly and modern JavaScript APIs. Your documents never touch our servers.
- ⚡ **Instant Execution**: Because computations run locally on your device, operations execute immediately without waiting for slow upload and download queues.
- 🎯 **Zero Subscriptions or Paywalls**: Every single tool is free and accessible with no file size counters or account creation required.
- 🎨 **Modern Interface**: Designed with warm amber visual accents, smooth responsive layouts, and seamless dark/light theme switching.

---

## 🛠️ Complete Tools Catalogue (39 Tools)

### 📄 PDF Tools (13)
| Tool | Description |
|---|---|
| **Word to PDF** | 100% browser-native conversion with OpenXML preview and print-to-PDF export. Zero server dependency. |
| **PDF to Word** | Client-side text & layout extraction into editable DOCX. Optional offline Python engine for enhanced table fidelity. |
| **Merge PDF** | Combine multiple PDF files into one ordered document with live preview. |
| **Split PDF** | Multi-case range splitting (`1-2, 3-5`), burst all pages, live preview & ZIP download. |
| **Compress PDF** | Reduce PDF file size with adjustable DPI compression presets and before/after preview. |
| **Rotate PDF** | Permanently rotate pages (90°, 180°, 270°) with live PDF preview. |
| **Reorder PDF** | Drag and drop visual thumbnail reorganization with live PDF preview. |
| **Image to PDF** | Convert JPG, PNG, and WebP images into paginated PDFs. |
| **Text to PDF** | Convert plain text or notes into formatted PDF documents. |
| **PPT to PDF** | Convert presentations into shareable PDF format. |
| **PDF to JPG** | Extract high-resolution images of each page (single or ZIP). |
| **PDF to PPT** | Convert PDF presentation pages into PowerPoint slides. |
| **PDF to Text** | Extract all readable text from documents without formatting. |

### 📱 QR Code Tools (5)
| Tool | Description |
|---|---|
| **File Share QR** | Share files up to 100MB via secure vanity QR download links with smart phone-ready domain routing. |
| **QR Generator** | Generate custom QR codes for URLs, text, and phone numbers. |
| **QR Scanner** | Scan codes live with camera or upload image files. |
| **Wi-Fi QR** | Create one-tap join codes for WPA/WPA2/WEP networks. |
| **vCard QR** | Generate digital contact cards compatible with mobile address books. |

### 🖼️ Image Tools (3)
| Tool | Description |
|---|---|
| **Image Compress** | Compress PNG, JPG, and WebP images with interactive side-by-side comparison. |
| **Image Convert** | Convert between PNG, JPEG, WebP, GIF, and BMP formats. |
| **Image Resize** | Scale images by dimensions, percentages, or locked aspect ratios. |

### 🎓 Student Tools (6)
| Tool | Description |
|---|---|
| **Scientific Calculator** | Trigonometry, logarithms, roots, and calculation history. |
| **GPA Calculator** | Semester GPA and cumulative CGPA calculation with custom credit weighting. |
| **Attendance Calculator** | Track class attendance and calculate target class attendance goals. |
| **Percentage Calculator** | Calculate percentages, discounts, taxes, and percentage changes. |
| **Case Converter** | Toggle between UPPERCASE, lowercase, Title Case, camelCase, snake_case. |
| **Word Counter** | Real-time counts of words, characters, sentences, and estimated reading time. |

### 💻 Developer Tools (7)
| Tool | Description |
|---|---|
| **JSON Formatter** | Validate, beautify, and minify JSON data with error indicators. |
| **Hash Generator** | Calculate MD5, SHA-1, SHA-256, and SHA-512 cryptographic hashes. |
| **Markdown Preview** | Live split-pane markdown editor with instant HTML rendering and export. |
| **Regex Tester** | Real-time regex pattern testing with flag toggles and match counters. |
| **URL Encoder/Decoder** | Safe URL-encoding and decoding for strings and parameters. |
| **UUID Generator** | Generate RFC4122 v4 cryptographically random UUIDs in bulk. |
| **Base64 Converter** | Encode and decode binary data and text strings to Base64. |

### 🔧 Everyday Utilities (5)
| Tool | Description |
|---|---|
| **Barcode Generator** | Generate CODE128, EAN, and UPC barcodes for products and inventory. |
| **Password Generator** | Generate cryptographically strong random passwords with custom entropy rules. |
| **Text to Speech** | Read text aloud using native Web Speech voices with pitch and rate controls. |
| **Unit Converter** | Multi-unit conversion across Length, Weight, Temp, Area, Volume, Speed, and Data. |
| **Pomodoro Timer** | Focus session timer with customizable work/break intervals and session metrics. |

---

## 🏗️ Architecture & Technology Stack

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)
- **PDF Engine**: [`pdf-lib`](https://pdf-lib.js.org/) and [`pdf.js`](https://mozilla.github.io/pdf.js/)
- **Word / OpenXML Engine**: [`jszip`](https://stuk.github.io/jszip/) and [`docx-preview`](https://github.com/VolodymyrBaydalka/docxjs)
- **Security**: Strict Content-Security-Policy (CSP), HSTS, timing-safe HMAC token verification (`timingSafeEqual`), and SSRF private IP blocking.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version `20.x` or higher
- **npm**: Version `10.x` or higher

### 1. Clone the repository
```bash
git clone https://github.com/Ganapathi-139/TOOL_KIT.git
cd TOOL_KIT
```

### 2. Install dependencies
```bash
npm install
```

### 3. (Optional) Set up environment variables
```bash
cp .env.example .env.local
```
Configure your custom variables if needed (e.g. `FILE_SHARE_SECRET`).

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Available Scripts

| Script | Command | Purpose |
|---|---|---|
| **Development** | `npm run dev` | Starts local Next.js Turbopack dev server. |
| **Typecheck** | `npx tsc --noEmit` | Runs strict TypeScript compiler check across all routes. |
| **Lint** | `npm run lint` | Runs ESLint analysis for code quality and Next.js Core Web Vitals. |
| **Build** | `npm run build` | Compiles optimized production bundle. |
| **Start** | `npm run start` | Serves compiled production build locally. |

---

## 🚢 Deployment

### 1-Click Deployment on Vercel (Recommended)
ToolKit is pre-configured for seamless deployment on Vercel:
1. Push your repository to GitHub.
2. Import the project on [Vercel](https://vercel.com/new).
3. Vercel automatically detects Next.js settings. Click **Deploy**.

*Note: For self-hosted VPS or Docker deployments, detailed guides are available in [`PROJECT_DOCUMENTATION/07_DEPLOYMENT_AND_HOSTING.md`](PROJECT_DOCUMENTATION/07_DEPLOYMENT_AND_HOSTING.md).*

---

## 📖 Complete Documentation Suite

Comprehensive architectural, security, and developer guides are included in the [`PROJECT_DOCUMENTATION/`](PROJECT_DOCUMENTATION/) directory:
- `01_PROJECT_OVERVIEW.md` — Purpose and feature deep-dive
- `02_TECH_STACK.md` — Complete library and API breakdown
- `03_FOLDER_AND_FILE_GUIDE.md` — Repository directory guide
- `04_ARCHITECTURE_AND_DATA_FLOW.md` — Architecture diagrams & data flow
- `05_FEATURES_AND_CODE_WALKTHROUGH.md` — Code-level tool implementations
- `06_SETUP_AND_COMMANDS.md` — Setup and troubleshooting
- `07_DEPLOYMENT_AND_HOSTING.md` — Hosting & serverless limitations
- `08_SECURITY_AND_PRIVACY.md` — Threat mitigations and security headers
- `09_TESTING_AND_KNOWN_ISSUES.md` — Test evidence and known limitations
- `10_GIT_AND_CHANGE_HISTORY.md` — Evolution & architectural pivots
- `11_BEGINNER_LEARNING_GUIDE.md` — Step-by-step developer tutorial
- `12_NEXT_STEPS.md` — Maintenance & roadmap

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
