import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

export const maxDuration = 120; // 2 minutes max for large documents

/**
 * Dual-engine Word-to-PDF conversion:
 *  1. If GOTENBERG_URL is set → use LibreOffice via Gotenberg (production / Vercel)
 *  2. Else if the local Python/Word COM script exists → use it (local Windows dev)
 *  3. Else → 503 with a clear message
 */

// ── Local Windows engine ──────────────────────────────────────────────────────
const PYTHON_SCRIPT = path.join(process.cwd(), "scripts", "docx_to_pdf_win.py");
const TMP_DIR = path.join(os.tmpdir(), "toolkit-docx-to-pdf");

async function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    await mkdir(TMP_DIR, { recursive: true });
  }
}

function findPython(): string {
  // Prefer the specific Python install that has pywin32; fall back to PATH
  return "C:\\Users\\mahag\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
}

async function runWordConverter(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const python = findPython();
    const proc = spawn(python, [PYTHON_SCRIPT, inputPath, outputPath], {
      timeout: 120_000,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code === 0 && stdout.trim().startsWith("OK:")) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: stderr.trim() || `Process exited with code ${code}`,
        });
      }
    });

    proc.on("error", (err) => {
      resolve({
        success: false,
        error: `Could not start Python: ${err.message}`,
      });
    });
  });
}

// ── Gotenberg engine ──────────────────────────────────────────────────────────
async function convertViaGotenberg(
  arrayBuffer: ArrayBuffer,
  rawName: string,
  gotenbergUrl: string
): Promise<NextResponse> {
  const endpoint = `${gotenbergUrl.replace(/\/+$/, "")}/forms/libreoffice/convert`;
  const gotenbergFormData = new FormData();
  const fileBlob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  gotenbergFormData.append("files", fileBlob, rawName);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      body: gotenbergFormData,
      signal: AbortSignal.timeout(90_000),
    });
  } catch (networkErr: unknown) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    console.error("[docx-to-pdf] Gotenberg connection failed:", msg);
    return NextResponse.json(
      {
        error: `Could not connect to the Gotenberg conversion service at ${gotenbergUrl}. Please ensure the service is running.`,
        details: msg,
      },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[docx-to-pdf] Gotenberg HTTP ${res.status}:`, errText);
    let clientError = `Conversion failed (status ${res.status}).`;
    if (res.status === 413) {
      clientError = "Document exceeds the maximum size allowed by the Gotenberg server.";
    } else if (res.status === 400) {
      clientError = "Gotenberg rejected the document as invalid or unsupported.";
    } else if (errText.trim()) {
      clientError = `Gotenberg error: ${errText.slice(0, 200).trim()}`;
    }
    return NextResponse.json({ error: clientError, statusCode: res.status }, { status: 500 });
  }

  const pdfBuffer = await res.arrayBuffer();
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    return NextResponse.json(
      { error: "Conversion server returned an empty PDF." },
      { status: 500 }
    );
  }

  const baseName = rawName.replace(/\.docx$/i, "").trim() || "document";
  const safeBaseName = baseName.replace(/["\\r\\n\\t]/g, "_");
  const outputPdfName = `${safeBaseName}.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(outputPdfName)}"; filename*=UTF-8''${encodeURIComponent(outputPdfName)}`,
      "Content-Length": pdfBuffer.byteLength.toString(),
      "X-Conversion-Engine": "gotenberg-libreoffice",
    },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Parse multipart form data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data submission." }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "A DOCX document file is required." }, { status: 400 });
    }

    const rawName = file.name || "document.docx";
    const lowerName = rawName.toLowerCase();
    if (!lowerName.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Only Microsoft Word (.docx) files are supported." },
        { status: 400 }
      );
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File exceeds the 50 MB size limit." }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength < 4) {
      return NextResponse.json(
        { error: "Uploaded file is empty or corrupted." },
        { status: 400 }
      );
    }

    // Verify DOCX magic bytes (PK ZIP: 50 4B 03 04)
    const header = Buffer.from(arrayBuffer.slice(0, 4));
    if (header[0] !== 0x50 || header[1] !== 0x4b) {
      return NextResponse.json(
        { error: "The uploaded file is not a valid .docx document." },
        { status: 400 }
      );
    }

    // 2. Choose engine
    const gotenbergUrl = process.env.GOTENBERG_URL?.trim();

    if (gotenbergUrl) {
      // ── Engine A: Gotenberg (production / Vercel) ──
      console.log("[docx-to-pdf] Using Gotenberg engine:", gotenbergUrl);
      return await convertViaGotenberg(arrayBuffer, rawName, gotenbergUrl);
    }

    if (existsSync(PYTHON_SCRIPT)) {
      // ── Engine B: Local Windows Word COM ──
      console.log("[docx-to-pdf] Using local Word COM engine.");

      let inputPath: string | null = null;
      let outputPath: string | null = null;

      try {
        await ensureTmpDir();
        const id = crypto.randomBytes(8).toString("hex");
        inputPath = path.join(TMP_DIR, `${id}.docx`);
        outputPath = path.join(TMP_DIR, `${id}.pdf`);

        await writeFile(inputPath, Buffer.from(arrayBuffer));

        const result = await runWordConverter(inputPath, outputPath);

        if (!result.success) {
          console.error("[docx-to-pdf] Word COM failed:", result.error);
          return NextResponse.json(
            { error: "Word PDF conversion failed.", details: result.error },
            { status: 500 }
          );
        }

        const pdfBuffer = await readFile(outputPath);
        const safeName = rawName
          .replace(/\.docx$/i, "")
          .replace(/[^\w.\- ]/g, "_")
          .slice(0, 100) || "converted_document";

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${safeName}.pdf"; filename*=UTF-8''${encodeURIComponent(safeName)}.pdf`,
            "Content-Length": pdfBuffer.length.toString(),
            "X-Conversion-Engine": "word-com",
          },
        });
      } finally {
        for (const f of [inputPath, outputPath]) {
          if (f && existsSync(f)) {
            await unlink(f).catch(() => {});
          }
        }
      }
    }

    // 3. Neither engine available
    return NextResponse.json(
      {
        error:
          "Conversion service is not configured. Set the GOTENBERG_URL environment variable to a running Gotenberg instance (e.g., https://your-gotenberg.onrender.com), or run locally on Windows with Microsoft Word and pywin32 installed.",
        code: "NO_ENGINE",
      },
      { status: 503 }
    );
  } catch (err: unknown) {
    console.error("[docx-to-pdf] Unhandled error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during document conversion." },
      { status: 500 }
    );
  }
}
