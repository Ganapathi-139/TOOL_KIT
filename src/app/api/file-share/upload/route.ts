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

      // Strict URL and domain validation to prevent open redirects and SSRF
      try {
        const parsedUrl = new URL(externalUrl);
        if (parsedUrl.protocol !== "https:") {
          return NextResponse.json({ error: "Only secure HTTPS URLs are permitted." }, { status: 400 });
        }
        const hostname = parsedUrl.hostname.toLowerCase();
        const isAllowedDomain = hostname === "gofile.io" || hostname.endsWith(".gofile.io");
        if (!isAllowedDomain) {
          return NextResponse.json(
            { error: "Untrusted external storage provider domain." },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json({ error: "Invalid URL provided." }, { status: 400 });
      }

      const safeName = String(name).slice(0, 255).replace(/[\r\n\0]/g, "");

      const token = createShareToken({
        url: externalUrl,
        name: safeName,
        size: Math.max(0, Number(size) || 0),
        type: String(type || "application/octet-stream").slice(0, 100),
        isExternal: true,
      });

      return NextResponse.json({
        success: true,
        token,
        fileName: safeName,
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

    // Limit maximum upload size (100 MB max)
    const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: "File exceeds 100 MB limit." }, { status: 413 });
    }

    // Forward to secure Cloudflare R2 storage
    const upstreamFormData = new FormData();
    const safeFileName = file.name.slice(0, 255).replace(/[\r\n\0]/g, "");
    upstreamFormData.append("file", file, safeFileName);

    const upstreamRes = await fetch("https://tmpfile.link/api/upload", {
      method: "POST",
      body: upstreamFormData,
    });

    if (!upstreamRes.ok) {
      throw new Error(`Storage provider returned status ${upstreamRes.status}`);
    }

    const data = await upstreamRes.json();
    const downloadUrl = data.downloadLink || data.downloadLinkEncoded;

    if (!downloadUrl) {
      throw new Error("Storage provider did not return a valid download URL.");
    }

    // Create secure in-app share token
    const token = createShareToken({
      url: downloadUrl,
      name: safeFileName,
      size: file.size,
      type: file.type || "application/octet-stream",
      isExternal: false,
    });

    return NextResponse.json({
      success: true,
      token,
      fileName: safeFileName,
      size: file.size,
      type: file.type || "application/octet-stream",
    });
  } catch (err: unknown) {
    console.error("API file-share upload error:", err);
    return NextResponse.json({ error: "Failed to upload file. Please try again." }, { status: 500 });
  }
}
