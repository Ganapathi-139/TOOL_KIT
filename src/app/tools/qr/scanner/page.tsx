"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ScanLine,
  Upload,
  Camera,
  Copy,
  Check,
  ExternalLink,
  Shield,
  ChevronRight,
  AlertCircle,
  StopCircle,
  QrCode,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

export default function QrScannerPage() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const decodeImageElement = async (img: HTMLImageElement | HTMLVideoElement): Promise<string | null> => {
    if (typeof window !== "undefined" && window.BarcodeDetector) {
      try {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          return barcodes[0].rawValue;
        }
      } catch (e) {
        console.warn("BarcodeDetector error:", e);
      }
    }
    return null;
  };

  const handleFileUpload = async (file: File) => {
    stopCamera();
    setErrorMessage(null);
    setScannedResult(null);

    const url = URL.createObjectURL(file);
    setPreviewImage(url);

    const img = new Image();
    img.src = url;
    img.onload = async () => {
      const result = await decodeImageElement(img);
      if (result) {
        setScannedResult(result);
      } else {
        setErrorMessage(
          "No QR code detected in this image, or your browser does not support the native BarcodeDetector API. Try a clearer or higher-contrast photo."
        );
      }
    };
    img.onerror = () => {
      setErrorMessage("Could not load image file.");
    };
  };

  const startCamera = async () => {
    setErrorMessage(null);
    setScannedResult(null);
    setPreviewImage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);

      // Start continuous scanning
      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const result = await decodeImageElement(videoRef.current);
          if (result) {
            setScannedResult(result);
            stopCamera();
          }
        }
      }, 500);
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setErrorMessage("Could not access camera. Please check your camera permissions.");
      setIsCameraActive(false);
    }
  };

  const handleCopy = () => {
    if (!scannedResult) return;
    navigator.clipboard.writeText(scannedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUrl = scannedResult && (scannedResult.startsWith("http://") || scannedResult.startsWith("https://"));

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "QR Code Tools", href: "/tools/qr" },
            { label: "QR Code Scanner" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <ScanLine size={16} />
            <span>QR Code Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            QR Code Scanner
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Scan and decode QR codes instantly using your device camera or by uploading an image.
            Runs 100% locally on your machine with zero server communication.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col gap-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              {/* Camera or Upload Area */}
              {isCameraActive ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                  <div className="absolute inset-0 border-2 border-amber-500/60 pointer-events-none rounded-xl m-8" />
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="absolute bottom-4 px-4 py-2 rounded-lg bg-red-600 text-white font-body text-xs font-semibold flex items-center gap-1.5 shadow-lg"
                  >
                    <StopCircle size={16} />
                    Stop Camera
                  </button>
                </div>
              ) : previewImage ? (
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-64 h-64 border rounded-xl overflow-hidden p-2 flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewImage} alt="Uploaded QR" className="w-full h-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setScannedResult(null);
                      setErrorMessage(null);
                    }}
                    className="font-body text-xs text-red-500 hover:underline"
                  >
                    Scan Another Image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Upload Image Option */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-amber-500 transition-all flex flex-col items-center justify-center gap-3"
                    style={{
                      borderColor: "var(--border-warm)",
                      backgroundColor: "var(--surface-tinted)",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                    >
                      <Upload size={22} />
                    </div>
                    <h4 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                      Upload QR Image
                    </h4>
                    <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                      Select a PNG, JPG, or screenshot from your device.
                    </p>
                  </div>

                  {/* Use Camera Option */}
                  <div
                    onClick={startCamera}
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-amber-500 transition-all flex flex-col items-center justify-center gap-3"
                    style={{
                      borderColor: "var(--border-warm)",
                      backgroundColor: "var(--surface-tinted)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                    >
                      <Camera size={22} />
                    </div>
                    <h4 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                      Scan via Camera
                    </h4>
                    <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                      Use your device webcam or rear phone camera live.
                    </p>
                  </div>
                </div>
              )}

              {/* Scanned Result */}
              {scannedResult && (
                <div
                  className="p-5 rounded-xl border flex flex-col gap-3"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-semibold text-sm text-green-500 flex items-center gap-1.5">
                      <Check size={16} /> QR Decoded Successfully!
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-3 py-1.5 rounded-lg border font-body text-xs font-medium flex items-center gap-1 transition-all"
                        style={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                      {isUrl && (
                        <a
                          href={scannedResult}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg font-body text-xs font-semibold flex items-center gap-1 text-white"
                          style={{ backgroundColor: "var(--amber-primary)" }}
                        >
                          <ExternalLink size={13} />
                          Open Link
                        </a>
                      )}
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-lg border font-mono text-xs break-all leading-relaxed"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {scannedResult}
                  </div>
                </div>
              )}

              {errorMessage && (
                <div
                  className="p-4 rounded-xl border font-body text-xs flex items-center gap-2"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                  }}
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
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
                Camera streams and scanned images are processed directly on your local device CPU. Your camera video is never transmitted across the network.
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
                Related QR Code Tools
              </h3>
              <div className="flex flex-col gap-3 font-body text-sm">
                {[
                  { name: "QR Generator", href: "/tools/qr/generator", icon: QrCode },
                  { name: "Wi-Fi QR Code", href: "/tools/qr/wifi", icon: QrCode },
                  { name: "vCard QR Code", href: "/tools/qr/vcard", icon: QrCode },
                ].map((t) => (
                  <Link
                    key={t.name}
                    href={t.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span>{t.name}</span>
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
