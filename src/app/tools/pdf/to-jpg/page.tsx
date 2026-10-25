"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileImage,
  Upload,
  Download,
  Shield,
  ChevronRight,
  FileText,
  Loader2,
  CheckCircle2,
  FilePlus2,
  Scissors,
  RotateCw,
  ImageDown,
  Minimize2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

interface PageImage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}



export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [imageFormat, setImageFormat] = useState<"jpeg" | "png">("jpeg");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = (selected: File) => {
    setErrorMessage(null);
    setPages([]);

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file (.pdf).");
      return;
    }

    setFile(selected);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const pdfLib = await ensurePdfEngine();
      if (!pdfLib) {
        throw new Error("PDF renderer library could not be loaded. Please refresh the page and try again.");
      }

      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const loadingTask = pdfLib.getDocument({ data: uint8 });
      const pdf = await loadingTask.promise;

      const renderedPages: PageImage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for crisp images

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) continue;

        // Fill white background for JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        const mime = imageFormat === "png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mime, 0.92);

        renderedPages.push({
          pageNumber: i,
          dataUrl,
          width: Math.round(viewport.width),
          height: Math.round(viewport.height),
        });
      }

      setPages(renderedPages);
    } catch (err: unknown) {
      console.error("PDF to image render error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to render PDF pages into images."
      );
    } finally {
      setIsProcessing(false);
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
            { label: "PDF to JPG" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <FileImage size={16} />
            <span>PDF Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            PDF to JPG & PNG Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Render and export every page of your PDF document as high-resolution JPG or PNG images.
            Entirely processed in your browser.
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
                  Choose a PDF file to extract images
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Converts locally in-memory into crisp high-definition image files.
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
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPages([]);
                    }}
                    className="font-body text-xs text-red-500 hover:underline"
                  >
                    Change File
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <label className="font-body text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Output Image Format:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImageFormat("jpeg")}
                      className={`px-4 py-2 rounded-lg border font-body text-xs font-semibold ${
                        imageFormat === "jpeg" ? "ring-2 ring-amber-500" : ""
                      }`}
                      style={{
                        backgroundColor: imageFormat === "jpeg" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      JPG (Smaller Size)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFormat("png")}
                      className={`px-4 py-2 rounded-lg border font-body text-xs font-semibold ${
                        imageFormat === "png" ? "ring-2 ring-amber-500" : ""
                      }`}
                      style={{
                        backgroundColor: imageFormat === "png" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      PNG (Lossless Quality)
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-lg font-headline font-semibold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--amber-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Rendering Pages to Images...
                    </>
                  ) : (
                    <>
                      <FileImage size={18} />
                      Extract Pages as Images
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

            {pages.length > 0 && (
              <div
                className="p-6 rounded-xl border flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                      Rendered {pages.length} Pages
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pages.map((p) => (
                    <div
                      key={p.pageNumber}
                      className="border rounded-xl p-3 flex flex-col gap-3"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                      }}
                    >
                      <div className="aspect-[3/4] bg-white rounded border overflow-hidden flex items-center justify-center" style={{ borderColor: "var(--border-warm)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.dataUrl}
                          alt={`Page ${p.pageNumber}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          Page {p.pageNumber} ({p.width}×{p.height}px)
                        </span>
                        <a
                          href={p.dataUrl}
                          download={`page-${p.pageNumber}.${imageFormat === "png" ? "png" : "jpg"}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                          style={{
                            backgroundColor: "var(--amber-primary)",
                            color: "#FFFFFF",
                          }}
                        >
                          <Download size={13} />
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
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
                Every page is drawn to an HTML5 canvas directly on your CPU/GPU. No images or documents are transmitted externally.
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
                  { name: "Compress PDF", href: "/tools/pdf/compress", icon: Minimize2 },
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
