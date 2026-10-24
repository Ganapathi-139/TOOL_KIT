"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  QrCode,
  Shield,
  Copy,
  Check,
  X,
  Link as LinkIcon,
  FileUp,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Laptop,
  Globe,
  Wifi,
} from "lucide-react";
import QRCodeLib from "qrcode";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || "https://toolkit.sgscreations.in";

export default function FileShareQrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareToken, setShareToken] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Host and domain selector state (prevents localhost phone scanning failures)
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [domainMode, setDomainMode] = useState<"public" | "localhost" | "custom">("public");
  const [customHost, setCustomHost] = useState("");

  // QR Style options
  const [fgColor, setFgColor] = useState("#1A1714");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [qrSize, setQrSize] = useState(260);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const MAX_FILE_SIZE_MB = 100;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "0.0.0.0" ||
        window.location.hostname.endsWith(".local");
      setIsLocalhost(isLocal);
      // Default to public phone-ready domain when running locally so mobile cameras can reach it
      setDomainMode(isLocal ? "public" : "localhost");
    }
  }, []);

  const getBaseOrigin = (mode: "public" | "localhost" | "custom", customIp?: string) => {
    if (typeof window === "undefined") return PUBLIC_DOMAIN;
    if (mode === "public") return PUBLIC_DOMAIN;
    if (mode === "custom" && customIp?.trim()) {
      const trimmed = customIp.trim();
      return trimmed.startsWith("http") ? trimmed : `http://${trimmed}`;
    }
    return window.location.origin;
  };

  const buildDownloadUrl = (token: string, mode: "public" | "localhost" | "custom", customIp?: string) => {
    if (!token) return "";
    const base = getBaseOrigin(mode, customIp);
    return `${base}/tools/qr/file-share/download?token=${encodeURIComponent(token)}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Primary: Upload via our direct in-house API route (Cloudflare R2 storage + in-app signed share token)
  const uploadViaDirectApi = (
    uploadFile: File,
    onProgress: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", uploadFile);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.token) {
              resolve(res.token);
            } else {
              reject(new Error(res.error || "Failed to obtain share token."));
            }
          } catch {
            reject(new Error("Invalid response format from upload service."));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network connection error during upload."));
      xhr.ontimeout = () => reject(new Error("Upload timed out."));
      xhr.open("POST", "/api/file-share/upload");
      xhr.send(formData);
    });
  };

  // Fallback: Upload via Gofile.io for files > 4.5MB, then tokenize through in-app API
  const uploadViaGofile = async (
    uploadFile: File,
    onProgress: (percent: number) => void
  ): Promise<string> => {
    const downloadPage = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", uploadFile);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.status === "ok" && res.data?.downloadPage) {
              resolve(res.data.downloadPage);
            } else {
              reject(new Error("Storage server did not return a valid link."));
            }
          } catch {
            reject(new Error("Invalid response received from storage provider."));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Connection error while uploading."));
      xhr.ontimeout = () => reject(new Error("Upload timed out."));
      xhr.open("POST", "https://upload.gofile.io/uploadfile");
      xhr.send(formData);
    });

    // Wrap in signed in-app share token
    const tokenRes = await fetch("/api/file-share/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        externalUrl: downloadPage,
        name: uploadFile.name,
        size: uploadFile.size,
        type: uploadFile.type,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.success || !tokenData.token) {
      throw new Error(tokenData.error || "Failed to generate in-app token.");
    }

    return tokenData.token;
  };

  const generateQr = async (url: string, fg: string, bg: string, size: number) => {
    if (!url) return;
    try {
      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: size,
        margin: 2,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);

      if (canvasRef.current) {
        await QRCodeLib.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: { dark: fg, light: bg },
          errorCorrectionLevel: "M",
        });
      }
    } catch (err) {
      console.error("QR Generation error:", err);
      setErrorMessage("Could not render QR code for this link. Please try again.");
    }
  };

  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    setQrDataUrl("");
    setShareUrl("");
    setShareToken("");
    setUploadProgress(0);

    const sizeMB = selected.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setErrorMessage(
        `File is too large (${formatFileSize(selected.size)}). Maximum supported size is ${MAX_FILE_SIZE_MB}MB.`
      );
      return;
    }

    setFile(selected);
    setIsGenerating(true);
    setStatusText("Preparing secure file upload...");

    try {
      let token = "";

      // For files <= 4.2MB, use direct in-house streaming pipeline
      if (sizeMB <= 4.2) {
        try {
          setStatusText("Uploading file (direct CDN storage)...");
          token = await uploadViaDirectApi(selected, (progress) => {
            setUploadProgress(progress);
            setStatusText(`Uploading file (${progress}%)...`);
          });
        } catch (apiErr) {
          console.warn("Direct API upload failed, switching to clean fallback:", apiErr);
          setStatusText("Uploading to clean storage host...");
          token = await uploadViaGofile(selected, (progress) => {
            setUploadProgress(progress);
            setStatusText(`Uploading file (${progress}%)...`);
          });
        }
      } else {
        // Files > 4.2MB use high-capacity storage pipeline
        setStatusText("Uploading to high-capacity storage...");
        token = await uploadViaGofile(selected, (progress) => {
          setUploadProgress(progress);
          setStatusText(`Uploading file (${progress}%)...`);
        });
      }

      setShareToken(token);

      // Generate in-app ToolKit download URL on trusted domain (phone-ready when on localhost)
      const downloadPageUrl = buildDownloadUrl(token, domainMode, customHost);
      setShareUrl(downloadPageUrl);

      setStatusText("Generating scannable QR code...");
      await generateQr(downloadPageUrl, fgColor, bgColor, qrSize);
      setStatusText("");
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const errMessage =
        err instanceof Error
          ? err.message
          : "Failed to upload file. Please check your internet connection and try again.";
      setErrorMessage(errMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDomainModeChange = (mode: "public" | "localhost" | "custom") => {
    setDomainMode(mode);
    if (shareToken) {
      const newUrl = buildDownloadUrl(shareToken, mode, customHost);
      setShareUrl(newUrl);
      generateQr(newUrl, fgColor, bgColor, qrSize);
    }
  };

  const handleCustomHostChange = (newHost: string) => {
    setCustomHost(newHost);
    if (shareToken && domainMode === "custom") {
      const newUrl = buildDownloadUrl(shareToken, "custom", newHost);
      setShareUrl(newUrl);
      generateQr(newUrl, fgColor, bgColor, qrSize);
    }
  };

  // Regenerate QR when color/size changes
  useEffect(() => {
    if (shareUrl) {
      generateQr(shareUrl, fgColor, bgColor, qrSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fgColor, bgColor, qrSize]);

  const downloadQr = (format: "png" | "svg") => {
    if (format === "png" && qrDataUrl) {
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `file-qr-${file?.name || "download"}.png`;
      a.click();
    } else if (format === "svg" && shareUrl) {
      QRCodeLib.toString(
        shareUrl,
        {
          type: "svg",
          width: qrSize,
          margin: 2,
          color: { dark: fgColor, light: bgColor },
        },
        (err, svg) => {
          if (!err && svg) {
            const blob = new Blob([svg], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `file-qr-${file?.name || "download"}.svg`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      );
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const openDownloadPage = () => {
    if (!shareUrl) return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const testDownloadDirectly = () => {
    if (!shareToken) return;
    const downloadApiUrl = `/api/file-share/download?token=${encodeURIComponent(shareToken)}`;
    const anchor = document.createElement("a");
    anchor.href = downloadApiUrl;
    if (file?.name) {
      anchor.download = file.name;
    }
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const reset = () => {
    setFile(null);
    setQrDataUrl("");
    setShareUrl("");
    setShareToken("");
    setUploadProgress(0);
    setStatusText("");
    setErrorMessage(null);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "QR Tools", href: "/tools/qr" },
            { label: "File Share QR" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <QrCode size={16} />
            <span>QR Code Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            File Share via QR Code
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Upload any file (up to 100 MB), generate a high-definition QR code, and let anyone scan with their phone camera to download it directly—completely ad-free with zero security warnings.
          </p>
        </div>

        {errorMessage && (
          <div
            className="mb-8 p-4 rounded-xl border flex items-start gap-3"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              borderColor: "rgba(239, 68, 68, 0.25)",
              color: "#dc2626",
            }}
          >
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm font-body flex-1">
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Upload + QR */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Upload Zone */}
            {!file && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] ${
                  isDragging ? "scale-[0.99]" : "hover:border-amber-500/50"
                }`}
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    color: "var(--amber-primary)",
                  }}
                >
                  <FileUp size={28} />
                </div>
                <h3
                  className="font-headline font-semibold text-lg"
                  style={{ color: "var(--text-primary)" }}
                >
                  Drop any file here to share via QR
                </h3>
                <p
                  className="font-body text-sm mt-1 mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Supports PDF, DOCX, Images, Videos, Audio, ZIP · Secure in-app download
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl font-body font-semibold text-sm text-white shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Browse Files
                </button>
              </div>
            )}

            {/* File loaded + QR display */}
            {file && (
              <div
                className="rounded-2xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* File header */}
                <div
                  className="flex items-center justify-between pb-4 border-b"
                  style={{ borderColor: "var(--border-warm)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "var(--amber-tint)",
                        color: "var(--amber-primary)",
                      }}
                    >
                      <FileUp size={20} />
                    </div>
                    <div>
                      <h4
                        className="font-headline font-semibold text-sm sm:text-base truncate max-w-xs sm:max-w-md"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {file.name}
                      </h4>
                      <p
                        className="font-body text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="font-body text-xs font-medium text-red-500 hover:underline flex items-center gap-1"
                  >
                    <X size={14} /> Change file
                  </button>
                </div>

                {/* Loading state with real progress bar */}
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <Loader2 size={36} className="animate-spin text-amber-500 mb-1" />
                    <p
                      className="font-headline font-medium text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {statusText || "Processing file..."}
                    </p>
                    <div className="w-full max-w-xs bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${uploadProgress}%`,
                          backgroundColor: "var(--amber-primary)",
                        }}
                      />
                    </div>
                    <p
                      className="font-body text-xs font-mono"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {uploadProgress > 0 ? `${uploadProgress}% completed` : "Please wait..."}
                    </p>
                  </div>
                )}

                {/* QR Code and sharing controls */}
                {!isGenerating && qrDataUrl && (
                  <>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div
                        className="rounded-2xl p-4 flex items-center justify-center shrink-0 shadow-sm"
                        style={{
                          backgroundColor: bgColor,
                          border: "1px solid var(--border-warm)",
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          className="rounded-lg"
                          style={{ display: "none" }}
                        />
                        <img
                          src={qrDataUrl}
                          alt={`QR Code to download ${file.name}`}
                          className="rounded-lg shadow-sm"
                          style={{
                            width: Math.min(qrSize, 240),
                            height: Math.min(qrSize, 240),
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-3 flex-1 w-full">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck size={16} />
                            <span className="font-body text-xs font-semibold uppercase tracking-wider">
                              Verified Safe Download Page
                            </span>
                          </div>
                          <p
                            className="font-headline font-semibold text-base"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Scan with Phone Camera
                          </p>
                          <p
                            className="font-body text-xs mt-0.5"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Scanning opens your clean ToolKit download page on their mobile device. Recipients can view file details and tap Download with <strong>zero security warnings</strong>.
                          </p>
                        </div>

                        {/* Localhost / Phone Domain Mode Selector */}
                        <div
                          className="p-3 rounded-xl border flex flex-col gap-2"
                          style={{
                            backgroundColor: "var(--bg-main)",
                            borderColor: isLocalhost ? "rgba(217, 119, 6, 0.35)" : "var(--border-warm)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                              <Smartphone size={14} className="text-amber-500" />
                              Target Device / Domain:
                            </span>
                            {isLocalhost && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Localhost Detected
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDomainModeChange("public")}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                domainMode === "public"
                                  ? "bg-amber-500 text-white shadow-sm font-semibold"
                                  : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-black/10 dark:hover:bg-white/10"
                              }`}
                              title="Public link that any smartphone camera can open anywhere"
                            >
                              <Globe size={12} />
                              <span>Phone Ready (Public Web)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDomainModeChange("localhost")}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                domainMode === "localhost"
                                  ? "bg-amber-500 text-white shadow-sm font-semibold"
                                  : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-black/10 dark:hover:bg-white/10"
                              }`}
                              title="Localhost link (for testing in browser on this PC only)"
                            >
                              <Laptop size={12} />
                              <span>This PC (Localhost)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDomainModeChange("custom")}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                domainMode === "custom"
                                  ? "bg-amber-500 text-white shadow-sm font-semibold"
                                  : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-black/10 dark:hover:bg-white/10"
                              }`}
                              title="Custom LAN IP address for phones on the same local Wi-Fi"
                            >
                              <Wifi size={12} />
                              <span>Local Wi-Fi IP</span>
                            </button>
                          </div>

                          {domainMode === "public" && isLocalhost && (
                            <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-tight">
                              ✓ <strong>Phone-ready:</strong> Encoded for ToolKit&apos;s public domain (<span className="font-mono text-[10px]">toolkit.sgscreations.in</span>) so scanning with your phone works seamlessly (phone cameras cannot reach &ldquo;localhost&rdquo;).
                            </p>
                          )}

                          {domainMode === "localhost" && (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                              ⚠️ <strong>Localhost only:</strong> Will open only on this computer. Phone cameras cannot connect to &ldquo;localhost&rdquo;.
                            </p>
                          )}

                          {domainMode === "custom" && (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                placeholder="e.g. 192.168.1.15:3000"
                                value={customHost}
                                onChange={(e) => handleCustomHostChange(e.target.value)}
                                className="px-2.5 py-1 rounded-lg text-xs font-mono border bg-transparent border-amber-400/60 dark:border-amber-600 outline-none flex-1"
                              />
                              <span className="text-[10px] text-stone-500">Your LAN IP</span>
                            </div>
                          )}
                        </div>

                        {/* Share link box */}
                        <div
                          className="flex items-center gap-2 p-2 rounded-xl border"
                          style={{
                            backgroundColor: "var(--bg-main)",
                            borderColor: "var(--border-warm)",
                          }}
                        >
                          <LinkIcon
                            size={14}
                            className="shrink-0 ml-1"
                            style={{ color: "var(--text-secondary)" }}
                          />
                          <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="bg-transparent font-mono text-xs flex-1 truncate outline-none select-all"
                            style={{ color: "var(--text-primary)" }}
                          />
                          <button
                            type="button"
                            onClick={copyShareLink}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-xs font-semibold shrink-0 transition-colors"
                            style={{
                              backgroundColor: "var(--amber-tint)",
                              color: "var(--amber-primary)",
                            }}
                          >
                            {copied ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                            <span>{copied ? "Copied!" : "Copy Page Link"}</span>
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => downloadQr("png")}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-xs font-semibold text-white transition-transform hover:scale-105"
                            style={{ backgroundColor: "var(--amber-primary)" }}
                          >
                            <Download size={14} /> Download QR (PNG)
                          </button>
                          <button
                            onClick={() => downloadQr("svg")}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border font-body text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{
                              borderColor: "var(--border-warm)",
                              color: "var(--text-primary)",
                            }}
                          >
                            <Download size={14} /> Download QR (SVG)
                          </button>
                          <button
                            onClick={openDownloadPage}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border font-body text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{
                              borderColor: "var(--border-warm)",
                              color: "var(--text-primary)",
                            }}
                          >
                            <ExternalLink size={14} /> Preview Download Page
                          </button>
                          <button
                            onClick={testDownloadDirectly}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border font-body text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{
                              borderColor: "var(--border-warm)",
                              color: "var(--text-primary)",
                            }}
                          >
                            <Download size={14} /> Test Download File
                          </button>
                        </div>

                        <div
                          className="font-body text-xs rounded-xl p-3 flex items-start gap-2"
                          style={{
                            color: "var(--text-secondary)",
                            backgroundColor: "var(--amber-tint)",
                          }}
                        >
                          <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>In-App Delivery:</strong> Recipient phones open your trusted ToolKit domain directly. Tapping &ldquo;Download File&rdquo; saves the file with zero ads or security prompts.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Style customization */}
                    <div
                      className="border-t pt-5"
                      style={{ borderColor: "var(--border-warm)" }}
                    >
                      <p
                        className="font-headline font-semibold text-sm mb-4"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Customize QR Style
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <label
                            className="font-body text-xs font-medium block mb-1.5"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            QR Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={fgColor}
                              onChange={(e) => setFgColor(e.target.value)}
                              className="w-9 h-9 rounded-lg cursor-pointer border"
                              style={{ borderColor: "var(--border-warm)" }}
                            />
                            <span
                              className="font-body text-xs font-mono"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {fgColor}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label
                            className="font-body text-xs font-medium block mb-1.5"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Background
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={bgColor}
                              onChange={(e) => setBgColor(e.target.value)}
                              className="w-9 h-9 rounded-lg cursor-pointer border"
                              style={{ borderColor: "var(--border-warm)" }}
                            />
                            <span
                              className="font-body text-xs font-mono"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {bgColor}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label
                            className="font-body text-xs font-medium block mb-1.5"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Size: {qrSize}px
                          </label>
                          <input
                            type="range"
                            min={128}
                            max={512}
                            step={32}
                            value={qrSize}
                            onChange={(e) => setQrSize(Number(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Privacy & Safety Note */}
            <div
              className="rounded-2xl border p-4 flex items-center gap-3"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--amber-tint)",
                  color: "var(--amber-primary)",
                }}
              >
                <Shield size={18} />
              </div>
              <p
                className="font-body text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Trusted In-App Delivery:
                </strong>{" "}
                The QR code and shared links always point directly to your ToolKit domain. Recipient devices open the clean download card over secure HTTPS without security warnings, popups, or external redirects.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3
                className="font-headline font-semibold text-base mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                How it works
              </h3>
              <ol
                className="space-y-3 text-xs font-body"
                style={{ color: "var(--text-secondary)" }}
              >
                {[
                  ["Upload any file", "Select or drop any document, image, or archive up to 100MB."],
                  ["Secure in-app link", "A trusted ToolKit download page link is created."],
                  ["QR code rendered", "A crisp, high-density QR code appears instantly."],
                  ["Scan & Download", "Recipients scan to open the clean page and download with 0 warnings."],
                ].map(([step, desc], i) => (
                  <li key={step} className="flex items-start gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <strong>{step}:</strong> {desc}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3
                className="font-headline font-semibold text-base mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Supported File Formats
              </h3>
              <ul
                className="space-y-2 text-xs font-body"
                style={{ color: "var(--text-secondary)" }}
              >
                {[
                  "PDF Documents (.pdf)",
                  "Microsoft Office (.docx, .xlsx, .pptx)",
                  "Images (JPG, PNG, WEBP, SVG)",
                  "Audio & Video (MP3, MP4, WAV)",
                  "Archives (.zip, .rar, .7z)",
                  "Plain Text & Code (.txt, .json, .csv)",
                  "Any file up to 100 MB",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3
                className="font-headline font-semibold text-base mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Other QR Tools
              </h3>
              <div className="flex flex-col gap-3 font-body text-sm">
                {[
                  { name: "QR Generator", href: "/tools/qr/generator", icon: QrCode },
                  { name: "Wi-Fi QR Code", href: "/tools/qr/wifi", icon: LinkIcon },
                  { name: "vCard QR Code", href: "/tools/qr/vcard", icon: LinkIcon },
                  { name: "QR Scanner", href: "/tools/qr/scanner", icon: QrCode },
                ].map((t) => (
                  <a
                    key={t.name}
                    href={t.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <t.icon size={16} style={{ color: "var(--amber-primary)" }} />
                      <span>{t.name}</span>
                    </div>
                    <span style={{ color: "var(--text-secondary)" }}>›</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
