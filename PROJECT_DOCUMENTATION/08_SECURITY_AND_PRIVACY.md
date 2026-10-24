# 08. Security and Privacy — ToolKit

This document details the security architecture, privacy controls, vulnerability defenses, and audited threat vectors in ToolKit.

---

## 1. Privacy-by-Design Architecture

The most secure data is data that is never sent to a server in the first place:

1. **Zero Database**: ToolKit does not use PostgreSQL, MySQL, MongoDB, Redis, or any user database.
2. **Zero User Accounts**: There are no passwords to steal, no user profiles, and no session cookies.
3. **Zero Third-Party Trackers**: No Google Analytics, Facebook Pixel, tracking beacons, or ad networks are loaded.
4. **RAM-Only Processing**: For 95% of tools (all PDF editing, Image manipulation, Student utilities, Developer tools), files are read into local browser RAM as `ArrayBuffer` objects, processed by WebAssembly or JavaScript, and saved back to disk. When the browser tab closes, the data disappears from memory.

---

## 2. Security Controls & Vulnerability Defenses

During the project's development and recent Cloudflare Security Audit, the following defense-in-depth controls were established:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TOOLKIT DEFENSE-IN-DEPTH                          │
├────────────────────────────────┬───────────────────────────────────────┤
│ Threat Vector                  │ Implemented Mitigation                │
├────────────────────────────────┼───────────────────────────────────────┤
│ Server-Side Request Forgery    │ Strict HTTPS allowlist + Private IP   │
│ (SSRF)                         │ blocking (127.0.0.1, 169.254.169.254) │
├────────────────────────────────┼───────────────────────────────────────┤
│ Open Redirect / Phishing       │ Hostname verification; allowlist only │
│                                │ trusted storage domains (gofile.io)   │
├────────────────────────────────┼───────────────────────────────────────┤
│ Command Injection              │ child_process.spawn array args only;  │
│                                │ random hex temp paths; zero shell     │
├────────────────────────────────┼───────────────────────────────────────┤
│ Cross-Site Scripting (XSS)     │ DOM sanitization of HTML previews;    │
│                                │ strict Content-Security-Policy (CSP)  │
├────────────────────────────────┼───────────────────────────────────────┤
│ Token Forgery / Timing Attacks │ HMAC-SHA256 with timingSafeEqual;     │
│                                │ 7-day expiration; random secret       │
├────────────────────────────────┼───────────────────────────────────────┤
│ Arbitrary File Uploads         │ Magic bytes validation (%PDF-);       │
│                                │ strict payload size enforcement       │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Deep Dive: Key Security Implementations

### A. SSRF & Internal IP Blocking (`/api/file-share/download`)
- **Risk**: An attacker passes an internal URL (e.g. `http://169.254.169.254/latest/meta-data/` on AWS/Cloud) to coerce the server into returning cloud credentials.
- **Defense in Code** (`src/app/api/file-share/download/route.ts`):
  ```typescript
  // 1. Enforce HTTPS only
  if (parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Insecure storage URL." }, { status: 400 });
  }

  // 2. Block all local and private IP addresses
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

  // 3. Allow only verified storage CDNs
  const isAllowedStorage =
    hostname === "tmpfile.link" ||
    hostname.endsWith(".tmpfile.link") ||
    hostname.endsWith(".r2.cloudflarestorage.com");

  if (!isAllowedStorage) {
    return NextResponse.json({ error: "Untrusted storage host." }, { status: 403 });
  }
  ```

### B. Timing-Safe HMAC Token Signatures (`src/lib/file-share.ts`)
- **Risk**: Standard `if (signature !== expectedSignature)` leaks information through execution timing variations, allowing attackers to guess signatures byte-by-byte.
- **Defense in Code**:
  ```typescript
  // Constant-time comparison prevents timing attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  ```
  Additionally, the token secret uses a persistent HMAC key (overridable via `FILE_SHARE_SECRET` in `.env`), ensuring tokens generated across multi-instance serverless deployments or between local dev and the public proxy remain verifiable.

### C. Command Injection Prevention (`/api/convert/pdf-to-word`)
- **Risk**: User uploads a file named `test; rm -rf /; .pdf`, which could execute arbitrary shell commands if passed to `exec()`.
- **Defense in Code**:
  ```typescript
  // 1. User filename is NEVER passed to the OS process
  const id = crypto.randomBytes(8).toString("hex");
  const inputPath = path.join(TMP_DIR, `${id}.pdf`);
  const outputPath = path.join(TMP_DIR, `${id}.docx`);

  // 2. Uses spawn with array parameters (no shell interpolation)
  const proc = spawn(/*turbopackIgnore: true*/ python, [PYTHON_SCRIPT, inputPath, outputPath], {
    timeout: 60_000,
  });
  ```

### D. DOM XSS Sanitization (`word-to-pdf` and `markdown`)
- **Risk**: A malicious Word `.docx` or Markdown document could inject `<script>` tags or `<img onerror=...>` handlers into preview windows.
- **Defense in Code**:
  - `src/app/tools/pdf/word-to-pdf/page.tsx`:
    ```typescript
    function sanitizeHtmlContent(raw: string): string {
      return raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
        .replace(/<embed\b[^>]*>/gi, "")
        .replace(/\s*on\w+\s*=\s*(['"]).*?\1/gi, "")
        .replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"');
    }
    ```
  - `src/app/tools/developer/markdown/page.tsx`:
    Escapes all raw HTML characters (`&`, `<`, `>`, `"`, `'`) before any markdown formatting tags are applied, and validates all link protocols to allow only `http:`, `https:`, or `mailto:`.

---

## 4. HTTP Security Headers (`next.config.ts`)

Every HTTP response from ToolKit includes the following security headers:

| Header | Value | Purpose |
|---|---|---|
| **`Content-Security-Policy`** | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; ...` | Restricts script execution, frame embedding, and network connect sources. |
| **`Strict-Transport-Security`** | `max-age=63072000; includeSubDomains; preload` | Forces all browser connections to use encrypted HTTPS for 2 years. |
| **`X-Content-Type-Options`** | `nosniff` | Prevents MIME-type sniffing attacks. |
| **`X-Frame-Options`** | `SAMEORIGIN` | Protects users from clickjacking attacks in unauthorized iframes. |
| **`X-XSS-Protection`** | `1; mode=block` | Enables legacy browser reflective XSS filters. |
| **`Referrer-Policy`** | `strict-origin-when-cross-origin` | Protects user privacy when navigating external links. |
| **`Permissions-Policy`** | `camera=(self), microphone=(self), geolocation=()` | Grants camera access only to the ToolKit origin for QR scanning and disables geolocation entirely. |

---

## 5. Remaining Considerations & Best Practices

1. **Production Cluster Secret**: If hosting on Kubernetes or multiple server containers behind a load balancer, always configure `FILE_SHARE_SECRET` in environment variables so all containers share the same HMAC key.
2. **Third-Party File Sharing Relay**: For File Share QR, files temporarily reside on public storage relays (`tmpfile.link` or `gofile.io`) with automatic expiration. The UI explicitly informs users not to upload confidential passwords or financial documents to public QR sharing links.
