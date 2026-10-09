import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Our plain-English privacy commitment to our users.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-[800px] mx-auto px-6 py-12 w-full">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />

        <div className="mt-8 mb-10">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <ShieldCheck size={16} />
            <span>Transparency & Privacy</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Privacy Policy
          </h1>
          <p
            className="font-body text-sm mt-2"
            style={{ color: "var(--text-muted)" }}
          >
            Last revised: October 2026 · Plain-English summary
          </p>
        </div>

        <div className="space-y-8 font-body leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <section className="rounded-xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
            <h2 className="font-headline font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              1. 100% Client-Side Processing
            </h2>
            <p className="text-sm">
              All tools currently provided on ToolKit (including PDF merging and splitting, QR code generation, image compression and conversion, student calculators, and developer utilities) run entirely inside your web browser. Your files, photos, text, and calculation data are never sent to, uploaded to, or stored on any server.
            </p>
          </section>

          <section className="rounded-xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
            <h2 className="font-headline font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              2. No User Account Required
            </h2>
            <p className="text-sm">
              We do not require account creation, logins, passwords, or email addresses to use any of our utilities. You can visit the site and perform tasks completely anonymously.
            </p>
          </section>

          <section className="rounded-xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
            <h2 className="font-headline font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              3. Analytics & Cookies
            </h2>
            <p className="text-sm">
              We respect your right to privacy. We do not use intrusive third-party cross-site trackers. Any telemetry used is strictly aggregated, privacy-preserving, and utilized exclusively to measure aggregate tool reliability and page speed.
            </p>
          </section>

          <section className="rounded-xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
            <h2 className="font-headline font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              4. Questions or Concerns
            </h2>
            <p className="text-sm">
              If you have any questions regarding privacy or how local file processing operates on this site, please feel free to reach out via our contact page.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
