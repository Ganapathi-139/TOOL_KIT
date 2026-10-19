# 04. Architecture and Data Flow — ToolKit

This document explains the technical architecture of ToolKit, illustrating how user inputs, files, and state travel through the application with **Mermaid sequence and flow diagrams**.

---

## 1. High-Level System Architecture

ToolKit uses a **Hybrid Edge Architecture**. 95% of features execute strictly within the user's web browser, while serverless API routes handle external storage relaying and optional backend conversions:

```mermaid
graph TB
    subgraph ClientBrowser ["User Browser (Client)"]
        UI["React 19 UI & Next.js App Router"]
        Theme["next-themes (Dark / Light)"]
        WebEngines["Client-Side Engines (pdf-lib, pdf.js, jszip, qrcode, canvas)"]
        LocalMemory["Browser RAM (ArrayBuffer, Blob, ObjectURL)"]
    end

    subgraph StaticAssets ["Static Edge CDN"]
        PublicJS["Local Vendor Scripts (/public/js/*.js)"]
        Icons["Static Images & Icons (/public/*.ico, *.svg)"]
    end

    subgraph NextServer ["Next.js Server / Serverless Runtime"]
        APIPdfWord["/api/convert/pdf-to-word (Subprocess Bridge)"]
        APIShareUp["/api/file-share/upload (Token Signer)"]
        APIShareDown["/api/file-share/download (SSRF-Guarded Proxy)"]
    end

    subgraph ExternalServices ["External Storage Relays"]
        R2Storage["tmpfile.link (Cloudflare R2 Temporary Storage)"]
        GofileStorage["upload.gofile.io (Large File Direct Upload)"]
    end

    subgraph LocalHostOnly ["Local Self-Hosted Only"]
        PythonBridge["scripts/pdf2docx_convert.py (Python 3 + PyMuPDF)"]
    end

    UI --> WebEngines
    WebEngines --> LocalMemory
    UI --> Theme
    UI -. Loads Script Fallback .-> PublicJS
    
    UI -- "PDF to Word (Stage 1)" --> APIPdfWord
    APIPdfWord -. "Spawns (if local)" .-> PythonBridge
    
    UI -- "QR File Upload" --> APIShareUp
    APIShareUp -- "Forwards File" --> R2Storage
    UI -- "Direct Large Upload (>4.5MB)" --> GofileStorage
    
    UI -- "Download Shared File" --> APIShareDown
    APIShareDown -- "Stream Proxy (Verified Host)" --> R2Storage
    APIShareDown -. "Redirect (302)" .-> GofileStorage
```

---

## 2. Data Flow 1: 100% Client-Side In-Memory Tools

*(Applies to: Merge PDF, Split PDF, Rotate PDF, Reorder PDF, Compress Image, Resize Image, Convert Image, Scientific Calculator, Unit Converter, Hash Generator, etc.)*

In these tools, data never leaves the user's browser. Memory is allocated in RAM and automatically freed when completed:

```mermaid
sequenceDiagram
    actor User as User
    participant Browser as Browser UI (React)
    participant FileReader as Browser FileReader API
    participant Engine as In-Browser Engine (pdf-lib / Canvas)
    participant BlobStore as Browser Memory (Blob Storage)

    User->>Browser: Drags and drops file(s)
    Browser->>FileReader: readAsArrayBuffer(file)
    FileReader-->>Browser: Binary ArrayBuffer in RAM
    User->>Browser: Selects options (e.g., Rotation: 90°, Quality: 80%)
    User->>Browser: Clicks "Process / Convert"
    Browser->>Engine: Passes ArrayBuffer + Transformation parameters
    Note over Engine: Computations execute in JavaScript / WebAssembly
    Engine->>BlobStore: new Blob([processedData], { type: mimeType })
    BlobStore-->>Browser: In-memory Blob reference
    Browser->>Browser: downloadUrl = URL.createObjectURL(blob)
    Browser-->>User: Displays download button & preview
    User->>Browser: Clicks "Download"
    Browser-->>User: Browser saves file to local disk
    Note over Browser: URL.revokeObjectURL(downloadUrl) cleans RAM
```

---

## 3. Data Flow 2: Word to PDF Conversion Pipeline

Converting Microsoft Word documents to PDF in the browser without third-party server uploads requires a creative, high-fidelity browser pipeline:

```mermaid
flowchart TD
    A[User drops .docx file] --> B[FileReader reads ArrayBuffer]
    B --> C{docx-preview available?}
    
    C -- Yes --> D["docx-preview renders WordprocessingML into hidden container (#word-preview-host)"]
    C -- No (Fallback) --> E["mammoth.js converts docx to clean HTML"]
    
    D --> F["Sanitizer removes unsafe script/iframe/event tags"]
    E --> F
    
    F --> G["Injects paginated CSS: page size, @page rules, and @media print styles"]
    G --> H["User clicks 'Download PDF'"]
    H --> I["Opens isolated print window / iframe with render content"]
    I --> J["Triggers window.print()"]
    J --> K["User chooses 'Save as PDF' in native browser print engine"]
    K --> L[High-fidelity PDF generated locally on device]
```

---

## 4. Data Flow 3: Dual-Engine PDF to Word Pipeline

PDF-to-Word is one of the most mathematically complex conversions because PDFs store text glyphs with absolute X,Y coordinates rather than semantic paragraphs or words. ToolKit uses a **Dual-Engine Architecture**:

```mermaid
flowchart TD
    Start[User uploads PDF file] --> Validate{"Is PDF valid? (%PDF magic bytes)"}
    Validate -- No --> Error[Show 'Invalid PDF' Error]
    Validate -- Yes --> Stage1["Stage 1: Try Server API (/api/convert/pdf-to-word)"]
    
    Stage1 --> CheckPython{"Python & script available?"}
    CheckPython -- "Yes (Local/Self-hosted)" --> PyExec["Spawn scripts/pdf2docx_convert.py in child process"]
    PyExec --> PySuccess{"Exit code 0 & output exists?"}
    PySuccess -- Yes --> ReturnDocx[Return DOCX attachment directly to user]
    
    CheckPython -- "No / HTTP 503 (e.g., Vercel)" --> Fallback["Stage 2: Client-Side Fallback Engine"]
    PySuccess -- "Failed / Timeout" --> Fallback
    
    subgraph ClientEngine ["In-Browser Client-Side Reconstruction"]
        Fallback --> PDFJS["PDF.js loads PDF ArrayBuffer"]
        PDFJS --> FontMap["Extract binary BaseFont map (F1, F2 -> Real font names)"]
        FontMap --> TextExtract["Extract glyphs: x, y, width, height, fontName"]
        TextExtract --> LineCluster["Cluster text runs by Y-baseline coordinate"]
        LineCluster --> ParaCluster["Group lines into paragraphs based on vertical line gap"]
        ParaCluster --> ImageCheck{"Any text extracted?"}
        ImageCheck -- "0 text items, only images" --> ScannedAlert["Inform user: PDF is scanned/image-only, requires OCR"]
        ImageCheck -- "Text found" --> XMLGen["Generate OpenXML (word/document.xml, _rels/.rels, [Content_Types].xml)"]
        XMLGen --> JSZip["jszip packages XML into valid .docx binary Blob"]
    end
    
    JSZip --> ReturnClientDocx[User downloads reconstructed .docx directly in browser]
```

---

## 5. Data Flow 4: File Share QR Pipeline (End-to-End)

When a user wants to transfer a file (up to 100MB) from their laptop to their smartphone:

```mermaid
sequenceDiagram
    autonumber
    actor Sender as Sender (Laptop)
    participant Client as ToolKit Frontend
    participant ServerAPI as ToolKit /api/file-share/
    participant CloudStorage as Upstream Storage (tmpfile.link / gofile.io)
    actor Receiver as Receiver (Phone)

    Sender->>Client: Selects file (e.g., photo.jpg, 12MB)
    Client->>ServerAPI: POST /api/file-share/upload
    ServerAPI->>CloudStorage: Forwards binary to temporary storage
    CloudStorage-->>ServerAPI: Returns raw temporary download URL
    Note over ServerAPI: Generates HMAC-SHA256 Token (url + name + size + time)
    ServerAPI-->>Client: Returns JSON { token, fileName, size }
    Client->>Client: Generates QR Code for URL: https://toolkit.com/tools/qr/file-share/download?token={token}
    Sender->>Receiver: Receiver scans QR code with phone camera
    Receiver->>Client: Opens in-app vanity download page
    Client->>ServerAPI: GET /api/file-share/download?token={token}
    Note over ServerAPI: Validates HMAC signature with constant-time equality
    Note over ServerAPI: Blocks localhost, 127.0.0.1, 169.254.169.254, private IPs
    ServerAPI->>CloudStorage: Fetches raw file from verified storage host
    ServerAPI-->>Receiver: Streams file with RFC 5987 Content-Disposition header
    Receiver-->>Receiver: Phone downloads photo.jpg directly!
```

---

## 6. Memory Safety & Garbage Collection

Because heavy client-side processing can consume significant RAM (e.g., merging ten 15MB PDFs), ToolKit strictly enforces memory hygiene:

1. **Explicit Object URL Revocation**: Whenever a new download URL is generated (`URL.createObjectURL(blob)`), any previously existing URL is immediately revoked using `URL.revokeObjectURL(oldUrl)`. This signals to the browser garbage collector that the old Blob can be freed.
2. **Buffer Lifecycle**: ArrayBuffers are loaded inside local function scopes rather than stored in global state. Once the output document is assembled, the input buffers fall out of scope and are collected.
3. **Canvas Cleanup**: In image conversion and QR scanning, `<canvas>` dimensions and contexts are cleared before new operations.
