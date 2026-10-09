"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ToolCard } from "@/components/ToolCard";
import { Icon } from "@/components/Icon";
import { categories, tools } from "@/lib/tools-data";

const ALL_ID = "all";

function AllToolsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("cat") || ALL_ID;

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);

  // Sync state if URL query changes
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
    if (initialCategory) setActiveCategory(initialCategory);
  }, [initialQuery, initialCategory]);

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchCat = activeCategory === ALL_ID || t.categoryId === activeCategory;
      const matchQ =
        query.trim() === "" ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [activeCategory, query]);

  const grouped = useMemo(() => {
    const result: Record<string, typeof tools> = {};
    if (activeCategory !== ALL_ID) {
      result[activeCategory] = filtered;
    } else {
      categories.forEach((cat) => {
        const catTools = filtered.filter((t) => t.categoryId === cat.id);
        if (catTools.length > 0) result[cat.id] = catTools;
      });
    }
    return result;
  }, [filtered, activeCategory]);

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "All Tools" }]} />

      {/* Page header */}
      <div className="mt-6 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1
            className="font-headline font-bold text-[36px] tracking-tight leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            All Tools
          </h1>
          <p
            className="font-body text-base mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Browse all available tools across every category.
          </p>
        </div>

        {/* Search */}
        <div
          className="relative flex items-center h-[44px] rounded-lg border max-w-[360px] w-full sm:w-auto"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-warm)",
          }}
        >
          <div className="pl-3 pr-2 pointer-events-none">
            <Search size={16} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tools…"
            aria-label="Filter tools"
            className="w-full border-0 bg-transparent focus:ring-0 focus:outline-none font-body text-sm px-2"
            style={{ color: "var(--text-primary)" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mr-3 text-xs font-body font-medium hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-10">
        {[{ id: ALL_ID, name: "All" }, ...categories].map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="shrink-0 px-4 py-2 rounded-full font-body text-sm font-medium transition-colors duration-150 border"
              style={{
                backgroundColor: isActive ? "var(--amber-primary)" : "var(--surface-tinted)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                borderColor: isActive ? "var(--amber-primary)" : "var(--border-warm)",
              }}
              aria-pressed={isActive}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Grouped tool sections */}
      {Object.keys(grouped).length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-body text-lg" style={{ color: "var(--text-secondary)" }}>
            No tools match &ldquo;{query}&rdquo;. Try a different keyword or view all categories.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setActiveCategory(ALL_ID);
            }}
            className="mt-4 px-4 py-2 rounded-lg font-body text-sm font-medium border"
            style={{
              borderColor: "var(--border-warm)",
              backgroundColor: "var(--surface-tinted)",
              color: "var(--text-primary)",
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-14">
          {Object.entries(grouped).map(([catId, catTools]) => {
            const cat = categories.find((c) => c.id === catId);
            if (!cat) return null;
            return (
              <section key={catId} aria-labelledby={`cat-${catId}`}>
                {/* Category heading */}
                <div
                  className="flex items-center justify-between mb-6 pb-4 border-b"
                  style={{ borderColor: "var(--border-warm)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--amber-tint)",
                        color: "var(--amber-primary)",
                      }}
                    >
                      <Icon name={cat.icon} size={18} aria-hidden="true" />
                    </div>
                    <h2
                      id={`cat-${catId}`}
                      className="font-headline font-semibold text-xl tracking-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {cat.name}
                    </h2>
                  </div>
                  <span
                    className="font-body text-sm px-2.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: "var(--amber-tint)",
                      color: "var(--amber-primary)",
                    }}
                  >
                    {catTools.length} tool{catTools.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Tool grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function AllToolsPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="flex-1 max-w-[1200px] mx-auto px-6 py-20 text-center font-body text-sm" style={{ color: "var(--text-secondary)" }}>
          Loading tools directory...
        </div>
      }>
        <AllToolsContent />
      </Suspense>
      <Footer />
    </>
  );
}
