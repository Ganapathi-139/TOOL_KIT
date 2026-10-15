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
  Info,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type TextRun = {
  str: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
};

type PageData = {
  pageNum: number;
  paragraphs: TextRun[][];
  bodyFontSize: number; // dominant font size for heading detection
  widthDxa: number;
  heightDxa: number;
  isLandscape: boolean;
};

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [done, setDone] = useState(false);
  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [docxSize, setDocxSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [engineUsed, setEngineUsed] = useState<"server" | "client" | null>(null);
  const [isImageBasedPdf, setIsImageBasedPdf] = useState(false);

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
    setEngineUsed(null);
    setIsImageBasedPdf(false);
  };

  // ──────────────────────────────────────────────────────────
  // Main conversion entry point
  // Strategy:
  //   1. Try /api/convert/pdf-to-word (Python pdf2docx — best quality)
  //   2. On 503/network error → fall back to client-side extraction
  // ──────────────────────────────────────────────────────────
  const convertPdfToWord = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setDone(false);
    setDocxUrl(null);
    setIsImageBasedPdf(false);

    try {
      // ── Stage 1: Try the server-side Python engine ──
      setStatus("Trying high-quality conversion engine…");
      const serverBlob = await tryServerConversion(file);

      if (serverBlob) {
        // Server succeeded
        finishWithBlob(serverBlob, "server");
        return;
      }

      // ── Stage 2: Client-side fallback ──
      setStatus("Loading PDF engine…");
      await loadScript(
        "/js/pdf.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) throw new Error("PDF engine failed to load. Please refresh and try again.");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js";

      setStatus("Reading PDF…");
      const arrayBuffer = await file.arrayBuffer();
      const pdfFontMap = extractPdfFontMap(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const pages: PageData[] = [];
      let totalTextItems = 0;
      let totalImageItems = 0;

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Extracting page ${i} of ${numPages}…`);
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const widthDxa = Math.round(viewport.width * 20);
        const heightDxa = Math.round(viewport.height * 20);
        const isLandscape = viewport.width > viewport.height;

        const textContent = await page.getTextContent({ includeMarkedContent: false });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const styles: Record<string, any> = textContent.styles || {};

        // Count items to detect image-based PDFs
        const operatorList = await page.getOperatorList();
        const imgOps = operatorList.fnArray.filter((fn: number) => fn === 82 || fn === 83);
        totalImageItems += imgOps.length;

        type LineItem = {
          str: string;
          fontSize: number;
          fontFamily: string;
          bold: boolean;
          italic: boolean;
          x: number;
          y: number;
          width: number;
        };

        const rawRuns: LineItem[] = [];

        for (const rawItem of textContent.items as Array<{
          str: string;
          transform: number[];
          fontName: string;
          width: number;
        }>) {
          if (!rawItem.str || !rawItem.str.trim()) continue;
          totalTextItems++;

          const scaleX = rawItem.transform[0];
          const scaleY = rawItem.transform[3];
          const rawSize = Math.abs(scaleY !== 0 ? scaleY : scaleX);
          const fontSize = Math.round(rawSize > 0 ? rawSize : 12);

          // Resolve font from binary map
          const fontKey = rawItem.fontName;
          const fIndexMatch = fontKey.match(/f(\d+)$/i);
          const fAlias = fIndexMatch ? ("F" + fIndexMatch[1]) : null;
          const fontInfo = fAlias ? (pdfFontMap[fAlias] || pdfFontMap[fAlias.toLowerCase()]) : null;

          let fontFamily: string, bold: boolean, italic: boolean;
          if (fontInfo) {
            fontFamily = fontInfo.family || "Times New Roman";
            bold = fontInfo.bold;
            italic = fontInfo.italic;
          } else {
            const style = styles[fontKey] || {};
            const fontFamilyRaw: string = style.fontFamily || "";
            const fnLower = (fontKey + fontFamilyRaw).toLowerCase();
            bold = fnLower.includes("bold") || fnLower.includes("heavy") || fnLower.includes("black");
            italic = fnLower.includes("italic") || fnLower.includes("oblique");
            fontFamily = fontFamilyRaw
              .replace(/[-_ ](bold|italic|oblique|regular|medium|light|heavy|black|condensed|expanded|semibold|extrabold)/gi, "")
              .trim() || "Times New Roman";
          }

          rawRuns.push({
            str: sanitizePdfStr(rawItem.str),
            fontSize,
            fontFamily,
            bold,
            italic,
            x: rawItem.transform[4],
            y: rawItem.transform[5],
            width: rawItem.width || 0,
          });
        }

        // ── Group into lines (Y-tolerance clustering) ──
        type LineCluster = { baselineY: number; runs: LineItem[] };
        const lineClusters: LineCluster[] = [];
        for (const run of rawRuns) {
          const matched = lineClusters.find((lc) => Math.abs(lc.baselineY - run.y) <= 3.5);
          if (matched) matched.runs.push(run);
          else lineClusters.push({ baselineY: run.y, runs: [run] });
        }
        lineClusters.sort((a, b) => b.baselineY - a.baselineY);

        // Sort each line L→R and join runs with gap detection
        type SortedLine = {
          baselineY: number;
          runs: TextRun[];
          maxFontSize: number;
          isBold: boolean;
        };
        const sortedLines: SortedLine[] = [];
        for (const cluster of lineClusters) {
          cluster.runs.sort((a, b) => a.x - b.x);
          const formattedRuns: TextRun[] = [];
          let maxFontSize = 0;
          let anyBold = false;
          for (let rIdx = 0; rIdx < cluster.runs.length; rIdx++) {
            const cur = cluster.runs[rIdx];
            if (cur.fontSize > maxFontSize) maxFontSize = cur.fontSize;
            if (cur.bold) anyBold = true;
            if (rIdx > 0) {
              const prev = cluster.runs[rIdx - 1];
              const gap = cur.x - (prev.x + prev.width);
              if (gap > 2 && !prev.str.endsWith(" ") && !cur.str.startsWith(" ")) {
                cur.str = " " + cur.str;
              }
            }
            formattedRuns.push({ str: cur.str, fontSize: cur.fontSize, fontFamily: cur.fontFamily, bold: cur.bold, italic: cur.italic });
          }
          sortedLines.push({ baselineY: cluster.baselineY, runs: formattedRuns, maxFontSize, isBold: anyBold });
        }

        // ── Group lines into paragraphs ──
        // Lines separated by a gap > 1.2× the line's own font size are different paragraphs
        const paragraphs: TextRun[][] = [];
        let currentPara: TextRun[] = [];
        let prevY: number | null = null;
        let prevSize = 12;

        for (const line of sortedLines) {
          if (prevY !== null) {
            const gap = Math.abs(prevY - line.baselineY);
            const lineHeight = Math.max(line.maxFontSize, prevSize) * 1.2;
            if (gap > lineHeight * 1.5) {
              // Large gap → new paragraph
              if (currentPara.length > 0) {
                paragraphs.push(currentPara);
                currentPara = [];
              }
            } else if (gap > lineHeight * 0.8) {
              // Normal line break within paragraph → append space between
              if (currentPara.length > 0 && line.runs.length > 0) {
                const lastRun = currentPara[currentPara.length - 1];
                if (!lastRun.str.endsWith(" ") && !line.runs[0].str.startsWith(" ")) {
                  currentPara.push({ ...line.runs[0], str: " " + line.runs[0].str });
                  for (let ri = 1; ri < line.runs.length; ri++) currentPara.push(line.runs[ri]);
                  prevY = line.baselineY;
                  prevSize = line.maxFontSize;
                  continue;
                }
              }
            }
          }
          currentPara.push(...line.runs);
          prevY = line.baselineY;
          prevSize = line.maxFontSize;
        }
        if (currentPara.length > 0) paragraphs.push(currentPara);

        // Detect body font size (most common font size)
        const sizeCounts: Record<number, number> = {};
        for (const para of paragraphs) {
          for (const run of para) {
            sizeCounts[run.fontSize] = (sizeCounts[run.fontSize] || 0) + 1;
          }
        }
        const bodyFontSize = Object.entries(sizeCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0];
        const bodySize = bodyFontSize ? parseInt(bodyFontSize) : 12;

        pages.push({ pageNum: i, paragraphs, bodyFontSize: bodySize, widthDxa, heightDxa, isLandscape });
      }

      // Check for image-based PDF
      if (totalTextItems === 0 && totalImageItems > 0) {
        setIsImageBasedPdf(true);
        throw new Error(
          "This PDF contains scanned images, not selectable text. Text extraction is not possible without OCR. " +
          "Try uploading a text-based PDF, or use a dedicated OCR tool first."
        );
      }

      if (totalTextItems === 0) {
        throw new Error("No text was found in this PDF. The file may be empty or image-only.");
      }

      setStatus("Building Word document (.docx)…");
      const docxBlob = await buildDocx(pages);
      finishWithBlob(docxBlob, "client");

    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "PDF conversion failed. Please try another file.");
      setIsProcessing(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // Try server-side conversion (Python pdf2docx)
  // Returns the DOCX blob if successful, null if not available
  // ──────────────────────────────────────────────────────────
  const tryServerConversion = async (f: File): Promise<Blob | null> => {
    try {
      const form = new FormData();
      form.append("file", f);
      const resp = await fetch("/api/convert/pdf-to-word", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(90_000),
      });
      if (resp.status === 503 || resp.status === 404) return null; // not available on this deployment
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.warn("[server conversion]", err.error || resp.statusText);
        return null;
      }
      return await resp.blob();
    } catch {
      return null; // network error or timeout — fall back silently
    }
  };

  const finishWithBlob = (blob: Blob, engine: "server" | "client") => {
    const url = URL.createObjectURL(blob);
    setDocxUrl(url);
    setDocxSize(blob.size);
    setDone(true);
    setEngineUsed(engine);
    setStatus(
      engine === "server"
        ? "Converted using high-quality engine (pdf2docx). Tables and layout preserved."
        : "Converted using browser engine. Text and fonts extracted."
    );
    setIsProcessing(false);
  };

  // ──────────────────────────────────────────────────────────
  // Extract font aliases from PDF binary (F1, F2 → real BaseFont)
  // ──────────────────────────────────────────────────────────
  const extractPdfFontMap = (
    buf: ArrayBuffer
  ): Record<string, { family: string; bold: boolean; italic: boolean }> => {
    const bytes = new Uint8Array(buf);
    const str = new Array(bytes.length)
      .fill(0)
      .map((_, i) => String.fromCharCode(bytes[i]))
      .join("");

    const objMap: Record<string, string> = {};
    const objRegex = /(\d+)\s+0\s+obj\s*<<([\s\S]*?)>>\s*endobj/g;
    let m: RegExpExecArray | null;
    while ((m = objRegex.exec(str)) !== null) objMap[m[1]] = m[2];

    const fontObjToBaseFont: Record<string, string> = {};
    for (const [objNum, body] of Object.entries(objMap)) {
      const bfMatch = body.match(/\/(?:BaseFont|FontName)\s*\/([^\s\/>]+)/);
      if (bfMatch) {
        let rawName = bfMatch[1].replace(/#20/g, " ");
        if (rawName.includes("+")) rawName = rawName.split("+")[1];
        fontObjToBaseFont[objNum] = rawName;
      }
    }

    const result: Record<string, { family: string; bold: boolean; italic: boolean }> = {};
    const resRegex = /\/([A-Za-z0-9_]+)\s+(\d+)\s+0\s+R/g;
    while ((m = resRegex.exec(str)) !== null) {
      const alias = m[1];
      const targetObj = m[2];
      if (fontObjToBaseFont[targetObj]) {
        const fullName = fontObjToBaseFont[targetObj];
        const fnL = fullName.toLowerCase();
        const bold = fnL.includes("bold") || fnL.includes("black") || fnL.includes("heavy");
        const italic = fnL.includes("italic") || fnL.includes("oblique");
        const family =
          fullName
            .replace(/[,]?(bold|italic|oblique|regular|medium|light|heavy|black|semibold)/gi, "")
            .trim() || fullName;
        result[alias] = { family, bold, italic };
        result[alias.toLowerCase()] = { family, bold, italic };
      }
    }
    return result;
  };

  // ── Sanitize PDF special characters ──
  const sanitizePdfStr = (s: string): string =>
    s.replace(/\uF0B7/g, "\u2022 ").replace(/\uF0A7/g, "\u25AA ")
      .replace(/\uF076/g, "\u2713 ").replace(/\uF0D8/g, "\u27A2 ")
      .replace(/[\uF000-\uF0FF]/g, "\u2022 ")
      .replace(/\uFB01/g, "fi").replace(/\uFB02/g, "fl")
      .replace(/\uFB00/g, "ff").replace(/\uFB03/g, "ffi").replace(/\uFB04/g, "ffl");

  // ──────────────────────────────────────────────────────────
  // Build .docx Open XML with:
  //   - Per-page section breaks (no extra blank pages)
  //   - Heading styles for large/bold text
  //   - Bold, italic, font family, font size per run
  // ──────────────────────────────────────────────────────────
  const xmlEscape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const buildDocx = async (pages: PageData[]): Promise<Blob> => {
    const xmlParagraphs: string[] = [];

    pages.forEach((pageData, pageIndex) => {
      const { paragraphs, bodyFontSize, widthDxa, heightDxa, isLandscape } = pageData;
      const isLastPage = pageIndex === pages.length - 1;
      const orientAttr = isLandscape ? ' w:orient="landscape"' : "";

      if (paragraphs.length === 0) {
        // Empty page — just a section break placeholder
        if (!isLastPage) {
          xmlParagraphs.push(
            `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="${widthDxa}" w:h="${heightDxa}"${orientAttr}/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:pPr></w:p>`
          );
        }
        return;
      }

      paragraphs.forEach((runs, paraIndex) => {
        const isLastParaOfPage = paraIndex === paragraphs.length - 1;

        // Determine if this paragraph is a heading
        const paraMaxSize = runs.reduce((m, r) => Math.max(m, r.fontSize), 0);
        const paraIsBold = runs.some((r) => r.bold);
        const isHeading = paraMaxSize >= bodyFontSize * 1.4 && (paraIsBold || paraMaxSize >= bodyFontSize * 1.6);
        const headingLevel =
          paraMaxSize >= bodyFontSize * 2.0 ? 1 :
          paraMaxSize >= bodyFontSize * 1.6 ? 2 :
          paraMaxSize >= bodyFontSize * 1.4 ? 3 : 0;

        // Build runs
        const wruns = runs.map((run) => {
          const szHalfPt = Math.max(8, Math.min(run.fontSize * 2, 144));
          const rpr = [
            `<w:rFonts w:ascii="${xmlEscape(run.fontFamily)}" w:hAnsi="${xmlEscape(run.fontFamily)}"/>`,
            `<w:sz w:val="${szHalfPt}"/>`,
            `<w:szCs w:val="${szHalfPt}"/>`,
            run.bold   ? `<w:b/>` : "",
            run.italic ? `<w:i/>` : "",
          ].filter(Boolean).join("");

          return `<w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${xmlEscape(run.str)}</w:t></w:r>`;
        }).join("");

        // Paragraph spacing: add space after for headings, tight for body
        const spaceAfter = isHeading ? "120" : "40";
        const spaceBefore = isHeading ? "200" : "0";
        let ppr = `<w:spacing w:before="${spaceBefore}" w:after="${spaceAfter}" w:line="240" w:lineRule="auto"/>`;

        // Heading style
        if (isHeading && headingLevel > 0) {
          ppr = `<w:pStyle w:val="Heading${headingLevel}"/>` + ppr;
        }

        // Page section break at last paragraph of non-last page
        if (!isLastPage && isLastParaOfPage) {
          ppr += `<w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="${widthDxa}" w:h="${heightDxa}"${orientAttr}/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>`;
        }

        xmlParagraphs.push(`<w:p><w:pPr>${ppr}</w:pPr>${wruns}</w:p>`);
      });
    });

    const lastPage = pages[pages.length - 1];
    const lastWidthDxa = lastPage?.widthDxa || 11906;
    const lastHeightDxa = lastPage?.heightDxa || 16838;
    const lastOrientAttr = lastPage?.isLandscape ? ' w:orient="landscape"' : "";

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${xmlParagraphs.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="${lastWidthDxa}" w:h="${lastHeightDxa}"${lastOrientAttr}/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
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
    zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);

    return await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  };

  // ── Script loaders ──
  const loadScript = (src: string, fallback: string): Promise<void> =>
    new Promise((resolve) => {
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

  const loadJsZip = (): Promise<void> =>
    new Promise((resolve) => {
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

  const resetTool = () => {
    setFile(null);
    setDone(false);
    if (docxUrl) URL.revokeObjectURL(docxUrl);
    setDocxUrl(null);
    setDocxSize(null);
    setStatus("");
    setErrorMessage(null);
    setEngineUsed(null);
    setIsImageBasedPdf(false);
  };

  // ──────────────────────────────────────────────────────────
  // UI
  // ──────────────────────────────────────────────────────────
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
            Convert PDF to editable Word (.docx) — uses a high-quality engine locally, with a browser fallback for cloud deployment.
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
              <p className="font-semibold">{isImageBasedPdf ? "Scanned PDF Detected" : "Error"}</p>
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
                  .pdf files supported · Text-based PDFs give best results
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

                    {/* Engine badge */}
                    {engineUsed && (
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-body"
                        style={{
                          backgroundColor: engineUsed === "server" ? "rgba(34,197,94,0.07)" : "var(--amber-tint)",
                          color: engineUsed === "server" ? "#15803d" : "var(--text-secondary)",
                          border: `1px solid ${engineUsed === "server" ? "rgba(34,197,94,0.3)" : "rgba(200,123,58,0.2)"}`,
                        }}
                      >
                        <Info size={13} />
                        <span>
                          {engineUsed === "server"
                            ? "High-quality engine (pdf2docx): tables, layout, and fonts preserved."
                            : "Browser engine: text and fonts extracted. Tables/images not supported."}
                        </span>
                      </div>
                    )}

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
                      <strong>Note:</strong> For scanned/image PDFs, text extraction is not possible without OCR. For complex layouts, tables, or charts, results may vary — this is a fundamental limitation of PDF format.
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
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>100% Private:</strong>{" "}
                When using the browser engine, your files never leave your device. The server engine processes files temporarily and deletes them immediately after conversion.
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
                  ["High-quality engine", "Used locally: preserves tables, fonts, layout (pdf2docx)"],
                  ["Browser fallback", "Used on Vercel: extracts text, fonts, headings — no tables"],
                  ["Page breaks preserved", "Each PDF page becomes a new section in the .docx"],
                  ["Editable output", "Open and edit in Word, LibreOffice, Google Docs"],
                  ["Scanned PDFs", "Image-only PDFs require OCR — not supported without it"],
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
