import { NextRequest, NextResponse } from "next/server";
import { createShareToken } from "@/lib/file-share";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Support JSON payload for wrapping external/fallback URLs (e.g. large files > 4.5MB)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { externalUrl, name, size, type } = body;
      if (!externalUrl || !name) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const token = createShareToken({
        url: externalUrl,
        name,
        size: Number(size) || 0,
        type: type || "application/octet-stream",
        isExternal: true,
      });

      return NextResponse.json({
        success: true,
        token,
        fileName: name,
        size: Number(size) || 0,
        type: type || "application/octet-stream",
      });
    }

    // Default: Multipart file upload
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file was provided." }, { status: 400 });
    }

    // Forward to secure Cloudflare R2 storage
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

    // Create secure in-app share token
    const token = createShareToken({
      url: downloadUrl,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      isExternal: false,
    });

    return NextResponse.json({
      success: true,
      token,
      fileName: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    });
  } catch (err: unknown) {
    console.error("API file-share upload error:", err);
    const message = err instanceof Error ? err.message : "Failed to upload file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
