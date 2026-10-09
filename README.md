# ToolKit 🛠️

A modern, fast, privacy-first web utility suite built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**.

ToolKit provides **37 essential everyday utilities** spanning PDF document tools, QR & barcode generation, image optimization, academic calculation tools, developer utilities, and productivity helpers.

Designed with a **100% client-side, browser-native processing architecture**: every tool—including document conversions like Word to PDF, PDF to PowerPoint, and PowerPoint to PDF—executes directly inside the user's browser. No file uploads, no remote servers, no cloud costs, and zero data leakage.

---

## ✨ Available Tools (37 Tools Across 6 Categories)

### 📄 PDF Document Suite (12 Tools)
- **Word to PDF** (`/tools/pdf/word-to-pdf`): Parse Microsoft Word (.docx) files in-browser and export clean, formatted PDF documents with custom margins and vector typography.
- **PDF to PowerPoint (.pptx)** (`/tools/pdf/to-ppt`): Convert PDF document pages into presentation-ready Microsoft PowerPoint slides using client-side OpenXML presentation generation.
- **PowerPoint to PDF** (`/tools/pdf/ppt-to-pdf`): Convert PowerPoint presentations (.pptx) into paginated PDF documents directly in the browser.
- **Merge PDF** (`/tools/pdf/merge`): Combine multiple PDF documents into a single file with custom drag-and-drop ordering.
- **Split PDF** (`/tools/pdf/split`): Extract specific page ranges or split PDFs into individual pages.
- **Compress PDF** (`/tools/pdf/compress`): Streamline PDF object streams and cross-references with transparent size savings.
- **Image to PDF** (`/tools/pdf/image-to-pdf`): Convert JPG, PNG, and WebP images to PDF with A4/Letter sizing and margin controls.
- **PDF to JPG / PNG** (`/tools/pdf/to-jpg`): Render every PDF page into high-resolution images in-browser via PDF.js.
- **PDF to Text** (`/tools/pdf/to-text`): Extract plain Unicode text from PDF files directly in the browser.
- **Text to PDF** (`/tools/pdf/text-to-pdf`): Format raw text and generate clean, downloadable PDF documents.
- **Rotate PDF** (`/tools/pdf/rotate`): Rotate pages by 90°, 180°, or 270° across all pages, odd/even, or custom page selections.
- **Reorder & Delete Pages** (`/tools/pdf/reorder`): Visually reorder, extract, or delete specific pages before saving.

### 📱 QR & Barcode Tools (4 Tools)
- **QR Code Generator** (`/tools/qr/generator`): Custom QR codes for URLs, text, email, and phone with instant PNG/SVG export.
- **Wi-Fi QR Code** (`/tools/qr/wifi`): Instant Wi-Fi connection QR code for guests (supporting WPA/WPA2/WEP/Open).
- **vCard QR Code** (`/tools/qr/vcard`): Encode contact address book cards (Name, Phone, Email, Org, Address).
- **QR Code Scanner** (`/tools/qr/scanner`): Scan and decode QR codes via live webcam or uploaded image files.

### 🖼️ Image Utilities (3 Tools)
- **Image Resizer & Transformer** (`/tools/image/resize`): Resize dimensions, lock aspect ratios, rotate, flip, and strip EXIF metadata.
- **Image Compressor** (`/tools/image/compress`): Compress JPG, PNG, and WebP with quality sliders and immediate size previews.
- **Image Converter** (`/tools/image/convert`): Convert images between PNG, JPEG, and WebP formats using browser canvas rendering.

### 🎓 Student & Academic Tools (6 Tools)
- **CGPA & SGPA Calculator** (`/tools/student/gpa`): Calculate semester SGPA and cumulative CGPA across various grading scales.
- **Attendance Tracker** (`/tools/student/attendance`): Track class attendance percentages, bunk margin, and target forecasting.
- **Scientific Calculator** (`/tools/student/scientific-calculator`): Trigonometric functions, logarithms, powers, roots, and calculation tape.
- **Percentage Calculator** (`/tools/student/percentage-calculator`): Calculate ratios, marks percentages, and percentage increase/decrease.
- **Word Counter** (`/tools/student/word-counter`): Real-time word, character, sentence, paragraph, and reading-time metrics.
- **Text Case Converter** (`/tools/student/case-converter`): Convert between UPPERCASE, lowercase, Title Case, camelCase, snake_case, and kebab-case.

### 💻 Developer Tools (7 Tools)
- **JSON Formatter & Validator** (`/tools/developer/json`): Indent, validate, minify, and inspect JSON with exact line/column syntax errors.
- **Base64 Encoder/Decoder** (`/tools/developer/base64`): Encode and decode text or binary strings safely in-browser.
- **Regex Tester** (`/tools/developer/regex`): Live regular expression tester with match highlighting and regex capture groups.
- **Cryptographic Hash Generator** (`/tools/developer/hash`): Generate SHA-1, SHA-256, SHA-384, and SHA-512 digests via WebCrypto.
- **UUID / GUID Generator** (`/tools/developer/uuid`): Generate cryptographically secure RFC 4122 v4 UUIDs in bulk.
- **URL Encoder/Decoder** (`/tools/developer/url`): Percent-encode URLs and parse query parameter tables.
- **Markdown Editor & Preview** (`/tools/developer/markdown`): Live split-pane markdown editor with HTML preview, XSS sanitization, and file download.

### ⏱️ Everyday Utilities (5 Tools)
- **Password Generator** (`/tools/utilities/password-generator`): Hardware-random high-entropy password generator with security strength meter.
- **Code-128 Barcode Generator** (`/tools/utilities/barcode`): Generate standard 1D linear barcodes with custom dimensions and export options.
- **Text to Speech** (`/tools/utilities/text-to-speech`): Natural voice synthesis with speed and pitch controls via the Web Speech API.
- **Unit Converter** (`/tools/utilities/unit-converter`): Convert length, mass, temperature, area, volume, and digital storage.
- **Pomodoro Timer** (`/tools/utilities/pomodoro`): Productivity focus timer with work/break intervals and session tracking.

---

## 🔒 Privacy & Security

ToolKit is built on a strict privacy model:

1. **100% Client-Side In-Browser Execution**: All 37 tools run purely on the user's machine using modern Web APIs (`FileReader`, `Canvas`, `Blob`, `WebCrypto`, `DOMParser`), `pdf-lib`, and `jszip`.
2. **Zero Server Uploads**: No files, text, images, or documents are ever transmitted to any server. Complete data confidentiality.
3. **DOM XSS Sanitization**: User previewers (Markdown, text tools) escape HTML entities and strictly whitelist safe URL protocols (`http://`, `https://`, `mailto:`), preventing script injection.
4. **HTTP Security Headers**: Configured with `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and strict Referrer policies.
5. **Zero Vulnerabilities**: 0 vulnerabilities reported by `npm audit --omit=dev`.

---

## ⚡ 1-Click Free Deployment on Vercel

Because all tools are 100% browser-native with zero backend server dependencies or serverless limits:

1. Push your code to GitHub (or fork this repo).
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository (`Ganapathi-139/TOOL_KIT`).
4. Set **Root Directory** to `tool-kit` (if repository contains subfolders) or leave as `./`.
5. Click **Deploy** — your app will be live within seconds on Vercel's global CDN at $0 cost!

---

## 🚀 Local Development

### Prerequisites
- **Node.js**: v18.18+ or v20+ (Node.js 22/24 recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Ganapathi-139/TOOL_KIT.git
cd tool-kit
npm install
```

### Development Server

Run the development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Generate an optimized static production build:

```bash
npm run build
npm start
```

---

## 🏗️ Project Architecture

```
tool-kit/
├── public/                 # Static assets, logos, and icons
├── src/
│   ├── app/                # Next.js App Router (All 100% Client-Side Routes)
│   │   ├── layout.tsx      # Root layout with ThemeProvider and font configuration
│   │   ├── page.tsx        # Homepage with hero, category highlights, and real-time search
│   │   ├── globals.css     # CSS design tokens, warm amber theme, and typography
│   │   ├── robots.ts       # Automated robots.txt generator
│   │   ├── sitemap.ts      # Automated dynamic sitemap.xml generator
│   │   ├── about/          # About page
│   │   ├── contact/        # Contact page
│   │   ├── privacy/        # Privacy policy (client-side processing declaration)
│   │   ├── terms/          # Terms of service
│   │   └── tools/          # Dedicated tool routes and category hubs
│   │       ├── pdf/        # PDF suite (12 tools)
│   │       ├── qr/         # QR suite (4 tools)
│   │       ├── image/      # Image tools (3 tools)
│   │       ├── student/    # Academic utilities (6 tools)
│   │       ├── developer/  # Dev tools (7 tools)
│   │       └── utilities/  # Everyday utilities (5 tools)
│   ├── components/         # Reusable UI components (Header, Footer, Breadcrumb, ThemeProvider)
│   ├── lib/
│   │   └── tools-data.ts   # Central registry of categories, tools, icons, and metadata
│   └── types/              # TypeScript definitions
├── next.config.ts          # Next.js config with HTTP security headers
├── eslint.config.mjs       # ESLint 9 configuration
├── package.json            # Dependencies (pure client-side: pdf-lib, jszip, qrcode)
└── tsconfig.json           # TypeScript configuration
```

---

## 🎨 Design System

- **Palette**: Warm amber accents (`#D97706`, `#B45309`) with harmonious stone neutrals.
- **Theme**: Automatic dark and light mode toggle with system preference detection via `next-themes`.
- **Typography**: Clean, accessible sans-serif hierarchy optimized for productivity.
- **Responsive**: Fully responsive layouts verified across mobile (375px+), tablet, and desktop viewports.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
