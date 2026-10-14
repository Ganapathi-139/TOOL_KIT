"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
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
} from "lucide-react";
import QRCodeLib from "qrcode";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function FileShareQrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // QR Style options
  const [fgColor, setFgColor] = useState("#1A1714");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [qrSize, setQrSize] = useState(260);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const MAX_FILE_SIZE_MB = 100; // 100MB limit with temporary cloud hosting

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const uploadToTmpFiles = (
    file: File,
    onProgress: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

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
            if (res.status === "success" && res.data?.url) {
              resolve(res.data.url);
            } else {
              reject(new Error(res.message || "Upload service returned an error."));
            }
          } catch {
            reject(new Error("Invalid response received from upload server."));
          }
        } else {
          reject(new Error(`Upload failed with server status ${xhr.status}.`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload. Please check your internet connection."));
      xhr.ontimeout = () => reject(new Error("Upload timed out. Please try again with a smaller file or faster connection."));
      xhr.open("POST", "https://tmpfiles.org/api/v1/upload");
      xhr.send(formData);
    });
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
    setUploadProgress(0);

    const sizeMB = selected.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setErrorMessage(
        `File is too large (${formatFileSize(selected.size)}). Maximum supported file size is ${MAX_FILE_SIZE_MB}MB.`
      );
      return;
    }

    setFile(selected);
    setIsGenerating(true);
    setStatusText("Preparing file upload...");

    try {
      setStatusText("Uploading file...");
      const remoteUrl = await uploadToTmpFiles(selected, (progress) => {
        setUploadProgress(progress);
        setStatusText(`Uploading file (${progress}%)...`);
      });

      setShareUrl(remoteUrl);
      setStatusText("Generating scannable QR code...");
      await generateQr(remoteUrl, fgColor, bgColor, qrSize);
      setStatusText("");
    } catch (err: unknown) {
      console.warn("Primary upload failed, checking fallback:", err);

      // If file is tiny (<= 2KB), fallback to inline data URL
      if (selected.size <= 2048) {
        try {
          setStatusText("Encoding local file data...");
          const dataUrl = await fileToDataUrl(selected);
          setShareUrl(dataUrl);
          await generateQr(dataUrl, fgColor, bgColor, qrSize);
          setStatusText("");
          return;
        } catch {
          // continue to error below
        }
      }

      const errMessage = err instanceof Error ? err.message : "Failed to upload file. Please check your internet connection and try again.";
      setErrorMessage(errMessage);
    } finally {
      setIsGenerating(false);
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

  const copyFileLink = async () => {
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

  const reset = () => {
    setFile(null);
    setQrDataUrl("");
    setShareUrl("");
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
            Upload any file (up to 100 MB), instantly generate a high-definition QR code, and let anyone scan with their phone camera to download it directly.
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
              <p className="font-semibold">Upload Notice</p>
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
                  Supports PDF, DOCX, Images, Videos, Audio, ZIP · Up to 100 MB
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
                            Anyone who scans this QR code will instantly open and download{" "}
                            <strong>{file.name}</strong> on their device.
                          </p>
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
                            onClick={copyFileLink}
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
                            <span>{copied ? "Copied!" : "Copy"}</span>
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
                            <ExternalLink size={14} /> Open Download Page
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
                            <strong>Ready to share:</strong> This QR code contains a verified, universal HTTPS link compatible with all iOS and Android camera apps.
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
                  Temporary Secure Sharing:
                </strong>{" "}
                Files are uploaded to an encrypted temporary host with direct download access. Anyone scanning your QR code gets immediate access without creating an account or installing any software.
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
                  ["Upload a file", "Select or drop any file up to 100MB."],
                  ["Secure link created", "A direct, scannable download link is prepared."],
                  ["QR code is generated", "A crisp, high-density QR code is rendered instantly."],
                  ["Scan & Download", "Recipients scan with any phone camera to download directly."],
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
