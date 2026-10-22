"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  Download,
  Shield,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  FileType2,
  FilePlus2,
  Scissors,
  RotateCw,
  Layers,
  X,
  Zap,
  Eye,
  Settings,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    setConfigMissing(false);
    setConversionStatus("");
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfFileName("");

    const name = selected.name.toLowerCase();
    if (!name.endsWith(".docx") && !name.endsWith(".doc")) {
      setErrorMessage("Please select a valid Word document (.docx format).");
      return;
    }
    if (name.endsWith(".doc") && !name.endsWith(".docx")) {
      setErrorMessage(
        "Legacy .doc files are not supported. Please save your file as .docx in Word, Google Docs, or LibreOffice first."
      );
      return;
    }

    setFile(selected);
    setIsConverting(true);
    setConversionStatus("Converting document…");

    try {
      const formData = new FormData();
      formData.append("file", selected);

      const res = await fetch("/api/convert/docx-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (res.status === 503) {
        const data = await res.json().catch(() => null);
        if (data?.code === "GOTENBERG_URL_MISSING" || data?.code === "NO_ENGINE") {
          setConfigMissing(true);
          setErrorMessage(
            data?.error ||
              "Conversion service is not configured. Please set the GOTENBERG_URL environment variable to a running Gotenberg instance (e.g., https://your-gotenberg.onrender.com)."
          );
          return;
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.error || `Conversion failed with server status ${res.status}.`
        );
      }

      // Read real binary PDF blob from Gotenberg
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Preserve original filename with .pdf extension
      const safeName = selected.name.replace(/\.docx$/i, ".pdf");

      setPdfUrl(url);
      setPdfFileName(safeName);
      const engine = res.headers.get("X-Conversion-Engine") || "";
      const engineLabel =
        engine === "word-com"
          ? "Microsoft Word"
          : engine.includes("gotenberg")
          ? "LibreOffice via Gotenberg"
          : "conversion service";
      setConversionStatus(`PDF ready — converted by ${engineLabel} (full layout fidelity).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsConverting(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setConversionStatus("");
    setErrorMessage(null);
    setConfigMissing(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfFileName("");
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "Word to PDF" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <FileType2 size={16} />
            <span>PDF Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Word to PDF Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert Microsoft Word (.docx) documents to PDF with full fidelity. Powered by LibreOffice
            via Gotenberg to preserve tables, diagrams, headers, footers, and page breaks exactly.
          </p>
        </div>

        {/* Configuration Error Banner */}
        {configMissing && (
          <div
            className="mb-8 p-5 rounded-2xl border flex items-start gap-3.5"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              borderColor: "rgba(245, 158, 11, 0.35)",
              color: "var(--text-primary)",
            }}
          >
            <Settings size={22} className="shrink-0 text-amber-500 mt-0.5" />
            <div className="text-sm font-body flex-1">
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                GOTENBERG_URL Configuration Required
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Word-to-PDF conversion requires an open-source Gotenberg conversion server to run LibreOffice.
                Please set the <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-xs font-semibold">GOTENBERG_URL</code> environment variable in your Vercel Project Settings or <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-xs font-semibold">.env.local</code> file (e.g. <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-xs font-semibold">GOTENBERG_URL=https://your-gotenberg.onrender.com</code>).
              </p>
            </div>
            <button
              onClick={() => {
                setConfigMissing(false);
                setErrorMessage(null);
              }}
              className="shrink-0 opacity-60 hover:opacity-100 p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* General Error Banner */}
        {errorMessage && !configMissing && (
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
              <p className="font-semibold">Conversion Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Upload Zone */}
            {!file && (
              <div
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
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] ${
                  isDragging ? "scale-[0.99]" : "hover:border-amber-500/50"
                }`}
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                >
                  <Upload size={28} />
                </div>
                <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  Drop your Word document here
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  .docx files supported (up to 50 MB)
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

            {/* File loaded */}
            {file && (
              <div
                className="rounded-2xl border p-6 flex flex-col gap-5"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}
              >
                {/* File header */}
                <div
                  className="flex items-center justify-between pb-4 border-b"
                  style={{ borderColor: "var(--border-warm)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                    >
                      <FileType2 size={20} />
                    </div>
                    <div>
                      <h4
                        className="font-headline font-semibold text-sm sm:text-base truncate max-w-xs sm:max-w-md"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {file.name}
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetTool}
                    className="font-body text-xs font-medium text-red-500 hover:underline flex items-center gap-1"
                  >
                    <X size={14} /> Change file
                  </button>
                </div>

                {/* Progress / Status banner */}
                {isConverting && (
                  <div
                    className="p-4 rounded-xl border flex items-center gap-3"
                    style={{ backgroundColor: "var(--amber-tint)", borderColor: "rgba(200,123,58,0.25)" }}
                  >
                    <Loader2 size={18} className="animate-spin shrink-0 text-amber-500" />
                    <span className="font-body text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {conversionStatus}
                    </span>
                  </div>
                )}

                {/* Success Banner & Actions */}
                {pdfUrl && !isConverting && (
                  <>
                    <div
                      className="p-4 rounded-xl border flex items-center gap-3"
                      style={{ backgroundColor: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.3)" }}
                    >
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                      <div>
                        <p className="font-body text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {conversionStatus}
                        </p>
                        <p className="font-body text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <Zap size={11} />
                          Rendered via LibreOffice — tables, diagrams, headers, and margins are preserved.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={pdfUrl}
                        download={pdfFileName}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-sm"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Download size={16} />
                        <span>Download PDF</span>
                      </a>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3 rounded-xl font-body font-semibold text-sm border flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                      >
                        <Eye size={16} />
                        <span>Open in New Tab</span>
                      </a>
                    </div>

                    {/* PDF Preview Container */}
                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers size={16} style={{ color: "var(--amber-primary)" }} />
                          <span className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                            Converted Document Preview
                          </span>
                        </div>
                        <span
                          className="text-xs font-body font-medium px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                        >
                          LibreOffice Engine
                        </span>
                      </div>

                      <div className="w-full h-[650px] sm:h-[750px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-inner">
                        <iframe
                          src={pdfUrl}
                          className="w-full h-full border-0"
                          title="Converted PDF Preview"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Privacy badge */}
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
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Secure & Isolated:</strong>{" "}
                Files are processed through your dedicated Gotenberg instance and streamed directly back to your browser.
                No documents are stored permanently.
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
                  ["Upload", "Select or drop your .docx file."],
                  ["LibreOffice Engine", "Gotenberg runs headless LibreOffice to convert with native pagination."],
                  ["Preview & Save", "Inspect the full document layout in the built-in reader and download."],
                ].map(([step, desc], i) => (
                  <li key={step} className="flex items-start gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      {i + 1}
                    </span>
                    <span><strong>{step}:</strong> {desc}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                What is preserved
              </h3>
              <ul className="space-y-2.5 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                {[
                  "Exact page geometry & margins",
                  "Complex tables & column widths",
                  "Diagrams, flowcharts & image positions",
                  "Headers, footers & page numbers",
                  "Heading typography & font styles",
                  "Bullet points & numbered sections",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
                Related PDF Tools
              </h3>
              <div className="flex flex-col gap-3 font-body text-sm">
                {[
                  { name: "PDF to Word", href: "/tools/pdf/to-word", icon: FileCheck },
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
                  { name: "Split PDF", href: "/tools/pdf/split", icon: Scissors },
                  { name: "Compress PDF", href: "/tools/pdf/compress", icon: FileType2 },
                  { name: "Rotate PDF", href: "/tools/pdf/rotate", icon: RotateCw },
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
