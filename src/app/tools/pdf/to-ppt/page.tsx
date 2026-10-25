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

interface SlidePreview {
  slideNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export default function PdfToPptPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [pptxBlobUrl, setPptxBlobUrl] = useState<string | null>(null);
  const [pptxFileSize, setPptxFileSize] = useState<number | null>(null);
  const [slidePreviews, setSlidePreviews] = useState<SlidePreview[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [selectedSlide, setSelectedSlide] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.pdfjsLib) {
      const script = document.createElement("script");
      script.src = "/js/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js";
        }
      };
      script.onerror = () => {
        const cdn = document.createElement("script");
        cdn.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        cdn.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
        };
        document.body.appendChild(cdn);
      };
      document.body.appendChild(script);
    }
  }, []);

  const ensurePdfEngine = (): Promise<any> => {
    if (typeof window === "undefined") return Promise.resolve(null);
    if ((window as any).pdfjsLib) {
      const lib = (window as any).pdfjsLib;
      if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js";
      }
      return Promise.resolve(lib);
    }
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "/js/pdf.min.js";
      s.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (lib?.GlobalWorkerOptions) {
          lib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js";
        }
        resolve(lib);
      };
      s.onerror = () => {
        const c = document.createElement("script");
        c.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        c.onload = () => {
          const lib = (window as any).pdfjsLib;
          if (lib?.GlobalWorkerOptions) {
            lib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
          resolve(lib);
        };
        c.onerror = () => resolve(null);
        document.body.appendChild(c);
      };
      document.body.appendChild(s);
    });
  };

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
    setSlidePreviews([]);
    setSelectedSlide(null);
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
    setSlidePreviews([]);
    setConversionStatus("Initializing PDF rendering engine...");

    try {
      const pdfjs = await ensurePdfEngine();
      if (!pdfjs) {
        throw new Error(
          "PDF rendering engine could not be loaded. Please refresh the page and try again."
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({
        data: new Uint8Array(arrayBuffer),
      }).promise;
      const numPages = pdf.numPages;

      if (numPages === 0) {
        throw new Error("The selected PDF document contains no pages.");
      }

      // Detect natural aspect ratio of the first page
      const firstPage = await pdf.getPage(1);
      const firstViewport = firstPage.getViewport({ scale: 1.0 });
      const aspect = firstViewport.width / firstViewport.height;

      // Compute natural slide dimensions in EMUs (1 pt = 12700 EMUs)
      let emuWidth: number;
      let emuHeight: number;

      if (aspect >= 1.5) {
        // ~16:9 Widescreen
        emuWidth = 12192000;
        emuHeight = Math.round(12192000 / aspect);
      } else if (aspect >= 1.1) {
        // ~4:3 Standard Slide
        emuWidth = 9144000;
        emuHeight = Math.round(9144000 / aspect);
      } else {
        // Portrait (A4 / Letter document format)
        emuWidth = 6858000;
        emuHeight = Math.round(6858000 / aspect);
      }

      const zip = new JSZip();

      // Root [Content_Types].xml & _rels
      zip.folder("_rels")?.file(
        ".rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>\n</Relationships>`
      );

      const pptFolder = zip.folder("ppt");
      const pptRelsFolder = pptFolder?.folder("_rels");
      const slidesFolder = pptFolder?.folder("slides");
      const mediaFolder = pptFolder?.folder("media");
      const mastersFolder = pptFolder?.folder("slideMasters");
      const layoutsFolder = pptFolder?.folder("slideLayouts");

      // Slide Master & Layout for 100% PowerPoint compatibility
      mastersFolder?.file(
        "slideMaster1.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">\n  <p:cSld>\n    <p:spTree>\n      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>\n      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>\n    </p:spTree>\n  </p:cSld>\n  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>\n  <p:sldLayoutIdLst>\n    <p:sldLayoutId id="2147483649" r:id="rId1"/>\n  </p:sldLayoutIdLst>\n</p:sldMaster>`
      );
      mastersFolder?.folder("_rels")?.file(
        "slideMaster1.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>\n</Relationships>`
      );

      layoutsFolder?.file(
        "slideLayout1.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">\n  <p:cSld>\n    <p:spTree>\n      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>\n      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>\n    </p:spTree>\n  </p:cSld>\n  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>\n</p:sldLayout>`
      );
      layoutsFolder?.folder("_rels")?.file(
        "slideLayout1.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>\n</Relationships>`
      );

      let contentTypesOverrides = `  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>\n  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>\n`;
      let presentationRels = `  <Relationship Id="rIdMaster1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>\n`;
      let sldIdLst = "";

      const previews: SlidePreview[] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setConversionStatus(`Rendering slide ${pageNum} of ${numPages}...`);
        const page = await pdf.getPage(pageNum);
        // Render at crisp 2.5x scale
        const viewport = page.getViewport({ scale: 2.5 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        mediaFolder?.file(`image${pageNum}.png`, base64Data, { base64: true });

        previews.push({
          slideNumber: pageNum,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
        });

        const rId = `rId${pageNum + 1}`;
        const sldId = 255 + pageNum;

        contentTypesOverrides += `  <Override PartName="/ppt/slides/slide${pageNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`;
        presentationRels += `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${pageNum}.xml"/>\n`;
        sldIdLst += `    <p:sldId id="${sldId}" r:id="${rId}"/>\n`;

        const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">\n  <p:cSld>\n    <p:spTree>\n      <p:nvGrpSpPr>\n        <p:cNvPr id="1" name=""/>\n        <p:cNvGrpSpPr/>\n        <p:nvPr/>\n      </p:nvGrpSpPr>\n      <p:grpSpPr>\n        <a:xfrm>\n          <a:off x="0" y="0"/>\n          <a:ext cx="0" cy="0"/>\n          <a:chOff x="0" y="0"/>\n          <a:chExt cx="0" cy="0"/>\n        </a:xfrm>\n      </p:grpSpPr>\n      <p:pic>\n        <p:nvPicPr>\n          <p:cNvPr id="2" name="Slide ${pageNum}"/>\n          <p:cNvPicPr>\n            <a:picLocks noChangeAspect="1"/>\n          </p:cNvPicPr>\n          <p:nvPr/>\n        </p:nvPicPr>\n        <p:blipFill>\n          <a:blip r:embed="rId1"/>\n          <a:stretch>\n            <a:fillRect/>\n          </a:stretch>\n        </p:blipFill>\n        <p:spPr>\n          <a:xfrm>\n            <a:off x="0" y="0"/>\n            <a:ext cx="${emuWidth}" cy="${emuHeight}"/>\n          </a:xfrm>\n          <a:prstGeom prst="rect">\n            <a:avLst/>\n          </a:prstGeom>\n        </p:spPr>\n      </p:pic>\n    </p:spTree>\n  </p:cSld>\n</p:sld>`;

        slidesFolder?.file(`slide${pageNum}.xml`, slideXml);

        const slideRelsFolder = slidesFolder?.folder("_rels");
        slideRelsFolder?.file(
          `slide${pageNum}.xml.rels`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${pageNum}.png"/>\n  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>\n</Relationships>`
        );
      }

      setSlidePreviews(previews);
      setConversionStatus("Packaging presentation (.pptx)...");

      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Default Extension="png" ContentType="image/png"/>\n  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>\n${contentTypesOverrides}</Types>`
      );

      pptFolder?.file(
        "presentation.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">\n  <p:sldMasterIdLst>\n    <p:sldMasterId id="2147483648" r:id="rIdMaster1"/>\n  </p:sldMasterIdLst>\n  <p:sldIdLst>\n${sldIdLst}  </p:sldIdLst>\n  <p:sldSz cx="${emuWidth}" cy="${emuHeight}"/>\n  <p:notesSz cx="6858000" cy="9144000"/>\n</p:presentation>`
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
        err instanceof Error
          ? err.message
          : "Failed to convert PDF to PPT. Please try again."
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
            Convert each page of your PDF document into presentation slides in
            PowerPoint (.pptx) format with pristine visual reproduction and
            natural aspect ratios.
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
                  accept="application/pdf,.pdf"
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
                  Choose a PDF document or drag it here
                </h3>
                <p
                  className="font-body text-sm mt-1 mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Each page converted into an editable PowerPoint slide
                </p>
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 mx-auto transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Browse PDF File
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

                {!pptxBlobUrl ? (
                  <div className="flex flex-col gap-4">
                    <p
                      className="font-body text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Convert each PDF page into a high-resolution presentation
                      slide in Microsoft PowerPoint (.pptx) format.
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
                            {conversionStatus || "Converting PDF to PowerPoint..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <FileDown size={18} />
                          <span>Convert to PowerPoint</span>
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
                            Presentation Created!
                          </p>
                          <p className="text-xs opacity-90">
                            {slidePreviews.length} slides packaged into .pptx (
                            {pptxFileSize ? formatFileSize(pptxFileSize) : ""}).
                          </p>
                        </div>
                      </div>

                      <a
                        href={pptxBlobUrl}
                        download={file.name.replace(/\.pdf$/i, ".pptx")}
                        className="px-5 py-2.5 rounded-lg font-body font-semibold text-xs text-white inline-flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-sm"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Download size={16} />
                        <span>Download .pptx</span>
                      </a>
                    </div>

                    {/* Interactive Slide Gallery Preview */}
                    <div
                      className="border rounded-xl p-4 flex flex-col gap-4"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                      }}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-warm">
                        <span
                          className="font-headline font-semibold text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Generated Slides Preview ({slidePreviews.length}{" "}
                          slides)
                        </span>

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

                      {showPreview && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[560px] overflow-y-auto p-1">
                          {slidePreviews.map((slide) => (
                            <div
                              key={slide.slideNumber}
                              onClick={() => setSelectedSlide(slide.slideNumber)}
                              className="rounded-lg border p-2 flex flex-col gap-1.5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md"
                              style={{
                                backgroundColor: "var(--surface)",
                                borderColor:
                                  selectedSlide === slide.slideNumber
                                    ? "var(--amber-primary)"
                                    : "var(--border-warm)",
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

                      {/* Selected Slide Modal View */}
                      {selectedSlide && (
                        <div className="mt-3 p-3 rounded-lg border bg-white dark:bg-zinc-900 border-amber-500/30 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-primary">
                            <span>Expanded View: Slide {selectedSlide}</span>
                            <button
                              onClick={() => setSelectedSlide(null)}
                              className="text-red-500 hover:underline"
                            >
                              Close
                            </button>
                          </div>
                          <div className="max-h-[400px] overflow-hidden rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                slidePreviews.find(
                                  (s) => s.slideNumber === selectedSlide
                                )?.dataUrl
                              }
                              alt={`Slide ${selectedSlide}`}
                              className="max-h-[380px] max-w-full object-contain"
                            />
                          </div>
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
                PDF rendering and PowerPoint presentation generation occur
                entirely in local browser RAM. No pages or files are ever sent to
                any external server.
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
                How to convert PDF to PPT
              </h3>
              <ol
                className="font-body text-xs flex flex-col gap-3 list-decimal list-inside leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                <li>
                  <strong className="text-primary">Upload Document:</strong>{" "}
                  Choose any multi-page or single-page PDF.
                </li>
                <li>
                  <strong className="text-primary">
                    High-Res Vector Render:
                  </strong>{" "}
                  Each page is converted with natural aspect ratios.
                </li>
                <li>
                  <strong className="text-primary">Slide Preview:</strong>{" "}
                  Inspect generated presentation slides.
                </li>
                <li>
                  <strong className="text-primary">Download:</strong> Save your
                  ready-to-present .pptx presentation file.
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
                Related Presentation Tools
              </h3>
              <div className="flex flex-col gap-2">
                <Link
                  href="/tools/pdf/ppt-to-pdf"
                  className="flex items-center justify-between p-2.5 rounded-lg border font-body text-xs transition-colors hover:bg-surface-tinted"
                  style={{
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="font-medium">PowerPoint to PDF (.pptx)</span>
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
                <Link
                  href="/tools/pdf/to-jpg"
                  className="flex items-center justify-between p-2.5 rounded-lg border font-body text-xs transition-colors hover:bg-surface-tinted"
                  style={{
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="font-medium">PDF to JPG / Images</span>
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
