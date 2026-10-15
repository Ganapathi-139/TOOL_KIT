"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Expand,
  Upload,
  Download,
  Shield,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  Loader2,
  ChevronRight,
  Image as ImageIcon,
  Minimize2,
  RefreshCcw,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function ImageResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState<number>(0.92);

  const [_previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resizedBlobUrl, setResizedBlobUrl] = useState<string | null>(null);
  const [resizedSize, setResizedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const resizedBlobUrlRef = useRef<string | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (resizedBlobUrlRef.current) URL.revokeObjectURL(resizedBlobUrlRef.current);
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const clearImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (resizedBlobUrlRef.current) {
      URL.revokeObjectURL(resizedBlobUrlRef.current);
      resizedBlobUrlRef.current = null;
    }
    setFile(null);
    setPreviewUrl(null);
    setResizedBlobUrl(null);
    setResizedSize(null);
    setOrigWidth(0);
    setOrigHeight(0);
    setTargetWidth(0);
    setTargetHeight(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    imageElementRef.current = null;
  };

  const handleFile = (selected: File) => {
    if (!selected.type.startsWith("image/")) return;

    clearImage();
    setFile(selected);

    const url = URL.createObjectURL(selected);
    previewUrlRef.current = url;
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      imageElementRef.current = img;
      setOrigWidth(img.naturalWidth);
      setOrigHeight(img.naturalHeight);
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
    };
    img.src = url;
  };

  const handleWidthChange = (val: number) => {
    const w = Math.max(1, val);
    setTargetWidth(w);
    if (aspectRatioLocked && origWidth > 0 && origHeight > 0) {
      const ratio = origHeight / origWidth;
      setTargetHeight(Math.max(1, Math.round(w * ratio)));
    }
  };

  const handleHeightChange = (val: number) => {
    const h = Math.max(1, val);
    setTargetHeight(h);
    if (aspectRatioLocked && origWidth > 0 && origHeight > 0) {
      const ratio = origWidth / origHeight;
      setTargetWidth(Math.max(1, Math.round(h * ratio)));
    }
  };

  const applyScalePreset = (percent: number) => {
    if (origWidth <= 0 || origHeight <= 0) return;
    const w = Math.max(1, Math.round((origWidth * percent) / 100));
    const h = Math.max(1, Math.round((origHeight * percent) / 100));
    setTargetWidth(w);
    setTargetHeight(h);
  };

  const processImage = useCallback(() => {
    if (!imageElementRef.current || targetWidth <= 0 || targetHeight <= 0) return;

    setIsProcessing(true);
    const img = imageElementRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    const isSwapped = rotation === 90 || rotation === 270;
    canvas.width = isSwapped ? targetHeight : targetWidth;
    canvas.height = isSwapped ? targetWidth : targetHeight;

    // Fill white background for JPEG
    if (outputFormat === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    // Translate to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply flips
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Draw scaled image centered
    ctx.drawImage(
      img,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        setIsProcessing(false);
        if (blob) {
          if (resizedBlobUrlRef.current) URL.revokeObjectURL(resizedBlobUrlRef.current);
          const url = URL.createObjectURL(blob);
          resizedBlobUrlRef.current = url;
          setResizedBlobUrl(url);
          setResizedSize(blob.size);
        }
      },
      outputFormat,
      outputFormat === "image/png" ? undefined : quality
    );
  }, [targetWidth, targetHeight, rotation, flipH, flipV, outputFormat, quality]);

  useEffect(() => {
    if (file && targetWidth > 0 && targetHeight > 0) {
      processImage();
    }
  }, [file, targetWidth, targetHeight, rotation, flipH, flipV, outputFormat, quality, processImage]);

  const isSwapped = rotation === 90 || rotation === 270;
  const currentOutputWidth = isSwapped ? targetHeight : targetWidth;
  const currentOutputHeight = isSwapped ? targetWidth : targetHeight;

  const getExtension = () => {
    if (outputFormat === "image/jpeg") return "jpg";
    if (outputFormat === "image/webp") return "webp";
    return "png";
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Image Tools", href: "/tools/image" },
            { label: "Image Resizer" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Expand size={16} />
            <span>Image Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Image Resizer & Transformer
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Resize pixel dimensions, lock aspect ratios, rotate, flip, and export images in JPG, PNG, or WebP format with private in-browser processing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Workspace */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[320px] ${
                  isDragging ? "border-amber-500 bg-amber-500/5 scale-[0.99]" : "hover:border-amber-500/50"
                }`}
                style={{
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                  backgroundColor: "var(--surface)",
                }}
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
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  }}
                />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                >
                  <Upload size={28} />
                </div>
                <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  Choose an image or drag it here
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>
                  Supports JPG, PNG, WebP, SVG, and GIF
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl font-body font-semibold text-sm text-white shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div
                className="rounded-2xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* File Header */}
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                    >
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-sm truncate max-w-xs sm:max-w-md" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                        Original: {origWidth} × {origHeight} px • {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="font-body text-xs font-medium hover:underline"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Change image
                  </button>
                </div>

                {/* Dimension Inputs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      Pixel Dimensions
                    </label>
                    <button
                      type="button"
                      onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-body transition-colors ${
                        aspectRatioLocked ? "border-amber-500 font-semibold" : ""
                      }`}
                      style={{
                        backgroundColor: aspectRatioLocked ? "var(--amber-tint)" : "transparent",
                        borderColor: aspectRatioLocked ? "var(--amber-primary)" : "var(--border-warm)",
                        color: aspectRatioLocked ? "var(--amber-primary)" : "var(--text-muted)",
                      }}
                    >
                      {aspectRatioLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      <span>{aspectRatioLocked ? "Lock Aspect Ratio" : "Free Proportions"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20000"
                        value={targetWidth}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
                        style={{
                          backgroundColor: "var(--surface-tinted)",
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20000"
                        value={targetHeight}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
                        style={{
                          backgroundColor: "var(--surface-tinted)",
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Percentage Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                      Quick Scale:
                    </span>
                    {[25, 50, 75, 100, 150, 200].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyScalePreset(pct)}
                        className="px-2.5 py-1 rounded text-xs border font-body transition-colors hover:border-amber-500"
                        style={{
                          backgroundColor: "var(--surface-tinted)",
                          borderColor: "var(--border-warm)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transform Controls (Rotate & Flip) */}
                <div className="border-t pt-4 space-y-3" style={{ borderColor: "var(--border-warm)" }}>
                  <label className="block font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    Rotate & Flip
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setRotation((prev) => (prev + 270) % 360)}
                      className="py-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <RotateCcw size={14} /> 90° CCW
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="py-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <RotateCw size={14} /> 90° CW
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipH(!flipH)}
                      className={`py-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        flipH ? "ring-2 ring-amber-500 font-semibold" : ""
                      }`}
                      style={{
                        backgroundColor: flipH ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <FlipHorizontal size={14} /> Flip H
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipV(!flipV)}
                      className={`py-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        flipV ? "ring-2 ring-amber-500 font-semibold" : ""
                      }`}
                      style={{
                        backgroundColor: flipV ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <FlipVertical size={14} /> Flip V
                    </button>
                  </div>
                </div>

                {/* Output Format */}
                <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ borderColor: "var(--border-warm)" }}>
                  <div>
                    <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Output Format
                    </label>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as "image/png" | "image/jpeg" | "image/webp")}
                      className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="image/png">PNG (Lossless)</option>
                      <option value="image/jpeg">JPG (Standard)</option>
                      <option value="image/webp">WebP (Modern Compact)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Quality ({Math.round(quality * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      disabled={outputFormat === "image/png"}
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full accent-amber-600 mt-2 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Card */}
            <div
              className="rounded-xl border p-4 flex items-center gap-3"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
              >
                <Shield size={16} />
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <strong className="font-semibold text-primary">Zero Cloud Uploads:</strong> Scaling and canvas transformations execute on your device&apos;s GPU/CPU. Images are never uploaded.
              </p>
            </div>
          </div>

          {/* Fixed Responsive Preview & Download Card */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div
              className="rounded-2xl border p-6 flex flex-col items-center gap-4 text-center"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="w-full flex items-center justify-between">
                <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                  Result Preview
                </h3>
                {rotation !== 0 && (
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-600">
                    Rotated {rotation}°
                  </span>
                )}
              </div>

              {/* Fixed Responsive Container */}
              <div
                className="w-full h-72 sm:h-80 max-h-[360px] rounded-xl border overflow-hidden p-3 flex items-center justify-center relative bg-black/5 dark:bg-white/5"
                style={{ borderColor: "var(--border-warm)" }}
              >
                {resizedBlobUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resizedBlobUrl}
                      alt="Resized output"
                      className="max-w-full max-h-full object-contain select-none"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs">
                        <Loader2 size={24} className="text-white animate-spin" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-xs gap-2" style={{ color: "var(--text-muted)" }}>
                    <ImageIcon size={32} className="opacity-40" />
                    <span>Upload an image to preview transformed output</span>
                  </div>
                )}
              </div>

              {resizedBlobUrl && (
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                    <span className="font-medium">
                      Dimensions: <span className="font-mono text-primary font-semibold">{currentOutputWidth} × {currentOutputHeight} px</span>
                    </span>
                    <span>{resizedSize ? formatFileSize(resizedSize) : ""}</span>
                  </div>

                  <a
                    href={resizedBlobUrl}
                    download={`${(file?.name || "image").replace(/\.[^/.]+$/, "")}_resized.${getExtension()}`}
                    className="w-full py-3.5 rounded-xl font-body text-sm font-semibold flex items-center justify-center gap-2 text-white transition-transform hover:scale-105 active:scale-95 shadow-sm"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    <Download size={16} />
                    Download Resized Image
                  </a>
                </div>
              )}
            </div>

            {/* Related Tools */}
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Related Image Tools
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { name: "Image Compressor", href: "/tools/image/compress", icon: Minimize2 },
                  { name: "Image Format Converter", href: "/tools/image/convert", icon: RefreshCcw },
                  { name: "Image to PDF", href: "/tools/pdf/image-to-pdf", icon: ImageIcon },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-body group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon size={15} style={{ color: "var(--amber-primary)" }} />
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.name}
                      </span>
                    </div>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text-muted)" }} />
                  </Link>
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
