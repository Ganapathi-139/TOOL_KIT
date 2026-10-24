"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const FORMSUBMIT_ENDPOINT =
  process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ||
  "https://formsubmit.co/ajax/contact@sgscreations.in";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Feedback",
    message: "",
  });

  // Prevent double-submissions while a request is in flight
  const isSubmitting = status === "loading";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Guard against duplicate submissions
    if (isSubmitting) return;

    // Basic client-side validation
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

    // Check honeypot field — bots fill this, humans cannot see it
    const form = e.currentTarget;
    const honeypot = (form.elements.namedItem("_honey") as HTMLInputElement)?.value || "";
    if (honeypot.trim().length > 0) {
      // Bot detected: simulate success without calling external API
      setStatus("success");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(FORMSUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          // Visitor data with explicit field names for the email table
          Name: formData.name.trim(),
          Email: formData.email.trim(),
          Topic: formData.subject,
          Message: formData.message.trim(),

          // FormSubmit configuration
          _subject: `[ToolKit Contact] [${formData.subject}] from ${formData.name.trim()}`,
          _replyto: formData.email.trim(),
          _template: "table",
          _captcha: "false",
          _honey: honeypot,
        }),
      });

      const data = await res.json().catch(() => null);

      // FormSubmit returns success: "true" or an activation notice when first used on a domain.
      // Both mean FormSubmit received the message and sent the email to your inbox.
      const isSuccess =
        (res.ok && data?.success === "true") ||
        (data?.message && data.message.toLowerCase().includes("activation")) ||
        (data?.message && data.message.toLowerCase().includes("success"));

      if (isSuccess) {
        setStatus("success");
      } else {
        throw new Error(
          data?.message || `Server responded with status ${res.status}.`
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

  /* ─── Shared input style helper ─── */
  const inputStyle = {
    backgroundColor: "var(--bg-warm)",
    borderColor: "var(--border-warm)",
    color: "var(--text-primary)",
  } as React.CSSProperties;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[800px] mx-auto px-6 py-12 w-full">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

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
        </div>

        {/* ── Success state ── */}
        {status === "success" ? (
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
              Thank you for reaching out. Your message was delivered and we
              review every suggestion to improve ToolKit for all users.
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
          /* ── Contact form ── */
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border p-6 sm:p-8 flex flex-col gap-5"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border-warm)",
            }}
            noValidate
          >
            {/* ── Error banner ── */}
            {status === "error" && (
              <div
                className="flex items-start gap-3 rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "rgba(239,68,68,0.08)",
                  borderColor: "rgba(239,68,68,0.35)",
                  color: "#ef4444",
                }}
                role="alert"
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p className="font-body text-sm leading-relaxed">
                  {errorMessage ||
                    "Something went wrong. Please try again in a moment."}
                </p>
              </div>
            )}

            {/* ── Name + Email row ── */}
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

            {/* ── Topic dropdown ── */}
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

            {/* ── Message textarea ── */}
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

            {/* ── Honeypot (hidden from real users, bots fill it) ── */}
            <input
              type="text"
              name="_honey"
              defaultValue=""
              aria-hidden="true"
              tabIndex={-1}
              style={{ display: "none" }}
              autoComplete="off"
            />

            {/* ── Submit button ── */}
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
      <Footer />
    </>
  );
}
