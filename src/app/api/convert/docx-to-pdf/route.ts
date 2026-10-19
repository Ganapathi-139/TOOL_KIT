import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

// This route converts DOCX → PDF using Microsoft Word COM automation (Windows + Word required).
// On Vercel / Linux / Word-not-installed systems it returns 503 and the client falls back
// to the browser docx-preview + print approach.

const PYTHON_SCRIPT = path.join(process.cwd(), "scripts", "docx_to_pdf_win.py");
const TMP_DIR = path.join(os.tmpdir(), "toolkit-docx-to-pdf");

async function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    await mkdir(TMP_DIR, { recursive: true });
  }
}

function findPython(): string {
  // Prefer the specific Python version with pywin32 installed; fall back to PATH
  const candidates = [
    "C:\\Users\\mahag\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
    "python",
    "python3",
  ];
  return candidates[0];
}

async function runWordConverter(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const python = findPython();
    const proc = spawn(/*turbopackIgnore: true*/ python, [PYTHON_SCRIPT, inputPath, outputPath], {
      timeout: 120_000, // Word can take 30-60s for large documents
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

export async function POST(req: NextRequest) {
  // Fast-fail if the Python script doesn't exist (not in local dev with scripts/ dir)
  if (!existsSync(/*turbopackIgnore: true*/ PYTHON_SCRIPT)) {
    return NextResponse.json(
      { error: "Word conversion backend not available on this deployment." },
      { status: 503 }
    );
  }

  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "A DOCX file is required." }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Only .docx files are supported for high-fidelity conversion." },
        { status: 400 }
      );
    }

    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 50 MB)." }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // Verify DOCX magic bytes (PK ZIP header: 50 4B 03 04)
    const header = Buffer.from(arrayBuffer.slice(0, 4));
    if (header[0] !== 0x50 || header[1] !== 0x4b) {
      return NextResponse.json(
        { error: "Uploaded file is not a valid .docx document." },
        { status: 400 }
      );
    }

    await ensureTmpDir();
    const id = crypto.randomBytes(8).toString("hex");
    inputPath = path.join(TMP_DIR, `${id}.docx`);
    outputPath = path.join(TMP_DIR, `${id}.pdf`);

    await writeFile(inputPath, Buffer.from(arrayBuffer));

    const result = await runWordConverter(inputPath, outputPath);

    if (!result.success) {
      console.error("[docx-to-pdf API] Word conversion failed:", result.error);
      return NextResponse.json(
        {
          error: "Word PDF conversion failed.",
          details: result.error,
        },
        { status: 500 }
      );
    }

    const pdfBuffer = await readFile(outputPath);
    const safeName = file.name
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
  } catch (err: unknown) {
    console.error("[docx-to-pdf API]", err);
    return NextResponse.json(
      { error: "Internal server error during conversion." },
      { status: 500 }
    );
  } finally {
    // Always clean up temp files
    for (const f of [inputPath, outputPath]) {
      if (f && existsSync(/*turbopackIgnore: true*/ f)) {
        await unlink(f).catch(() => {});
      }
    }
  }
}

export const maxDuration = 120; // 2 minutes max for large documents
