import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Tool } from "@/lib/tools-data";

interface ToolCardProps {
  tool: Tool;
  compact?: boolean;
}

export function ToolCard({ tool, compact = false }: ToolCardProps) {
  return (
    <div
      className="group rounded-lg border flex flex-col card-hover"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-warm)",
        padding: compact ? "16px" : "20px",
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-4 shrink-0"
        style={{
          backgroundColor: "var(--amber-tint)",
          color: "var(--amber-primary)",
        }}
      >
        <Icon name={tool.icon} size={18} />
      </div>

      {/* Title + Description */}
      <div className="flex-1">
        <h4
          className="font-headline font-semibold text-[17px] tracking-tight leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {tool.name}
        </h4>
        {!compact && (
          <p
            className="font-body text-sm mt-1 leading-relaxed line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {tool.description}
          </p>
        )}
      </div>

      {/* Action */}
      <Link
        href={tool.href}
        className="inline-flex items-center gap-1 font-body text-sm font-medium mt-4 transition-colors duration-150 hover:underline"
        style={{ color: "var(--amber-primary)" }}
        aria-label={`Open ${tool.name}`}
      >
        Open tool <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
