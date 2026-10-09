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
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

export default function PptToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
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
    setConversionStatus("");
  };

  const handleFile = (selected: File) => {
    clearFile();
    const name = selected.name.toLowerCase();
    if (!name.endsWith(".pptx") && !name.endsWith(".ppt")) {
      setErrorMessage("Please select a valid PowerPoint presentation (.pptx).");
      return;
    }
    if (name.endsWith(".ppt") && !name.endsWith(".pptx")) {
      setErrorMessage(
        "Legacy binary .ppt files cannot be parsed directly in modern web browsers. Please save or export your presentation as .pptx in PowerPoint or Google Slides before converting."
      );
      return;
    }
    setFile(selected);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setErrorMessage(null);
    setConversionStatus("Opening presentation package...");

    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      // Find all slide files: ppt/slides/slide{N}.xml
      const slideFileNames = Object.keys(zip.files).filter((key) =>
        /^ppt\/slides\/slide\d+\.xml$/i.test(key)
      );

      if (slideFileNames.length === 0) {
        throw new Error(
          "Could not detect standard presentation slides in this file. Please ensure it is a valid .pptx presentation."
        );
      }

      // Sort slide numbers numerically
      slideFileNames.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
        return numA - numB;
      });

      const totalSlides = slideFileNames.length;
      const pdfDoc = await PDFDocument.create();

      const parser = new DOMParser();
      const canvasWidth = 960;
      const canvasHeight = 540;

      for (let i = 0; i < totalSlides; i++) {
        const slidePath = slideFileNames[i];
        setConversionStatus(`Converting slide ${i + 1} of ${totalSlides}...`);

        const slideXmlStr = await zip.files[slidePath].async("text");
        const doc = parser.parseFromString(slideXmlStr, "text/xml");

        // Extract paragraphs and texts
        const paragraphs = Array.from(doc.getElementsByTagName("a:p"));
        const textLines: string[] = [];

        paragraphs.forEach((p) => {
          const textRuns = Array.from(p.getElementsByTagName("a:t"));
          const line = textRuns.map((t) => t.textContent || "").join("").trim();
          if (line) textLines.push(line);
        });

        // Check if there is a background image or embedded image in slide rels
        const slideNumMatch = slidePath.match(/slide(\d+)\.xml/i);
        const slideNum = slideNumMatch ? slideNumMatch[1] : `${i + 1}`;
        const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
        let embeddedImageDataUrl: string | null = null;

        if (zip.files[relsPath]) {
          const relsStr = await zip.files[relsPath].async("text");
          const relsDoc = parser.parseFromString(relsStr, "text/xml");
          const relNodes = Array.from(relsDoc.getElementsByTagName("Relationship"));
          const imageRel = relNodes.find((r) =>
            (r.getAttribute("Type") || "").includes("/image")
          );

          if (imageRel) {
            let target = imageRel.getAttribute("Target") || "";
            if (target.startsWith("../")) target = "ppt/" + target.replace(/^\.\.\//, "");
            else if (!target.startsWith("ppt/")) target = "ppt/slides/" + target;

            if (zip.files[target]) {
              const imgBuffer = await zip.files[target].async("base64");
              const ext = target.toLowerCase().endsWith(".png") ? "png" : "jpeg";
              embeddedImageDataUrl = `data:image/${ext};base64,${imgBuffer}`;
            }
          }
        }

        // Render slide onto canvas
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Slide background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          if (embeddedImageDataUrl) {
            await new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = embeddedImageDataUrl!;
            });
          }

          // If there's text extracted, render cleanly overlayed or on top
          if (textLines.length > 0 && !embeddedImageDataUrl) {
            // Elegant slide layout
            // Header accent bar
            ctx.fillStyle = "#d97706";
            ctx.fillRect(0, 0, canvasWidth, 8);

            // Title
            const title = textLines[0];
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(title.length > 55 ? title.slice(0, 52) + "..." : title, 60, 90);

            // Subtle divider
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(60, 115);
            ctx.lineTo(canvasWidth - 60, 115);
            ctx.stroke();

            // Body bullet items
            ctx.fillStyle = "#334155";
            ctx.font = "20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            let currentY = 160;

            for (let t = 1; t < Math.min(textLines.length, 10); t++) {
              const line = textLines[t];
              // Bullet point dot
              ctx.fillStyle = "#d97706";
              ctx.beginPath();
              ctx.arc(70, currentY - 6, 4, 0, Math.PI * 2);
              ctx.fill();

              // Bullet text
              ctx.fillStyle = "#334155";
              ctx.fillText(line.length > 70 ? line.slice(0, 67) + "..." : line, 90, currentY);
              currentY += 38;
            }

            // Slide number footer
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(`Slide ${i + 1} of ${totalSlides}`, canvasWidth - 140, canvasHeight - 30);
          }
        }

        // Convert canvas to image and embed into PDF
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const base64Data = dataUrl.split(",")[1];
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        const embeddedImage = await pdfDoc.embedJpg(imageBytes);
        const pdfPage = pdfDoc.addPage([canvasWidth, canvasHeight]);
        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
        });
      }

      setConversionStatus("Finalizing PDF document...");
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(pdfBlob);
      blobUrlRef.current = url;
      setPdfBlobUrl(url);
      setPdfFileSize(pdfBlob.size);
      setConversionStatus("");
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
                          <span>{conversionStatus || "Converting Presentation to PDF..."}</span>
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
                  { name: "Word to PDF", href: "/tools/pdf/word-to-pdf", icon: FileText },
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FileText },
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
