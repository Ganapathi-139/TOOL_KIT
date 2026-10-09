"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Download,
  Shield,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileType2,
  FilePlus2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export default function TextToPdfPage() {
  const [text, setText] = useState<string>(
    "ToolKit Plain Text Document\n\nThis is a sample document generated in your browser.\nYou can type or paste any text here, or upload a .txt file.\n\nFormatting Features:\n• Automatic word wrapping\n• Multi-page pagination\n• Customizable fonts and page margins\n• Footer page numbering\n• 100% client-side privacy"
  );
  const [fileName, setFileName] = useState<string>("document");
  const [fontFamily, setFontFamily] = useState<"helvetica" | "courier" | "times">("helvetica");
  const [fontSize, setFontSize] = useState<number>(11);
  const [lineSpacing, setLineSpacing] = useState<number>(1.4);
  const [pageSize, setPageSize] = useState<"a4" | "letter">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [marginSize, setMarginSize] = useState<number>(50); // in points
  const [includePageNumbers, setIncludePageNumbers] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setFileName(file.name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read text file.");
    };
    reader.readAsText(file);
  };

  const generatePdf = async () => {
    if (!text.trim()) {
      setErrorMessage("Please enter or upload some text to convert.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const pdfDoc = await PDFDocument.create();

      // Embed selected font
      let chosenFont;
      if (fontFamily === "courier") {
        chosenFont = await pdfDoc.embedFont(StandardFonts.Courier);
      } else if (fontFamily === "times") {
        chosenFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      } else {
        chosenFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      // Page dimensions
      let baseWidth = pageSize === "a4" ? 595.28 : 612.0;
      let baseHeight = pageSize === "a4" ? 841.89 : 792.0;

      if (orientation === "landscape") {
        const temp = baseWidth;
        baseWidth = baseHeight;
        baseHeight = temp;
      }

      const usableWidth = baseWidth - marginSize * 2;
      const bottomLimit = marginSize + (includePageNumbers ? 20 : 0);
      const lineHeight = fontSize * lineSpacing;

      // Word wrapping helper
      const wrapLine = (lineStr: string): string[] => {
        if (!lineStr) return [""];
        const words = lineStr.split(" ");
        const lines: string[] = [];
        let cur = "";

        for (const w of words) {
          const test = cur ? `${cur} ${w}` : w;
          const width = chosenFont.widthOfTextAtSize(test, fontSize);
          if (width <= usableWidth) {
            cur = test;
          } else {
            if (cur) lines.push(cur);
            // If single word is wider than usableWidth, break it
            let remainingWord = w;
            while (chosenFont.widthOfTextAtSize(remainingWord, fontSize) > usableWidth && remainingWord.length > 1) {
              let sliceLen = remainingWord.length - 1;
              while (sliceLen > 0 && chosenFont.widthOfTextAtSize(remainingWord.slice(0, sliceLen), fontSize) > usableWidth) {
                sliceLen--;
              }
              if (sliceLen > 0) {
                lines.push(remainingWord.slice(0, sliceLen));
                remainingWord = remainingWord.slice(sliceLen);
              } else {
                break;
              }
            }
            cur = remainingWord;
          }
        }
        if (cur) lines.push(cur);
        return lines;
      };

      // Split text by newlines and wrap each paragraph
      const paragraphs = text.split("\n");
      const wrappedLines: string[] = [];
      for (const p of paragraphs) {
        const lines = wrapLine(p);
        wrappedLines.push(...lines);
      }

      let currentPage = pdfDoc.addPage([baseWidth, baseHeight]);
      let currentY = baseHeight - marginSize;
      let count = 1;

      for (const line of wrappedLines) {
        if (currentY - lineHeight < bottomLimit) {
          currentPage = pdfDoc.addPage([baseWidth, baseHeight]);
          currentY = baseHeight - marginSize;
          count++;
        }

        if (line) {
          currentPage.drawText(line, {
            x: marginSize,
            y: currentY - fontSize,
            size: fontSize,
            font: chosenFont,
            color: rgb(0.12, 0.12, 0.14),
          });
        }
        currentY -= lineHeight;
      }

      // Add page numbers
      if (includePageNumbers) {
        const allPages = pdfDoc.getPages();
        for (let i = 0; i < allPages.length; i++) {
          const p = allPages[i];
          const pageStr = `${i + 1} / ${allPages.length}`;
          const strWidth = chosenFont.widthOfTextAtSize(pageStr, 8);
          p.drawText(pageStr, {
            x: (baseWidth - strWidth) / 2,
            y: marginSize / 2,
            size: 8,
            font: chosenFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(url);
      setPdfSize(blob.size);
      setPageCount(count);
    } catch (err: unknown) {
      console.error("PDF generation failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to create PDF document.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "Plain Text to PDF" },
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
            Plain Text to PDF Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert raw text, notes, code snippets, or .txt files into styled, paginated PDF documents with custom typography and margins.
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
            <div className="text-sm font-body">
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Workspace */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div
              className="rounded-2xl border p-6 flex flex-col gap-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              {/* Text Area Header */}
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-warm)" }}>
                <div>
                  <h3 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    Document Text
                  </h3>
                  <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                    {text.length.toLocaleString()} characters • {text.trim() ? text.trim().split(/\s+/).length.toLocaleString() : 0} words
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg border text-xs font-body font-medium flex items-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Upload size={13} />
                    <span>Import .txt</span>
                  </button>
                </div>
              </div>

              {/* Text Input */}
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (pdfBlobUrl) {
                    URL.revokeObjectURL(pdfBlobUrl);
                    setPdfBlobUrl(null);
                  }
                }}
                rows={12}
                className="w-full p-4 rounded-xl border font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                style={{
                  backgroundColor: "var(--bg-warm)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-primary)",
                }}
                placeholder="Type or paste plain text here..."
              />

              {/* Layout & Typography Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as "helvetica" | "courier" | "times")}
                    className="w-full rounded-lg border px-3 py-2 font-body text-xs"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="helvetica">Helvetica (Sans)</option>
                    <option value="courier">Courier (Monospace)</option>
                    <option value="times">Times Roman (Serif)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Font Size
                  </label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2 font-body text-xs"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="9">9 pt</option>
                    <option value="10">10 pt</option>
                    <option value="11">11 pt</option>
                    <option value="12">12 pt</option>
                    <option value="14">14 pt</option>
                  </select>
                </div>

                <div>
                  <label className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as "a4" | "letter")}
                    className="w-full rounded-lg border px-3 py-2 font-body text-xs"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                  </select>
                </div>

                <div>
                  <label className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Orientation
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
                    className="w-full rounded-lg border px-3 py-2 font-body text-xs"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              {/* Advanced Checkboxes */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="page-nums"
                    checked={includePageNumbers}
                    onChange={(e) => setIncludePageNumbers(e.target.checked)}
                    className="rounded accent-amber-600"
                  />
                  <label htmlFor="page-nums" className="font-body text-xs cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                    Include footer page numbers
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                    Margins:
                  </label>
                  <select
                    value={marginSize}
                    onChange={(e) => setMarginSize(Number(e.target.value))}
                    className="rounded border px-2 py-1 font-body text-xs"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="30">Compact (30pt)</option>
                    <option value="50">Standard (50pt)</option>
                    <option value="72">Wide (72pt)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                    Line Spacing:
                  </label>
                  <select
                    value={lineSpacing}
                    onChange={(e) => setLineSpacing(Number(e.target.value))}
                    className="rounded border px-2 py-1 font-body text-xs"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="1.2">1.2 (Tight)</option>
                    <option value="1.4">1.4 (Standard)</option>
                    <option value="1.6">1.6 (Relaxed)</option>
                    <option value="2.0">2.0 (Double)</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={generatePdf}
                disabled={isGenerating || !text.trim()}
                className="w-full py-3.5 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                style={{ backgroundColor: "var(--amber-primary)" }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Formatting & Building PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    <span>Generate PDF Document</span>
                  </>
                )}
              </button>

              {/* Download Section */}
              {pdfBlobUrl && (
                <div
                  className="p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-500 bg-emerald-500/10">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        PDF Ready
                      </p>
                      <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                        {pageCount} {pageCount === 1 ? "page" : "pages"} • {pdfSize ? formatFileSize(pdfSize) : ""}
                      </p>
                    </div>
                  </div>

                  <a
                    href={pdfBlobUrl}
                    download={`${fileName || "document"}.pdf`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-body font-semibold text-xs text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    <Download size={15} />
                    <span>Download PDF</span>
                  </a>
                </div>
              )}
            </div>

            {/* Privacy Card */}
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
                <strong className="font-semibold text-primary">In-Browser PDF Engine:</strong> Binary PDF vectors are synthesized locally on your computer with <code className="font-mono">pdf-lib</code>. No data is stored or uploaded.
              </p>
            </div>
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
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Use Cases
              </h3>
              <ul className="space-y-2 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Converting source code or logs with Courier monospace.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Formatting essays, meeting notes, and outlines.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Creating clean text PDFs without bloated Word metadata.</span>
                </li>
              </ul>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Related PDF Tools
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { name: "PDF to Plain Text", href: "/tools/pdf/to-text", icon: FileText },
                  { name: "Word to PDF", href: "/tools/pdf/word-to-pdf", icon: FileType2 },
                  { name: "Word to PDF", href: "/tools/pdf/word-to-pdf", icon: FileText },
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-body group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon size={15} style={{ color: "var(--amber-primary)" }} />
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.name}
                      </span>
                    </div>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text-muted)" }} />
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
