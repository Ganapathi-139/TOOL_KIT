/**
 * api-security.ts – Central security utilities for ToolKit API conversion routes:
 * 1. In-memory sliding window rate limiter per client IP.
 * 2. Magic byte file signature validation (prevents disguised executable uploads).
 * 3. File size and name sanitization.
 */

import { NextRequest } from "next/server";

// Rate limiting: 15 requests per 60 seconds per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

interface RateRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateRecord>();

// Cleanup stale rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(req: NextRequest): { allowed: boolean; remaining: number } {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "127.0.0.1").trim();

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

/**
 * Validates PDF file header magic bytes (%PDF-).
 */
export function isPdfBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 5) return false;
  const header = new Uint8Array(buffer, 0, 5);
  // %PDF- in ASCII is 0x25 0x50 0x44 0x46 0x2D
  return (
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46 &&
    header[4] === 0x2d
  );
}

/**
 * Validates Word document magic bytes (PK\x03\x04 for .docx or CFB \xD0\xCF\x11\xE0 for legacy .doc).
 */
export function isWordBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const header = new Uint8Array(buffer, 0, 4);

  // PK\x03\x04 (ZIP container for .docx)
  const isZip = header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;
  // \xD0\xCF\x11\xE0 (Compound File Binary for legacy .doc)
  const isCfb = header[0] === 0xd0 && header[1] === 0xcf && header[2] === 0x11 && header[3] === 0xe0;

  return isZip || isCfb;
}

/**
 * Validates PowerPoint document magic bytes (PK\x03\x04 for .pptx or CFB \xD0\xCF\x11\xE0 for legacy .ppt).
 */
export function isPowerPointBuffer(buffer: ArrayBuffer): boolean {
  return isWordBuffer(buffer);
}

/**
 * Sanitizes download filenames to prevent response header injection.
 */
export function sanitizeFilename(filename: string, fallback: string): string {
  const cleaned = filename.replace(/[\r\n"\\/<>|?*]+/g, "_").trim();
  return cleaned || fallback;
}
