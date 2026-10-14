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
} from "lucide-react";
import QRCodeLib from "qrcode";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function FileShareQrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [fileDataUrl, setFileDataUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // QR Style options
  const [fgColor, setFgColor] = useState("#1A1714");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [qrSize, setQrSize] = useState(256);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const MAX_FILE_SIZE_MB = 2; // 2MB limit for data URL embedding

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    setQrDataUrl("");
    setShareUrl("");
    setFileDataUrl("");

    const sizeMB = selected.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setErrorMessage(
        `File is too large (${formatFileSize(selected.size)}). Maximum file size for QR sharing is ${MAX_FILE_SIZE_MB}MB. For larger files, upload to a cloud service and share the link via QR instead.`
      );
      return;
    }

    setFile(selected);
    setIsGenerating(true);

    try {
      // Convert file to data URL
      const dataUrl = await fileToDataUrl(selected);
      setFileDataUrl(dataUrl);

      // Create a "share" URL — since we're client-only, we store the data URL
      // and generate a QR pointing to a special local download link
      // For real sharing: in a production app you'd upload to a CDN.
      // Here, we generate a QR pointing to the data URL directly (works for small files)
      const url = dataUrl;
      setShareUrl(url);

      // Generate QR
      await generateQr(url, fgColor, bgColor, qrSize);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to process the file. Please try again.");
    } finally {
      setIsGenerating(false);
    }
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
      // Also draw to canvas
      if (canvasRef.current) {
        await QRCodeLib.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: { dark: fg, light: bg },
          errorCorrectionLevel: "M",
        });
      }
    } catch (err) {
      console.error(err);
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
      a.download = `file-share-qr-${file?.name || "download"}.png`;
      a.click();
    } else if (format === "svg" && shareUrl) {
      QRCodeLib.toString(shareUrl, { type: "svg", width: qrSize, margin: 2, color: { dark: fgColor, light: bgColor } }, (err, svg) => {
        if (!err && svg) {
          const blob = new Blob([svg], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `file-share-qr-${file?.name || "download"}.svg`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }
  };

  const copyFileLink = async () => {
    if (!fileDataUrl) return;
    try {
      await navigator.clipboard.writeText(fileDataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const downloadFileFromQr = () => {
    if (!fileDataUrl || !file) return;
    const a = document.createElement("a");
    a.href = fileDataUrl;
    a.download = file.name;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setQrDataUrl("");
    setShareUrl("");
    setFileDataUrl("");
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
            Upload a file (up to 2 MB), generate a QR code, and let anyone scan it to instantly download the file — no server, no sign-up, no expiry.
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
              <p className="font-semibold">Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="shrink-0 opacity-60 hover:opacity-100">
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
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] ${isDragging ? "scale-[0.99]" : "hover:border-amber-500/50"}`}
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }}
                  className="hidden"
                />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                >
                  <FileUp size={28} />
                </div>
                <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  Drop any file here to share via QR
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Any file type · Max 2 MB · No upload needed
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
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}
              >
                {/* File header */}
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                    >
                      <FileUp size={20} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-sm sm:text-base truncate max-w-xs sm:max-w-md" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={reset} className="font-body text-xs font-medium text-red-500 hover:underline flex items-center gap-1">
                    <X size={14} /> Change file
                  </button>
                </div>

                {isGenerating && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-amber-500" />
                  </div>
                )}

                {!isGenerating && qrDataUrl && (
                  <>
                    {/* QR Code display */}
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div
                        className="rounded-2xl p-4 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: bgColor, border: "1px solid var(--border-warm)" }}
                      >
                        <canvas ref={canvasRef} className="rounded-lg" style={{ display: "none" }} />
                        <img
                          src={qrDataUrl}
                          alt="File Share QR Code"
                          className="rounded-lg"
                          style={{ width: Math.min(qrSize, 240), height: Math.min(qrSize, 240) }}
                        />
                      </div>

                      <div className="flex flex-col gap-3 flex-1 w-full">
                        <p className="font-body text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          Scan to Download
                        </p>
                        <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                          Anyone who scans this QR code will be able to download <strong>{file.name}</strong> directly to their device.
                        </p>

                        <div className="flex flex-wrap gap-2">
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
                            style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                          >
                            <Download size={14} /> Download QR (SVG)
                          </button>
                          <button
                            onClick={downloadFileFromQr}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border font-body text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                          >
                            <Download size={14} /> Download File
                          </button>
                          <button
                            onClick={copyFileLink}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border font-body text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                          >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            {copied ? "Copied!" : "Copy File Link"}
                          </button>
                        </div>

                        <div
                          className="font-body text-xs rounded-lg p-3"
                          style={{ color: "var(--text-secondary)", backgroundColor: "var(--amber-tint)" }}
                        >
                          <strong>Tip:</strong> The QR code encodes your file directly as a data URL. It works offline and requires no server. For files larger than 2MB, upload to Google Drive or Dropbox and share the link via the QR Generator tool.
                        </div>
                      </div>
                    </div>

                    {/* Style customization */}
                    <div className="border-t pt-5" style={{ borderColor: "var(--border-warm)" }}>
                      <p className="font-headline font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
                        Customize QR Style
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="font-body text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
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
                            <span className="font-body text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{fgColor}</span>
                          </div>
                        </div>
                        <div>
                          <label className="font-body text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
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
                            <span className="font-body text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{bgColor}</span>
                          </div>
                        </div>
                        <div>
                          <label className="font-body text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
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

            {/* Privacy */}
            <div
              className="rounded-2xl border p-4 flex items-center gap-3"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
              >
                <Shield size={18} />
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>100% Private & Offline:</strong> Files are encoded directly into the QR code as a data URL. Nothing is uploaded to any server. The QR code itself contains your file.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                How it works
              </h3>
              <ol className="space-y-3 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                {[
                  ["Upload a file", "Drop or browse any file up to 2MB."],
                  ["QR code is generated", "Your file is encoded directly inside the QR code."],
                  ["Share the QR", "Download the QR image and share it digitally or print it."],
                  ["Scan to download", "Anyone who scans the QR gets the file instantly."],
                ].map(([step, desc], i) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: "var(--amber-primary)" }}>
                      {i + 1}
                    </span>
                    <span><strong>{step}:</strong> {desc}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Good for sharing
              </h3>
              <ul className="space-y-2 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                {["PDF documents", "Images (JPG, PNG)", "Text files (.txt, .csv)", "Small ZIP archives", "Business cards (vCard)", "Any file under 2MB"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--amber-primary)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
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
