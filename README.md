# ToolKit 🛠️

A modern, fast, privacy-first web utility suite built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**.

ToolKit provides **38 essential everyday utilities** spanning PDF document processing, QR & barcode generation, image optimization, academic calculation tools, developer utilities, and productivity helpers.

Designed with a high-fidelity local processing architecture: standard utilities run **100% in-browser** without uploading files, and advanced document conversions (Word ↔ PDF, PDF ↔ PowerPoint) are driven by hardened local Python engines with strict security controls.

---

## ✨ Complete Tool Inventory (38 Tools Across 6 Categories)

### 📄 PDF Document Suite (13 Tools)
- **PDF to Word (.docx)** (`/tools/pdf/to-word`): High-fidelity PDF to Microsoft Word converter powered by `pdf2docx` preserving multi-column layouts, tables, and images.
- **Word to PDF** (`/tools/pdf/word-to-pdf`): Native `.docx` / `.doc` to PDF conversion engine with macro execution force-disabled.
- **PDF to PowerPoint (.pptx)** (`/tools/pdf/to-ppt`): Converts PDF slides into editable Microsoft PowerPoint presentations.
- **PowerPoint to PDF** (`/tools/pdf/ppt-to-pdf`): Converts `.pptx` / `.ppt` presentations directly into high-resolution PDF documents.
- **Merge PDF** (`/tools/pdf/merge`): Combine multiple PDF documents into a single file with custom drag-and-drop reordering.
- **Split PDF** (`/tools/pdf/split`): Extract specific page ranges or split PDFs into individual pages.
- **Compress PDF** (`/tools/pdf/compress`): Streamline PDF object streams and cross-references with transparent size savings.
- **Image to PDF** (`/tools/pdf/image-to-pdf`): Convert JPG, PNG, and WebP images to PDF with A4/Letter sizing and margin controls.
- **PDF to JPG / PNG** (`/tools/pdf/to-jpg`): Render every PDF page into high-resolution raster images in-browser.
- **PDF to Text** (`/tools/pdf/to-text`): Extract plain raw text from PDF files directly in the browser.
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

## 🔒 Security & Privacy Architecture

ToolKit is built according to defense-in-depth principles:

1. **Client-Side Processing First**: 34 of the 38 tools run **100% in-browser** using modern Web APIs (`FileReader`, `Canvas`, `Blob`, `WebCrypto`). No files or text leave the device.
2. **Strict File Signature (Magic Byte) Validation**: Conversion APIs reject files based on actual file headers (`%PDF-`, `PK\x03\x04`), preventing extension-spoofing and polyglot payloads.
3. **Automated Subprocess Hardening**: Word and PowerPoint conversion scripts execute with `AutomationSecurity = 3` (`msoAutomationSecurityForceDisable`) and `DisplayAlerts = False`, neutralizing potential malicious macros.
4. **Rate Limiting & DoS Protection**: API endpoints enforce sliding-window IP rate limiting (15 req/min per IP) to prevent server resource exhaustion.
5. **DOM XSS Sanitization**: Markdown and user input previewers escape HTML entities and strictly whitelist URL protocols (`http://`, `https://`, `mailto:`), blocking `javascript:` and `data:` schemes.
6. **HTTP Security Headers**: Production responses include `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and strict Referrer policies.
7. **Clean Dependencies**: Audited with `npm audit --omit=dev` for 0 vulnerabilities.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18+ or v20+ (Node.js 22/24 recommended)
- **Python**: v3.10+ (for Office & PDF conversion endpoints)
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Ganapathi-139/TOOL_KIT.git
cd tool-kit
npm install
```

Install Python dependencies for document conversion engines:

```bash
pip install pdf2docx pymupdf python-pptx pywin32
```

### Development Server

Run the Next.js development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Generate an optimized production build:

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
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # Root layout with ThemeProvider and font configuration
│   │   ├── page.tsx        # Homepage with hero, category highlights, and real-time search
│   │   ├── globals.css     # CSS design tokens, warm amber theme, and typography
│   │   ├── robots.ts       # Automated robots.txt generator
│   │   ├── sitemap.ts      # Automated dynamic sitemap.xml generator
│   │   ├── about/          # About page
│   │   ├── contact/        # Contact page
│   │   ├── privacy/        # Privacy policy (client-side processing declaration)
│   │   ├── terms/          # Terms of service
│   │   ├── api/            # Serverless conversion API endpoints
│   │   │   ├── pdf-to-word/
│   │   │   ├── word-to-pdf/
│   │   │   ├── pdf-to-ppt/
│   │   │   └── ppt-to-pdf/
│   │   └── tools/          # Dedicated tool routes and category hubs
│   │       ├── pdf/        # PDF suite (13 tools)
│   │       ├── qr/         # QR suite (4 tools)
│   │       ├── image/      # Image tools (3 tools)
│   │       ├── student/    # Academic utilities (6 tools)
│   │       ├── developer/  # Dev tools (7 tools)
│   │       └── utilities/  # Everyday utilities (5 tools)
│   ├── components/         # Reusable UI components (Header, Footer, Breadcrumb, ThemeProvider)
│   ├── lib/
│   │   ├── api-security.ts # Magic byte validation, rate limiting, and filename sanitization
│   │   └── tools-data.ts   # Central registry of categories, tools, icons, and metadata
│   ├── scripts/            # Hardened Python conversion microservices
│   │   ├── pdf_to_docx.py  # Layout-preserving PDF to DOCX
│   │   ├── word_to_pdf.py  # Office COM / LibreOffice Word to PDF
│   │   ├── pdf_to_pptx.py  # PDF to PowerPoint slides
│   │   └── ppt_to_pdf.py   # Office COM / LibreOffice PowerPoint to PDF
│   └── types/              # TypeScript definitions
├── next.config.ts          # Next.js config with HTTP security headers
├── eslint.config.mjs       # ESLint 9 configuration
├── package.json            # Scripts and dependencies
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
