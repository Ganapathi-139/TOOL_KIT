import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file was provided." }, { status: 400 });
    }

    // Forward to clean temporary storage provider (Cloudflare R2 direct attachment download)
    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file, file.name);

    const upstreamRes = await fetch("https://tmpfile.link/api/upload", {
      method: "POST",
      body: upstreamFormData,
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "");
      throw new Error(`Storage provider responded with status ${upstreamRes.status}: ${errText.slice(0, 100)}`);
    }

    const data = await upstreamRes.json();
    const downloadUrl = data.downloadLink || data.downloadLinkEncoded;

    if (!downloadUrl) {
      throw new Error("Storage provider did not return a valid download URL.");
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: file.name,
      size: file.size,
    });
  } catch (err: unknown) {
    console.error("API file-share upload error:", err);
    const message = err instanceof Error ? err.message : "Failed to upload file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
