"use client";

import { useState, useEffect } from "react";
import {
  Wifi,
  Download,
  Copy,
  Check,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import QRCodeLib from "qrcode";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function WifiQrPage() {
  const [ssid, setSsid] = useState("MyHomeWiFi");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState("WPA");
  const [hidden, setHidden] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fgColor, setFgColor] = useState("#1A1714");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const payload = `WIFI:S:${ssid};T:${auth};P:${password};H:${hidden ? "true" : "false"};;`;

  useEffect(() => {
    if (!ssid.trim()) return;

    QRCodeLib.toDataURL(payload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [payload, fgColor, bgColor, ssid]);

  const handleDownload = (format: "png" | "svg") => {
    if (format === "png") {
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `wifi-${ssid || "network"}-qr.png`;
      a.click();
    } else {
      QRCodeLib.toString(payload, {
        type: "svg",
        color: { dark: fgColor, light: bgColor },
      }).then((svgString) => {
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wifi-${ssid || "network"}-qr.svg`;
        a.click();
        URL.revokeObjectURL(url);
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
            { label: "Wi-Fi QR Code" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Wifi size={16} />
            <span>QR Code Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Wi-Fi QR Code Generator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Let guests and friends connect to your Wi-Fi instantly with their phone camera. No more typing long passwords.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form */}
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
                  Network Name (SSID) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Home_WiFi_5G"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2.5 font-body text-sm"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block font-body text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Security Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "WPA/WPA2/WPA3", value: "WPA" },
                    { label: "WEP", value: "WEP" },
                    { label: "Open (None)", value: "nopass" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setAuth(item.value)}
                      className={`py-2 px-3 rounded-lg border font-body text-xs font-medium text-center transition-all ${
                        auth === item.value ? "ring-2 ring-amber-500 font-semibold" : ""
                      }`}
                      style={{
                        backgroundColor: auth === item.value ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {auth !== "nopass" && (
                <div>
                  <label className="block font-body text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Wi-Fi Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter network password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border px-3.5 py-2.5 pr-10 font-body text-sm"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hiddenNetwork"
                  checked={hidden}
                  onChange={(e) => setHidden(e.target.checked)}
                  className="rounded accent-amber-600 cursor-pointer"
                />
                <label htmlFor="hiddenNetwork" className="font-body text-xs cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                  This is a hidden network
                </label>
              </div>

              {/* Color Customization */}
              <div className="border-t pt-4 grid grid-cols-2 gap-4" style={{ borderColor: "var(--border-warm)" }}>
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    QR Code Color
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
                    Background Color
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

          {/* QR Preview & Download */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col items-center text-center gap-5"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                Live Wi-Fi QR Preview
              </h3>

              {qrDataUrl ? (
                <div className="p-4 rounded-xl border bg-white shadow-sm" style={{ borderColor: "var(--border-warm)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="Wi-Fi QR Code" className="w-56 h-56" />
                </div>
              ) : (
                <div
                  className="w-56 h-56 flex items-center justify-center rounded-xl border font-body text-xs"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-muted)",
                  }}
                >
                  Enter an SSID to generate
                </div>
              )}

              <div className="w-full flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload("png")}
                    disabled={!qrDataUrl}
                    className="py-2.5 rounded-lg font-body text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    <Download size={14} />
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("svg")}
                    disabled={!qrDataUrl}
                    className="py-2.5 rounded-lg border font-body text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
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
                  <span>{copied ? "Copied Raw Code!" : "Copy Raw Wi-Fi String"}</span>
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
                Your Wi-Fi network credentials and passwords are encoded entirely inside your local browser. No password data is ever sent to or stored on any server.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
