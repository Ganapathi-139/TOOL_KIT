"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Copy,
  Check,
  Download,
  Bold,
  Italic,
  Heading,
  List,
  Code,
  Link as LinkIcon,
  Quote,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

const defaultMarkdown = `# Welcome to Markdown Editor

Write or paste **Markdown** on the left and see the rendered HTML on the right.

## Key Features
- Clean formatting
- *Instant* live preview
- Client-side execution

> "Simplicity is the soul of efficiency." — Austin Freeman

### Sample Code
\`\`\`javascript
const greet = (name) => \`Hello \${name}!\`;
console.log(greet("ToolKit"));
\`\`\`
`;

export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [copied, setCopied] = useState(false);

  // Safe client-side markdown to HTML parser with XSS protection
  const htmlOutput = useMemo(() => {
    // 1. Escape raw HTML entities first to prevent script/DOM injection
    let raw = markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // 2. Code blocks (preserved with escaped HTML inside)
    raw = raw.replace(/```([\s\S]*?)```/g, '<pre class="bg-black/10 dark:bg-white/10 p-3 rounded-lg overflow-x-auto my-3 font-mono text-xs"><code>$1</code></pre>');

    // 3. Inline code
    raw = raw.replace(/`([^`]+)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-xs text-amber-600 dark:text-amber-400">$1</code>');

    // 4. Headers
    raw = raw.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    raw = raw.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>');
    raw = raw.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3 border-b pb-1">$1</h1>');

    // 5. Blockquotes
    raw = raw.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-amber-500 pl-3 my-3 italic text-[var(--text-secondary)]">$1</blockquote>');

    // 6. Bold & Italic
    raw = raw.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    raw = raw.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 7. Unordered lists
    raw = raw.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');

    // 8. Safe links: only allow http, https, mailto, or relative/anchor links (block javascript:, data:, etc.)
    raw = raw.replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, href) => {
      const cleanHref = href.trim();
      const isSafe = /^https?:\/\//i.test(cleanHref) || /^mailto:/i.test(cleanHref) || cleanHref.startsWith("#") || cleanHref.startsWith("/");
      if (!isSafe) {
        return `<span>${linkText}</span>`;
      }
      return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer" class="text-amber-600 underline">${linkText}</a>`;
    });

    // 9. Line breaks
    raw = raw.replace(/\n\n/g, '<div class="my-2"></div>');

    return raw;
  }, [markdown]);

  const insertSyntax = (prefix: string, suffix = "") => {
    setMarkdown((prev) => prev + `${prefix}${suffix}`);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1400px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Developer Tools", href: "/tools/developer" },
            { label: "Markdown Editor" },
          ]}
        />

        <div className="mt-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div
              className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--amber-primary)" }}
            >
              <FileText size={16} />
              <span>Developer Tools</span>
            </div>
            <h1
              className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Markdown Editor & Live Preview
            </h1>
            <p
              className="font-body text-base mt-2 max-w-2xl"
              style={{ color: "var(--text-secondary)" }}
            >
              Write markdown documents with syntax shortcuts, live HTML rendering, and instant export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="px-4 py-2 rounded-lg border font-body text-xs font-medium flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
                color: "var(--text-primary)",
              }}
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              <span>{copied ? "Copied HTML" : "Copy HTML"}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMd}
              className="px-4 py-2 rounded-lg font-body text-xs font-semibold flex items-center gap-1.5 text-white transition-all"
              style={{ backgroundColor: "var(--amber-primary)" }}
            >
              <Download size={14} />
              <span>Download .md</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div
          className="rounded-t-xl border border-b-0 p-2.5 flex items-center gap-1 flex-wrap"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-warm)",
          }}
        >
          <button
            type="button"
            onClick={() => insertSyntax("**", "**")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax("*", "*")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax("## ")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Heading"
          >
            <Heading size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax("- ")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax("`", "`")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Inline Code"
          >
            <Code size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax("> ")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Quote"
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax("[Link Text](https://example.com)")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Link"
          >
            <LinkIcon size={16} />
          </button>
        </div>

        {/* Dual Editor & Preview Panes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-b-xl border overflow-hidden min-h-[500px]" style={{ borderColor: "var(--border-warm)" }}>
          {/* Editor Pane */}
          <div className="p-4 border-b lg:border-b-0 lg:border-r flex flex-col" style={{ backgroundColor: "var(--surface-tinted)", borderColor: "var(--border-warm)" }}>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type your markdown here..."
              className="w-full h-full min-h-[460px] bg-transparent font-mono text-sm leading-relaxed resize-none focus:outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          {/* Rendered Preview Pane */}
          <div
            className="p-6 overflow-y-auto font-body text-sm leading-relaxed prose max-w-none"
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--text-primary)",
            }}
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
