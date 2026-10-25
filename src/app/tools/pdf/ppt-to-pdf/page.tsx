"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Presentation,
  Upload,
  Download,
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  FileDown,
  Eye,
  EyeOff,
  Maximize2,
  FileText,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

interface SlideThumbnail {
  slideNumber: number;
  dataUrl: string;
}

export default function PptToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<number | null>(null);
  const [slideCount, setSlideCount] = useState<number>(0);
  const [slideThumbnails, setSlideThumbnails] = useState<SlideThumbnail[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<"pdf" | "slides">("pdf");
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
    setSlideCount(0);
    setSlideThumbnails([]);
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
    setSlideThumbnails([]);
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
          "Could not detect presentation slides in this file. Please ensure it is a valid .pptx presentation."
        );
      }

      // Sort slide numbers numerically
      slideFileNames.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
        return numA - numB;
      });

      const totalSlides = slideFileNames.length;
      setSlideCount(totalSlides);
      const pdfDoc = await PDFDocument.create();
      const parser = new DOMParser();

      // Detect presentation slide dimensions (EMUs)
      let slideWidthEmu = 12192000;
      let slideHeightEmu = 6858000;
      if (zip.files["ppt/presentation.xml"]) {
        const presXml = await zip.files["ppt/presentation.xml"].async("text");
        const presDoc = parser.parseFromString(presXml, "text/xml");
        const sldSz = presDoc.getElementsByTagName("p:sldSz")[0];
        if (sldSz) {
          const cx = parseInt(sldSz.getAttribute("cx") || "12192000", 10);
          const cy = parseInt(sldSz.getAttribute("cy") || "6858000", 10);
          if (cx > 0 && cy > 0) {
            slideWidthEmu = cx;
            slideHeightEmu = cy;
          }
        }
      }

      // Render canvas resolution (Crisp Full HD width)
      const canvasWidth = 1920;
      const canvasHeight = Math.round(
        canvasWidth * (slideHeightEmu / slideWidthEmu)
      );
      const scaleX = canvasWidth / slideWidthEmu;
      const scaleY = canvasHeight / slideHeightEmu;

      const generatedThumbnails: SlideThumbnail[] = [];

      for (let i = 0; i < totalSlides; i++) {
        const slidePath = slideFileNames[i];
        setConversionStatus(`Rendering slide ${i + 1} of ${totalSlides}...`);

        const slideXmlStr = await zip.files[slidePath].async("text");
        const slideDoc = parser.parseFromString(slideXmlStr, "text/xml");

        // Parse slide relationships to locate embedded images
        const slideNumMatch = slidePath.match(/slide(\d+)\.xml/i);
        const slideNum = slideNumMatch ? slideNumMatch[1] : `${i + 1}`;
        const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
        const relMap = new Map<string, string>();

        if (zip.files[relsPath]) {
          const relsStr = await zip.files[relsPath].async("text");
          const relsDoc = parser.parseFromString(relsStr, "text/xml");
          const relNodes = Array.from(
            relsDoc.getElementsByTagName("Relationship")
          );

          for (const r of relNodes) {
            const id = r.getAttribute("Id");
            let target = r.getAttribute("Target") || "";
            if (id && target) {
              if (target.startsWith("../")) {
                target = "ppt/" + target.replace(/^\.\.\//, "");
              } else if (!target.startsWith("ppt/")) {
                target = "ppt/slides/" + target;
              }

              if (zip.files[target]) {
                const ext = target.toLowerCase().endsWith(".png")
                  ? "png"
                  : "jpeg";
                const base64 = await zip.files[target].async("base64");
                relMap.set(id, `data:image/${ext};base64,${base64}`);
              }
            }
          }
        }

        // Preload all images referenced by this slide
        const loadedImages = new Map<string, HTMLImageElement>();
        for (const [id, dataUrl] of relMap.entries()) {
          const img = new Image();
          img.src = dataUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          loadedImages.set(id, img);
        }

        // Initialize high-res canvas
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        // 1. Render slide background
        let bgColor = "#ffffff";
        const bgNode = slideDoc.getElementsByTagName("p:bg")[0];
        if (bgNode) {
          const srgb = bgNode.getElementsByTagName("a:srgbClr")[0];
          if (srgb && srgb.getAttribute("val")) {
            bgColor = "#" + srgb.getAttribute("val");
          }
        }
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Helper to extract transform coordinates
        const getTransform = (
          node: Element
        ): { x: number; y: number; w: number; h: number } | null => {
          const off = node.getElementsByTagName("a:off")[0];
          const ext = node.getElementsByTagName("a:ext")[0];
          if (!off || !ext) return null;
          const ox = parseInt(off.getAttribute("x") || "0", 10);
          const oy = parseInt(off.getAttribute("y") || "0", 10);
          const cx = parseInt(ext.getAttribute("cx") || "0", 10);
          const cy = parseInt(ext.getAttribute("cy") || "0", 10);
          return {
            x: ox * scaleX,
            y: oy * scaleY,
            w: cx * scaleX,
            h: cy * scaleY,
          };
        };

        // Helper to wrap text within width
        const wrapText = (
          text: string,
          maxWidth: number,
          font: string
        ): string[] => {
          ctx.font = font;
          const words = text.split(/\s+/);
          const lines: string[] = [];
          let currentLine = words[0] || "";

          for (let w = 1; w < words.length; w++) {
            const word = words[w];
            const testLine = currentLine + " " + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width < maxWidth) {
              currentLine = testLine;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
          return lines;
        };

        // Render shapes, pictures, and text boxes in visual tree order
        const spTree = slideDoc.getElementsByTagName("p:spTree")[0];
        if (spTree) {
          const children = Array.from(spTree.children);

          for (const child of children) {
            const tagName = child.tagName.toLowerCase();

            // A. PICTURE (<p:pic>)
            if (tagName === "p:pic" || child.getElementsByTagName("p:pic")[0]) {
              const picNode =
                tagName === "p:pic"
                  ? child
                  : child.getElementsByTagName("p:pic")[0];
              const xfrm = getTransform(picNode);
              const blip = picNode.getElementsByTagName("a:blip")[0];
              const rId = blip?.getAttribute("r:embed");

              if (xfrm && rId && loadedImages.has(rId)) {
                const img = loadedImages.get(rId)!;
                ctx.drawImage(img, xfrm.x, xfrm.y, xfrm.w, xfrm.h);
              }
            }

            // B. SHAPE OR TEXTBOX (<p:sp>)
            else if (
              tagName === "p:sp" ||
              child.getElementsByTagName("p:sp")[0]
            ) {
              const spNode =
                tagName === "p:sp"
                  ? child
                  : child.getElementsByTagName("p:sp")[0];
              const xfrm = getTransform(spNode);
              if (!xfrm) continue;

              // Shape Fill
              const spPr = spNode.getElementsByTagName("p:spPr")[0];
              if (spPr) {
                const solidFill = spPr.getElementsByTagName("a:solidFill")[0];
                if (solidFill) {
                  const srgb = solidFill.getElementsByTagName("a:srgbClr")[0];
                  if (srgb && srgb.getAttribute("val")) {
                    ctx.fillStyle = "#" + srgb.getAttribute("val");
                    ctx.fillRect(xfrm.x, xfrm.y, xfrm.w, xfrm.h);
                  }
                }
              }

              // Text Body
              const txBody = spNode.getElementsByTagName("p:txBody")[0];
              if (txBody) {
                const paragraphs = Array.from(
                  txBody.getElementsByTagName("a:p")
                );
                let currentY = xfrm.y + 24;

                for (const p of paragraphs) {
                  const pPr = p.getElementsByTagName("a:pPr")[0];
                  const align = pPr?.getAttribute("algn") || "l";

                  // Extract text runs with formatting
                  const runs = Array.from(p.getElementsByTagName("a:r"));
                  const runTexts: {
                    text: string;
                    fontSize: number;
                    bold: boolean;
                    color: string;
                  }[] = [];

                  for (const r of runs) {
                    const t =
                      r.getElementsByTagName("a:t")[0]?.textContent || "";
                    if (!t) continue;

                    const rPr = r.getElementsByTagName("a:rPr")[0];
                    const sz = parseInt(rPr?.getAttribute("sz") || "1800", 10);
                    // Convert hundredths of pt to canvas px relative to Full HD
                    const fontSize = Math.max(
                      14,
                      Math.round((sz / 100) * (canvasHeight / 540) * 0.95)
                    );
                    const bold = rPr?.getAttribute("b") === "1";

                    let color = "#1e293b";
                    const srgb = rPr?.getElementsByTagName("a:srgbClr")[0];
                    if (srgb && srgb.getAttribute("val")) {
                      color = "#" + srgb.getAttribute("val");
                    }

                    runTexts.push({ text: t, fontSize, bold, color });
                  }

                  // Handle plain paragraphs without <a:r> tags
                  if (runTexts.length === 0) {
                    const allText = Array.from(
                      p.getElementsByTagName("a:t")
                    )
                      .map((t) => t.textContent || "")
                      .join("");
                    if (allText.trim()) {
                      runTexts.push({
                        text: allText,
                        fontSize: 22,
                        bold: false,
                        color: "#1e293b",
                      });
                    }
                  }

                  if (runTexts.length === 0) {
                    currentY += 16;
                    continue;
                  }

                  // Render text lines
                  const fullText = runTexts.map((r) => r.text).join("");
                  const primaryRun = runTexts[0];
                  const fontStr = `${primaryRun.bold ? "bold " : ""}${
                    primaryRun.fontSize
                  }px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

                  const wrapped = wrapText(fullText, xfrm.w - 16, fontStr);
                  const lineHeight = Math.round(primaryRun.fontSize * 1.35);

                  for (const line of wrapped) {
                    ctx.font = fontStr;
                    ctx.fillStyle = primaryRun.color;

                    let startX = xfrm.x + 8;
                    if (align === "ctr") {
                      const textWidth = ctx.measureText(line).width;
                      startX = xfrm.x + (xfrm.w - textWidth) / 2;
                    } else if (align === "r") {
                      const textWidth = ctx.measureText(line).width;
                      startX = xfrm.x + xfrm.w - textWidth - 8;
                    }

                    ctx.fillText(line, startX, currentY);
                    currentY += lineHeight;
                  }

                  currentY += 8; // Paragraph spacing
                }
              }
            }

            // C. TABLES & GRAPHICS (<p:graphicFrame>)
            else if (tagName === "p:graphicFrame") {
              const xfrm = getTransform(child);
              const tbl = child.getElementsByTagName("a:tbl")[0];

              if (xfrm && tbl) {
                const rows = Array.from(tbl.getElementsByTagName("a:tr"));
                if (rows.length > 0) {
                  const rowHeight = xfrm.h / rows.length;

                  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
                    const cells = Array.from(
                      rows[rIdx].getElementsByTagName("a:tc")
                    );
                    const colWidth = xfrm.w / (cells.length || 1);

                    for (let cIdx = 0; cIdx < cells.length; cIdx++) {
                      const cellX = xfrm.x + cIdx * colWidth;
                      const cellY = xfrm.y + rIdx * rowHeight;

                      // Cell background
                      ctx.fillStyle =
                        rIdx === 0 ? "rgba(217, 119, 6, 0.15)" : "#f8fafc";
                      ctx.fillRect(cellX, cellY, colWidth, rowHeight);

                      // Cell border
                      ctx.strokeStyle = "#cbd5e1";
                      ctx.lineWidth = 1;
                      ctx.strokeRect(cellX, cellY, colWidth, rowHeight);

                      // Cell text
                      const text = Array.from(
                        cells[cIdx].getElementsByTagName("a:t")
                      )
                        .map((t) => t.textContent || "")
                        .join(" ")
                        .trim();

                      if (text) {
                        ctx.fillStyle = "#1e293b";
                        ctx.font = `${rIdx === 0 ? "bold " : ""}14px sans-serif`;
                        ctx.fillText(
                          text.length > 30
                            ? text.slice(0, 27) + "..."
                            : text,
                          cellX + 6,
                          cellY + rowHeight / 2 + 5
                        );
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Save slide thumbnail for visual gallery preview
        const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        generatedThumbnails.push({
          slideNumber: i + 1,
          dataUrl: thumbnailDataUrl,
        });

        // Convert high-res canvas to image and embed into PDF
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const base64Data = dataUrl.split(",")[1];
        const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
          c.charCodeAt(0)
        );

        const embeddedImage = await pdfDoc.embedJpg(imageBytes);
        const pdfPage = pdfDoc.addPage([canvasWidth, canvasHeight]);
        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
        });
      }

      setSlideThumbnails(generatedThumbnails);
      setConversionStatus("Finalizing PDF document...");

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(pdfBlob);
      blobUrlRef.current = url;
      setPdfBlobUrl(url);
      setPdfFileSize(pdfBlob.size);
      setConversionStatus("");
    } catch (err: unknown) {
      console.error("PPT to PDF conversion failed:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to convert PPT to PDF. Please try again."
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
            Convert PowerPoint presentations (.pptx) directly into
            high-resolution, universal PDF documents with slide formatting,
            graphics, and typography accurately preserved.
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
                  backgroundColor: isDragging
                    ? "var(--amber-tint)"
                    : "var(--surface)",
                  borderColor: isDragging
                    ? "var(--amber-primary)"
                    : "var(--border-warm)",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0])
                    handleFile(e.dataTransfer.files[0]);
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
                  Choose a presentation or drag it here
                </h3>
                <p
                  className="font-body text-sm mt-1 mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Supports standard PPTX slides · High-fidelity local browser
                  rendering
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
                <div
                  className="flex items-center justify-between pb-4 border-b"
                  style={{ borderColor: "var(--border-warm)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "var(--amber-tint)",
                        color: "var(--amber-primary)",
                      }}
                    >
                      <Presentation size={20} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-headline font-semibold text-sm truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {file.name}
                      </p>
                      <p
                        className="font-body text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
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
                    <p
                      className="font-body text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Click below to convert all presentation slides with proper
                      typography, bounding boxes, and images into a single PDF.
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
                          <span>
                            {conversionStatus ||
                              "Converting Presentation to PDF..."}
                          </span>
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
                    {/* Success notification banner */}
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-600">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={20} className="shrink-0" />
                        <div>
                          <p className="text-sm font-semibold">
                            Conversion Complete!
                          </p>
                          <p className="text-xs opacity-90">
                            {slideCount} slides converted to PDF (
                            {pdfFileSize ? formatFileSize(pdfFileSize) : ""}).
                          </p>
                        </div>
                      </div>

                      <a
                        href={pdfBlobUrl}
                        download={file.name.replace(/\.pptx?$/i, ".pdf")}
                        className="px-5 py-2.5 rounded-lg font-body font-semibold text-xs text-white inline-flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-sm"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Download size={16} />
                        <span>Download PDF</span>
                      </a>
                    </div>

                    {/* Interactive Preview Controls */}
                    <div
                      className="border rounded-xl p-4 flex flex-col gap-4"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                      }}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-warm">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab("pdf")}
                            className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${
                              activeTab === "pdf" ? "shadow-sm" : "opacity-70"
                            }`}
                            style={{
                              backgroundColor:
                                activeTab === "pdf"
                                  ? "var(--amber-primary)"
                                  : "transparent",
                              color:
                                activeTab === "pdf"
                                  ? "#ffffff"
                                  : "var(--text-primary)",
                            }}
                          >
                            PDF Document View
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("slides")}
                            className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${
                              activeTab === "slides"
                                ? "shadow-sm"
                                : "opacity-70"
                            }`}
                            style={{
                              backgroundColor:
                                activeTab === "slides"
                                  ? "var(--amber-primary)"
                                  : "transparent",
                              color:
                                activeTab === "slides"
                                  ? "#ffffff"
                                  : "var(--text-primary)",
                            }}
                          >
                            Slide Gallery ({slideThumbnails.length})
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="px-3 py-1.5 rounded-lg border font-body text-xs font-medium flex items-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{
                            borderColor: "var(--border-warm)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                          <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
                        </button>
                      </div>

                      {showPreview && activeTab === "pdf" && (
                        <div
                          className="rounded-lg overflow-hidden border"
                          style={{
                            borderColor: "var(--border-warm)",
                            height: "560px",
                          }}
                        >
                          <iframe
                            src={pdfBlobUrl}
                            title="Converted PDF Preview"
                            className="w-full h-full border-0"
                          />
                        </div>
                      )}

                      {showPreview && activeTab === "slides" && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto p-1">
                          {slideThumbnails.map((slide) => (
                            <div
                              key={slide.slideNumber}
                              className="rounded-lg border p-2 flex flex-col gap-1.5 transition-all hover:scale-[1.02]"
                              style={{
                                backgroundColor: "var(--surface)",
                                borderColor: "var(--border-warm)",
                              }}
                            >
                              <div className="relative aspect-video rounded overflow-hidden bg-white border border-slate-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={slide.dataUrl}
                                  alt={`Slide ${slide.slideNumber}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span
                                className="font-body text-[11px] font-medium text-center"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Slide {slide.slideNumber}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                style={{
                  backgroundColor: "var(--amber-tint)",
                  color: "var(--amber-primary)",
                }}
              >
                <Shield size={16} />
              </div>
              <p
                className="font-body text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                <strong className="font-semibold text-primary">
                  100% In-Browser Privacy:
                </strong>{" "}
                PowerPoint slide extraction and PDF synthesis execute directly in
                your browser&apos;s memory. No files are ever uploaded or stored
                remotely.
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
                className="font-headline font-semibold text-base mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                How to convert PPT to PDF
              </h3>
              <ol
                className="font-body text-xs flex flex-col gap-3 list-decimal list-inside leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                <li>
                  <strong className="text-primary">Upload Presentation:</strong>{" "}
                  Select your .pptx file.
                </li>
                <li>
                  <strong className="text-primary">
                    Browser-Native Synthesis:
                  </strong>{" "}
                  Each slide is rendered with typography, images, and tables.
                </li>
                <li>
                  <strong className="text-primary">Interactive Preview:</strong>{" "}
                  Review the slide gallery or PDF document view.
                </li>
                <li>
                  <strong className="text-primary">Download:</strong> Save your
                  crystal-clear converted PDF instantly.
                </li>
              </ol>
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
                className="font-headline font-semibold text-base mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Related Document Tools
              </h3>
              <div className="flex flex-col gap-2">
                <Link
                  href="/tools/pdf/to-ppt"
                  className="flex items-center justify-between p-2.5 rounded-lg border font-body text-xs transition-colors hover:bg-surface-tinted"
                  style={{
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="font-medium">PDF to PowerPoint (.pptx)</span>
                  <ChevronRight
                    size={14}
                    style={{ color: "var(--text-secondary)" }}
                  />
                </Link>
                <Link
                  href="/tools/pdf/word-to-pdf"
                  className="flex items-center justify-between p-2.5 rounded-lg border font-body text-xs transition-colors hover:bg-surface-tinted"
                  style={{
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="font-medium">Word to PDF (.docx)</span>
                  <ChevronRight
                    size={14}
                    style={{ color: "var(--text-secondary)" }}
                  />
                </Link>
                <Link
                  href="/tools/pdf/to-word"
                  className="flex items-center justify-between p-2.5 rounded-lg border font-body text-xs transition-colors hover:bg-surface-tinted"
                  style={{
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="font-medium">PDF to Word (.docx)</span>
                  <ChevronRight
                    size={14}
                    style={{ color: "var(--text-secondary)" }}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
