"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Barcode,
  Download,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function BarcodeGeneratorPage() {
  const [value, setValue] = useState("TOOLKIT-2026");
  const [barWidth, setBarWidth] = useState(2);
  const [barHeight, setBarHeight] = useState(80);
  const [showText, setShowText] = useState(true);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple Code 128 (Subset B) barcode generator in pure canvas
  const drawCode128 = useCallback((text: string, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Code 128 patterns (simplified subset for alphanumeric)
    const patterns: Record<string, string> = {
      " ": "11011001100", "!": "11001101100", "\"": "11001100110", "#": "10010011000",
      "$": "10010001100", "%": "10001001100", "&": "10011001000", "'": "10011000100",
      "(": "10001100100", ")": "11001001000", "*": "11001000100", "+": "11000100100",
      ",": "10110011100", "-": "10011011100", ".": "10011001110", "/": "10111001100",
      "0": "10011101100", "1": "10011100110", "2": "11001110010", "3": "11001011100",
      "4": "11001001110", "5": "11000101110", "6": "10110111000", "7": "10110001110",
      "8": "10001101110", "9": "10111011000", "A": "10111000110", "B": "10001110110",
      "C": "11101101000", "D": "11101100010", "E": "11100011010", "F": "11101011000",
      "G": "11101000110", "H": "11100010110", "I": "11101101110", "J": "10100011000",
      "K": "10001011000", "L": "10001000110", "M": "10110010000", "N": "10110000100",
      "O": "10001101000", "P": "10001100010", "Q": "11010000110", "R": "11000100110",
      "S": "11011000100", "T": "11011100010", "U": "11011101010", "V": "11011101110",
      "W": "11101010110", "X": "11101001010", "Y": "11100101010", "Z": "11101011010",
    };

    // Default fallback binary for unsupported characters
    const defaultPattern = "10101100110";
    const startPattern = "11010010000"; // Start B
    const stopPattern = "1100011101011"; // Stop

    let binaryString = startPattern;
    for (const char of text.toUpperCase()) {
      binaryString += patterns[char] || defaultPattern;
    }
    binaryString += stopPattern;

    const quietZone = 20;
    const totalWidth = binaryString.length * barWidth + quietZone * 2;
    const totalHeight = barHeight + (showText ? 30 : 10);

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1A1714";
    let x = quietZone;

    for (const bit of binaryString) {
      if (bit === "1") {
        ctx.fillRect(x, 10, barWidth, barHeight);
      }
      x += barWidth;
    }

    if (showText) {
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#1A1714";
      ctx.fillText(text, totalWidth / 2, barHeight + 24);
    }
  }, [barWidth, barHeight, showText]);

  useEffect(() => {
    if (canvasRef.current && value) {
      drawCode128(value, canvasRef.current);
    }
  }, [value, barWidth, barHeight, showText, drawCode128]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `barcode-${value || "code"}.png`;
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
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
            { label: "Everyday Utilities", href: "/tools/utilities" },
            { label: "Barcode Generator" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Barcode size={16} />
            <span>Everyday Utilities</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Code-128 Barcode Generator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Generate clean, high-contrast linear 1D barcodes for inventory, retail packaging,
            and shipping labels. Rendered directly on HTML5 Canvas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col gap-5"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div>
                <label className="block font-body text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Barcode Text / SKU / Serial
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter barcode string..."
                  className="w-full rounded-lg border px-3.5 py-2.5 font-mono text-sm"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    <span>Bar Thickness</span>
                    <span className="font-mono">{barWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={barWidth}
                    onChange={(e) => setBarWidth(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    <span>Bar Height</span>
                    <span className="font-mono">{barHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={barHeight}
                    onChange={(e) => setBarHeight(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showText"
                  checked={showText}
                  onChange={(e) => setShowText(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <label htmlFor="showText" className="font-body text-xs cursor-pointer" style={{ color: "var(--text-primary)" }}>
                  Include human-readable label under barcode
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col items-center gap-5 text-center"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                Live Barcode Preview
              </h3>

              <div
                className="p-4 rounded-xl border bg-white shadow-sm max-w-full overflow-x-auto flex items-center justify-center"
                style={{ borderColor: "var(--border-warm)" }}
              >
                <canvas ref={canvasRef} className="max-w-full" />
              </div>

              <div className="w-full flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2.5 rounded-lg border font-body text-xs font-medium flex items-center justify-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  <span>{copied ? "Copied Text" : "Copy Value"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-2.5 rounded-lg font-body text-xs font-semibold flex items-center justify-center gap-1.5 text-white transition-all"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  <Download size={14} />
                  Download PNG
                </button>
              </div>
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
                Barcodes are painted locally onto an HTML5 2D Canvas in your browser without contacting any external barcode generation endpoints.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
