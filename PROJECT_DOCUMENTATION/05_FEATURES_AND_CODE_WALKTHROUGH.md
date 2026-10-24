# 05. Features and Code Walkthrough — ToolKit

This guide walks through every major tool in the ToolKit repository. For each feature, you will learn the **implementation file**, **inputs**, **how the code processes the data**, **the output**, and any **technical limitations**.

---

## 1. PDF Tools (13 Tools)

### 1. Merge PDF
- **File**: `src/app/tools/pdf/merge/page.tsx`
- **Input**: Two or more `.pdf` files dropped or selected by the user.
- **Processing**:
  1. Reads all files into binary `ArrayBuffer`s using `FileReader`.
  2. Uses `pdf-lib`'s `PDFDocument.create()` to create a blank document.
  3. Iterates through each uploaded PDF, loading it with `PDFDocument.load(buffer)`.
  4. Calls `mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices())` to clone all pages.
  5. Appends each cloned page to the merged document in the exact order configured by the user.
- **Output**: A single combined `.pdf` file.
- **Limitations**: Password-encrypted PDFs must be decrypted before merging.

### 2. Split PDF
- **File**: `src/app/tools/pdf/split/page.tsx`
- **Input**: A single `.pdf` file and user-specified page ranges (e.g. `1, 3-5, 8`).
- **Processing**:
  1. Loads document using `pdf-lib`.
  2. Parses the page range string into a sanitized integer array with bounds checking against `doc.getPageCount()`.
  3. Creates a new `PDFDocument`, copies only the requested page indices, and saves as bytes.
- **Output**: A new smaller `.pdf` file containing only the extracted pages.

### 3. Compress PDF
- **File**: `src/app/tools/pdf/compress/page.tsx`
- **Input**: A `.pdf` file and an optimization preset (Extreme: 72 DPI, Recommended: 144 DPI, Light: 200 DPI).
- **Processing**:
  1. Uses PDF.js to render each page onto a temporary HTML5 Canvas at target DPI.
  2. Re-encodes canvas frames into compressed JPEG image streams.
  3. Embeds compressed page images into a new `pdf-lib` document with identical dimensions.
- **Output**: A compressed `.pdf` file, showing original size vs. new size and percentage saved.
- **Limitations**: Because it re-rasters pages to achieve true compression, selectable text on compressed pages becomes rasterized.

### 4. Rotate PDF
- **File**: `src/app/tools/pdf/rotate/page.tsx`
- **Input**: A `.pdf` file and rotation angle (+90°, +180°, +270°).
- **Processing**:
  1. Loads document with `pdf-lib`.
  2. Loops through `doc.getPages()` and calls `page.setRotation(degrees(currentRotation + angle))`.
  3. Saves the modified document into a byte array.
- **Output**: Rotated `.pdf` file.

### 5. Reorder PDF
- **File**: `src/app/tools/pdf/reorder/page.tsx`
- **Input**: A `.pdf` file.
- **Processing**:
  1. Renders thumbnail previews for every page using PDF.js onto small canvas elements.
  2. Allows users to drag and drop or click arrow buttons to reorder pages.
  3. Copies pages into a new `PDFDocument` in the updated sequence.
- **Output**: A reordered `.pdf` document.

### 6. Image to PDF
- **File**: `src/app/tools/pdf/image-to-pdf/page.tsx`
- **Input**: One or more image files (PNG, JPG, WebP).
- **Processing**:
  1. Reads image binary data into `pdf-lib`.
  2. Calls `doc.embedJpg(bytes)` or `doc.embedPng(bytes)`.
  3. Adds a new page matching the exact aspect ratio and dimensions of each image.
- **Output**: A multi-page `.pdf` where each page contains one high-resolution image.

### 7. Text to PDF
- **File**: `src/app/tools/pdf/text-to-pdf/page.tsx`
- **Input**: Raw text or pasted notes, plus font size, margin, and orientation settings.
- **Processing**:
  1. Splits input text into wrapped lines based on page width and character metrics using standard standard fonts (`Helvetica`, `TimesRoman`).
  2. Handles automated page overflow: when Y-coordinate reaches page margin, it automatically creates a new page.
- **Output**: Formatted `.pdf` document.

### 8. PPT to PDF & PDF to PPT
- **Files**: `src/app/tools/pdf/ppt-to-pdf/page.tsx` & `src/app/tools/pdf/to-ppt/page.tsx`
- **Processing**:
  - `to-ppt`: Renders PDF pages to high-res images, then packages them into standard `.pptx` XML slides using `jszip`.
  - `ppt-to-pdf`: Extracts embedded slide drawings/images and wraps them into paginated PDF pages.
- **Output**: Downloadable `.pptx` presentation or `.pdf` document.

### 9. PDF to JPG
- **File**: `src/app/tools/pdf/to-jpg/page.tsx`
- **Input**: A `.pdf` file and image quality setting.
- **Processing**:
  1. Loops through all pages using PDF.js.
  2. Draws each page onto an HTML5 canvas at 2x scale for crisp retina resolution.
  3. Converts canvas to JPEG blob (`canvas.toBlob("image/jpeg", quality)`).
  4. If multi-page: bundles all images into a single `.zip` file using `jszip`.
- **Output**: Single `.jpg` or `.zip` containing all page images.

### 10. PDF to Text
- **File**: `src/app/tools/pdf/to-text/page.tsx`
- **Input**: A `.pdf` file.
- **Processing**:
  1. Extracts text items from PDF.js `page.getTextContent()`.
  2. Preserves line breaks and basic paragraph structure.
- **Output**: Plain text preview with a "Copy to Clipboard" button and `.txt` file download.

### 11. Word to PDF
- **File**: `src/app/tools/pdf/word-to-pdf/page.tsx`
- **Input**: A `.docx` Word file.
- **Processing**:
  1. Primary Engine: Integrates Gotenberg LibreOffice headless service (`process.env.GOTENBERG_URL`) for pixel-perfect PDF vector conversion.
  2. Fallback Engine: Client-side `docx-preview` parses OpenXML directly into styled HTML elements inside a sandboxed container, with browser native print engine (`window.print()`).
  3. Provides an interactive embedded PDF previewer before download.
- **Output**: Direct print-to-PDF export and downloadable `.pdf` document.

### 12. PDF to Word
- **Files**: `src/app/tools/pdf/to-word/page.tsx`, `src/app/api/convert/pdf-to-word/route.ts`, `scripts/pdf2docx_convert.py`
- **Processing (Dual Engine)**:
  - **Stage 1 (Server API)**: Calls local Python `pdf2docx` subprocess for native desktop-grade table and layout reconstruction.
  - **Stage 2 (Browser Fallback)**: Extracts text runs with PDF.js, reconstructs fonts from binary `BaseFont` maps, groups lines using baseline clustering, tightens margins to 0.5 in, uses explicit page break runs (`<w:r><w:br w:type="page"/></w:r>`) to eliminate blank pages, and builds a valid `.docx` package using `jszip`.
  - **Live Preview**: Integrates interactive `docx-preview` reader with side-by-side comparison tabs toggling between the converted Word document and original PDF.
- **Output**: Editable Microsoft Word `.docx` file with real-time in-app viewer.

---

## 2. QR Code Suite (5 Tools)

### 1. QR Code Generator
- **File**: `src/app/tools/qr/generator/page.tsx`
- **Input**: Text, URL, Email, or Phone number, with foreground/background color picks and size sliders.
- **Processing**: Uses `qrcode` library to compute Reed-Solomon error correction and render to `<canvas>`.
- **Output**: Instant live preview and download as `.png` or `.svg`.

### 2. QR Code Scanner
- **File**: `src/app/tools/qr/scanner/page.tsx`
- **Input**: Live webcam feed or uploaded QR image.
- **Processing**:
  - Live mode: Requests `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })` and scans frames using canvas image data analysis.
  - File mode: Reads image into canvas and decodes matrix.
- **Output**: Decoded URL or text with one-click "Copy" and "Open Link" buttons.

### 3. Wi-Fi QR Generator
- **File**: `src/app/tools/qr/wifi/page.tsx`
- **Input**: Network SSID, Password, Encryption Type (WPA/WPA2, WEP, or Open), and Hidden network checkbox.
- **Processing**: Formats into standard Wi-Fi URI scheme: `WIFI:T:WPA;S:MyNetwork;P:MyPassword;;`.
- **Output**: QR code that smartphone cameras can scan to automatically join the network without typing the password.

### 4. vCard Contact QR
- **File**: `src/app/tools/qr/vcard/page.tsx`
- **Input**: Name, Phone, Email, Company, Job Title, Website, Address.
- **Processing**: Encodes data according to the vCard 3.0 standard (`BEGIN:VCARD ... END:VCARD`).
- **Output**: QR code that adds the contact directly to phone address books when scanned.

### 5. File Share QR
- **Files**: `src/app/tools/qr/file-share/page.tsx`, `download/page.tsx`, `src/lib/file-share.ts`, `/api/file-share/*`
- **Input**: Any file up to 100MB.
- **Processing**:
  1. Uploads to temporary storage relay (`tmpfile.link` or `gofile.io`).
  2. Generates HMAC-SHA256 token encoding safe metadata and expiration using a persistent key.
  3. **Phone-Ready Domain Routing**: When running in local development (`localhost`), automatically points the QR code to ToolKit's public domain (`https://toolkit.sgscreations.in` or `NEXT_PUBLIC_SITE_URL`) so mobile phone cameras can scan and download without encountering "localhost can't be reached" errors.
  4. Provides an interactive domain selector: 🌐 Phone Ready (Public Domain), 💻 Localhost (This PC), and 📡 Local Wi-Fi IP.
  5. Recipient scans QR, verifies token signature, and streams file cleanly without ads.
- **Output**: Shareable QR code and mobile-friendly download page.

---

## 3. Image Tools (3 Tools)

### 1. Image Compress
- **File**: `src/app/tools/image/compress/page.tsx`
- **Input**: PNG, JPG, or WebP image + Quality slider (10% - 100%).
- **Processing**: Draws image to HTML5 canvas and re-encodes via `canvas.toBlob("image/jpeg", quality)`. Displays interactive before/after side-by-side comparison with byte savings.
- **Output**: Compressed image blob.

### 2. Image Convert
- **File**: `src/app/tools/image/convert/page.tsx`
- **Input**: Image file + Desired target format (PNG, JPEG, WebP, GIF, BMP).
- **Processing**: Reads source image into an `Image` bitmap element and re-renders to the target format using Canvas API.
- **Output**: Converted image file.

### 3. Image Resize
- **File**: `src/app/tools/image/resize/page.tsx`
- **Input**: Image + target dimensions (width, height, percentage, or aspect ratio lock).
- **Processing**: Resizes canvas buffer with high-quality bicubic image smoothing (`ctx.imageSmoothingQuality = "high"`).
- **Output**: Resized image file.

---

## 4. Student & Academic Tools (6 Tools)

### 1. Scientific Calculator
- **File**: `src/app/tools/student/scientific-calculator/page.tsx`
- **Features**: Trigonometry (sin, cos, tan, radians/degrees), exponents, roots, factorial, log/ln, constants ($\pi$, $e$), calculation history ledger, and keyboard input support.
- **Implementation**: Built with a safe mathematical parser that tokenizes and evaluates expressions without using unsafe `eval()`!

### 2. GPA & CGPA Calculator
- **File**: `src/app/tools/student/gpa/page.tsx`
- **Features**: Add course rows (Course Name, Credits, Letter Grade). Computes weighted GPA = $\frac{\sum (\text{credits} \times \text{grade points})}{\sum \text{credits}}$. Supports multi-semester CGPA cumulative tracking.

### 3. Attendance Calculator
- **File**: `src/app/tools/student/attendance/page.tsx`
- **Features**: Input: Total Classes Held, Classes Attended, Required Target Percentage (e.g. 75%). Output: Current attendance status, how many consecutive future classes you can miss without dropping below the target, or how many future classes you MUST attend to reach the target.

### 4. Percentage Calculator
- **File**: `src/app/tools/student/percentage-calculator/page.tsx`
- **Features**: 4 dedicated calculator tabs: "What is X% of Y?", "X is what % of Y?", "% Increase/Decrease from X to Y", and "Discount / Tax calculator".

### 5. Case Converter & Word Counter
- **File**: `src/app/tools/student/case-converter/page.tsx`
- **Features**: Live transformations: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case, Alternating Case. Real-time statistics: Words, Characters, Sentences, Paragraphs, Estimated Reading Time (200 wpm), Estimated Speaking Time (130 wpm).

---

## 5. Developer Tools (7 Tools)

| Tool | File | What It Does |
|---|---|---|
| **JSON Formatter** | `src/app/tools/developer/json/page.tsx` | Validates, beautifies with 2-space or 4-space indentation, minifies, and detects JSON syntax errors with line/column markers. |
| **Hash Generator** | `src/app/tools/developer/hash/page.tsx` | Calculates cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) in real time using the browser's native `crypto.subtle` API. |
| **Markdown Preview** | `src/app/tools/developer/markdown/page.tsx` | Split-pane editor with live HTML preview, syntax shortcuts, safe HTML escaping against XSS, and `.md` file download. |
| **Regex Tester** | `src/app/tools/developer/regex/page.tsx` | Real-time regular expression tester with flag switches (`g`, `i`, `m`, `s`), match counter, and matched text highlight spans. |
| **URL Encoder/Decoder** | `src/app/tools/developer/url/page.tsx` | Converts text to URL-safe percent-encoding (`encodeURIComponent`) and decodes URL strings. |
| **UUID Generator** | `src/app/tools/developer/uuid/page.tsx` | Generates RFC4122 v4 cryptographically random UUIDs in bulk (1 to 100 at a time) with uppercase, lowercase, and hyphen options. |

---

## 6. Everyday Utilities (5 Tools)

| Tool | File | What It Does |
|---|---|---|
| **Barcode Generator** | `src/app/tools/utilities/barcode/page.tsx` | Generates standard barcodes (CODE128, EAN-13, UPC-A, Code 39) with custom height, line color, and text display. |
| **Password Generator**| `src/app/tools/utilities/password-generator/page.tsx` | Generates ultra-secure random passwords with length slider (8 - 64) and character toggles (A-Z, a-z, 0-9, symbols) using `window.crypto`. |
| **Text to Speech** | `src/app/tools/utilities/text-to-speech/page.tsx` | Reads text aloud using browser `window.speechSynthesis`. Lets users pick installed device voices, playback rate, and pitch. |
| **Unit Converter** | `src/app/tools/utilities/unit-converter/page.tsx` | Converts measurements across 7 categories: Length, Weight, Temperature, Area, Volume, Speed, and Digital Storage. |
