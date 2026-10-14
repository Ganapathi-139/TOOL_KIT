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
  FileText,
  FileType2,
  FilePlus2,
  Scissors,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [done, setDone] = useState(false);
  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [docxSize, setDocxSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFile = (selected: File) => {
    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file (.pdf).");
      return;
    }
    setFile(selected);
    setDone(false);
    setDocxUrl(null);
    setDocxSize(null);
    setStatus("");
    setErrorMessage(null);
  };

  const convertPdfToWord = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setDone(false);
    setDocxUrl(null);

    try {
      setStatus("Reading PDF...");
      const arrayBuffer = await file.arrayBuffer();

      setStatus("Loading PDF engine...");
      await loadScript("/js/pdf.min.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) throw new Error("PDF engine failed to load. Please refresh and try again.");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js";

      setStatus("Extracting text and formatting from PDF...");
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      // Each run carries text + formatting
      type TextRun = {
        str: string;
        fontSize: number;      // pt
        fontFamily: string;
        bold: boolean;
        italic: boolean;
      };
      type PageData = { pageNum: number; lines: TextRun[][] };

      const pages: PageData[] = [];

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Extracting page ${i} of ${numPages}...`);
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent({ includeMarkedContent: false });

        // styles map: fontName → { fontFamily, ascent, descent, vertical }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const styles: Record<string, any> = textContent.styles || {};

        // Group runs into lines by Y position (rounded to nearest integer)
        const yGroups: Record<number, TextRun[]> = {};

        for (const rawItem of textContent.items as Array<{
          str: string;
          transform: number[];
          fontName: string;
          width: number;
          height: number;
        }>) {
          if (!rawItem.str) continue;

          // Font size from transform matrix scale factor
          const scaleX = rawItem.transform[0];
          const scaleY = rawItem.transform[3];
          const rawSize = Math.abs(scaleY !== 0 ? scaleY : scaleX);
          const fontSize = Math.round(rawSize > 0 ? rawSize : 12);

          // Font metadata from styles
          const style = styles[rawItem.fontName] || {};
          const fontFamilyRaw: string = style.fontFamily || "";

          // Detect bold / italic from font family name
          const fnLower = (rawItem.fontName + fontFamilyRaw).toLowerCase();
          const bold = fnLower.includes("bold") || fnLower.includes("heavy") || fnLower.includes("black");
          const italic = fnLower.includes("italic") || fnLower.includes("oblique");

          // Strip common weight/style suffixes to get a clean family name
          const fontFamily = fontFamilyRaw
            .replace(/[-_ ](bold|italic|oblique|regular|medium|light|heavy|black|condensed|expanded|semibold|extrabold)/gi, "")
            .trim() || "Calibri";

          const y = Math.round(rawItem.transform[5]);
          if (!yGroups[y]) yGroups[y] = [];
          yGroups[y].push({ str: rawItem.str, fontSize, fontFamily, bold, italic });
        }

        // Sort Y positions descending (top of page first in PDF coords)
        const sortedYs = Object.keys(yGroups)
          .map(Number)
          .sort((a, b) => b - a);

        const lines: TextRun[][] = sortedYs.map((y) => yGroups[y]);
        pages.push({ pageNum: i, lines });
      }

      setStatus("Building Word document (.docx)...");
      const docxBlob = await buildDocx(pages);

      if (docxUrl) URL.revokeObjectURL(docxUrl);
      const url = URL.createObjectURL(docxBlob);
      setDocxUrl(url);
      setDocxSize(docxBlob.size);
      setDone(true);
      setStatus(`Converted successfully! ${numPages} ${numPages === 1 ? "page" : "pages"} extracted.`);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "PDF conversion failed. Please try another file."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const loadScript = (src: string, fallback: string): Promise<void> => {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).pdfjsLib) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => {
        const f = document.createElement("script");
        f.src = fallback;
        f.onload = () => resolve();
        f.onerror = () => resolve();
        document.body.appendChild(f);
      };
      document.body.appendChild(s);
    });
  };

  // ────────────────────────────────────────────────────────────
  // Build a .docx (Open XML ZIP) file preserving font size,
  // font family, bold and italic for every extracted text run.
  // ────────────────────────────────────────────────────────────
  type TextRun = { str: string; fontSize: number; fontFamily: string; bold: boolean; italic: boolean; };

  const xmlEscape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const buildDocx = async (
    pages: { pageNum: number; lines: TextRun[][] }[]
  ): Promise<Blob> => {

    const xmlParagraphs: string[] = [];

    pages.forEach(({ lines }, pageIndex) => {
      lines.forEach((runs) => {
        // Each line → one paragraph; each run → one <w:r> with formatting
        const wruns = runs.map((run) => {
          const szHalfPt = Math.max(8, Math.min(run.fontSize * 2, 144)); // clamp 4–72pt
          const rpr = [
            `<w:rFonts w:ascii="${xmlEscape(run.fontFamily)}" w:hAnsi="${xmlEscape(run.fontFamily)}"/>`,
            `<w:sz w:val="${szHalfPt}"/>`,
            `<w:szCs w:val="${szHalfPt}"/>`,
            run.bold   ? `<w:b/>` : "",
            run.italic ? `<w:i/>` : "",
          ].filter(Boolean).join("");

          return [
            `<w:r>`,
            `  <w:rPr>${rpr}</w:rPr>`,
            `  <w:t xml:space="preserve">${xmlEscape(run.str)}</w:t>`,
            `</w:r>`,
          ].join("");
        }).join("");

        xmlParagraphs.push(`<w:p>${wruns}</w:p>`);
      });

      // Page break between pages (not after last)
      if (pageIndex < pages.length - 1) {
        xmlParagraphs.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
      }
    });

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${xmlParagraphs.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    await loadJsZip();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const JSZip = (window as any).JSZip;
    if (!JSZip) throw new Error("ZIP engine not available. Please refresh and try again.");

    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypesXml);
    zip.file("_rels/.rels", relsXml);
    zip.file("word/document.xml", documentXml);
    zip.file("word/_rels/document.xml.rels", wordRelsXml);

    const blob: Blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    return blob;
  };

  const loadJsZip = (): Promise<void> => {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).JSZip) { resolve(); return; }
      const s = document.createElement("script");
      s.src = "/js/jszip.min.js";
      s.onload = () => resolve();
      s.onerror = () => {
        const f = document.createElement("script");
        f.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        f.onload = () => resolve();
        f.onerror = () => resolve();
        document.body.appendChild(f);
      };
      document.body.appendChild(s);
    });
  };

  const resetTool = () => {
    setFile(null);
    setDone(false);
    if (docxUrl) URL.revokeObjectURL(docxUrl);
    setDocxUrl(null);
    setDocxSize(null);
    setStatus("");
    setErrorMessage(null);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "PDF to Word" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <FileText size={16} />
            <span>PDF Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            PDF to Word Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Extract text from any PDF and convert it into an editable Word (.docx) document — entirely in your browser.
          </p>
        </div>

        {errorMessage && (
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
              <p className="font-semibold">Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Upload Zone */}
            {!file && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] ${isDragging ? "scale-[0.99]" : "hover:border-amber-500/50"}`}
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }}
                  className="hidden"
                />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                >
                  <Upload size={28} />
                </div>
                <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  Drop your PDF here
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  .pdf files supported · All processing is done in your browser
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
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={resetTool} className="font-body text-xs font-medium text-red-500 hover:underline flex items-center gap-1">
                    <X size={14} /> Change file
                  </button>
                </div>

                {/* Convert button */}
                {!isProcessing && !done && (
                  <button
                    type="button"
                    onClick={convertPdfToWord}
                    className="w-full py-3.5 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-sm"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    <FileText size={18} />
                    <span>Convert to Word (.docx)</span>
                  </button>
                )}

                {isProcessing && (
                  <div
                    className="p-4 rounded-xl border flex items-center gap-3"
                    style={{ backgroundColor: "var(--amber-tint)", borderColor: "rgba(200,123,58,0.25)" }}
                  >
                    <Loader2 size={18} className="animate-spin shrink-0 text-amber-500" />
                    <span className="font-body text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {status}
                    </span>
                  </div>
                )}

                {done && (
                  <>
                    <div
                      className="p-4 rounded-xl border flex items-center gap-3"
                      style={{ backgroundColor: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.3)" }}
                    >
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                      <div>
                        <p className="font-body text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          Conversion complete!
                        </p>
                        <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                          {status}
                          {docxSize && ` · Output: ${formatFileSize(docxSize)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {docxUrl && (
                        <a
                          href={docxUrl}
                          download={file.name.replace(/\.pdf$/i, "") + ".docx"}
                          className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-sm"
                          style={{ backgroundColor: "var(--amber-primary)" }}
                        >
                          <Download size={16} />
                          <span>Download .docx</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={resetTool}
                        className="px-4 py-3 rounded-xl border font-body text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                      >
                        Convert Another
                      </button>
                    </div>

                    <p
                      className="font-body text-xs rounded-lg p-3"
                      style={{ color: "var(--text-secondary)", backgroundColor: "var(--amber-tint)" }}
                    >
                      <strong>Note:</strong> PDF to Word conversion extracts text content. Complex layouts, images, and special formatting may not be preserved exactly. For best results, use PDFs with selectable (not scanned) text.
                    </p>
                  </>
                )}
              </div>
            )}

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
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>100% Private:</strong> Your PDF files are processed entirely in your browser. Nothing is uploaded to any server.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                What to Expect
              </h3>
              <ul className="space-y-2.5 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                {[
                  ["Text extraction", "All selectable text is extracted page by page"],
                  ["Page breaks preserved", "Each PDF page becomes a new section in the .docx"],
                  ["Editable output", "Open and edit the .docx in Word, LibreOffice, etc."],
                  ["Works offline", "No internet needed after the page loads"],
                ].map(([title, desc]) => (
                  <li key={title} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>{title}:</strong> {desc}</span>
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
                  { name: "Word to PDF", href: "/tools/pdf/word-to-pdf", icon: FileType2 },
                  { name: "Compress PDF", href: "/tools/pdf/compress", icon: FileType2 },
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
                  { name: "Split PDF", href: "/tools/pdf/split", icon: Scissors },
                  { name: "PDF to Text", href: "/tools/pdf/to-text", icon: FileText },
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
