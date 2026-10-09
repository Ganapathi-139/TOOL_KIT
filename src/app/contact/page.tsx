"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Feedback",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
            We’d love to hear from you
          </h1>
          <p
            className="font-body text-base sm:text-lg leading-relaxed mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Have an idea for a new tool? Spotted a bug? Send us a message and we will get back to you promptly.
          </p>
        </div>

        {submitted ? (
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
              Message received!
            </h2>
            <p
              className="font-body text-sm mt-2 max-w-md mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Thank you for reaching out. We review every suggestion to improve ToolKit for all users.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: "", email: "", subject: "Feedback", message: "" });
              }}
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
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border p-6 sm:p-8 flex flex-col gap-5"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border-warm)",
            }}
          >
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
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
                htmlFor="contact-topic"
                className="block font-body text-sm font-medium mb-1.5"
                style={{ color: "var(--text-primary)" }}
              >
                Topic
              </label>
              <select
                id="contact-topic"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                style={{
                  backgroundColor: "var(--bg-warm)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="Feedback">General Feedback</option>
                <option value="Tool Request">Request a New Tool</option>
                <option value="Bug Report">Report a Bug / Issue</option>
                <option value="Partnership">Other Inquiry</option>
              </select>
            </div>

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
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can we help or what tool would you like to see?"
                className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                style={{
                  backgroundColor: "var(--bg-warm)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <button
              type="submit"
              className="mt-2 py-3 px-6 rounded-lg font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
              style={{ backgroundColor: "var(--amber-primary)" }}
            >
              <Send size={16} />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
