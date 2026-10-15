import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

// This route only works in local development or on a self-hosted Node.js server.
// On Vercel serverless it will return 503 and the client falls back to client-side conversion.

const PYTHON_SCRIPT = path.join(process.cwd(), "scripts", "pdf2docx_convert.py");
const TMP_DIR = path.join(os.tmpdir(), "toolkit-conversions");

async function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    await mkdir(TMP_DIR, { recursive: true });
  }
}

function findPython(): string {
  // Try common Python executables
  const candidates = ["python", "python3", "python3.11", "python3.10"];
  return candidates[0]; // spawn will fail gracefully if not found
}

async function runPythonConverter(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const python = findPython();
    const proc = spawn(/*turbopackIgnore: true*/ python, [PYTHON_SCRIPT, inputPath, outputPath], {
      timeout: 60_000, // 60 second max
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code === 0 && stdout.startsWith("OK:")) {
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
        error: `Could not start Python: ${err.message}. Python + pdf2docx must be installed.`,
      });
    });
  });
}

export async function POST(req: NextRequest) {
  // Check if the python script exists — fast fail on Vercel
  if (!existsSync(/*turbopackIgnore: true*/ PYTHON_SCRIPT)) {
    return NextResponse.json(
      { error: "Python backend not available on this deployment." },
      { status: 503 }
    );
  }

  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
    }

    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 50 MB)." }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // Verify PDF magic bytes (%PDF) to prevent arbitrary file processing
    const headerBytes = Buffer.from(arrayBuffer.slice(0, 5)).toString("ascii");
    if (!headerBytes.startsWith("%PDF")) {
      return NextResponse.json({ error: "Uploaded file is not a valid PDF document." }, { status: 400 });
    }

    await ensureTmpDir();
    const id = crypto.randomBytes(8).toString("hex");
    inputPath = path.join(TMP_DIR, `${id}.pdf`);
    outputPath = path.join(TMP_DIR, `${id}.docx`);

    // Write uploaded PDF to temp file
    await writeFile(inputPath, Buffer.from(arrayBuffer));

    // Run pdf2docx via Python subprocess
    const result = await runPythonConverter(inputPath, outputPath);

    if (!result.success) {
      return NextResponse.json(
        { error: "Document conversion failed. Ensure the PDF contains standard formatting." },
        { status: 500 }
      );
    }

    // Read the output DOCX
    const docxBuffer = await readFile(outputPath);
    const safeOriginalName = file.name.replace(/\.pdf$/i, "").replace(/[^\w.-]/g, "_").slice(0, 100) || "converted_document";

    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeOriginalName}.docx"; filename*=UTF-8''${encodeURIComponent(safeOriginalName)}.docx`,
        "Content-Length": docxBuffer.length.toString(),
        "X-Conversion-Engine": "pdf2docx",
      },
    });
  } catch (err: unknown) {
    console.error("[pdf-to-word API]", err);
    return NextResponse.json(
      { error: "Internal server error during conversion." },
      { status: 500 }
    );
  } finally {
    // Clean up temp files
    for (const f of [inputPath, outputPath]) {
      if (f && existsSync(/*turbopackIgnore: true*/ f)) {
        await unlink(f).catch(() => {});
      }
    }
  }
}

export const maxDuration = 60; // seconds — ignored on Vercel free tier (10s limit)
