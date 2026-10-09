import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight
                size={14}
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              />
            )}
            {isLast || !item.href ? (
              <span
                className="font-body text-sm"
                style={{
                  color: isLast ? "var(--text-secondary)" : "var(--text-muted)",
                }}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="font-body text-sm transition-colors duration-150 hover:underline"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
