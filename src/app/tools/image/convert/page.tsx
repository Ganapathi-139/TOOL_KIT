"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCcw,
  Upload,
  Download,
  Shield,
  ChevronRight,
  Minimize2,
  Expand,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

type TargetFormat = "image/png" | "image/jpeg" | "image/webp";

export default function ImageConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("image/png");
  const [jpegQuality, setJpegQuality] = useState<number>(90);
  const [fillBackground, setFillBackground] = useState<string>("#FFFFFF");
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFormatLabel = (mime: TargetFormat) => {
    switch (mime) {
      case "image/png":
        return "PNG (Lossless)";
      case "image/jpeg":
        return "JPEG (.jpg)";
      case "image/webp":
        return "WebP";
    }
  };

  const previewUrlRef = useRef<string | null>(null);
  const convertedUrlRef = useRef<string | null>(null);

  const getFormatExtension = (mime: TargetFormat) => {
    switch (mime) {
      case "image/png":
        return "png";
      case "image/jpeg":
        return "jpg";
      case "image/webp":
        return "webp";
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
    };
  }, []);

  const clearImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (convertedUrlRef.current) {
      URL.revokeObjectURL(convertedUrlRef.current);
      convertedUrlRef.current = null;
    }
    setFile(null);
    setPreviewUrl(null);
    setConvertedBlob(null);
    setConvertedUrl(null);
    setIsConverting(false);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    clearImage();
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  };

  const processConvert = useCallback(() => {
    if (!file || !previewUrl) return;

    setIsConverting(true);
    const img = new Image();
    img.src = previewUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsConverting(false);
        return;
      }

      // If converting to JPEG or fill specified, fill background first to prevent black transparency
      if (targetFormat === "image/jpeg") {
        ctx.fillStyle = fillBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const qualityVal = targetFormat === "image/png" ? undefined : jpegQuality / 100;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
            const newUrl = URL.createObjectURL(blob);
            convertedUrlRef.current = newUrl;
            setConvertedBlob(blob);
            setConvertedUrl(newUrl);
          }
          setIsConverting(false);
        },
        targetFormat,
        qualityVal
      );
    };
  }, [file, previewUrl, targetFormat, jpegQuality, fillBackground]);

  useEffect(() => {
    if (file && previewUrl) {
      processConvert();
    }
  }, [file, previewUrl, targetFormat, jpegQuality, fillBackground, processConvert]);

  const relatedTools = [
    { name: "Image Compressor", href: "/tools/image/compress", icon: Minimize2 },
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
            { label: "Image Converter" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <RefreshCcw size={16} />
            <span>Image Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Image Format Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert images between PNG, JPEG, and WebP instantly in your browser with zero quality degradation.
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
                  accept="image/*"
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
                  Drop an image to convert
                </h3>
                <p
                  className="font-body text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Supports PNG, JPG, WebP, GIF, BMP · Converted 100% locally
                </p>
              </div>
            ) : (
              /* Conversion Workspace */
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {file.name}
                    </p>
                    <p className="font-body text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Current Format: {file.type || "Image"} · {formatFileSize(file.size)}
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

                {/* Target Format Buttons */}
                <div>
                  <label className="block font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Convert To
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["image/png", "image/jpeg", "image/webp"] as TargetFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setTargetFormat(fmt)}
                        className="p-3 rounded-lg border text-left font-body text-sm transition-all"
                        style={{
                          backgroundColor: targetFormat === fmt ? "var(--amber-tint)" : "var(--surface-tinted)",
                          borderColor: targetFormat === fmt ? "var(--amber-primary)" : "var(--border-warm)",
                          color: targetFormat === fmt ? "var(--amber-primary)" : "var(--text-primary)",
                          fontWeight: targetFormat === fmt ? 600 : 400,
                        }}
                      >
                        {getFormatLabel(fmt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lossy Quality Slider if JPEG or WebP */}
                {targetFormat !== "image/png" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="jpeg-quality-slider" className="font-body text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        Compression Quality: <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{jpegQuality}%</span>
                      </label>
                    </div>
                    <input
                      id="jpeg-quality-slider"
                      type="range"
                      min="10"
                      max="100"
                      value={jpegQuality}
                      onChange={(e) => setJpegQuality(Number(e.target.value))}
                      className="w-full accent-[var(--amber-primary)]"
                    />
                  </div>
                )}

                {/* Background color fill for transparent images converted to JPEG */}
                {targetFormat === "image/jpeg" && (
                  <div>
                    <label htmlFor="bg-fill-input" className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Background Fill for Transparent Pixels
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="bg-fill-input"
                        type="color"
                        value={fillBackground}
                        onChange={(e) => setFillBackground(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer"
                      />
                      <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{fillBackground}</span>
                    </div>
                  </div>
                )}

                {/* Download / Status Banner */}
                {convertedUrl && (
                  <div
                    className="p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                    }}
                  >
                    <div>
                      <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                        Converted Output ({getFormatExtension(targetFormat).toUpperCase()})
                      </p>
                      <p className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                        {isConverting ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm">Converting...</span>
                          </span>
                        ) : convertedBlob ? formatFileSize(convertedBlob.size) : "Ready"}
                      </p>
                    </div>

                    <a
                      href={convertedUrl}
                      download={`${file.name.replace(/\.[^/.]+$/, "")}_converted.${getFormatExtension(targetFormat)}`}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      <Download size={16} />
                      <span>Download {getFormatExtension(targetFormat).toUpperCase()}</span>
                    </a>
                  </div>
                )}

                {/* Preview Image */}
                {convertedUrl && (
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                      Converted Preview
                    </p>
                    <div
                      className="w-full h-72 sm:h-80 max-h-[360px] rounded-xl border p-3 flex items-center justify-center overflow-hidden relative bg-black/5 dark:bg-white/5"
                      style={{
                        borderColor: "var(--border-warm)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={convertedUrl}
                        alt="Converted result"
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
                Format Comparison
              </h3>
              <div className="space-y-3 font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>PNG</p>
                  <p>Lossless compression. Ideal for logos, graphics, screenshots, and artwork requiring transparent backgrounds.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>JPEG / JPG</p>
                  <p>Lossy compression. Excellent balance of small file size and quality for realistic photographs.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>WebP</p>
                  <p>Modern Google-developed format providing 25-34% smaller file sizes than comparable JPEGs at equivalent quality.</p>
                </div>
              </div>
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
                <h4>Privacy Protected</h4>
              </div>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Files never leave your computer. Conversions execute entirely on your GPU and browser canvas memory.
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
