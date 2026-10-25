"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ImageDown,
  Upload,
  Trash2,
  Download,
  Shield,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  FilePlus2,
  Scissors,
  Minimize2,
  Loader2,
  CheckCircle2,
  FileText,
  RotateCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument } from "pdf-lib";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width: number;
  height: number;
}

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4" | "letter">("a4");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState<number>(20); // in points
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFiles = async (incoming: FileList | File[]) => {
    setErrorMessage(null);
    setPdfUrl(null);
    const validFiles: File[] = [];

    Array.from(incoming).forEach((file) => {
      const type = file.type.toLowerCase();
      const ext = file.name.toLowerCase();
      if (
        type.startsWith("image/") ||
        ext.endsWith(".jpg") ||
        ext.endsWith(".jpeg") ||
        ext.endsWith(".png") ||
        ext.endsWith(".webp")
      ) {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) {
      setErrorMessage("Please select valid image files (.jpg, .png, .webp).");
      return;
    }

    const loadedItems: ImageItem[] = [];

    for (const file of validFiles) {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = previewUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });

      loadedItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        width: img.naturalWidth || 800,
        height: img.naturalHeight || 600,
      });
    }

    setImages((prev) => [...prev, ...loadedItems]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setPdfUrl(null);
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setImages(updated);
    setPdfUrl(null);
  };

  const convertWebpOrImageToPngBytes = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error("Canvas context failed"));
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return reject(new Error("Blob creation failed"));
          resolve(await blob.arrayBuffer());
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image failed to load into canvas"));
      };
      img.src = url;
    });
  };

  const handleConvertToPdf = async () => {
    if (images.length === 0) {
      setErrorMessage("Please upload at least one image to convert.");
      return;
    }

    setIsConverting(true);
    setErrorMessage(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        let embeddedImage;
        const fileType = item.file.type.toLowerCase();
        const fileName = item.name.toLowerCase();

        if (fileType === "image/jpeg" || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
          const buffer = await item.file.arrayBuffer();
          embeddedImage = await pdfDoc.embedJpg(buffer);
        } else if (fileType === "image/png" || fileName.endsWith(".png")) {
          const buffer = await item.file.arrayBuffer();
          embeddedImage = await pdfDoc.embedPng(buffer);
        } else {
          // WebP or other format -> convert to PNG in-memory via canvas
          const pngBuffer = await convertWebpOrImageToPngBytes(item.file);
          embeddedImage = await pdfDoc.embedPng(pngBuffer);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (pageSize === "a4") {
          pageWidth = 595.28;
          pageHeight = 841.89;
        } else if (pageSize === "letter") {
          pageWidth = 612;
          pageHeight = 792;
        }

        // Handle orientation
        if (pageSize !== "fit") {
          let isLandscape = false;
          if (orientation === "landscape") {
            isLandscape = true;
          } else if (orientation === "portrait") {
            isLandscape = false;
          } else {
            // Auto: match image aspect ratio
            isLandscape = imgWidth > imgHeight;
          }

          if (isLandscape && pageWidth < pageHeight) {
            const temp = pageWidth;
            pageWidth = pageHeight;
            pageHeight = temp;
          } else if (!isLandscape && pageWidth > pageHeight) {
            const temp = pageWidth;
            pageWidth = pageHeight;
            pageHeight = temp;
          }
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        if (pageSize === "fit") {
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: imgWidth,
            height: imgHeight,
          });
        } else {
          const availWidth = Math.max(pageWidth - margin * 2, 20);
          const availHeight = Math.max(pageHeight - margin * 2, 20);

          const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;

          const x = (pageWidth - scaledWidth) / 2;
          const y = (pageHeight - scaledHeight) / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setPdfSize(blob.size);
    } catch (err: unknown) {
      console.error("PDF creation error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "An error occurred while generating the PDF."
      );
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "Image to PDF" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <ImageDown size={16} />
            <span>PDF Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Image to PDF Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert JPG, PNG, and WebP images into a clean, formatted PDF document.
            Combine multiple pictures, arrange the order, and choose your preferred page sizing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Workspace */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging ? "border-amber-500 scale-[0.99]" : ""
              }`}
              style={{
                borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                backgroundColor: isDragging ? "var(--amber-tint)" : "var(--surface)",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  backgroundColor: "var(--amber-tint)",
                  color: "var(--amber-primary)",
                }}
              >
                <Upload size={24} />
              </div>
              <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                Drop your images here
              </h3>
              <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                Supports JPG, PNG, and WebP files. All operations occur 100% in your browser.
              </p>
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg font-body text-sm font-medium transition-all"
                style={{
                  backgroundColor: "var(--amber-primary)",
                  color: "#FFFFFF",
                }}
              >
                Select Images
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                className="p-4 rounded-xl border font-body text-sm"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Images List */}
            {images.length > 0 && (
              <div
                className="rounded-xl border p-6 flex flex-col gap-4"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                    Selected Images ({images.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                      setImages([]);
                      setPdfUrl(null);
                    }}
                    className="font-body text-xs text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-4 p-3 rounded-lg border transition-all"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                      }}
                    >
                      {/* Image Thumbnail */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.previewUrl}
                        alt={img.name}
                        className="w-14 h-14 object-cover rounded-md border shrink-0"
                        style={{ borderColor: "var(--border-warm)" }}
                      />

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {img.name}
                        </p>
                        <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                          {img.width} × {img.height} px · {formatFileSize(img.size)}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveImage(idx, "up")}
                          disabled={idx === 0}
                          aria-label={`Move ${img.name} up`}
                          className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, "down")}
                          disabled={idx === images.length - 1}
                          aria-label={`Move ${img.name} down`}
                          className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          aria-label={`Remove ${img.name}`}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Page Options */}
                <div
                  className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4"
                  style={{ borderColor: "var(--border-warm)" }}
                >
                  <div>
                    <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as "fit" | "a4" | "letter")}
                      className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="a4">A4 (Standard)</option>
                      <option value="letter">US Letter</option>
                      <option value="fit">Fit to Image Size</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Orientation
                    </label>
                    <select
                      value={orientation}
                      disabled={pageSize === "fit"}
                      onChange={(e) => setOrientation(e.target.value as "auto" | "portrait" | "landscape")}
                      className="w-full rounded-lg border px-3 py-2 font-body text-sm disabled:opacity-50"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="auto">Auto (Match Image)</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Page Margin
                    </label>
                    <select
                      value={margin}
                      disabled={pageSize === "fit"}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-full rounded-lg border px-3 py-2 font-body text-sm disabled:opacity-50"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value={0}>No Margin</option>
                      <option value={15}>Small (15 pt)</option>
                      <option value={30}>Normal (30 pt)</option>
                    </select>
                  </div>
                </div>

                {/* Convert Button */}
                <button
                  type="button"
                  onClick={handleConvertToPdf}
                  disabled={isConverting}
                  className="w-full mt-2 py-3.5 rounded-lg font-headline font-semibold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--amber-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  {isConverting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <ImageDown size={18} />
                      Convert {images.length} Image{images.length > 1 ? "s" : ""} to PDF
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Result Download Card & Interactive Preview */}
            {pdfUrl && (
              <div className="space-y-4">
                <div
                  className="p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500 shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                        Your PDF is ready!
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {images.length} pages generated · {pdfSize ? formatFileSize(pdfSize) : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowPreview((prev) => !prev)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border font-body text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                      title={showPreview ? "Hide Preview" : "Show Preview"}
                    >
                      {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                      <span>{showPreview ? "Hide Preview" : "Preview PDF"}</span>
                    </button>
                    <a
                      href={pdfUrl}
                      download="converted-images.pdf"
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-body text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                      style={{
                        backgroundColor: "var(--amber-primary)",
                        color: "#FFFFFF",
                      }}
                    >
                      <Download size={16} />
                      Download PDF
                    </a>
                  </div>
                </div>

                {showPreview && (
                  <div
                    className="p-4 rounded-xl border space-y-3"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border-warm)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        <Eye size={16} style={{ color: "var(--amber-primary)" }} />
                        <span>Interactive PDF Preview</span>
                      </div>
                      <span className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {images.length} Page{images.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-warm)" }}>
                      <iframe
                        src={pdfUrl}
                        title="Converted PDF Preview"
                        className="w-full h-[540px] bg-neutral-900 border-0"
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
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-sm" style={{ color: "var(--amber-primary)" }}>
                <Shield size={16} />
                <h4>Privacy Guarantee</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Your pictures are converted inside your browser using client-side JavaScript. None of your photos or documents are ever uploaded to any cloud server.
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
                Related PDF Tools
              </h3>
              <div className="flex flex-col gap-3 font-body text-sm">
                {[
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
                  { name: "Split PDF", href: "/tools/pdf/split", icon: Scissors },
                  { name: "Rotate PDF", href: "/tools/pdf/rotate", icon: RotateCw },
                  { name: "Compress PDF", href: "/tools/pdf/compress", icon: Minimize2 },
                  { name: "PDF to Images", href: "/tools/pdf/to-jpg", icon: FileText },
                ].map((t) => (
                  <Link
                    key={t.name}
                    href={t.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <t.icon size={16} style={{ color: "var(--amber-primary)" }} />
                      <span>{t.name}</span>
                    </div>
                    <ChevronRight size={14} />
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
