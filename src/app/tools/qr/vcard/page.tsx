"use client";

import { useState, useEffect } from "react";
import {
  Contact,
  Download,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import QRCodeLib from "qrcode";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function VCardQrPage() {
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [org, setOrg] = useState("Acme Corp");
  const [title, setTitle] = useState("Product Manager");
  const [phone, setPhone] = useState("+1 555 123 4567");
  const [email, setEmail] = useState("john.doe@example.com");
  const [url, setUrl] = useState("https://example.com");
  const [address, setAddress] = useState("San Francisco, CA");

  const [fgColor, setFgColor] = useState("#1A1714");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const getVCardPayload = (): string => {
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${lastName};${firstName};;;`,
      `FN:${firstName} ${lastName}`.trim(),
      org ? `ORG:${org}` : "",
      title ? `TITLE:${title}` : "",
      phone ? `TEL;TYPE=CELL:${phone}` : "",
      email ? `EMAIL:${email}` : "",
      url ? `URL:${url}` : "",
      address ? `ADR:;;${address};;;;` : "",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const payload = getVCardPayload();

  useEffect(() => {
    QRCodeLib.toDataURL(payload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((dataUri) => setQrDataUrl(dataUri))
      .catch((err) => console.error(err));
  }, [payload, fgColor, bgColor]);

  const handleDownload = (format: "png" | "svg") => {
    const filename = `vcard-${firstName}-${lastName}-qr`.toLowerCase().replace(/\s+/g, "-");
    if (format === "png") {
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `${filename}.png`;
      a.click();
    } else {
      QRCodeLib.toString(payload, {
        type: "svg",
        color: { dark: fgColor, light: bgColor },
      }).then((svgString) => {
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `${filename}.svg`;
        a.click();
        URL.revokeObjectURL(objectUrl);
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
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
            { label: "QR Code Tools", href: "/tools/qr" },
            { label: "vCard QR Code" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Contact size={16} />
            <span>QR Code Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            vCard Contact QR Code Generator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Create a scannable business card QR code. Scanning immediately allows users to save your contact card directly to their iOS or Android address book.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Website URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Location / Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4" style={{ borderColor: "var(--border-warm)" }}>
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    QR Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer p-0.5"
                    />
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {fgColor}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer p-0.5"
                    />
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {bgColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col items-center text-center gap-5"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                vCard QR Preview
              </h3>

              {qrDataUrl && (
                <div className="p-4 rounded-xl border bg-white shadow-sm" style={{ borderColor: "var(--border-warm)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="vCard QR Code" className="w-56 h-56" />
                </div>
              )}

              <div className="w-full flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload("png")}
                    className="py-2.5 rounded-lg font-body text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-white"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    <Download size={14} />
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("svg")}
                    className="py-2.5 rounded-lg border font-body text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Download size={14} />
                    Download SVG
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-2 rounded-lg font-body text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  <span>{copied ? "Copied vCard Text!" : "Copy vCard Raw Text"}</span>
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
                Your private contact details are processed in local memory and encoded straight to the QR matrix on your device.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
