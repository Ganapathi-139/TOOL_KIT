import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120; // 2 minutes max for large documents

/**
 * Server-side Word to PDF conversion route powered by LibreOffice via Gotenberg.
 * Requires the `GOTENBERG_URL` environment variable pointing to a running Gotenberg instance.
 */
export async function POST(req: NextRequest) {
  try {
    const gotenbergUrl = process.env.GOTENBERG_URL?.trim();

    // 1. Check if the Gotenberg conversion service is configured
    if (!gotenbergUrl) {
      return NextResponse.json(
        {
          error:
            "Conversion service is not configured. Please set the GOTENBERG_URL environment variable to a running Gotenberg instance (e.g., https://your-gotenberg.onrender.com).",
          code: "GOTENBERG_URL_MISSING",
        },
        { status: 503 }
      );
    }

    // 2. Parse and validate multipart form data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid form data submission." },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "A DOCX document file is required." },
        { status: 400 }
      );
    }

    const rawName = file.name || "document.docx";
    const lowerName = rawName.toLowerCase();
    if (!lowerName.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Only Microsoft Word (.docx) files are supported." },
        { status: 400 }
      );
    }

    // Size limit: 50 MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File exceeds the 50 MB size limit." },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength < 4) {
      return NextResponse.json(
        { error: "Uploaded file is empty or corrupted." },
        { status: 400 }
      );
    }

    // Verify DOCX magic bytes (PK ZIP header: 50 4B 03 04)
    const header = Buffer.from(arrayBuffer.slice(0, 4));
    if (header[0] !== 0x50 || header[1] !== 0x4b) {
      return NextResponse.json(
        { error: "The uploaded file is not a valid .docx document." },
        { status: 400 }
      );
    }

    // 3. Prepare Gotenberg LibreOffice conversion request
    const endpoint = `${gotenbergUrl.replace(/\/+$/, "")}/forms/libreoffice/convert`;
    const gotenbergFormData = new FormData();
    const fileBlob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    // Gotenberg's LibreOffice endpoint expects input files in the 'files' field
    gotenbergFormData.append("files", fileBlob, rawName);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        body: gotenbergFormData,
        signal: AbortSignal.timeout(90_000), // 90s timeout for complex documents
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
      console.error("[docx-to-pdf API] Gotenberg connection failed:", msg);
      return NextResponse.json(
        {
          error: `Could not connect to the Gotenberg conversion service at ${gotenbergUrl}. Please ensure the service is running and accessible.`,
          details: msg,
        },
        { status: 502 }
      );
    }

    // 4. Handle Gotenberg error responses
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[docx-to-pdf API] Gotenberg returned HTTP ${res.status}:`, errText);

      let clientError = `Conversion failed with status ${res.status}.`;
      if (res.status === 413) {
        clientError = "Document exceeds the maximum body size allowed by the Gotenberg server.";
      } else if (res.status === 400) {
        clientError = "Gotenberg rejected the document as invalid or unsupported.";
      } else if (errText.trim()) {
        clientError = `Gotenberg error: ${errText.slice(0, 200).trim()}`;
      }

      return NextResponse.json(
        { error: clientError, statusCode: res.status },
        { status: 500 }
      );
    }

    const pdfBuffer = await res.arrayBuffer();
    if (!pdfBuffer || pdfBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: "Conversion server returned an empty PDF document." },
        { status: 500 }
      );
    }

    // 5. Preserve original filename with .pdf extension
    const baseName = rawName.replace(/\.docx$/i, "").trim() || "document";
    const safeBaseName = baseName.replace(/["\r\n\t]/g, "_");
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
  } catch (err: unknown) {
    console.error("[docx-to-pdf API] Unhandled error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during document conversion." },
      { status: 500 }
    );
  }
}
