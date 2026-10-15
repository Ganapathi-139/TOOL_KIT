"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  ShieldCheck,
  FileText,
  FileArchive,
  FileImage,
  FileCode,
  File as FileIcon,
  Copy,
  Check,
  ArrowLeft,
  AlertTriangle,
  QrCode,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

function formatFileSize(bytes: number) {
  if (!bytes || bytes <= 0) return "Unknown size";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getFileCategoryIcon(filename: string, mimeType: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (mimeType.includes("pdf") || ext === "pdf") {
    return <FileText size={40} className="text-red-500" />;
  }
  if (mimeType.includes("image") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
    return <FileImage size={40} className="text-blue-500" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive size={40} className="text-amber-500" />;
  }
  if (["js", "ts", "json", "html", "css", "py", "java", "c", "cpp"].includes(ext)) {
    return <FileCode size={40} className="text-emerald-500" />;
  }
  return <FileIcon size={40} className="text-amber-500" />;
}

function parseShareToken(token: string) {
  try {
    const dataPart = token.split(".")[0];
    if (!dataPart) return null;
    let base64 = dataPart.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonStr) as {
      name: string;
      size: number;
      type: string;
      time: number;
      isExternal?: boolean;
    };
  } catch {
    return null;
  }
}

function DownloadContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileMeta = useMemo(() => {
    if (!token) return null;
    return parseShareToken(token);
  }, [token]);

  const handleDownload = () => {
    if (!token) return;
    setIsDownloading(true);

    const downloadUrl = `/api/file-share/download?token=${encodeURIComponent(token)}`;
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    if (fileMeta?.name) {
      anchor.download = fileMeta.name;
    }
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!token || !fileMeta) {
    return (
      <div className="max-w-[600px] mx-auto py-16 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "#dc2626",
          }}
        >
          <AlertTriangle size={32} />
        </div>
        <h2
          className="font-headline font-bold text-2xl tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Invalid or Expired Download Link
        </h2>
        <p
          className="font-body text-sm mt-2 mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          This file download link is either incomplete or has expired. Please ask the sender to generate a fresh QR code from ToolKit.
        </p>
        <Link
          href="/tools/qr/file-share"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-body font-semibold text-sm text-white transition-transform hover:scale-105"
          style={{ backgroundColor: "var(--amber-primary)" }}
        >
          <ArrowLeft size={16} /> Go to File Share QR
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto py-6">
      {/* File Card */}
      <div
        className="rounded-3xl border p-8 shadow-sm flex flex-col items-center text-center transition-all"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border-warm)",
        }}
      >
        {/* Security badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6">
          <ShieldCheck size={16} />
          <span>Verified Safe & Clean Download</span>
        </div>

        {/* File icon */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5 shadow-sm"
          style={{
            backgroundColor: "var(--bg-main)",
            border: "1px solid var(--border-warm)",
          }}
        >
          {getFileCategoryIcon(fileMeta.name, fileMeta.type)}
        </div>

        {/* File name & size */}
        <h2
          className="font-headline font-bold text-2xl sm:text-3xl tracking-tight break-all max-w-full"
          style={{ color: "var(--text-primary)" }}
        >
          {fileMeta.name}
        </h2>
        <p
          className="font-body text-sm mt-1.5 font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {formatFileSize(fileMeta.size)} · Safe Direct Transfer
        </p>

        {/* Action button */}
        <div className="w-full flex flex-col gap-3 mt-8">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-4 px-6 rounded-2xl font-headline font-semibold text-base sm:text-lg text-white shadow-md flex items-center justify-center gap-2 transition-all hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
            style={{ backgroundColor: "var(--amber-primary)" }}
          >
            {isDownloading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Starting Download...</span>
              </>
            ) : (
              <>
                <Download size={20} />
                <span>Download File</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-xl border font-body text-xs font-medium flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              borderColor: "var(--border-warm)",
              color: "var(--text-secondary)",
            }}
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span>Page Link Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Page Link to Share</span>
              </>
            )}
          </button>
        </div>

        {/* Trust info note */}
        <div
          className="w-full rounded-2xl p-4 mt-8 text-left border flex items-start gap-3"
          style={{
            backgroundColor: "var(--bg-main)",
            borderColor: "var(--border-warm)",
          }}
        >
          <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
          <div className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <strong className="font-semibold block" style={{ color: "var(--text-primary)" }}>
              No Ads, No Popups, No Risk
            </strong>
            This file was shared using ToolKit. Files are served over encrypted HTTPS without third-party advertisements or tracking scripts.
          </div>
        </div>
      </div>

      {/* Cross link to create QR */}
      <div className="mt-8 text-center">
        <Link
          href="/tools/qr/file-share"
          className="inline-flex items-center gap-2 text-xs font-body font-semibold transition-colors hover:underline"
          style={{ color: "var(--amber-primary)" }}
        >
          <QrCode size={16} />
          <span>Want to share a file? Create your own free QR code on ToolKit →</span>
        </Link>
      </div>
    </div>
  );
}

export default function FileDownloadPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "QR Tools", href: "/tools/qr" },
            { label: "File Share QR", href: "/tools/qr/file-share" },
            { label: "Download File" },
          ]}
        />
        <Suspense
          fallback={
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-amber-500" />
              <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
                Loading file details...
              </p>
            </div>
          }
        >
          <DownloadContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
