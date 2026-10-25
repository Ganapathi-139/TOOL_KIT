import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const POWERSHELL_SCRIPT = path.join(process.cwd(), "scripts", "word2pdf_convert.ps1");
const TMP_DIR = path.join(os.tmpdir(), "toolkit-conversions");

async function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    await mkdir(TMP_DIR, { recursive: true });
  }
}

async function runWordConverter(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      return resolve({ success: false, error: "Native Word conversion is only available on Windows." });
    }

    const proc = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        POWERSHELL_SCRIPT,
        inputPath,
        outputPath,
      ],
      { timeout: 120_000 }
    );

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 && existsSync(outputPath)) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: stderr.trim() || stdout.trim() || `Process exited with code ${code}`,
        });
      }
    });

    proc.on("error", (err) => {
      resolve({
        success: false,
        error: `Could not start PowerShell converter: ${err.message}`,
      });
    });
  });
}

export async function POST(req: NextRequest) {
  // Fast fail on Vercel or non-Windows deployments
  if (process.platform !== "win32" || !existsSync(POWERSHELL_SCRIPT)) {
    return NextResponse.json(
      { error: "Native Word engine not available in this environment." },
      { status: 503 }
    );
  }

  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "A Word document file is required." }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".docx") && !name.endsWith(".doc")) {
      return NextResponse.json({ error: "Only .docx or .doc files are supported." }, { status: 400 });
    }

    const maxSize = 80 * 1024 * 1024; // 80 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 80 MB)." }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    await ensureTmpDir();

    const uniqueId = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const ext = name.endsWith(".doc") && !name.endsWith(".docx") ? ".doc" : ".docx";
    inputPath = path.join(TMP_DIR, `input-${uniqueId}${ext}`);
    outputPath = path.join(TMP_DIR, `output-${uniqueId}.pdf`);

    await writeFile(inputPath, Buffer.from(arrayBuffer));

    const result = await runWordConverter(inputPath, outputPath);

    if (!result.success || !existsSync(outputPath)) {
      return NextResponse.json(
        { error: result.error || "Word conversion failed." },
        { status: 500 }
      );
    }

    const pdfBuffer = await readFile(outputPath);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          file.name.replace(/\.[^/.]+$/, ".pdf")
        )}"`,
      },
    });
  } catch (err: unknown) {
    console.error("API Word-to-PDF error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal conversion failure." },
      { status: 500 }
    );
  } finally {
    if (inputPath && existsSync(inputPath)) {
      unlink(inputPath).catch(() => {});
    }
    if (outputPath && existsSync(outputPath)) {
      unlink(outputPath).catch(() => {});
    }
  }
}
