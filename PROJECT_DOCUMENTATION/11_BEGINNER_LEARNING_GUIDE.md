# 11. Beginner Learning Guide — ToolKit

If you are a student, junior engineer, or developer looking to understand how modern full-stack web applications work, ToolKit is a masterclass in practical web development.

This guide takes you on a structured learning journey using real code examples from this repository.

---

## Roadmap Overview

```
1. Next.js App Router  ──>  2. React Hooks  ──>  3. File & Blob APIs
         │                         │                    │
         ▼                         ▼                    ▼
4. Tailwind & CSS Tokens ──> 5. Binary Formats ──> 6. API Routes & Security
```

---

## Module 1: Next.js App Router & `"use client"`

### What is a Page in Next.js?
In Next.js, files inside `src/app/` automatically become web pages based on their folder names.
- `src/app/page.tsx` $\rightarrow$ `https://your-site.com/` (Homepage)
- `src/app/about/page.tsx` $\rightarrow$ `https://your-site.com/about`
- `src/app/tools/pdf/merge/page.tsx` $\rightarrow$ `https://your-site.com/tools/pdf/merge`

### What is `"use client"`?
By default in modern Next.js, components run on the server to generate fast static HTML. However, if a component needs **browser interactivity** (like dragging and dropping files, clicking buttons, using `useState`, or accessing `window`), it MUST have `"use client";` at the very top of the file!

**Real Example from `src/app/tools/pdf/merge/page.tsx`:**
```typescript
"use client"; // Tells Next.js: "This component runs inside the user's browser!"

import { useState } from "react";
// ...
```

---

## Module 2: React State & Hooks in the Real World

React components re-render automatically whenever their **state** changes.

### 1. `useState` (Tracking Dynamic Data)
When a user selects a file or toggles an option, we store that information in state:
```typescript
// From src/app/tools/pdf/compress/page.tsx:
const [file, setFile] = useState<File | null>(null);
const [compressionLevel, setCompressionLevel] = useState<"extreme" | "recommended" | "light">("recommended");
const [isProcessing, setIsProcessing] = useState<boolean>(false);
```
- When `setIsProcessing(true)` is called, React instantly shows a loading spinner on the screen.
- When `setIsProcessing(false)` is called, the spinner disappears and the download button appears.

### 2. `useRef` (Accessing the DOM Directly)
HTML `<input type="file" />` elements look ugly and cannot easily be styled. Professional websites hide the raw `<input>` and trigger it programmatically when the user clicks a styled drop-zone:
```typescript
const fileInputRef = useRef<HTMLInputElement>(null);

// When user clicks the custom styled box:
const handleClick = () => {
  fileInputRef.current?.click(); // Simulates clicking the hidden file input!
};
```

### 3. `useEffect` (Running Code on Mount)
`useEffect` runs once when the user opens the page. In ToolKit, we use it to load vendor scripts dynamically:
```typescript
useEffect(() => {
  // Load PDF.js script when page opens
  loadScript("/js/pdf.min.js", "https://cdnjs.cloudflare.com/...").then(() => {
    initPdfWorker();
  });
}, []); // Empty array [] means "run only once on initial mount"
```

---

## Module 3: Files, Blobs, and Memory in JavaScript

How do web browsers handle files without sending them to a server?

### What is an `ArrayBuffer`?
An `ArrayBuffer` is raw binary data in your computer's RAM. It is a sequence of bytes (`0` to `255`).

### What is a `Blob`?
A `Blob` (Binary Large Object) is an `ArrayBuffer` wrapped with a file type (MIME type).
```typescript
// Creating a PDF Blob in memory:
const pdfBytes = await pdfDoc.save(); // Uint8Array of bytes
const blob = new Blob([pdfBytes], { type: "application/pdf" });
```

### How Does the User Download It? (`URL.createObjectURL`)
The browser allows you to create a temporary virtual URL pointing to that memory Blob:
```typescript
const downloadUrl = URL.createObjectURL(blob);
// downloadUrl looks like: "blob:https://toolkit.com/8f3a12b4-..."

// Triggering download programmatically:
const a = document.createElement("a");
a.href = downloadUrl;
a.download = "merged-document.pdf";
a.click(); // Triggers browser download!

// CRITICAL: Clean up memory so RAM doesn't leak!
URL.revokeObjectURL(downloadUrl);
```

---

## Module 4: Design Tokens & Dark Mode

ToolKit uses **CSS Variables** defined in `src/app/globals.css` combined with Tailwind utility classes.

### Theme Tokens in `src/app/globals.css`:
```css
:root {
  --surface: #ffffff;
  --surface-tinted: #fcfbf9;
  --text-primary: #1c1917;
  --amber-primary: #d97706;
}

.dark {
  --surface: #1c1917;
  --surface-tinted: #141210;
  --text-primary: #f5f5f4;
  --amber-primary: #f59e0b;
}
```
In any component, you simply write:
```tsx
<div style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>
```
When `next-themes` toggles the `.dark` class on the `<html>` element, the entire interface instantly switches themes with zero page reload!

---

## Module 5: Manipulating Binary Files

### Example: How `pdf-lib` Merges Two PDFs
```typescript
import { PDFDocument } from "pdf-lib";

async function mergeTwoPdfs(pdf1Bytes: ArrayBuffer, pdf2Bytes: ArrayBuffer): Promise<Uint8Array> {
  // 1. Create a blank PDF document
  const mergedPdf = await PDFDocument.create();

  // 2. Load the two input PDFs
  const doc1 = await PDFDocument.load(pdf1Bytes);
  const doc2 = await PDFDocument.load(pdf2Bytes);

  // 3. Copy pages from doc1 and add to mergedPdf
  const doc1Pages = await mergedPdf.copyPages(doc1, doc1.getPageIndices());
  doc1Pages.forEach((page) => mergedPdf.addPage(page));

  // 4. Copy pages from doc2 and add to mergedPdf
  const doc2Pages = await mergedPdf.copyPages(doc2, doc2.getPageIndices());
  doc2Pages.forEach((page) => mergedPdf.addPage(page));

  // 5. Serialize to binary bytes
  return await mergedPdf.save();
}
```
*Notice how simple and elegant this is: no servers, no command-line tools, pure JavaScript!*

---

## Module 6: Next.js Serverless API Routes

When you do need server execution (like signing tokens or streaming uploads), Next.js allows you to write serverless route handlers in `route.ts`.

**Example from `src/app/api/file-share/upload/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file was provided." }, { status: 400 });
    }

    // Do server operations here...
    return NextResponse.json({ success: true, fileName: file.name });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

---

## Module 7: Web Security Principles to Remember

1. **Never trust client input**: In `/api/file-share/upload`, verify that external URLs start with `https:` and belong to trusted domains.
2. **Prevent Timing Attacks**: When verifying tokens or passwords, use `crypto.timingSafeEqual` rather than `===` or `!==`.
3. **Prevent Command Injection**: Never pass user-supplied strings directly to `exec("command " + userInput)`. Use `spawn(command, [arg1, arg2])` where arguments are passed as fixed array elements with no shell.
4. **Sanitize HTML Before Rendering**: If inserting user-supplied or document-generated HTML into the DOM, always strip `<script>` tags, `<iframe>`s, and `onerror=` attributes first.
