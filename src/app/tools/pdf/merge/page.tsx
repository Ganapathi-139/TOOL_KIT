"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  FilePlus2,
  Upload,
  GripVertical,
  Trash2,
  FileText,
  Download,
  CheckCircle2,
  Shield,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  RotateCw,
  Scissors,
  Minimize2,
  FileType2,
  Lock,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument } from "pdf-lib";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function MergePdfPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [mergedPdfSize, setMergedPdfSize] = useState<number | null>(null);
  const [mergeDuration, setMergeDuration] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFiles = (incoming: FileList | File[]) => {
    setErrorMessage(null);
    setMergedPdfUrl(null);
    const newFiles: UploadedFile[] = [];

    Array.from(incoming).forEach((file) => {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        newFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
        });
      }
    });

    if (newFiles.length === 0) {
      setErrorMessage("Please select valid PDF files (.pdf).");
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setMergedPdfUrl(null);
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setFiles(updated);
    setMergedPdfUrl(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setErrorMessage("Please add at least 2 PDF files to merge.");
      return;
    }

    setIsMerging(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        const loadedPdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          loadedPdf,
          loadedPdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const endTime = performance.now();
      const durationSeconds = Number(((endTime - startTime) / 1000).toFixed(1));

      setMergedPdfUrl(url);
      setMergedPdfSize(blob.size);
      setMergeDuration(durationSeconds);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        "An error occurred while merging your PDFs. Ensure files are unencrypted and valid."
      );
    } finally {
      setIsMerging(false);
    }
  };

  const relatedTools = [
    { name: "Split PDF", href: "/tools/pdf/split", icon: Scissors },
    { name: "Compress PDF", href: "/tools/pdf/compress", icon: Minimize2 },
    { name: "PDF to Word", href: "/tools/pdf/to-word", icon: FileType2 },
    { name: "Rotate PDF", href: "/tools/pdf/rotate", icon: RotateCw },
    { name: "PDF Password Protect", href: "/tools/pdf/protect", icon: Lock },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "Merge PDF" },
          ]}
        />

        {/* Page Heading */}
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--amber-primary)" }}>
            <FilePlus2 size={16} />
            <span>PDF Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Merge PDF
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Combine multiple PDF documents into a single file. Drag to reorder, then click Merge.
          </p>
        </div>

        {/* Grid: Main Tool on Left, Guides on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Workspace (Col 1-8) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleFiles(e.dataTransfer.files);
                }
              }}
              className={`rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
                isDragging ? "drag-over" : ""
              }`}
              style={{
                backgroundColor: isDragging ? "var(--amber-tint)" : "var(--surface)",
                borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
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
                Drop PDF files here
              </h3>
              <p
                className="font-body text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                or click to browse your files from device
              </p>
              <div
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "var(--surface-tinted)",
                  color: "var(--text-muted)",
                }}
              >
                <span>Select 2 or more PDFs</span>
              </div>
            </div>

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

            {/* Selected Files List */}
            {files.length > 0 && (
              <div
                className="rounded-xl border p-5"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                    Selected Files ({files.length})
                  </h3>
                  <button
                    onClick={() => {
                      setFiles([]);
                      setMergedPdfUrl(null);
                    }}
                    className="text-xs font-medium hover:underline"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Clear all
                  </button>
                </div>

                <ul className="divide-y mt-2" style={{ borderColor: "var(--border-warm)" }}>
                  {files.map((item, index) => (
                    <li
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div style={{ color: "var(--text-muted)" }}>
                          <GripVertical size={16} />
                        </div>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: "var(--amber-tint)",
                            color: "var(--amber-primary)",
                          }}
                        >
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-body text-sm font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.name}
                          </p>
                          <p
                            className="font-body text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {formatFileSize(item.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveFile(index, "up")}
                          disabled={index === 0}
                          aria-label="Move file up"
                          className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFile(index, "down")}
                          disabled={index === files.length - 1}
                          aria-label="Move file down"
                          className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <ArrowDown size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          aria-label="Remove file"
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors ml-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Merge Action Button */}
                <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "var(--border-warm)" }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="font-body text-sm font-medium px-4 py-2 rounded-lg border transition-colors w-full sm:w-auto"
                    style={{
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                      backgroundColor: "var(--surface)",
                    }}
                  >
                    + Add more PDFs
                  </button>

                  <button
                    onClick={handleMerge}
                    disabled={isMerging || files.length < 2}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-body font-medium text-sm text-white transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {isMerging ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Merging client-side...</span>
                      </>
                    ) : (
                      <span>Merge PDFs</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Merge Success / Download Banner */}
            {mergedPdfUrl && (
              <div
                className="rounded-xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--amber-primary)",
                }}
              >
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
                    <h3
                      className="font-headline font-semibold text-lg"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Your merged PDF is ready!
                    </h3>
                    <p
                      className="font-body text-sm mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {mergedPdfSize && formatFileSize(mergedPdfSize)} · Merged in {mergeDuration ?? 0.3}s via local browser memory
                    </p>
                  </div>
                </div>

                <a
                  href={mergedPdfUrl}
                  download="merged_document.pdf"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-body font-semibold text-sm text-white transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  <Download size={18} />
                  <span>Download Merged PDF</span>
                </a>
              </div>
            )}
          </div>

          {/* Sidebar (Col 9-12) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* How-to Card */}
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3
                className="font-headline font-semibold text-lg mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                How to merge PDFs
              </h3>
              <ol className="space-y-4">
                {[
                  "Select your PDF files from your device by dropping them into the target area.",
                  "Drag or use arrow buttons to reorder them in your preferred sequence.",
                  "Click ‘Merge PDFs’ to combine completely client-side in memory.",
                  "Download the newly created merged PDF file directly to your drive.",
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
                    <p
                      className="font-body text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Privacy Card */}
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
              <p
                className="font-body text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Zero data leaves your computer. Your files are combined directly inside your browser’s JavaScript memory without ever being sent to a server.
              </p>
            </div>

            {/* Related Tools */}
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3
                className="font-headline font-semibold text-base mb-4"
                style={{ color: "var(--text-primary)" }}
              >
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
