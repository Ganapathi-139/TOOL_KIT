import { NextRequest, NextResponse } from "next/server";
import { verifyShareToken } from "@/lib/file-share";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing share token." }, { status: 400 });
    }

    const payload = verifyShareToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired download token." },
        { status: 403 }
      );
    }

    // Validate URL to protect against SSRF and open redirect
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(payload.url);
    } catch {
      return NextResponse.json({ error: "Malformed storage URL." }, { status: 400 });
    }

    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Insecure storage URL." }, { status: 400 });
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Block private/local IP addresses and metadata endpoints
    const isPrivateHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "169.254.169.254" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal");

    if (isPrivateHost) {
      return NextResponse.json({ error: "Access to private resources is forbidden." }, { status: 403 });
    }

    // If external storage link (e.g., Gofile), redirect to the page
    if (payload.isExternal) {
      const isAllowedExternal = hostname === "gofile.io" || hostname.endsWith(".gofile.io");
      if (!isAllowedExternal) {
        return NextResponse.json({ error: "Unauthorized redirect destination." }, { status: 403 });
      }
      return NextResponse.redirect(payload.url, 302);
    }

    // Verify upstream storage backend domain before proxying
    const isAllowedStorage =
      hostname === "tmpfile.link" ||
      hostname.endsWith(".tmpfile.link") ||
      hostname.endsWith(".r2.cloudflarestorage.com");

    if (!isAllowedStorage) {
      return NextResponse.json({ error: "Untrusted storage host." }, { status: 403 });
    }

    // Stream directly from storage backend through our own domain
    const upstreamRes = await fetch(payload.url);
    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: "File expired or no longer available on storage server." },
        { status: upstreamRes.status }
      );
    }

    const headers = new Headers();
    // Use RFC 5987 filename* encoding alongside standard filename for universal browser/mobile support
    const safeFileName = payload.name.replace(/[^\w.-]/g, "_");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(payload.name)}`
    );
    headers.set("Content-Type", payload.type || "application/octet-stream");
    if (payload.size) {
      headers.set("Content-Length", payload.size.toString());
    }
    headers.set("Cache-Control", "public, max-age=86400");
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    console.error("Download route error:", err);
    return NextResponse.json({ error: "Download failed. Please try again." }, { status: 500 });
  }
}
