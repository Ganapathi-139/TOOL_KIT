"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Minimize2,
  Upload,
  Download,
  Shield,
  ChevronRight,
  Image as ImageIcon,
  Expand,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function ImageCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; size: number } | null>(null);
  const [quality, setQuality] = useState<number>(75);
  const [scale, setScale] = useState<number>(100);
  const [outputFormat, setOutputFormat] = useState<"image/jpeg" | "image/webp">("image/jpeg");

  const [_compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const compressedUrlRef = useRef<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (compressedUrlRef.current) URL.revokeObjectURL(compressedUrlRef.current);
    };
  }, []);

  const clearImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (compressedUrlRef.current) {
      URL.revokeObjectURL(compressedUrlRef.current);
      compressedUrlRef.current = null;
    }
    setFile(null);
    setPreviewUrl(null);
    setImageMeta(null);
    setCompressedBlob(null);
    setCompressedUrl(null);
    setCompressedSize(null);
    setIsCompressing(false);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    clearImage();
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);

    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setImageMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: selectedFile.size,
      });
    };
  };

  const processCompression = useCallback(() => {
    if (!file || !previewUrl || !imageMeta) return;

    setIsCompressing(true);
    const img = new Image();
    img.src = previewUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const targetWidth = Math.round((imageMeta.width * scale) / 100);
      const targetHeight = Math.round((imageMeta.height * scale) / 100);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsCompressing(false);
        return;
      }

      // Draw with white background in case source had alpha transparency
      if (outputFormat === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (compressedUrlRef.current) URL.revokeObjectURL(compressedUrlRef.current);
            const newUrl = URL.createObjectURL(blob);
            compressedUrlRef.current = newUrl;
            setCompressedBlob(blob);
            setCompressedUrl(newUrl);
            setCompressedSize(blob.size);
          }
          setIsCompressing(false);
        },
        outputFormat,
        quality / 100
      );
    };
  }, [file, previewUrl, imageMeta, scale, outputFormat, quality]);

  useEffect(() => {
    if (file && previewUrl && imageMeta) {
      processCompression();
    }
  }, [file, previewUrl, imageMeta, quality, scale, outputFormat, processCompression]);

  const savingsPercent =
    imageMeta && compressedSize
      ? Math.max(0, Math.round(((imageMeta.size - compressedSize) / imageMeta.size) * 100))
      : 0;

  const relatedTools = [
    { name: "Image Format Converter", href: "/tools/image/convert", icon: RefreshCcw },
    { name: "Image Resizer", href: "/tools/image/resize", icon: Expand },
    { name: "Image to PDF", href: "/tools/pdf/image-to-pdf", icon: ImageIcon },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Image Tools", href: "/tools/image" },
            { label: "Image Compressor" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Minimize2 size={16} />
            <span>Image Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Image Compressor
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Compress JPEG, PNG, and WebP images client-side with instant preview. Dramatically reduce file size without quality loss.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-8 sm:p-14 text-center transition-all cursor-pointer ${
                  isDragging ? "drag-over" : ""
                }`}
                style={{
                  backgroundColor: isDragging ? "var(--amber-tint)" : "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                  }}
                />
                <div
                  className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    color: "var(--amber-primary)",
                  }}
                >
                  <Upload size={26} />
                </div>
                <h3
                  className="font-headline font-semibold text-lg sm:text-xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  Drop an image here to compress
                </h3>
                <p
                  className="font-body text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Supports JPG, PNG, and WebP · Up to 50MB
                </p>
              </div>
            ) : (
              /* Compression Workspace */
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* Header info */}
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {file.name}
                    </p>
                    <p className="font-body text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Original: {imageMeta ? formatFileSize(imageMeta.size) : ""} ({imageMeta?.width} × {imageMeta?.height}px)
                    </p>
                  </div>
                  <button
                    onClick={clearImage}
                    className="text-xs font-body font-medium hover:underline"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Change image
                  </button>
                </div>

                {/* Compression Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="quality-slider" className="font-body text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        Quality: <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{quality}%</span>
                      </label>
                      <span className="text-xs font-body" style={{ color: "var(--text-muted)" }}>
                        {quality > 80 ? "High Quality" : quality > 50 ? "Balanced" : "Smallest Size"}
                      </span>
                    </div>
                    <input
                      id="quality-slider"
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full accent-[var(--amber-primary)]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="scale-slider" className="font-body text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        Resolution Scale: <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{scale}%</span>
                      </label>
                      <span className="text-xs font-body" style={{ color: "var(--text-muted)" }}>
                        {imageMeta ? `${Math.round((imageMeta.width * scale) / 100)} × ${Math.round((imageMeta.height * scale) / 100)}px` : ""}
                      </span>
                    </div>
                    <input
                      id="scale-slider"
                      type="range"
                      min="25"
                      max="100"
                      step="5"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full accent-[var(--amber-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="format-select" className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Output Format
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setOutputFormat("image/jpeg")}
                      className="px-4 py-2 rounded-lg border text-xs font-body font-medium transition-all"
                      style={{
                        backgroundColor: outputFormat === "image/jpeg" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: outputFormat === "image/jpeg" ? "var(--amber-primary)" : "var(--border-warm)",
                        color: outputFormat === "image/jpeg" ? "var(--amber-primary)" : "var(--text-primary)",
                      }}
                    >
                      JPEG (Universal)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputFormat("image/webp")}
                      className="px-4 py-2 rounded-lg border text-xs font-body font-medium transition-all"
                      style={{
                        backgroundColor: outputFormat === "image/webp" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: outputFormat === "image/webp" ? "var(--amber-primary)" : "var(--border-warm)",
                        color: outputFormat === "image/webp" ? "var(--amber-primary)" : "var(--text-primary)",
                      }}
                    >
                      WebP (Modern & Compact)
                    </button>
                  </div>
                </div>

                {/* Comparison Card */}
                <div
                  className="p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                  }}
                >
                  <div className="flex items-center gap-6 text-center sm:text-left">
                    <div>
                      <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>Original</p>
                      <p className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                        {imageMeta ? formatFileSize(imageMeta.size) : "-"}
                      </p>
                    </div>

                    <span className="text-sm font-body" style={{ color: "var(--text-muted)" }}>→</span>

                    <div>
                      <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>Compressed</p>
                      <p className="font-headline font-semibold text-lg" style={{ color: "var(--amber-primary)" }}>
                        {isCompressing ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm">Processing...</span>
                          </span>
                        ) : compressedSize ? formatFileSize(compressedSize) : "Calculating..."}
                      </p>
                    </div>

                    {savingsPercent > 0 && (
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                        }}
                      >
                        -{savingsPercent}% Saved
                      </span>
                    )}
                  </div>

                  {compressedUrl && (
                    <a
                      href={compressedUrl}
                      download={`compressed_${file.name.replace(/\.[^/.]+$/, "")}.${outputFormat === "image/jpeg" ? "jpg" : "webp"}`}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      <Download size={16} />
                      <span>Download Image</span>
                    </a>
                  )}
                </div>

                {/* Preview Image */}
                {compressedUrl && (
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                      Live Result Preview
                    </p>
                    <div
                      className="w-full h-72 sm:h-80 max-h-[360px] rounded-xl border p-3 flex items-center justify-center overflow-hidden relative bg-black/5 dark:bg-white/5"
                      style={{
                        borderColor: "var(--border-warm)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={compressedUrl}
                        alt="Compressed preview"
                        className="max-w-full max-h-full object-contain rounded select-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
                How image compression works
              </h3>
              <ol className="space-y-4">
                {[
                  "Select an image from your device. It is loaded strictly in local memory.",
                  "Tune the quality and optional resolution scale sliders to balance clarity and file weight.",
                  "Inspect the real-time size reduction percentage and live image preview.",
                  "Click ‘Download Image’ to save your streamlined file.",
                ].map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5"
                      style={{
                        backgroundColor: "var(--amber-tint)",
                        color: "var(--amber-primary)",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-base" style={{ color: "var(--amber-primary)" }}>
                <Shield size={18} />
                <h4>Complete Privacy</h4>
              </div>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Unlike typical compression services, your photos and graphics are never uploaded over the internet. Canvas processing happens directly in your browser hardware.
              </p>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
                Related Image Tools
              </h3>
              <div className="divide-y" style={{ borderColor: "var(--border-warm)" }}>
                {relatedTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      className="py-3 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ToolIcon size={16} style={{ color: "var(--amber-primary)" }} />
                        <span
                          className="font-body text-sm group-hover:text-[var(--amber-primary)] transition-colors"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {tool.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
