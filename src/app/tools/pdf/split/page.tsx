"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Scissors,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  Shield,
  ChevronRight,
  FilePlus2,
  Minimize2,
  FileType2,
  RotateCw,
  Lock,
  Layers,
  Eye,
  EyeOff,
  Archive,
  Copy,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

interface SplitFile {
  name: string;
  blob: Blob;
  url: string;
  size: number;
  label: string;
}

interface RangeCase {
  label: string;
  fileSuffix: string;
  indices: number[];
}

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [splitMode, setSplitMode] = useState<"ranges" | "all-pages" | "merged" | "single">("ranges");
  const [rangeInput, setRangeInput] = useState<string>("1-2, 3");
  const [singlePage, setSinglePage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitFiles, setSplitFiles] = useState<SplitFile[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [zipFileName, setZipFileName] = useState<string>("");
  const [zipSize, setZipSize] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const clearResults = () => {
    splitFiles.forEach((f) => URL.revokeObjectURL(f.url));
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    setSplitFiles([]);
    setZipUrl(null);
    setPreviewIndex(null);
  };

  const handleFile = async (selectedFile: File) => {
    setErrorMessage(null);
    clearResults();

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file (.pdf).");
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const pages = doc.getPageCount();

      if (pages === 0) {
        setErrorMessage("The selected PDF document has no pages.");
        return;
      }

      setFile(selectedFile);
      setPageCount(pages);
      if (pages === 1) {
        setRangeInput("1");
      } else if (pages === 2) {
        setRangeInput("1, 2");
      } else {
        const mid = Math.floor(pages / 2);
        setRangeInput(`1-${mid}, ${mid + 1}-${pages}`);
      }
      setSinglePage(1);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage("Could not parse this PDF. Please ensure it is unencrypted and not corrupt.");
    }
  };

  // Parse comma-separated page ranges into individual cases: e.g. "1-3, 5, 8-10"
  const parseRangeCases = (input: string, maxPages: number): RangeCase[] => {
    const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) {
      throw new Error("Please specify at least one valid page range (e.g. 1-2, 3-4).");
    }

    const cases: RangeCase[] = [];

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
          throw new Error(`Invalid range "${part}". Pages must be between 1 and ${maxPages}.`);
        }
        const indices: number[] = [];
        for (let i = start; i <= end; i++) {
          indices.push(i - 1);
        }
        cases.push({
          label: start === end ? `Page ${start}` : `Pages ${start}–${end}`,
          fileSuffix: start === end ? `page_${start}` : `pages_${start}-${end}`,
          indices,
        });
      } else {
        const pageNum = parseInt(part, 10);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
          throw new Error(`Invalid page "${part}". Page must be between 1 and ${maxPages}.`);
        }
        cases.push({
          label: `Page ${pageNum}`,
          fileSuffix: `page_${pageNum}`,
          indices: [pageNum - 1],
        });
      }
    }

    return cases;
  };

  const handleSplit = async () => {
    if (!file || !pageCount) return;

    setIsProcessing(true);
    setErrorMessage(null);
    clearResults();

    try {
      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer);
      const baseName = file.name.replace(/\.pdf$/i, "");
      const createdFiles: SplitFile[] = [];

      if (splitMode === "all-pages") {
        // Split every single page into its own individual PDF
        for (let i = 0; i < pageCount; i++) {
          const newDoc = await PDFDocument.create();
          const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(copiedPage);

          const bytes = await newDoc.save();
          const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const name = `${baseName}_page_${i + 1}.pdf`;

          createdFiles.push({
            name,
            blob,
            url,
            size: blob.size,
            label: `Page ${i + 1}`,
          });
        }
      } else if (splitMode === "single") {
        // Single page extraction
        if (singlePage < 1 || singlePage > pageCount) {
          throw new Error(`Selected page must be between 1 and ${pageCount}.`);
        }
        const newDoc = await PDFDocument.create();
        const [copiedPage] = await newDoc.copyPages(srcDoc, [singlePage - 1]);
        newDoc.addPage(copiedPage);

        const bytes = await newDoc.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const name = `${baseName}_page_${singlePage}.pdf`;

        createdFiles.push({
          name,
          blob,
          url,
          size: blob.size,
          label: `Page ${singlePage}`,
        });
      } else if (splitMode === "merged") {
        // Extract all specified pages into a single merged PDF
        const cases = parseRangeCases(rangeInput, pageCount);
        const allIndicesSet = new Set<number>();
        cases.forEach((c) => c.indices.forEach((idx) => allIndicesSet.add(idx)));
        const sortedIndices = Array.from(allIndicesSet).sort((a, b) => a - b);

        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(srcDoc, sortedIndices);
        copiedPages.forEach((p) => newDoc.addPage(p));

        const bytes = await newDoc.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const name = `${baseName}_extracted.pdf`;

        createdFiles.push({
          name,
          blob,
          url,
          size: blob.size,
          label: `${sortedIndices.length} Pages Extracted`,
        });
      } else {
        // splitMode === "ranges": Split each given range/case into its own separate PDF
        const cases = parseRangeCases(rangeInput, pageCount);

        for (let idx = 0; idx < cases.length; idx++) {
          const item = cases[idx];
          const newDoc = await PDFDocument.create();
          const copiedPages = await newDoc.copyPages(srcDoc, item.indices);
          copiedPages.forEach((p) => newDoc.addPage(p));

          const bytes = await newDoc.save();
          const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const name = `${baseName}_part_${idx + 1}_(${item.fileSuffix}).pdf`;

          createdFiles.push({
            name,
            blob,
            url,
            size: blob.size,
            label: item.label,
          });
        }
      }

      setSplitFiles(createdFiles);

      // If multiple files were generated, bundle into a ZIP
      if (createdFiles.length > 1) {
        const zip = new JSZip();
        for (const item of createdFiles) {
          zip.file(item.name, item.blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipObjectUrl = URL.createObjectURL(zipBlob);
        setZipUrl(zipObjectUrl);
        setZipFileName(`${baseName}_split_files.zip`);
        setZipSize(zipBlob.size);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while splitting the PDF.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const relatedTools = [
    { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
    { name: "Compress PDF", href: "/tools/pdf/compress", icon: Minimize2 },
    { name: "Word to PDF", href: "/tools/pdf/word-to-pdf", icon: FileType2 },
    { name: "Rotate PDF", href: "/tools/pdf/rotate", icon: RotateCw },
    { name: "PDF Password Protect", href: "/tools/pdf/protect", icon: Lock },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "Split PDF" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Scissors size={16} />
            <span>PDF Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Split PDF
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Split PDFs into multiple separate documents by page ranges, extract every page into individual files, or isolate specific pages. Fast and 100% private.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Upload Zone */}
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
                    handleFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
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
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
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
                  Drop a PDF file here to split
                </h3>
                <p
                  className="font-body text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  or click to select a document from your device
                </p>
              </div>
            ) : (
              /* Active File Info & Split Controls */
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* File Header */}
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "var(--amber-tint)",
                        color: "var(--amber-primary)",
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </p>
                      <p className="font-body text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {formatFileSize(file.size)} · {pageCount} {pageCount === 1 ? "page" : "pages"} total
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      clearResults();
                      setFile(null);
                      setPageCount(null);
                    }}
                    className="text-xs font-body font-medium hover:underline shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Change file
                  </button>
                </div>

                {/* Mode Selector */}
                <div>
                  <label className="block font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Select Splitting Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSplitMode("ranges")}
                      className="p-3 rounded-lg border text-left font-body text-sm transition-all"
                      style={{
                        backgroundColor: splitMode === "ranges" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: splitMode === "ranges" ? "var(--amber-primary)" : "var(--border-warm)",
                        color: splitMode === "ranges" ? "var(--amber-primary)" : "var(--text-primary)",
                        fontWeight: splitMode === "ranges" ? 600 : 400,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Layers size={16} />
                        <span>Split by Ranges</span>
                      </div>
                      <span className="block text-xs mt-1 font-normal" style={{ color: "var(--text-secondary)" }}>
                        Separate file for each range (e.g. 1-2, 3-5)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode("all-pages")}
                      className="p-3 rounded-lg border text-left font-body text-sm transition-all"
                      style={{
                        backgroundColor: splitMode === "all-pages" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: splitMode === "all-pages" ? "var(--amber-primary)" : "var(--border-warm)",
                        color: splitMode === "all-pages" ? "var(--amber-primary)" : "var(--text-primary)",
                        fontWeight: splitMode === "all-pages" ? 600 : 400,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Archive size={16} />
                        <span>Split All Pages</span>
                      </div>
                      <span className="block text-xs mt-1 font-normal" style={{ color: "var(--text-secondary)" }}>
                        Separate 1-page PDF for each page (ZIP)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode("merged")}
                      className="p-3 rounded-lg border text-left font-body text-sm transition-all"
                      style={{
                        backgroundColor: splitMode === "merged" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: splitMode === "merged" ? "var(--amber-primary)" : "var(--border-warm)",
                        color: splitMode === "merged" ? "var(--amber-primary)" : "var(--text-primary)",
                        fontWeight: splitMode === "merged" ? 600 : 400,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Copy size={16} />
                        <span>Extract to 1 PDF</span>
                      </div>
                      <span className="block text-xs mt-1 font-normal" style={{ color: "var(--text-secondary)" }}>
                        Combine chosen pages into a single file
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode("single")}
                      className="p-3 rounded-lg border text-left font-body text-sm transition-all"
                      style={{
                        backgroundColor: splitMode === "single" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: splitMode === "single" ? "var(--amber-primary)" : "var(--border-warm)",
                        color: splitMode === "single" ? "var(--amber-primary)" : "var(--text-primary)",
                        fontWeight: splitMode === "single" ? 600 : 400,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Scissors size={16} />
                        <span>Single Page</span>
                      </div>
                      <span className="block text-xs mt-1 font-normal" style={{ color: "var(--text-secondary)" }}>
                        Extract one specific page
                      </span>
                    </button>
                  </div>
                </div>

                {/* Mode-Specific Inputs */}
                {splitMode === "ranges" || splitMode === "merged" ? (
                  <div>
                    <label htmlFor="range-input" className="block font-body text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                      {splitMode === "ranges"
                        ? `Define ranges to split into separate files (1 to ${pageCount})`
                        : `Pages to extract into one PDF (1 to ${pageCount})`}
                    </label>
                    <input
                      id="range-input"
                      type="text"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder={`e.g. 1-2, 3-4, 5-${pageCount}`}
                      className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <p className="font-body text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {splitMode === "ranges"
                        ? "Each comma-separated range creates its own separate PDF document."
                        : "All selected pages will be extracted and merged into a single PDF."}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="text-xs font-body" style={{ color: "var(--text-muted)" }}>Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const mid = Math.floor((pageCount || 1) / 2);
                          setRangeInput(`1-${mid}, ${mid + 1}-${pageCount}`);
                        }}
                        className="text-xs font-body px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                      >
                        Split in Halves
                      </button>
                      <button
                        type="button"
                        onClick={() => setRangeInput(`1-${pageCount}`)}
                        className="text-xs font-body px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                      >
                        All Pages (1-{pageCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const evens = Array.from({ length: pageCount || 0 }, (_, i) => i + 1).filter((n) => n % 2 === 0).join(", ");
                          setRangeInput(evens || "2");
                        }}
                        className="text-xs font-body px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                      >
                        Even Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const odds = Array.from({ length: pageCount || 0 }, (_, i) => i + 1).filter((n) => n % 2 !== 0).join(", ");
                          setRangeInput(odds || "1");
                        }}
                        className="text-xs font-body px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                      >
                        Odd Pages
                      </button>
                    </div>
                  </div>
                ) : splitMode === "all-pages" ? (
                  <div
                    className="p-4 rounded-lg border font-body text-sm"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Every page from <strong>1 to {pageCount}</strong> will be split into its own distinct 1-page PDF file and bundled into a convenient <strong>.ZIP archive</strong>.
                  </div>
                ) : (
                  <div>
                    <label htmlFor="single-page-select" className="block font-body text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Choose page number (1 to {pageCount})
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="single-page-select"
                        type="number"
                        min={1}
                        max={pageCount || 1}
                        value={singlePage}
                        onChange={(e) => setSinglePage(Math.max(1, Math.min(pageCount || 1, parseInt(e.target.value) || 1)))}
                        className="w-28 px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                        style={{
                          backgroundColor: "var(--bg-warm)",
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <input
                        type="range"
                        min={1}
                        max={pageCount || 1}
                        value={singlePage}
                        onChange={(e) => setSinglePage(parseInt(e.target.value))}
                        className="flex-1 accent-[var(--amber-primary)]"
                      />
                    </div>
                  </div>
                )}

                {/* Split Action */}
                <div className="pt-4 border-t flex justify-end" style={{ borderColor: "var(--border-warm)" }}>
                  <button
                    onClick={handleSplit}
                    disabled={isProcessing}
                    className="px-6 py-2.5 rounded-lg font-body font-semibold text-sm text-white transition-all disabled:opacity-50 flex items-center gap-2"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Splitting PDF...</span>
                      </>
                    ) : (
                      <>
                        <Scissors size={16} />
                        <span>
                          {splitMode === "all-pages"
                            ? `Split into ${pageCount} Individual PDFs`
                            : splitMode === "ranges"
                            ? "Split All Given Ranges"
                            : splitMode === "merged"
                            ? "Extract into 1 PDF"
                            : `Extract Page ${singlePage}`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                className="p-4 rounded-lg border text-sm font-body"
                style={{
                  backgroundColor: "rgba(220, 38, 38, 0.08)",
                  borderColor: "rgba(220, 38, 38, 0.2)",
                  color: "#dc2626",
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Split Results Banner & List */}
            {splitFiles.length > 0 && (
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--amber-primary)",
                }}
              >
                {/* Header summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        color: "#10b981",
                      }}
                    >
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                        {splitFiles.length === 1
                          ? "Your split PDF is ready!"
                          : `Split into ${splitFiles.length} separate PDF files!`}
                      </h3>
                      <p className="font-body text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {splitFiles.length === 1
                          ? `${splitFiles[0].name} · ${formatFileSize(splitFiles[0].size)}`
                          : `All ${splitFiles.length} cases split successfully. Download individually or as a single ZIP.`}
                      </p>
                    </div>
                  </div>

                  {/* Primary Download Button */}
                  {zipUrl ? (
                    <a
                      href={zipUrl}
                      download={zipFileName}
                      className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-body font-semibold text-sm text-white transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      <Archive size={18} />
                      <span>Download All as ZIP {zipSize && `(${formatFileSize(zipSize)})`}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewIndex(previewIndex === 0 ? null : 0)}
                        className="px-4 py-2.5 rounded-lg border font-body text-sm font-medium flex items-center gap-2 transition-colors"
                        style={{
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                          backgroundColor: previewIndex === 0 ? "var(--amber-tint)" : "var(--surface-tinted)",
                        }}
                      >
                        {previewIndex === 0 ? <EyeOff size={16} /> : <Eye size={16} />}
                        <span>{previewIndex === 0 ? "Hide Preview" : "Preview PDF"}</span>
                      </button>

                      <a
                        href={splitFiles[0].url}
                        download={splitFiles[0].name}
                        className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-body font-semibold text-sm text-white transition-transform hover:scale-[1.02]"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Download size={16} />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Multiple Files List */}
                {splitFiles.length > 1 && (
                  <div className="border-t pt-4" style={{ borderColor: "var(--border-warm)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        Generated Split Files ({splitFiles.length})
                      </p>
                      {previewIndex !== null && (
                        <button
                          onClick={() => setPreviewIndex(null)}
                          className="text-xs font-body font-medium hover:underline flex items-center gap-1"
                          style={{ color: "var(--amber-primary)" }}
                        >
                          <EyeOff size={13} />
                          <span>Close Preview</span>
                        </button>
                      )}
                    </div>

                    <div className="divide-y max-h-[360px] overflow-y-auto pr-1" style={{ borderColor: "var(--border-warm)" }}>
                      {splitFiles.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
                              style={{
                                backgroundColor: previewIndex === idx ? "var(--amber-primary)" : "var(--surface-tinted)",
                                color: previewIndex === idx ? "#fff" : "var(--text-muted)",
                              }}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-body text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                                {item.name}
                              </p>
                              <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                                {item.label} · {formatFileSize(item.size)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewIndex(previewIndex === idx ? null : idx)}
                              className="p-2 rounded-lg border text-xs font-body font-medium flex items-center gap-1.5 transition-colors"
                              style={{
                                borderColor: previewIndex === idx ? "var(--amber-primary)" : "var(--border-warm)",
                                backgroundColor: previewIndex === idx ? "var(--amber-tint)" : "var(--surface-tinted)",
                                color: previewIndex === idx ? "var(--amber-primary)" : "var(--text-secondary)",
                              }}
                              title="Preview this split file"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">{previewIndex === idx ? "Hide" : "Preview"}</span>
                            </button>

                            <a
                              href={item.url}
                              download={item.name}
                              className="p-2 sm:px-3 sm:py-2 rounded-lg font-body text-xs font-medium text-white flex items-center gap-1.5 transition-transform hover:scale-105"
                              style={{ backgroundColor: "var(--amber-primary)" }}
                              title="Download this file"
                            >
                              <Download size={14} />
                              <span className="hidden sm:inline">Download</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live PDF Preview Panel */}
                {previewIndex !== null && splitFiles[previewIndex] && (
                  <div className="border-t pt-4" style={{ borderColor: "var(--border-warm)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-body text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        Previewing: {splitFiles[previewIndex].name} ({splitFiles[previewIndex].label})
                      </p>
                      <button
                        onClick={() => setPreviewIndex(null)}
                        className="text-xs font-body font-medium hover:underline"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Hide Preview
                      </button>
                    </div>
                    <iframe
                      src={splitFiles[previewIndex].url}
                      title={`Preview of ${splitFiles[previewIndex].name}`}
                      className="w-full h-[450px] rounded-lg border bg-white"
                      style={{ borderColor: "var(--border-warm)" }}
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
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
                How to split a PDF
              </h3>
              <ol className="space-y-4">
                {[
                  "Upload your PDF document by dropping it into the designated box.",
                  "Choose 'Split by Ranges' to export each given range into its own separate PDF (e.g. 1-2, 3-5).",
                  "Or select 'Split All Pages' to split every page into separate 1-page files.",
                  "Preview your split documents directly on the page and download individually or as a single ZIP archive.",
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
                <h4>Client-Side Privacy</h4>
              </div>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Your confidential documents are processed strictly within your browser. No PDF pages are ever uploaded, saved, or inspected by an external server.
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
