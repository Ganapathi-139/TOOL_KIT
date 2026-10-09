import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Icon } from "@/components/Icon";
import type { Category } from "@/lib/tools-data";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={category.href}
      className="group relative block text-left rounded-lg border card-hover p-6"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-warm)",
      }}
    >
      {/* Top row: icon + badge + arrow */}
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: "var(--amber-tint)",
            color: "var(--amber-primary)",
          }}
        >
          <Icon name={category.icon} size={20} />
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-md font-body"
            style={{
              backgroundColor: "var(--amber-tint)",
              color: "var(--amber-primary)",
            }}
          >
            {category.toolCount} tools
          </span>
          <ArrowUpRight
            size={16}
            className="transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-headline font-semibold text-xl mt-4 mb-2 tracking-tight transition-colors duration-150"
        style={{ color: "var(--text-primary)" }}
      >
        {category.name}
      </h3>

      {/* Description */}
      <p
        className="font-body text-sm leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {category.description}
      </p>
    </Link>
  );
}
