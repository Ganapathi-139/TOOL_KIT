"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileType2,
  Upload,
  Download,
  Shield,
  ChevronRight,
  FileText,
  Loader2,
  CheckCircle2,
  Info,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [docxBlobUrl, setDocxBlobUrl] = useState<string | null>(null);
  const [docxFileSize, setDocxFileSize] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Dynamically load PDF.js client-side script for Unicode font decompression
    if (typeof window !== "undefined" && !window.pdfjsLib) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = (selected: File) => {
    setErrorMessage(null);
    setDocxBlobUrl(null);
    setExtractedText("");

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file (.pdf).");
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
      const apiRes = await fetch("/api/pdf-to-word", {
        method: "POST",
        body: formData,
      });

      if (!apiRes.ok) {
        const errJson = await apiRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${apiRes.status}`);
      }

      const docxBlob = await apiRes.blob();
      if (!docxBlob || docxBlob.size === 0) {
        throw new Error("Converted Word (.docx) document is empty.");
      }

      const url = URL.createObjectURL(docxBlob);
      setDocxBlobUrl(url);
      setDocxFileSize(docxBlob.size);

      try {
        if (window.pdfjsLib) {
          const buffer = await file.arrayBuffer();
          const p = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
          setPageCount(p.numPages);
        } else {
          setPageCount(1);
        }
      } catch {
        setPageCount(1);
      }
    } catch (err: unknown) {
      console.error("PDF to Word conversion error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to convert PDF into a Word document."
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "PDF to Word (.docx)" },
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
            PDF to Word Converter (.docx)
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert PDF certificates and documents into authentic Microsoft Word (.docx) files.
            Extracts decoded Unicode text, preserves visual certificate layouts, and exports genuine WordprocessingML.
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
                  Choose a PDF file to convert to Word
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Works with certificates, contracts, and digital documents. Runs 100% in your browser.
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
                        File size: {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setDocxBlobUrl(null);
                      setExtractedText("");
                    }}
                    className="font-body text-xs text-red-500 hover:underline"
                  >
                    Change File
                  </button>
                </div>


                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full py-3.5 rounded-lg font-headline font-semibold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--amber-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  {isConverting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Decompressing Streams & Generating .docx...
                    </>
                  ) : (
                    <>
                      <FileType2 size={18} />
                      Convert to Word (.docx)
                    </>
                  )}
                </button>
              </div>
            )}

            {errorMessage && (
              <div
                className="p-4 rounded-xl border font-body text-sm flex items-start gap-2.5"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {docxBlobUrl && (
              <div
                className="p-6 rounded-xl border flex flex-col gap-4"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "rgba(34, 197, 94, 0.3)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500 shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                        Word (.docx) Document Ready!
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {pageCount} page(s) · {docxFileSize ? formatFileSize(docxFileSize) : ""} · Microsoft Word & Docs compatible
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="px-4 py-2 rounded-lg border font-body text-xs font-medium flex items-center gap-1.5 transition-all"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      <span>{copied ? "Copied" : "Copy Raw Text"}</span>
                    </button>
                    <a
                      href={docxBlobUrl}
                      download={`${file?.name.replace(/\.pdf$/i, "") || "document"}.docx`}
                      className="px-5 py-2.5 rounded-lg font-body text-sm font-semibold flex items-center gap-2 text-white transition-all shadow-sm"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      <Download size={16} />
                      Download .docx
                    </a>
                  </div>
                </div>

                {extractedText && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer font-body text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-70 hover:opacity-100 transition-opacity list-none flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <span>▶ View Decoded Text Layer</span>
                    </summary>
                    <textarea
                      readOnly
                      rows={6}
                      value={extractedText}
                      className="w-full mt-2 rounded-lg border p-3 font-mono text-xs leading-relaxed resize-none select-all"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </details>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                <Info size={16} style={{ color: "var(--amber-primary)" }} />
                <h4>How PDF to Word Works</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                • <strong>Digital Text PDFs:</strong> Decompresses internal FlateDecode binary streams and resolves Adobe/Identity font CMaps into clean Unicode text.
                <br /><br />
                • <strong>Certificates & Layouts:</strong> Preserves visual backgrounds, logos, and signatures by packaging high-res layout snapshots into genuine WordprocessingML (.docx) containers.
                <br /><br />
                • <strong>Scanned Physical Papers:</strong> Pure photographic scans lack embedded font streams and require OCR to extract character text.
              </p>
            </div>

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
                Processed 100% in your local browser using client-side JavaScript. No certificates or credentials are ever sent to external cloud servers.
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
                Related Reverse Tools
              </h3>
              <div className="flex flex-col gap-3 font-body text-sm">
                {[
                  { name: "Word to PDF", href: "/tools/pdf/word-to-pdf" },
                  { name: "PDF to Plain Text (.txt)", href: "/tools/pdf/to-text" },
                  { name: "Plain Text to PDF", href: "/tools/pdf/text-to-pdf" },
                  { name: "PDF to Images", href: "/tools/pdf/to-jpg" },
                  { name: "Images to PDF", href: "/tools/pdf/image-to-pdf" },
                ].map((t) => (
                  <Link
                    key={t.name}
                    href={t.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span>{t.name}</span>
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
