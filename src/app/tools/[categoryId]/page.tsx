import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ToolCard } from "@/components/ToolCard";
import { Icon } from "@/components/Icon";
import { categories, getToolsByCategory, getCategoryById } from "@/lib/tools-data";

interface Props {
  params: Promise<{ categoryId: string }>;
}

export async function generateStaticParams() {
  return categories.map((c) => ({ categoryId: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const cat = getCategoryById(categoryId);
  if (!cat) return {};
  return {
    title: `${cat.name} — Free Online Tools`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categoryId } = await params;
  const cat = getCategoryById(categoryId);
  if (!cat) notFound();
  const catTools = getToolsByCategory(categoryId);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <div
          className="border-b"
          style={{ borderColor: "var(--border-warm)" }}
        >
          <div className="max-w-[1200px] mx-auto px-6 py-12">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "All Tools", href: "/tools" },
                { label: cat.name },
              ]}
            />

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mt-6">
              {/* Text */}
              <div className="flex-1 max-w-[600px]">
                <h1
                  className="font-headline font-bold text-[40px] tracking-tight leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {cat.name}
                </h1>
                <p
                  className="font-body text-[17px] leading-[1.7] mt-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {cat.description} No software to install, no account needed.
                </p>
                {/* Stats */}
                <div
                  className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-4 font-body text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>{cat.toolCount} tools available</span>
                  <span>·</span>
                  <span>Browser-based</span>
                  <span>·</span>
                  <span>Files stay on your device</span>
                </div>
              </div>

              {/* Large icon */}
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--amber-tint)",
                  color: "var(--amber-primary)",
                }}
                aria-hidden="true"
              >
                <Icon name={cat.icon} size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Tool grid */}
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          {catTools.length === 0 ? (
            <p
              className="font-body text-base py-16 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              Tools coming soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {/* Related categories */}
          <div className="mt-16">
            <p
              className="font-body font-medium text-xs uppercase tracking-[0.08em] mb-4"
              style={{ color: "var(--amber-primary)" }}
            >
              Other categories
            </p>
            <div className="flex flex-wrap gap-3">
              {categories
                .filter((c) => c.id !== cat.id)
                .map((c) => (
                  <Link
                    key={c.id}
                    href={c.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border font-body text-sm font-medium transition-colors duration-150"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Icon name={c.icon} size={14} style={{ color: "var(--amber-primary)" }} aria-hidden="true" />
                    {c.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
