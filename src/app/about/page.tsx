import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Shield, Sparkles, HeartHandshake, Zap, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the mission, values, and design principles behind ToolKit.",
};

export default function AboutPage() {
  const values = [
    {
      title: "Client-Side First",
      description: "Wherever possible, files and calculations stay inside your browser. No server storage, no data harvest.",
      icon: Shield,
    },
    {
      title: "No Clutter or Dark Patterns",
      description: "No subscription popups, deceptive download buttons, or intrusive advertisements ruining your workflow.",
      icon: Sparkles,
    },
    {
      title: "Accessible to Everyone",
      description: "Crafted with high-contrast text, clear typography, and straightforward language for students, professionals, and seniors.",
      icon: HeartHandshake,
    },
    {
      title: "Instant Utility",
      description: "No mandatory sign-ups or email verification barriers. Open the tool, get the work done, and carry on.",
      icon: Zap,
    },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[900px] mx-auto px-6 py-12 w-full">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />

        <div className="mt-8 mb-12">
          <span
            className="font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            Our Mission
          </span>
          <h1
            className="font-headline font-bold text-3xl sm:text-5xl tracking-tight mt-2 leading-[1.15]"
            style={{ color: "var(--text-primary)" }}
          >
            Building thoughtful, privacy-minded online tools.
          </h1>
          <p
            className="font-body text-lg sm:text-xl leading-relaxed mt-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Online utilities shouldn&apos;t feel like a gauntlet of advertisements, fake download links, or hidden subscriptions. We created ToolKit to provide honest, fast, and beautifully designed tools for everyday tasks.
          </p>
        </div>

        {/* Core Values Grid */}
        <section className="my-14">
          <h2
            className="font-headline font-semibold text-2xl tracking-tight mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            Principles we stand by
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((val) => {
              const IconComp = val.icon;
              return (
                <div
                  key={val.title}
                  className="rounded-xl border p-6"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border-warm)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: "var(--amber-tint)",
                      color: "var(--amber-primary)",
                    }}
                  >
                    <IconComp size={20} />
                  </div>
                  <h3
                    className="font-headline font-semibold text-lg"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {val.title}
                  </h3>
                  <p
                    className="font-body text-sm leading-relaxed mt-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Narrative / Context */}
        <section
          className="rounded-xl border p-8 my-10"
          style={{
            backgroundColor: "var(--surface-tinted)",
            borderColor: "var(--border-warm)",
          }}
        >
          <h2
            className="font-headline font-semibold text-xl tracking-tight mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            How it works under the hood
          </h2>
          <p
            className="font-body text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Modern web browsers are capable of running powerful computations, from parsing and re-encoding PDF documents to manipulating high-resolution images. By running these tasks on your local device with WebAssembly and JavaScript, you get instantaneous feedback without network delays or security worries.
          </p>

          <div className="mt-6">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 font-body text-sm font-semibold hover:underline"
              style={{ color: "var(--amber-primary)" }}
            >
              <span>Explore all online tools</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
