import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { checkRateLimit, isPowerPointBuffer, sanitizeFilename } from "@/lib/api-security";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const TIMEOUT_MS = 60000; // 60 seconds

function extractErrorMessage(stderr: string, fallback: string): string {
  const match = stderr.match(/ERROR:\s*(.+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  const lines = stderr.trim().split("\n").filter((l) => l.trim());
  return lines.length > 0 ? lines[lines.length - 1].trim() : fallback;
}

export async function POST(req: NextRequest) {
  // Rate limiting check
  const rate = checkRateLimit(req);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many conversion requests. Please wait a moment before trying again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let inputPath = "";
  let outputPath = "";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 50 MB size limit. Please choose a smaller file." },
        { status: 400 }
      );
    }

    const ext = file.name.toLowerCase();
    const isPptx = ext.endsWith(".pptx");
    const isPpt = ext.endsWith(".ppt");

    if (!isPptx && !isPpt) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload a valid PowerPoint presentation (.pptx or .ppt)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    // Magic byte signature verification
    if (!isPowerPointBuffer(bytes)) {
      return NextResponse.json(
        { error: "Invalid PowerPoint presentation signature. The file is corrupted or not a valid presentation." },
        { status: 400 }
      );
    }

    const tempDir = os.tmpdir();
    const id = crypto.randomUUID();
    inputPath = path.join(tempDir, `${id}_input.${isPptx ? "pptx" : "ppt"}`);
    outputPath = path.join(tempDir, `${id}_output.pdf`);

    await fs.writeFile(inputPath, Buffer.from(bytes));

    const scriptPath = path.join(process.cwd(), "src", "scripts", "ppt_to_pdf.py");

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("python", [scriptPath, inputPath, outputPath], {
        windowsHide: true,
      });

      let stderr = "";
      let isTimedOut = false;

      const timer = setTimeout(() => {
        isTimedOut = true;
        proc.kill();
        reject(new Error("Conversion timed out after 60 seconds."));
      }, TIMEOUT_MS);

      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      proc.on("close", (code) => {
        clearTimeout(timer);
        if (isTimedOut) return;
        if (code === 0) resolve();
        else reject(new Error(extractErrorMessage(stderr, `Process exited with code ${code}`)));
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    const outputBuffer = await fs.readFile(outputPath);
    const safeName = sanitizeFilename(file.name.replace(/\.pptx?$/i, ".pdf"), "presentation.pdf");

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    console.error("PPT to PDF conversion failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (inputPath) await fs.unlink(inputPath).catch(() => {});
    if (outputPath) await fs.unlink(outputPath).catch(() => {});
  }
}
