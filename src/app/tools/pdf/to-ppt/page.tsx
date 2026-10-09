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

export default function PdfToPptPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [pptxBlobUrl, setPptxBlobUrl] = useState<string | null>(null);
  const [pptxFileSize, setPptxFileSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
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
    setPptxBlobUrl(null);
    setPptxFileSize(null);
    setErrorMessage(null);
    setIsConverting(false);
    setConversionStatus("");
  };

  const handleFile = (selected: File) => {
    clearFile();
    const name = selected.name.toLowerCase();
    if (!name.endsWith(".pdf") && selected.type !== "application/pdf") {
      setErrorMessage("Please select a valid PDF file (.pdf).");
      return;
    }
    setFile(selected);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setErrorMessage(null);
    setConversionStatus("Initializing PDF engine...");

    try {
      if (!window.pdfjsLib) {
        throw new Error("PDF processing engine is still initializing. Please wait a moment and try again.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const numPages = pdf.numPages;

      if (numPages === 0) {
        throw new Error("The selected PDF document contains no pages.");
      }

      const zip = new JSZip();

      // Root _rels/.rels
      zip.folder("_rels")?.file(
        ".rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>\n</Relationships>`
      );

      const pptFolder = zip.folder("ppt");
      const pptRelsFolder = pptFolder?.folder("_rels");
      const slidesFolder = pptFolder?.folder("slides");
      const mediaFolder = pptFolder?.folder("media");

      let contentTypesOverrides = "";
      let presentationRels = "";
      let sldIdLst = "";

      const emuWidth = 12192000;
      const emuHeight = 6858000;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setConversionStatus(`Rendering slide ${pageNum} of ${numPages}...`);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        mediaFolder?.file(`image${pageNum}.png`, base64Data, { base64: true });

        const rId = `rId${pageNum}`;
        const sldId = 255 + pageNum;

        contentTypesOverrides += `  <Override PartName="/ppt/slides/slide${pageNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`;
        presentationRels += `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${pageNum}.xml"/>\n`;
        sldIdLst += `    <p:sldId id="${sldId}" r:id="${rId}"/>\n`;

        const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">\n  <p:cSld>\n    <p:spTree>\n      <p:nvGrpSpPr>\n        <p:cNvPr id="1" name=""/>\n        <p:cNvGrpSpPr/>\n        <p:nvPr/>\n      </p:nvGrpSpPr>\n      <p:grpSpPr>\n        <a:xfrm>\n          <a:off x="0" y="0"/>\n          <a:ext cx="0" cy="0"/>\n          <a:chOff x="0" y="0"/>\n          <a:chExt cx="0" cy="0"/>\n        </a:xfrm>\n      </p:grpSpPr>\n      <p:pic>\n        <p:nvPicPr>\n          <p:cNvPr id="2" name="Slide ${pageNum}"/>\n          <p:cNvPicPr>\n            <a:picLocks noChangeAspect="1"/>\n          </p:cNvPicPr>\n          <p:nvPr/>\n        </p:nvPicPr>\n        <p:blipFill>\n          <a:blip r:embed="rId1"/>\n          <a:stretch>\n            <a:fillRect/>\n          </a:stretch>\n        </p:blipFill>\n        <p:spPr>\n          <a:xfrm>\n            <a:off x="0" y="0"/>\n            <a:ext cx="${emuWidth}" cy="${emuHeight}"/>\n          </a:xfrm>\n          <a:prstGeom prst="rect">\n            <a:avLst/>\n          </a:prstGeom>\n        </p:spPr>\n      </p:pic>\n    </p:spTree>\n  </p:cSld>\n</p:sld>`;

        slidesFolder?.file(`slide${pageNum}.xml`, slideXml);

        const slideRelsFolder = slidesFolder?.folder("_rels");
        slideRelsFolder?.file(
          `slide${pageNum}.xml.rels`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${pageNum}.png"/>\n</Relationships>`
        );
      }

      setConversionStatus("Packaging PowerPoint presentation (.pptx)...");

      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Default Extension="png" ContentType="image/png"/>\n  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>\n${contentTypesOverrides}</Types>`
      );

      pptFolder?.file(
        "presentation.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">\n  <p:sldMasterIdLst/>\n  <p:sldIdLst>\n${sldIdLst}  </p:sldIdLst>\n  <p:sldSz cx="${emuWidth}" cy="${emuHeight}" type="screen16x9"/>\n  <p:notesSz cx="6858000" cy="9144000"/>\n</p:presentation>`
      );

      pptRelsFolder?.file(
        "presentation.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n${presentationRels}</Relationships>`
      );

      const blob = await zip.generateAsync({ type: "blob" });

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setPptxBlobUrl(url);
      setPptxFileSize(blob.size);
      setConversionStatus("");
    } catch (err: unknown) {
      console.error("PDF to PPT conversion failed:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to convert PDF to PPT. Please try again."
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
            { label: "PDF to PPT" },
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
            PDF to PowerPoint Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert each page of your PDF document into presentation slides in PowerPoint (.pptx) format with pristine visual reproduction.
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
                  accept="application/pdf,.pdf"
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
                  Choose a PDF or drag it here
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Converts each PDF page into a high-res presentation slide
                </p>
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 mx-auto transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Browse PDF Document
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
                      <FileText size={20} />
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

                {!pptxBlobUrl ? (
                  <div className="flex flex-col gap-4">
                    <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
                      Click below to convert the PDF pages into a PowerPoint presentation deck.
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
                          <span>{conversionStatus || "Generating PowerPoint Deck..."}</span>
                        </>
                      ) : (
                        <>
                          <FileDown size={18} />
                          <span>Convert to PowerPoint (.pptx)</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-600">
                      <CheckCircle2 size={20} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Presentation Ready!</p>
                        <p className="text-xs opacity-90">
                          Your PowerPoint deck is ready ({pptxFileSize ? formatFileSize(pptxFileSize) : ""}).
                        </p>
                      </div>
                    </div>

                    <a
                      href={pptxBlobUrl}
                      download={file.name.replace(/\.pdf$/i, ".pptx")}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg font-body font-semibold text-sm text-white inline-flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-sm"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      <Download size={18} />
                      <span>Download PowerPoint (.pptx)</span>
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
                <strong className="font-semibold text-primary">Private Slide Generator:</strong> Slides are compiled securely on your device. Your presentation content is never retained or uploaded to external servers.
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
                How to convert PDF to PPT
              </h3>
              <ol className="space-y-4">
                {[
                  "Select or drag your PDF document into the upload area.",
                  "Click ‘Convert to PowerPoint’ to generate full-fidelity slides.",
                  "Download the generated presentation deck directly to your machine.",
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
                <h4>Local & Confidential</h4>
              </div>
              <p
                className="font-body text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Zero third-party tracking. The presentation deck is built locally using native slide generators.
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
                  { name: "PPT to PDF", href: "/tools/pdf/ppt-to-pdf", icon: Presentation },
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
