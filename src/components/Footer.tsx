import Link from "next/link";

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "GitHub", href: "https://github.com", external: true },
];

export function Footer() {
  return (
    <footer
      className="w-full border-t mt-auto"
      style={{
        backgroundColor: "var(--surface-tinted)",
        borderColor: "var(--border-warm)",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand */}
        <Link
          href="/"
          className="font-headline font-semibold text-lg tracking-tight"
          style={{ color: "var(--amber-primary)" }}
        >
          Project Name
        </Link>

        {/* Links */}
        <nav
          className="flex flex-wrap justify-center items-center gap-6"
          aria-label="Footer navigation"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="font-body text-sm transition-colors duration-150"
              style={{ color: "var(--text-secondary)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p
          className="font-body text-[13px]"
          style={{ color: "var(--text-secondary)" }}
        >
          © {new Date().getFullYear()} Project Name. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
