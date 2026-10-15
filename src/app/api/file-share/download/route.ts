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

    // If external storage link (e.g., Gofile), redirect to the page
    if (payload.isExternal) {
      return NextResponse.redirect(payload.url, 302);
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
    const message = err instanceof Error ? err.message : "Internal download error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
