import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using ToolKit tools.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-[800px] mx-auto px-6 py-12 w-full">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />

        <div className="mt-8 mb-10">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <FileText size={16} />
            <span>Legal</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Terms of Service
          </h1>
          <p
            className="font-body text-sm mt-2"
            style={{ color: "var(--text-muted)" }}
          >
            Effective date: October 2025
          </p>
        </div>

        <div className="space-y-8 font-body leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <section className="rounded-xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
            <h2 className="font-headline font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              1. Acceptance of Terms
            </h2>
            <p className="text-sm">
              By accessing and using this website, you agree to be bound by these terms. If you do not agree with these terms, please discontinue using the service.
            </p>
          </section>

          <section className="rounded-xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
            <h2 className="font-headline font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              2. Permitted Use
            </h2>
            <p className="text-sm">
              All tools provided on this website are free to use for personal, educational, and commercial purposes. You agree not to attempt to reverse-engineer malicious payloads or abuse service availability.
            </p>
          </section>

          <section className="rounded-xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
            <h2 className="font-headline font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              3. Disclaimer of Warranty
            </h2>
            <p className="text-sm">
              These utilities are provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind. While we aim for maximum precision and file integrity, you are advised to maintain independent backups of critical data before processing.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
