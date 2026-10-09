"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Globe,
  Type,
  Wifi,
  Mail,
  Phone,
  Shield,
  ChevronRight,
  Contact,
  ScanLine,
} from "lucide-react";
import QRCodeLib from "qrcode";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

type QRType = "url" | "text" | "wifi" | "email" | "phone";

export default function QrGeneratorPage() {
  const [qrType, setQrType] = useState<QRType>("url");
  const [urlValue, setUrlValue] = useState("https://example.com");
  const [textValue, setTextValue] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiAuth, setWifiAuth] = useState("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Styling options
  const [fgColor, setFgColor] = useState("#1A1714");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [qrSize, setQrSize] = useState(256);

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Compute the formatted string payload
  const getPayload = useCallback((): string => {
    switch (qrType) {
      case "url":
        return urlValue || "https://";
      case "text":
        return textValue || "Hello World";
      case "wifi":
        return `WIFI:S:${wifiSsid};T:${wifiAuth};P:${wifiPassword};H:${wifiHidden ? "true" : "false"};;`;
      case "email": {
        const params = new URLSearchParams();
        if (emailSubject) params.append("subject", emailSubject);
        if (emailBody) params.append("body", emailBody);
        const queryStr = params.toString() ? `?${params.toString()}` : "";
        return `mailto:${emailTo}${queryStr}`;
      }
      case "phone":
        return `tel:${phoneNumber}`;
      default:
        return "";
    }
  }, [qrType, urlValue, textValue, wifiSsid, wifiPassword, wifiAuth, wifiHidden, emailTo, emailSubject, emailBody, phoneNumber]);

  // Generate QR code whenever payload or options change
  useEffect(() => {
    const payload = getPayload();
    if (!payload) return;

    QRCodeLib.toDataURL(payload, {
      width: qrSize,
      margin: 2,
      errorCorrectionLevel: errorLevel,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("QR Code error:", err);
      });
  }, [getPayload, fgColor, bgColor, errorLevel, qrSize]);

  const handleDownload = (format: "png" | "svg") => {
    const payload = getPayload();
    if (format === "png") {
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `qrcode_${Date.now()}.png`;
      a.click();
    } else {
      QRCodeLib.toString(payload, {
        type: "svg",
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      }).then((svgString) => {
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qrcode_${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      if (!qrDataUrl) return;
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const tabs: { type: QRType; label: string; icon: typeof Globe }[] = [
    { type: "url", label: "Link / URL", icon: Globe },
    { type: "text", label: "Text", icon: Type },
    { type: "wifi", label: "Wi-Fi", icon: Wifi },
    { type: "email", label: "Email", icon: Mail },
    { type: "phone", label: "Phone", icon: Phone },
  ];

  const relatedTools = [
    { name: "Wi-Fi QR Code", href: "/tools/qr/wifi", icon: Wifi },
    { name: "vCard QR Code", href: "/tools/qr/vcard", icon: Contact },
    { name: "QR Code Scanner", href: "/tools/qr/scanner", icon: ScanLine },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "QR Code Tools", href: "/tools/qr" },
            { label: "QR Code Generator" },
          ]}
        />

        {/* Heading */}
        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <QrCode size={16} />
            <span>QR Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            QR Code Generator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Create customizable QR codes for links, text, Wi-Fi networks, and contact info. Free with zero tracking.
          </p>
        </div>

        {/* Main Grid: Inputs on Left, QR Preview on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Tool Inputs & Controls (Col 1-7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Type Selector Tabs */}
            <div
              className="flex items-center gap-1.5 p-1.5 rounded-xl border overflow-x-auto scrollbar-none"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              {tabs.map((tab) => {
                const IconComp = tab.icon;
                const isActive = qrType === tab.type;
                return (
                  <button
                    key={tab.type}
                    onClick={() => setQrType(tab.type)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all shrink-0 font-body"
                    style={{
                      backgroundColor: isActive ? "var(--amber-tint)" : "transparent",
                      color: isActive ? "var(--amber-primary)" : "var(--text-secondary)",
                      border: isActive ? "1px solid var(--amber-primary)" : "1px solid transparent",
                    }}
                  >
                    <IconComp size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Inputs based on selected type */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              {qrType === "url" && (
                <div>
                  <label
                    htmlFor="url-input"
                    className="block font-body text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Website URL
                  </label>
                  <input
                    id="url-input"
                    type="url"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <p className="font-body text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                    Include the complete link starting with https:// or http://
                  </p>
                </div>
              )}

              {qrType === "text" && (
                <div>
                  <label
                    htmlFor="text-input"
                    className="block font-body text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Plain Text Message
                  </label>
                  <textarea
                    id="text-input"
                    rows={4}
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder="Type or paste any text or note here..."
                    className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              )}

              {qrType === "wifi" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      htmlFor="wifi-ssid"
                      className="block font-body text-sm font-medium mb-1.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Network Name (SSID)
                    </label>
                    <input
                      id="wifi-ssid"
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="e.g. MyHomeWiFi"
                      className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="wifi-pass"
                        className="block font-body text-sm font-medium mb-1.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Password
                      </label>
                      <input
                        id="wifi-pass"
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="Network password"
                        className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                        style={{
                          backgroundColor: "var(--bg-warm)",
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="wifi-sec"
                        className="block font-body text-sm font-medium mb-1.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Security Type
                      </label>
                      <select
                        id="wifi-sec"
                        value={wifiAuth}
                        onChange={(e) => setWifiAuth(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                        style={{
                          backgroundColor: "var(--bg-warm)",
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (Open)</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                      className="rounded accent-[var(--amber-primary)]"
                    />
                    <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
                      Hidden Wi-Fi Network
                    </span>
                  </label>
                </div>
              )}

              {qrType === "email" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      htmlFor="email-to"
                      className="block font-body text-sm font-medium mb-1.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Email Recipient
                    </label>
                    <input
                      id="email-to"
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="hello@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email-subject"
                      className="block font-body text-sm font-medium mb-1.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Subject Line
                    </label>
                    <input
                      id="email-subject"
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Feedback / Inquiry"
                      className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email-body"
                      className="block font-body text-sm font-medium mb-1.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Email Body
                    </label>
                    <textarea
                      id="email-body"
                      rows={3}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Draft pre-filled message..."
                      className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>
              )}

              {qrType === "phone" && (
                <div>
                  <label
                    htmlFor="phone-input"
                    className="block font-body text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Appearance & Options */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-5"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                Customization Options
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fg-color"
                    className="block font-body text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Pattern Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="fg-color"
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-9 h-9 rounded cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border font-mono text-xs focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bg-color"
                    className="block font-body text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="bg-color"
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-9 h-9 rounded cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border font-mono text-xs focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label
                    htmlFor="error-level"
                    className="block font-body text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Error Correction Level
                  </label>
                  <select
                    id="error-level"
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as "L" | "M" | "Q" | "H")}
                    className="w-full px-3 py-2 rounded-lg border font-body text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="L">Low (7% recovery)</option>
                    <option value="M">Medium (15% recovery)</option>
                    <option value="Q">Quartile (25% recovery)</option>
                    <option value="H">High (30% recovery)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="qr-size-slider"
                    className="block font-body text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Export Resolution ({qrSize}px)
                  </label>
                  <input
                    id="qr-size-slider"
                    type="range"
                    min="128"
                    max="1024"
                    step="64"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full accent-[var(--amber-primary)] mt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* QR Preview & Download Panel (Col 8-12) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col items-center text-center"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
                Live QR Preview
              </h3>

              {/* QR Image Frame */}
              <div
                className="p-4 rounded-xl border flex items-center justify-center shadow-sm"
                style={{
                  backgroundColor: bgColor,
                  borderColor: "var(--border-warm)",
                  maxWidth: "280px",
                  maxHeight: "280px",
                }}
              >
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Generated QR code preview"
                    className="w-full h-auto aspect-square"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center font-body text-sm" style={{ color: "var(--text-muted)" }}>
                    Generating QR code...
                  </div>
                )}
              </div>

              {/* Download Buttons */}
              <div className="w-full flex flex-col gap-2.5 mt-6">
                <button
                  onClick={() => handleDownload("png")}
                  className="w-full py-2.5 px-4 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  <Download size={16} />
                  <span>Download PNG Image</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload("svg")}
                    className="flex-1 py-2 px-3 rounded-lg border font-body text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    style={{
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                      backgroundColor: "var(--surface)",
                    }}
                  >
                    <Download size={14} />
                    <span>Download SVG</span>
                  </button>

                  <button
                    onClick={copyToClipboard}
                    className="flex-1 py-2 px-3 rounded-lg border font-body text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    style={{
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                      backgroundColor: "var(--surface)",
                    }}
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy Image"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Callout */}
            <div
              className="rounded-xl border p-5"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-1.5 font-headline font-semibold text-sm" style={{ color: "var(--amber-primary)" }}>
                <Shield size={16} />
                <h4>Client-Side Generation</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                QR codes are rendered directly in your browser. None of the links, Wi-Fi credentials, or text messages you input are transmitted or logged.
              </p>
            </div>

            {/* Related Tools */}
            <div
              className="rounded-xl border p-5"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h4 className="font-headline font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                Related QR Tools
              </h4>
              <div className="divide-y" style={{ borderColor: "var(--border-warm)" }}>
                {relatedTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      className="py-2.5 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <ToolIcon size={15} style={{ color: "var(--amber-primary)" }} />
                        <span
                          className="font-body text-xs group-hover:text-[var(--amber-primary)] transition-colors"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {tool.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
