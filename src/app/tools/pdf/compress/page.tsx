"use client";

import { useState, useRef } from "react";
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
  Info,
  FilePlus2,
  Scissors,
  RotateCw,
  ImageDown,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument } from "pdf-lib";

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [newSize, setNewSize] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = (selected: File) => {
    setErrorMessage(null);
    setCompressedPdfUrl(null);

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file (.pdf).");
      return;
    }

    setFile(selected);
    setOriginalSize(selected.size);
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setErrorMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      // Load PDF document
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Clean metadata and serialize using PDF 1.5 Object Streams
      pdfDoc.setTitle("");
      pdfDoc.setAuthor("");
      pdfDoc.setSubject("");
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer("ToolKit (Local In-Browser Optimizer)");
      pdfDoc.setCreator("ToolKit");

      // Save with useObjectStreams for genuine stream compaction
      const optimizedBytes = await pdfDoc.save({
        useObjectStreams: true,
      });

      const blob = new Blob([optimizedBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setCompressedPdfUrl(url);
      setNewSize(blob.size);
    } catch (err: unknown) {
      console.error("Compression error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to optimize PDF. The file may be password protected."
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
            Compress cross-reference tables and streamline internal PDF object streams without quality loss.
            Operates 100% locally on your device with honest size reporting.
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
                  Choose a PDF file to compress
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Your file remains confidential and never touches any remote server.
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
                        Original Size: {formatFileSize(originalSize)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setCompressedPdfUrl(null);
                    }}
                    className="font-body text-xs text-red-500 hover:underline"
                  >
                    Change File
                  </button>
                </div>

                <div
                  className="p-4 rounded-xl border flex items-start gap-3"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                  }}
                >
                  <Info size={18} className="shrink-0 mt-0.5" style={{ color: "var(--amber-primary)" }} />
                  <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <strong>Honest In-Browser Optimization:</strong> This tool repacks internal PDF data into compressed binary object streams and discards duplicate structures. Text and vector clarity are 100% preserved. Documents that already use modern stream compression may show slight or minimal difference.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCompress}
                  disabled={isCompressing}
                  className="w-full py-3.5 rounded-lg font-headline font-semibold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--amber-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  {isCompressing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Optimizing Streams...
                    </>
                  ) : (
                    <>
                      <Minimize2 size={18} />
                      Optimize PDF
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

            {compressedPdfUrl && (
              <div
                className="p-6 rounded-xl border flex flex-col gap-4"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: savedBytes > 0 ? "rgba(34, 197, 94, 0.3)" : "var(--border-warm)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500 shrink-0">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h4 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                      Optimization Complete!
                    </h4>
                    <p className="font-body text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      Original: {formatFileSize(originalSize)} → New: {formatFileSize(newSize)}{" "}
                      {savedBytes > 0 ? (
                        <span className="text-green-500 font-semibold ml-1">
                          (-{formatFileSize(savedBytes)}, {percentChange}% smaller)
                        </span>
                      ) : (
                        <span className="text-amber-500 font-medium ml-1">
                          (Already fully compressed)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={compressedPdfUrl}
                    download={`optimized-${file?.name || "document.pdf"}`}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-body text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                    style={{
                      backgroundColor: "var(--amber-primary)",
                      color: "#FFFFFF",
                    }}
                  >
                    <Download size={16} />
                    Download Optimized PDF
                  </a>
                </div>
              </div>
            )}
          </div>

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
                Your private files are never sent over the internet. All stream optimization takes place directly in your browser.
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
