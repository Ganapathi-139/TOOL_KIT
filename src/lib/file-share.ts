import crypto from "crypto";

const SECRET = process.env.FILE_SHARE_SECRET || "toolkit_file_share_secure_secret_2026_salt";

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
    if (signature !== expectedSignature) return null;

    const jsonStr = Buffer.from(data, "base64url").toString("utf8");
    return JSON.parse(jsonStr) as ShareTokenPayload;
  } catch {
    return null;
  }
}
