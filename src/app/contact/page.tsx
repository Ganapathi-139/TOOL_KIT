"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Laptop,
  ExternalLink,
  Mail,
  RotateCcw,
} from "lucide-react";

type Status = "idle" | "loading" | "success" | "error" | "localhost";

function ContactFormInner() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLocalhost, setIsLocalhost] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Feedback",
    message: "",
  });

  // Pre-fill form from query params if coming from a redirected link
  useEffect(() => {
    const qName = searchParams.get("name");
    const qEmail = searchParams.get("email");
    const qSubject = searchParams.get("subject");
    const qMessage = searchParams.get("message");

    if (qName || qEmail || qSubject || qMessage) {
      setFormData((prev) => ({
        name: qName || prev.name,
        email: qEmail || prev.email,
        subject: qSubject || prev.subject,
        message: qMessage || prev.message,
      }));
    }

    // Detect if running on localhost / 127.0.0.1
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      setIsLocalhost(
        host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")
      );
    }
  }, [searchParams]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Basic validation
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    if (formData.message.trim().length < 10) {
      setErrorMessage("Your message must be at least 10 characters.");
      setStatus("error");
      return;
    }

    // Check honeypot field
    const form = e.currentTarget;
    const honeypot =
      (form.elements.namedItem("_honey") as HTMLInputElement)?.value || "";
    if (honeypot.trim().length > 0) {
      setStatus("success");
      return;
    }

    // Real-time host detection: if running on localhost / local network, intercept and guide to live site
    const currentHost =
      typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
    const isLocal =
      currentHost === "localhost" ||
      currentHost === "127.0.0.1" ||
      currentHost === "[::1]" ||
      currentHost.endsWith(".local") ||
      currentHost.startsWith("192.168.") ||
      currentHost.startsWith("10.") ||
      currentHost.startsWith("172.");

    if (isLocal) {
      setStatus("localhost");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // Call same-origin internal API route (never blocked by ad-blockers / shields)
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject,
          message: formData.message.trim(),
          _honey: honeypot,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setStatus("success");
      } else {
        throw new Error(
          data?.error || `Server responded with status ${res.status}.`
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setErrorMessage("");
    setFormData({ name: "", email: "", subject: "Feedback", message: "" });
  };

  const liveSubmitUrl = `https://toolkit.sgscreations.in/contact?name=${encodeURIComponent(
    formData.name
  )}&email=${encodeURIComponent(formData.email)}&subject=${encodeURIComponent(
    formData.subject
  )}&message=${encodeURIComponent(formData.message)}`;

  const githubIssueUrl = `https://github.com/Ganapathi-139/TOOL_KIT/issues/new?title=${encodeURIComponent(
    `[${formData.subject}] Feedback from ${formData.name || "User"}`
  )}&body=${encodeURIComponent(
    `### Feedback / Bug Report\n\n${formData.message}\n\n**Submitted by:** ${
      formData.name || "Anonymous"
    } (${formData.email || "No email"})\n**Environment:** Localhost`
  )}`;

  const mailtoUrl = `mailto:contact@sgscreations.in?subject=${encodeURIComponent(
    `[ToolKit ${formData.subject}] from ${formData.name || "User"}`
  )}&body=${encodeURIComponent(
    `Name: ${formData.name}\nEmail: ${formData.email}\nTopic: ${formData.subject}\n\nMessage:\n${formData.message}`
  )}`;

  const inputStyle = {
    backgroundColor: "var(--bg-warm)",
    borderColor: "var(--border-warm)",
    color: "var(--text-primary)",
  } as React.CSSProperties;

  return (
    <main className="flex-1 max-w-[800px] mx-auto px-6 py-12 w-full">
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <div className="mt-8 mb-10">
        <span
          className="font-body text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--amber-primary)" }}
        >
          Get In Touch
        </span>
        <h1
          className="font-headline font-bold text-3xl sm:text-4xl tracking-tight mt-2"
          style={{ color: "var(--text-primary)" }}
        >
          We&apos;d love to hear from you
        </h1>
        <p
          className="font-body text-base sm:text-lg leading-relaxed mt-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Have an idea for a new tool? Spotted a bug? Send us a message and we
          will get back to you promptly.
        </p>

        {isLocalhost && status === "idle" && (
          <div
            className="mt-4 flex items-center gap-2.5 px-3.5 py-2 rounded-lg border text-xs font-medium"
            style={{
              backgroundColor: "rgba(217, 119, 6, 0.08)",
              borderColor: "rgba(217, 119, 6, 0.25)",
              color: "var(--amber-primary)",
            }}
          >
            <Laptop size={14} className="flex-shrink-0" />
            <span>
              Running on localhost: submitting will guide you to send your message
              via the live platform or GitHub.
            </span>
          </div>
        )}
      </div>

      {/* ── State 1: Localhost Guidance (Idea 1) ── */}
      {status === "localhost" ? (
        <div
          className="rounded-xl border p-6 sm:p-8 text-center"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--amber-primary)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4"
            style={{
              backgroundColor: "rgba(217, 119, 6, 0.12)",
              color: "var(--amber-primary)",
            }}
          >
            <Laptop size={24} />
          </div>

          <h2
            className="font-headline font-semibold text-xl"
            style={{ color: "var(--text-primary)" }}
          >
            You are running ToolKit on Localhost
          </h2>

          <p
            className="font-body text-sm mt-2 max-w-lg mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Direct contact gateway delivery is active on the live web platform to
            prevent test spam from local dev environments. Your message has been
            saved! Choose how you would like to send it:
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={liveSubmitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-sm"
              style={{ backgroundColor: "var(--amber-primary)" }}
            >
              <ExternalLink size={16} />
              <span>Submit on Live Site (Pre-filled)</span>
            </a>

            <a
              href={githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg font-body font-medium text-sm border flex items-center justify-center gap-2 transition-colors hover:bg-surface-tinted"
              style={{
                borderColor: "var(--border-warm)",
                color: "var(--text-primary)",
                backgroundColor: "var(--surface-tinted)",
              }}
            >
              <svg
                className="w-4 h-4 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Open GitHub Issue</span>
            </a>
          </div>

          <div className="mt-4">
            <a
              href={mailtoUrl}
              className="inline-flex items-center gap-1.5 font-body text-xs underline transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <Mail size={12} />
              <span>Or click here to send directly via Email (mailto)</span>
            </a>
          </div>

          <div
            className="mt-6 pt-4 border-t"
            style={{ borderColor: "var(--border-warm)" }}
          >
            <button
              onClick={() => setStatus("idle")}
              className="inline-flex items-center gap-1.5 font-body text-xs font-medium transition-colors"
              style={{ color: "var(--amber-primary)" }}
            >
              <RotateCcw size={13} />
              <span>Edit your message</span>
            </button>
          </div>
        </div>
      ) : status === "success" ? (
        /* ── State 2: Message Sent (Success) ── */
        <div
          className="rounded-xl border p-8 text-center"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--amber-primary)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <h2
            className="font-headline font-semibold text-xl"
            style={{ color: "var(--text-primary)" }}
          >
            Message sent!
          </h2>
          <p
            className="font-body text-sm mt-2 max-w-md mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Thank you for reaching out. Your message was delivered and we review
            every suggestion to improve ToolKit for all users.
          </p>
          <button
            onClick={resetForm}
            className="mt-6 px-4 py-2 rounded-lg font-body text-sm font-medium border"
            style={{
              borderColor: "var(--border-warm)",
              backgroundColor: "var(--surface-tinted)",
              color: "var(--text-primary)",
            }}
          >
            Send another message
          </button>
        </div>
      ) : (
        /* ── State 3: Active Form ── */
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border p-6 sm:p-8 flex flex-col gap-5"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-warm)",
          }}
          noValidate
        >
          {status === "error" && (
            <div
              className="flex flex-col gap-2 rounded-lg border px-4 py-3"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.35)",
                color: "#ef4444",
              }}
              role="alert"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p className="font-body text-sm leading-relaxed">
                  {errorMessage ||
                    "Could not deliver message through the contact service."}
                </p>
              </div>
              <div className="pl-6 text-xs">
                <a
                  href={mailtoUrl}
                  className="underline hover:text-red-700 transition-colors"
                >
                  Click here to send this message directly via your email app →
                </a>
              </div>
            </div>
          )}

          {/* Name & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contact-name"
                className="block font-body text-sm font-medium mb-1.5"
                style={{ color: "var(--text-primary)" }}
              >
                Your Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                maxLength={120}
                disabled={isSubmitting}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="block font-body text-sm font-medium mb-1.5"
                style={{ color: "var(--text-primary)" }}
              >
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                required
                maxLength={254}
                disabled={isSubmitting}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Topic Dropdown */}
          <div>
            <label
              htmlFor="contact-topic"
              className="block font-body text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Topic
            </label>
            <select
              id="contact-topic"
              disabled={isSubmitting}
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
              style={inputStyle}
            >
              <option value="Feedback">General Feedback</option>
              <option value="Tool Request">Request a New Tool</option>
              <option value="Bug Report">Report a Bug / Issue</option>
              <option value="Partnership">Other Inquiry</option>
            </select>
          </div>

          {/* Message Textarea */}
          <div>
            <label
              htmlFor="contact-message"
              className="block font-body text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Message
            </label>
            <textarea
              id="contact-message"
              required
              rows={5}
              maxLength={5000}
              disabled={isSubmitting}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="How can we help or what tool would you like to see?"
              className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none resize-y"
              style={inputStyle}
            />
          </div>

          {/* Honeypot for bots */}
          <input
            type="text"
            name="_honey"
            defaultValue=""
            aria-hidden="true"
            tabIndex={-1}
            style={{ display: "none" }}
            autoComplete="off"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 py-3 px-6 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ backgroundColor: "var(--amber-primary)" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sending…</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      )}
    </main>
  );
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-24">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: "var(--amber-primary)" }}
            />
          </div>
        }
      >
        <ContactFormInner />
      </Suspense>
      <Footer />
    </>
  );
}
