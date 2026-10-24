import crypto from "crypto";

// Use environment variable if configured, otherwise use stable default secret
const DEFAULT_SECRET = "toolkit-file-share-signing-key-9b7e4f1a2c3d";
const SECRET = process.env.FILE_SHARE_SECRET || DEFAULT_SECRET;

export interface ShareTokenPayload {
  url: string;
  name: string;
  size: number;
  type: string;
  time: number;
  isExternal?: boolean;
}

export function createShareToken(payload: Omit<ShareTokenPayload, "time">): string {
  const fullPayload: ShareTokenPayload = {
    ...payload,
    time: Date.now(),
  };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyShareToken(token: string): ShareTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const jsonStr = Buffer.from(data, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr) as ShareTokenPayload;

    // Check expiration: tokens valid for 7 days
    if (!payload.time || Date.now() - payload.time > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

