"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  RotateCw,
  Upload,
  Download,
  Shield,
  ChevronRight,
  FileText,
  Loader2,
  CheckCircle2,
  FilePlus2,
  Scissors,
  ImageDown,
  Minimize2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument, degrees } from "pdf-lib";

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [pageSelection, setPageSelection] = useState<"all" | "odd" | "even" | "custom">("all");
  const [customRange, setCustomRange] = useState<string>("");
  const [isRotating, setIsRotating] = useState(false);
  const [rotatedPdfUrl, setRotatedPdfUrl] = useState<string | null>(null);
  const [rotatedPdfSize, setRotatedPdfSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    setRotatedPdfUrl(null);

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please upload a valid PDF document (.pdf).");
      return;
    }

    try {
      const buffer = await selected.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      setFile(selected);
      setPageCount(count);
    } catch (err: unknown) {
      console.error("PDF load error:", err);
      setErrorMessage("Could not read PDF. The document might be password-protected or corrupted.");
    }
  };

  const parseCustomPages = (input: string, max: number): Set<number> => {
    const result = new Set<number>();
    const parts = input.split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [startStr, endStr] = trimmed.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(max, end); i++) {
            result.add(i);
          }
        }
      } else {
        const page = parseInt(trimmed, 10);
        if (!isNaN(page) && page >= 1 && page <= max) {
          result.add(page);
        }
      }
    }
    return result;
  };

  const handleRotate = async () => {
    if (!file) return;

    setIsRotating(true);
    setErrorMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const customSet = pageSelection === "custom" ? parseCustomPages(customRange, pages.length) : null;

      if (pageSelection === "custom" && customSet && customSet.size === 0) {
        setErrorMessage("Please enter a valid page range (e.g., 1-3, 5).");
        setIsRotating(false);
        return;
      }

      pages.forEach((page, index) => {
        const pageNum = index + 1;
        let shouldRotate = false;

        if (pageSelection === "all") shouldRotate = true;
        else if (pageSelection === "odd" && pageNum % 2 !== 0) shouldRotate = true;
        else if (pageSelection === "even" && pageNum % 2 === 0) shouldRotate = true;
        else if (pageSelection === "custom" && customSet?.has(pageNum)) shouldRotate = true;

        if (shouldRotate) {
          const currentRotation = page.getRotation().angle;
          const newRotation = (currentRotation + rotationAngle) % 360;
          page.setRotation(degrees(newRotation));
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setRotatedPdfUrl(url);
      setRotatedPdfSize(blob.size);
    } catch (err: unknown) {
      console.error("Rotate error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to rotate PDF pages.");
    } finally {
      setIsRotating(false);
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
            { label: "Rotate PDF" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <RotateCw size={16} />
            <span>PDF Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Rotate PDF Pages
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Permanently rotate PDF pages by 90°, 180°, or 270°. Select all pages, odd/even pages,
            or specific ranges.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!file ? (
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
                  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
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
                  Choose a PDF file to rotate
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Processed completely client-side in your browser.
                </p>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-lg font-body text-sm font-medium transition-all"
                  style={{
                    backgroundColor: "var(--amber-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  Select PDF File
                </button>
              </div>
            ) : (
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* File Info */}
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {pageCount} Pages · {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setRotatedPdfUrl(null);
                    }}
                    className="font-body text-xs text-red-500 hover:underline"
                  >
                    Change File
                  </button>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="block font-body text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                      Rotation Direction
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "90° Clockwise", angle: 90 },
                        { label: "180° Flip", angle: 180 },
                        { label: "270° (90° CCW)", angle: 270 },
                      ].map((opt) => (
                        <button
                          key={opt.angle}
                          type="button"
                          onClick={() => setRotationAngle(opt.angle)}
                          className={`p-3 rounded-lg border font-body text-sm font-medium text-center transition-all ${
                            rotationAngle === opt.angle ? "ring-2 ring-amber-500" : ""
                          }`}
                          style={{
                            backgroundColor: rotationAngle === opt.angle ? "var(--amber-tint)" : "var(--surface-tinted)",
                            borderColor: "var(--border-warm)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-body text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                      Apply Rotation To
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: "All Pages", value: "all" },
                        { label: "Odd Pages", value: "odd" },
                        { label: "Even Pages", value: "even" },
                        { label: "Custom Range", value: "custom" },
                      ].map((scope) => (
                        <button
                          key={scope.value}
                          type="button"
                          onClick={() => setPageSelection(scope.value as "all" | "odd" | "even" | "custom")}
                          className={`p-2.5 rounded-lg border font-body text-xs font-medium text-center transition-all ${
                            pageSelection === scope.value ? "ring-2 ring-amber-500" : ""
                          }`}
                          style={{
                            backgroundColor: pageSelection === scope.value ? "var(--amber-tint)" : "var(--surface-tinted)",
                            borderColor: "var(--border-warm)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {scope.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {pageSelection === "custom" && (
                    <div>
                      <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                        Enter page numbers or ranges (e.g. 1-3, 5, 8-10):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1, 3-5"
                        value={customRange}
                        onChange={(e) => setCustomRange(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                        style={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRotate}
                  disabled={isRotating}
                  className="w-full py-3.5 rounded-lg font-headline font-semibold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--amber-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  {isRotating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Rotating Pages...
                    </>
                  ) : (
                    <>
                      <RotateCw size={18} />
                      Rotate PDF
                    </>
                  )}
                </button>
              </div>
            )}

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

            {rotatedPdfUrl && (
              <div
                className="p-6 rounded-xl border flex flex-col gap-4"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "rgba(34, 197, 94, 0.3)",
                }}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500 shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                        Rotated PDF is ready!
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {rotatedPdfSize ? formatFileSize(rotatedPdfSize) : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-4 py-2.5 rounded-lg border font-body text-sm font-medium flex items-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                        backgroundColor: showPreview ? "var(--amber-tint)" : "var(--surface-tinted)",
                      }}
                    >
                      {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                      <span>{showPreview ? "Hide Preview" : "Preview PDF"}</span>
                    </button>

                    <a
                      href={rotatedPdfUrl}
                      download={`rotated-${file?.name || "document.pdf"}`}
                      className="px-6 py-2.5 rounded-lg font-body text-sm font-semibold flex items-center justify-center gap-2 transition-all text-white"
                      style={{
                        backgroundColor: "var(--amber-primary)",
                      }}
                    >
                      <Download size={16} />
                      <span>Download Rotated PDF</span>
                    </a>
                  </div>
                </div>

                {showPreview && (
                  <div
                    className="border rounded-xl overflow-hidden mt-2"
                    style={{ borderColor: "var(--border-warm)", height: "540px" }}
                  >
                    <iframe
                      src={rotatedPdfUrl}
                      title="Rotated PDF Preview"
                      className="w-full h-full border-0"
                    />
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
                Your documents stay on your machine. All rotation and saving are computed via WebAssembly and JavaScript right in your browser.
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
                  { name: "Image to PDF", href: "/tools/pdf/image-to-pdf", icon: ImageDown },
                  { name: "Compress PDF", href: "/tools/pdf/compress", icon: Minimize2 },
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
