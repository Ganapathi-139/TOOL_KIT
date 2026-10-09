"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Presentation,
  Upload,
  Download,
  Shield,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  FileDown,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function PptToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const clearFile = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFile(null);
    setPdfBlobUrl(null);
    setPdfFileSize(null);
    setErrorMessage(null);
    setIsConverting(false);
  };

  const handleFile = (selected: File) => {
    clearFile();
    const name = selected.name.toLowerCase();
    if (!name.endsWith(".pptx") && !name.endsWith(".ppt")) {
      setErrorMessage("Please select a valid PowerPoint presentation (.pptx or .ppt).");
      return;
    }
    setFile(selected);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ppt-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${res.status}`);
      }

      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Generated PDF is empty. Please check the presentation.");
      }

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setPdfBlobUrl(url);
      setPdfFileSize(blob.size);
    } catch (err: unknown) {
      console.error("PPT to PDF conversion failed:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to convert PPT to PDF. Please try again."
      );
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "PPT to PDF" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Presentation size={16} />
            <span>PDF Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            PowerPoint to PDF Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert PowerPoint presentations (.pptx, .ppt) directly into high-resolution, universal PDF documents with slide formatting preserved.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!file ? (
              <div
                className={`rounded-xl border-2 border-dashed p-8 sm:p-14 text-center transition-all cursor-pointer ${
                  isDragging ? "drag-over" : ""
                }`}
                style={{
                  backgroundColor: isDragging ? "var(--amber-tint)" : "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
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
                  accept=".pptx, .ppt, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.ms-powerpoint"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  }}
                />
                <div
                  className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                >
                  <Upload size={26} />
                </div>
                <h3 className="font-headline font-semibold text-lg sm:text-xl" style={{ color: "var(--text-primary)" }}>
                  Choose a presentation or drag it here
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Supports PPTX and PPT · All slides converted
                </p>
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 mx-auto transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Browse PowerPoint File
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
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                    >
                      <Presentation size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-headline font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </p>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="text-xs font-body font-medium hover:underline text-red-500"
                  >
                    Change file
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-3 text-red-500 text-sm">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {!pdfBlobUrl ? (
                  <div className="flex flex-col gap-4">
                    <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
                      Click below to convert all presentation slides into a single, high-fidelity PDF file.
                    </p>
                    <button
                      type="button"
                      onClick={handleConvert}
                      disabled={isConverting}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      {isConverting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Converting Presentation to PDF...</span>
                        </>
                      ) : (
                        <>
                          <FileDown size={18} />
                          <span>Convert to PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-600">
                      <CheckCircle2 size={20} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Conversion Successful!</p>
                        <p className="text-xs opacity-90">
                          Your PDF is ready for download ({pdfFileSize ? formatFileSize(pdfFileSize) : ""}).
                        </p>
                      </div>
                    </div>

                    <a
                      href={pdfBlobUrl}
                      download={file.name.replace(/\.pptx?$/i, ".pdf")}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg font-body font-semibold text-sm text-white inline-flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-sm"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      <Download size={18} />
                      <span>Download Converted PDF</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Guarantee Card */}
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
                <strong className="font-semibold text-primary">Private Processing:</strong> PowerPoint rendering executes securely on your machine. No slides are stored or transmitted to external third-party services.
              </p>
            </div>
          </div>

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
                How to convert PPT to PDF
              </h3>
              <ol className="space-y-4">
                {[
                  "Select or drag your PowerPoint presentation (.pptx or .ppt) into the upload area.",
                  "Click the ‘Convert to PDF’ button to initiate high-fidelity slide rendering.",
                  "Download the generated PDF document directly to your device.",
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

            {/* Privacy Badge */}
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-base" style={{ color: "var(--amber-primary)" }}>
                <Shield size={18} />
                <h4>Local & Private</h4>
              </div>
              <p
                className="font-body text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Zero external cloud dependencies. Your presentations stay on your device for total data confidentiality.
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
              <h3 className="font-headline font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
                Related PDF Tools
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { name: "PDF to PPT", href: "/tools/pdf/to-ppt", icon: Presentation },
                  { name: "PDF to Word", href: "/tools/pdf/to-word", icon: FileText },
                  { name: "Word to PDF", href: "/tools/pdf/word-to-pdf", icon: FileText },
                ].map((t) => (
                  <Link
                    key={t.name}
                    href={t.href}
                    className="p-3 rounded-lg border flex items-center justify-between text-xs font-medium transition-all hover:border-amber-500 hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <t.icon size={16} style={{ color: "var(--amber-primary)" }} />
                      <span>{t.name}</span>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
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
