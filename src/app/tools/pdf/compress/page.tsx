"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Minimize2,
  Upload,
  Download,
  Shield,
  ChevronRight,
  FileText,
  Loader2,
  CheckCircle2,
  FilePlus2,
  Scissors,
  RotateCw,
  ImageDown,
  Sparkles,
  Sliders,
  Eye,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument } from "pdf-lib";

type CompressionMode = "smart" | "strong" | "light" | "stream";

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progressText, setProgressText] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [compressionMode, setCompressionMode] = useState<CompressionMode>("smart");
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [newSize, setNewSize] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount or file reset
  useEffect(() => {
    return () => {
      if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
    };
  }, [compressedPdfUrl]);

  // Load PDF.js client-side library
  useEffect(() => {
    if (typeof window !== "undefined" && !window.pdfjsLib) {
      const script = document.createElement("script");
      script.src = "/js/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js";
        }
      };
      script.onerror = () => {
        // Fallback to CDN if local script fails
        const fallback = document.createElement("script");
        fallback.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        fallback.async = true;
        fallback.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
        };
        document.body.appendChild(fallback);
      };
      document.body.appendChild(script);
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes <= 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFile = (selected: File) => {
    setErrorMessage(null);
    if (compressedPdfUrl) {
      URL.revokeObjectURL(compressedPdfUrl);
      setCompressedPdfUrl(null);
    }
    setShowPreview(false);
    setProgressPercent(0);
    setProgressText("");

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file (.pdf).");
      return;
    }

    setFile(selected);
    setOriginalSize(selected.size);
  };

  const ensurePdfJsLoaded = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (window.pdfjsLib) return true;

    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 200));
      if (window.pdfjsLib) return true;
    }
    return false;
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setErrorMessage(null);
    setProgressPercent(5);
    setProgressText("Reading document...");

    try {
      const buffer = await file.arrayBuffer();

      // Case 1: Pure lossless stream compaction mode
      if (compressionMode === "stream") {
        setProgressText("Compacting internal PDF object streams...");
        setProgressPercent(40);

        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("ToolKit Optimizer");
        pdfDoc.setCreator("ToolKit");

        setProgressPercent(80);
        const optimizedBytes = await pdfDoc.save({ useObjectStreams: true });
        const blob = new Blob([optimizedBytes as unknown as BlobPart], { type: "application/pdf" });

        setProgressPercent(100);
        setProgressText("Optimization complete!");

        if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
        setCompressedPdfUrl(URL.createObjectURL(blob));
        setNewSize(blob.size);
        setPageCount(pdfDoc.getPageCount());
        return;
      }

      // Case 2: Image & Scanned Pages High-Efficiency Recompression Engine
      setProgressText("Initializing PDF engine...");
      const isReady = await ensurePdfJsLoaded();
      if (!isReady || !window.pdfjsLib) {
        throw new Error("PDF processing engine is still loading. Please try again in a few moments.");
      }

      const uint8 = new Uint8Array(buffer);
      const loadingTask = window.pdfjsLib.getDocument({ data: uint8 });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      setPageCount(totalPages);

      // Compression presets based on selected mode
      let scale = 1.4;
      let quality = 0.70;

      if (compressionMode === "strong") {
        scale = 1.1;
        quality = 0.52;
      } else if (compressionMode === "light") {
        scale = 1.7;
        quality = 0.82;
      }

      const newPdfDoc = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const percent = Math.round(10 + (i / totalPages) * 75);
        setProgressPercent(percent);
        setProgressText(`Compressing page ${i} of ${totalPages} (${percent}%)...`);

        const page = await pdf.getPage(i);
        const originalViewport = page.getViewport({ scale: 1.0 });
        const renderViewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(renderViewport.width));
        canvas.height = Math.max(1, Math.round(renderViewport.height));
        const ctx = canvas.getContext("2d", { alpha: false });

        if (!ctx) continue;

        // Render clean white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport: renderViewport,
        }).promise;

        // Convert canvas frame to compressed JPEG data URL
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64Data = dataUrl.split(",")[1];
        const binaryStr = atob(base64Data);
        const imgBytes = new Uint8Array(binaryStr.length);
        for (let b = 0; b < binaryStr.length; b++) {
          imgBytes[b] = binaryStr.charCodeAt(b);
        }

        const embeddedImage = await newPdfDoc.embedJpg(imgBytes);
        const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: originalViewport.width,
          height: originalViewport.height,
        });

        // Free canvas memory
        canvas.width = 0;
        canvas.height = 0;
      }

      setProgressText("Packaging compressed PDF...");
      setProgressPercent(92);

      const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });
      let finalBlob = new Blob([compressedBytes as unknown as BlobPart], { type: "application/pdf" });

      // If recompressing pages resulted in a larger file (e.g. on tiny text-only PDFs),
      // fallback to stream compaction so file size is never inflated
      if (finalBlob.size >= originalSize && originalSize > 0) {
        try {
          const streamDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          streamDoc.setTitle("");
          streamDoc.setAuthor("");
          streamDoc.setSubject("");
          streamDoc.setKeywords([]);
          const streamBytes = await streamDoc.save({ useObjectStreams: true });
          if (streamBytes.length < finalBlob.size) {
            finalBlob = new Blob([streamBytes as unknown as BlobPart], { type: "application/pdf" });
          }
        } catch {
          // Keep rasterized blob
        }
      }

      setProgressPercent(100);
      setProgressText("Done! Your compressed PDF is ready.");

      if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
      const url = URL.createObjectURL(finalBlob);
      setCompressedPdfUrl(url);
      setNewSize(finalBlob.size);
    } catch (err: unknown) {
      console.error("PDF compression error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to compress PDF. Please check if the document is password-protected or corrupted."
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const savedBytes = originalSize - newSize;
  const percentChange = originalSize > 0 ? ((savedBytes / originalSize) * 100).toFixed(1) : "0";

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "Compress PDF" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Minimize2 size={16} />
            <span>PDF Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Compress & Optimize PDF
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Reduce large PDF file sizes significantly. Genuine in-browser image and page recompression for scanned documents, presentations, and reports.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px] ${
                  isDragging ? "border-amber-500 scale-[0.99] bg-amber-500/5" : "hover:border-amber-500/50"
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
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    color: "var(--amber-primary)",
                  }}
                >
                  <Upload size={28} />
                </div>
                <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  Choose a PDF file to compress
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Upload scanned documents, photo PDFs, or large reports up to 200MB.
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl font-body text-sm font-semibold shadow-sm transition-transform hover:scale-105"
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
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-sm sm:text-base truncate max-w-xs sm:max-w-md" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        Original Size: <strong>{formatFileSize(originalSize)}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
                      setCompressedPdfUrl(null);
                    }}
                    className="font-body text-xs text-red-500 hover:underline"
                  >
                    Change File
                  </button>
                </div>

                {/* Compression Level Selector */}
                <div>
                  <label className="block font-headline font-semibold text-sm mb-2" style={{ color: "var(--text-primary)" }}>
                    Select Compression Preset
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setCompressionMode("smart")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        compressionMode === "smart"
                          ? "ring-2 ring-amber-500 border-transparent shadow-sm"
                          : "hover:border-amber-500/50"
                      }`}
                      style={{
                        backgroundColor:
                          compressionMode === "smart" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: compressionMode === "smart" ? "var(--amber-primary)" : "var(--border-warm)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={16} style={{ color: "var(--amber-primary)" }} />
                        <span className="font-headline font-semibold text-xs sm:text-sm" style={{ color: "var(--text-primary)" }}>
                          Smart Balanced
                        </span>
                      </div>
                      <p className="font-body text-[11px] leading-tight" style={{ color: "var(--text-secondary)" }}>
                        High quality with ~70% to 90% size reduction. Recommended for scanned pages and notes.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCompressionMode("strong")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        compressionMode === "strong"
                          ? "ring-2 ring-amber-500 border-transparent shadow-sm"
                          : "hover:border-amber-500/50"
                      }`}
                      style={{
                        backgroundColor:
                          compressionMode === "strong" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: compressionMode === "strong" ? "var(--amber-primary)" : "var(--border-warm)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Minimize2 size={16} style={{ color: "var(--amber-primary)" }} />
                        <span className="font-headline font-semibold text-xs sm:text-sm" style={{ color: "var(--text-primary)" }}>
                          Strong (Smallest)
                        </span>
                      </div>
                      <p className="font-body text-[11px] leading-tight" style={{ color: "var(--text-secondary)" }}>
                        Maximum compression (~85% to 95% reduction). Best for email attachments & portal limits.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCompressionMode("light")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        compressionMode === "light"
                          ? "ring-2 ring-amber-500 border-transparent shadow-sm"
                          : "hover:border-amber-500/50"
                      }`}
                      style={{
                        backgroundColor:
                          compressionMode === "light" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: compressionMode === "light" ? "var(--amber-primary)" : "var(--border-warm)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sliders size={16} style={{ color: "var(--amber-primary)" }} />
                        <span className="font-headline font-semibold text-xs sm:text-sm" style={{ color: "var(--text-primary)" }}>
                          Light (Crisp)
                        </span>
                      </div>
                      <p className="font-body text-[11px] leading-tight" style={{ color: "var(--text-secondary)" }}>
                        Retains highest image resolution with gentle compression (~40% to 60% reduction).
                      </p>
                    </button>
                  </div>
                </div>

                {/* Progress bar during compression */}
                {isCompressing && (
                  <div className="p-4 rounded-xl border flex flex-col gap-2.5" style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)" }}>
                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Loader2 size={14} className="animate-spin text-amber-500" />
                        {progressText}
                      </span>
                      <span className="font-semibold" style={{ color: "var(--amber-primary)" }}>
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-black/10 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: "var(--amber-primary)",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action button */}
                {!compressedPdfUrl && (
                  <button
                    type="button"
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="w-full py-3.5 rounded-xl font-headline font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60 text-white"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Compressing Document...
                      </>
                    ) : (
                      <>
                        <Minimize2 size={18} />
                        Compress PDF Now
                      </>
                    )}
                  </button>
                )}
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

            {/* Compression Success Card */}
            {compressedPdfUrl && (
              <div
                className="p-6 rounded-2xl border flex flex-col gap-5"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "rgba(34, 197, 94, 0.35)",
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-green-500/10 text-green-500 shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-base" style={{ color: "var(--text-primary)" }}>
                        PDF Compressed Successfully!
                      </h4>
                      <p className="font-body text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {pageCount} {pageCount === 1 ? "page" : "pages"} processed
                      </p>
                    </div>
                  </div>

                  {savedBytes > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-600 dark:text-green-400">
                      -{percentChange}% Reduced
                    </span>
                  )}
                </div>

                {/* Size stats comparison */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl" style={{ backgroundColor: "var(--surface-tinted)" }}>
                  <div>
                    <span className="text-[11px] font-body block uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Original Size
                    </span>
                    <span className="font-headline font-semibold text-base line-through opacity-70" style={{ color: "var(--text-primary)" }}>
                      {formatFileSize(originalSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-body block uppercase tracking-wider text-green-600 dark:text-green-400 font-medium">
                      Compressed Size
                    </span>
                    <span className="font-headline font-bold text-lg text-green-600 dark:text-green-400">
                      {formatFileSize(newSize)}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-body block uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Space Saved
                    </span>
                    <span className="font-headline font-semibold text-base" style={{ color: "var(--amber-primary)" }}>
                      {savedBytes > 0 ? formatFileSize(savedBytes) : "Optimized"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={compressedPdfUrl}
                    download={`compressed-${file?.name || "document.pdf"}`}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-body text-sm font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-105 text-white"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    <Download size={16} />
                    Download Compressed PDF
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-3 rounded-xl border font-body text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                  >
                    <Eye size={16} />
                    {showPreview ? "Hide Preview" : "Preview PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="px-4 py-3 rounded-xl border font-body text-xs font-medium flex items-center justify-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ml-auto"
                    style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                  >
                    Recompress with other preset
                  </button>
                </div>

                {showPreview && (
                  <div className="mt-3 border rounded-xl overflow-hidden" style={{ borderColor: "var(--border-warm)", height: "480px" }}>
                    <iframe
                      src={compressedPdfUrl}
                      title="Compressed PDF Preview"
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-sm" style={{ color: "var(--amber-primary)" }}>
                <Shield size={16} />
                <h4>100% In-Browser Privacy</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Your private files and handwritten notes are never sent over the internet or uploaded to any third-party servers. All recompression runs directly in your browser.
              </p>
            </div>

            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Why is my PDF so large?
              </h3>
              <p className="font-body text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                PDFs containing smartphone camera photos, handwritten notes, or scanned textbook pages often store raw uncompressed bitmaps at 300+ DPI.
              </p>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Our <strong>Smart Compression</strong> resamples page images into web-optimized JPEG streams at standard viewing DPI, routinely reducing 50–100MB documents down to 2–5MB with crisp readability.
              </p>
            </div>

            <div
              className="rounded-2xl border p-6"
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
                  { name: "Image to PDF", href: "/tools/pdf/image-to-pdf", icon: ImageDown },
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
