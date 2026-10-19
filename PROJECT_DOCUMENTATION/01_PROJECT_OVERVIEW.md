# 01. Project Overview — ToolKit

Welcome to **ToolKit**, an open-source, modern, privacy-first web application that packs 39 essential daily tools into a single, cohesive dashboard.

ToolKit was designed to solve a common modern problem: **why should you upload your personal documents, student assignments, private images, or sensitive files to ad-filled, subscription-gated third-party websites just to perform simple operations like merging a PDF, resizing an image, or generating a QR code?**

ToolKit performs almost all operations directly **inside your browser** using modern Web APIs and WebAssembly. Your files never touch a remote server unless an explicit sharing or offline conversion workflow is triggered.

---

## 1. Core Purpose and Mission

1. **Privacy by Design**: Files processed in ToolKit (like PDFs, Word documents, images, and text) stay in your computer's RAM. They are not uploaded to a backend database, logged, or analyzed.
2. **Zero Subscriptions or Gimmicks**: Every tool is 100% free with no account creation, no paywalls, no artificial file size counters, and no spammy banner ads.
3. **Speed & Offline Capability**: Because computations happen client-side using JavaScript and WebAssembly, operations execute instantaneously without waiting for slow file uploads and downloads.
4. **Clean, Cohesive User Interface**: Built with a sleek dark/light theme, warm amber visual accents, consistent typography, and responsive mobile-ready layouts.

---

## 2. Target Users

ToolKit is built for four primary audiences:

| User Group | Needs & Daily Tasks | Key Tools Used |
|---|---|---|
| **Students & Academics** | Merging assignments, converting notes to PDF, calculating GPA, attendance tracking, scientific math. | Merge PDF, Text to PDF, GPA Calculator, Attendance Calculator, Scientific Calculator, Case Converter. |
| **Software Developers** | Formatting JSON, testing regex patterns, encoding URLs, inspecting hashes, generating UUIDs. | JSON Formatter, Regex Tester, Hash Generator, UUID Generator, Markdown Live Preview, Base64/URL. |
| **Office & Remote Workers** | Converting Word/PDF documents, compressing files for email, generating Wi-Fi or vCard QR codes, quick temporary file sharing. | Word to PDF, PDF to Word, PDF Compress, Wi-Fi QR, File Share QR, Barcode Generator. |
| **Everyday Users** | Resizing photos for passports or forms, image format conversion, password generation, unit conversions. | Image Resize, Image Compress, Image Convert, Password Generator, Unit Converter. |

---

## 3. High-Level Feature Overview

ToolKit organizes its 39 tools into **6 distinct categories**:

```
                       ┌─────────────────────────┐
                       │      TOOLKIT SUITE      │
                       └────────────┬────────────┘
                                    │
    ┌──────────────┬────────────────┼──────────────┬──────────────┬──────────────┐
    ▼              ▼                ▼              ▼              ▼              ▼
┌────────┐   ┌───────────┐    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│  PDF   │   │  QR CODE  │    │   IMAGE   │  │  STUDENT  │  │ DEVELOPER │  │ UTILITIES │
│(13 Tools)  │ (5 Tools) │    │ (3 Tools) │  │ (6 Tools) │  │ (7 Tools) │  │ (5 Tools) │
└────────┘   └───────────┘    └───────────┘  └───────────┘  └───────────┘  └───────────┘
```

### 1. PDF Suite (13 Tools)
- **Merge PDF**: Combine multiple PDF files into a single ordered document.
- **Split PDF**: Extract page ranges or specific individual pages.
- **Compress PDF**: Optimize and reduce PDF file size with adjustable compression presets.
- **Rotate PDF**: Rotate all or individual pages (90°, 180°, 270°).
- **Reorder PDF**: Visual drag-and-drop page reorganization.
- **Image to PDF**: Convert JPG, PNG, and WebP images into paginated PDF documents.
- **Text to PDF**: Transform plain text or markdown notes into downloadable PDFs.
- **PPT to PDF**: Convert PowerPoint slides into PDF document format.
- **PDF to JPG**: Render every page of a PDF into high-resolution JPG images.
- **PDF to PPT**: Export PDF presentation pages as PowerPoint slides.
- **PDF to Text**: Extract all readable text from any document without formatting.
- **Word to PDF**: High-fidelity in-browser DOCX rendering and print-to-PDF pipeline.
- **PDF to Word**: Dual-engine converter (offline Python bridge + smart client-side font and paragraph clustering fallback).

### 2. QR Code Suite (5 Tools)
- **QR Generator**: Custom QR codes for links, text, emails, and SMS with color customization.
- **QR Scanner**: Scan codes directly using your webcam/mobile camera or by dropping an image.
- **Wi-Fi QR**: Generate one-tap connection codes for WPA/WPA2/WEP networks.
- **vCard QR**: Create instant digital business cards containing contact details.
- **File Share QR**: Upload any file (up to 100MB) to generate an in-app shareable QR link and download page.

### 3. Image Suite (3 Tools)
- **Image Compress**: Compress PNG, JPG, and WebP files with visual quality sliders and instant side-by-side comparison.
- **Image Convert**: Instant format conversion between PNG, JPEG, WebP, GIF, and BMP.
- **Image Resize**: Resize images by pixel dimensions, percentage scaling, or fixed aspect ratios.

### 4. Student & Academic Suite (6 Tools)
- **Scientific Calculator**: Full math engine supporting trigonometry, logarithms, roots, and calculation history.
- **GPA Calculator**: Multi-semester GPA/CGPA calculator with grade scale customization.
- **Attendance Calculator**: Tracks current attendance percentage and predicts required classes to hit attendance targets (e.g. 75%).
- **Percentage Calculator**: Quick answers for percentage increases, discounts, fractions, and proportions.
- **Case Converter**: Toggle text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, and kebab-case.
- **Word & Character Counter**: Real-time analysis of words, characters, sentences, reading time, and speaking time.

### 5. Developer Suite (7 Tools)
- **JSON Formatter & Validator**: Beautify, minify, validate syntax, and spot JSON errors.
- **Hash Generator**: Cryptographic hash calculation (MD5, SHA-1, SHA-256, SHA-512) directly in-browser.
- **Markdown Live Preview**: Split-pane markdown editor with instant HTML rendering and one-click export.
- **Regex Tester**: Real-time regular expression matching with flag toggles and syntax highlighting.
- **URL Encoder / Decoder**: Safe URL component escaping and decoding.
- **UUID Generator**: RFC4122 v4 UUID generator with batch count and format options.
- **Base64 Converter**: Text and binary Base64 encoding/decoding.

### 6. Everyday Utilities (5 Tools)
- **Barcode Generator**: Generate CODE128, EAN, UPC, and Code39 barcodes for inventory and products.
- **Password Generator**: Secure, cryptographically random password generation with customizable entropy rules.
- **Text to Speech**: In-browser speech synthesis using the Web Speech API with voice and pitch controls.
- **Unit Converter**: Multi-unit converter across Length, Weight, Temperature, Area, Volume, Speed, and Data storage.
- **QR Tools Directory**: Quick access navigation hub for QR tools.

---

## 4. How the Application Works Under the Hood

### Client-Side Computation (The 95% Rule)
95% of ToolKit runs purely inside the visitor's browser. When a user drags a 20MB PDF into the "Merge PDF" tool:
1. JavaScript's `FileReader` API loads the binary data into an in-memory `ArrayBuffer`.
2. The client-side library `pdf-lib` inspects the PDF structure, copies the desired pages, and constructs a new PDF document.
3. The new PDF is saved into a memory `Blob` and exposed to the user via a temporary URL (`URL.createObjectURL(blob)`).
4. When the user clicks "Download", the browser saves the file directly from memory to their disk.
5. **No network requests are sent. No server resources are consumed. Privacy is 100% maintained.**

### Server-Side Endpoints (When Serverless is Actually Needed)
Only two features communicate with server endpoints:
1. **File Share QR (`/api/file-share/*`)**: When a user wants to send a file to a friend's phone via QR code, the file must temporarily reside in cloud storage so the phone can download it. ToolKit uses a signed token architecture and temporary storage relays (`tmpfile.link` or `gofile.io`) with automatic expiration.
2. **PDF to Word API (`/api/convert/pdf-to-word`)**: For users running ToolKit locally or on a private Node.js server, an optional Python script (`pdf2docx`) can be triggered for deep layout extraction. When hosted on Vercel (where Python is unavailable), the tool automatically detects this and falls back to its smart browser engine without failing.

---

## 5. Summary

ToolKit combines the simplicity of single-purpose utilities with the cohesive experience of a premium modern web application. It eliminates tracking, removes subscription walls, respects user privacy, and provides instantaneous results on any desktop or mobile device.
