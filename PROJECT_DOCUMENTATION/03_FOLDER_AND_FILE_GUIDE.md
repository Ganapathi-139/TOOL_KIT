# 03. Folder and File Guide — ToolKit

This guide explains the repository layout, what each folder is responsible for, and how the pieces connect to form a working application.

---

## 1. Top-Level Repository Structure

```
TOOL_KIT/tool-kit/
├── .agents/                    # Agent & AI skills directory (ignored by git)
│   └── skills/
│       └── security-audit/     # Cloudflare Security Audit Skill files
├── .next/                      # Next.js build cache and compiled outputs (generated)
├── node_modules/               # Installed npm packages and dependencies
├── public/                     # Static files directly served at web root
│   ├── js/                     # Standalone client-side vendor libraries
│   └── ...                     # Logos, favicons, SVGs
├── scripts/                    # Backend automation & conversion scripts
│   └── pdf2docx_convert.py     # Python bridge for offline PDF->Word conversion
├── src/                        # Main application source code
│   ├── app/                    # Next.js App Router (pages, layouts, API routes)
│   ├── components/             # Reusable React UI components
│   ├── lib/                    # Shared utilities, metadata, and helper functions
│   └── types/                  # Global TypeScript declaration files
├── .gitignore                  # Git untracked files specification
├── eslint.config.mjs           # ESLint v9 configuration
├── next.config.ts              # Next.js configuration (Turbopack, security headers)
├── package.json                # Project dependencies and script shortcuts
├── tsconfig.json               # TypeScript compiler options
└── README.md                   # Public repository documentation
```

---

## 2. Deep Dive: `src/` Directory

The `src/` folder contains all custom code written for ToolKit.

### A. `src/app/` (The Routing Heart)

Next.js App Router uses a folder-based routing convention. Every folder with a `page.tsx` file becomes a public URL.

```
src/app/
├── layout.tsx                  # Root HTML wrapper, ThemeProvider, fonts, meta tags
├── page.tsx                    # Homepage: Hero section, search bar, popular tools, categories
├── globals.css                 # CSS variables, dark/light theme tokens, Tailwind base
├── robots.ts                   # Automatically generates /robots.txt for search engines
├── sitemap.ts                  # Automatically generates /sitemap.xml for SEO
│
├── about/page.tsx              # About Us page
├── contact/page.tsx            # Contact & Support page
├── privacy/page.tsx            # Privacy Policy (emphasizing 100% client-side privacy)
├── terms/page.tsx              # Terms of Service
│
├── api/                        # Backend Serverless API endpoints
│   ├── convert/pdf-to-word/    # Subprocess bridge for Python conversion
│   │   └── route.ts
│   └── file-share/             # QR File Share upload & streaming proxy
│       ├── upload/route.ts
│       └── download/route.ts
│
└── tools/                      # The 39 individual tool interfaces
    ├── page.tsx                # Master tool directory & catalog page
    ├── [categoryId]/page.tsx   # Dynamic category hub (e.g. /tools/pdf)
    │
    ├── pdf/                    # 13 PDF tool pages (merge, split, compress, etc.)
    ├── qr/                     # 5 QR tool pages (generator, scanner, wifi, file-share)
    ├── image/                  # 3 Image tool pages (compress, convert, resize)
    ├── student/                # 6 Student tool pages (calculator, gpa, attendance, etc.)
    ├── developer/              # 7 Developer tool pages (json, hash, regex, markdown, etc.)
    └── utilities/              # 5 Utility tool pages (barcode, password, text-to-speech)
```

### B. `src/components/` (Reusable UI Elements)

To avoid duplicating navigation, headers, footers, and card styles across 39 separate pages, reusable components are maintained in `src/components/`:

| Component | File | Responsibility |
|---|---|---|
| **Header** | `Header.tsx` | Sticky navigation bar, brand logo, interactive search dropdown, category links, dark/light theme switch button. |
| **Footer** | `Footer.tsx` | Site footer with category navigation, privacy declaration, and copyright notices. |
| **Breadcrumb** | `Breadcrumb.tsx` | Navigation breadcrumbs (e.g. `Home > PDF Tools > Merge PDF`) with structured microdata. |
| **ToolCard** | `ToolCard.tsx` | The card visual displayed in grids: shows tool title, short description, icon badge, and hover animations. |
| **CategoryCard**| `CategoryCard.tsx` | Large card representing a whole category with tool counts and custom background tints. |
| **Icon** | `Icon.tsx` | Dynamic icon loader that renders appropriate Lucide icons from string names stored in `tools-data.ts`. |
| **ThemeProvider**| `ThemeProvider.tsx` | Wraps the application with `next-themes` to support smooth dark/light theme toggling. |

### C. `src/lib/` (Application Data & Logic)

- **`tools-data.ts`**: The single source of truth for the entire application. It defines the TypeScript interfaces for `Tool` and `Category`, catalogs all 39 tools, defines their routes (`href`), descriptions, icons, and category assignments. When you search for a tool in the header or homepage, it searches this catalog.
- **`file-share.ts`**: Manages secure signed tokens for the File Share QR feature. It uses Node.js `crypto` to create and verify HMAC-SHA256 signatures with constant-time equality comparisons (`timingSafeEqual`), ensuring tokens cannot be forged or tampered with.

### D. `src/types/` (Global Type Definitions)

- **`converters.d.ts`**: Contains ambient TypeScript declarations for client-side libraries that do not have their own official `@types` packages, such as `window.mammoth`, `window.docx`, `window.pdfjsLib`, and `window.JSZip`. This prevents TypeScript compiler errors when calling browser-loaded libraries.

---

## 3. `public/` (Static Assets and Client Engines)

Files placed in `public/` are served statically at the root URL (e.g. `public/favicon.ico` is accessible at `/favicon.ico`).

- **`public/js/`**: Contains offline, bundled vendor libraries:
  - `pdf.min.js` & `pdf.worker.min.js`: Mozilla PDF.js core and web worker.
  - `docx-preview.min.js`: Word document visual renderer.
  - `mammoth.browser.min.js`: Word document HTML converter.
  - `jszip.min.js`: JavaScript zip compression library.
  *Why keep local copies in `public/js`?* If a user has poor internet connectivity or an ad-blocker blocks external CDNs (`cdnjs` / `jsdelivr`), ToolKit immediately falls back to these local static copies!
- **Icons & Graphics**:
  - `icon.png`, `favicon.ico`, `fevicon1.ico`: App toolbox logo and browser tab icons.
  - `file.svg`, `globe.svg`, `window.svg`, `next.svg`, `vercel.svg`: Vector assets.

---

## 4. `scripts/` (Offline Backend Helpers)

- **`pdf2docx_convert.py`**: A Python command-line script that accepts `<input.pdf> <output.docx>`. When ToolKit is running on a server that has Python installed, `src/app/api/convert/pdf-to-word/route.ts` calls this script in a separate child process. The script disables verbose terminal logging, converts the PDF, and outputs a clean `OK:<size>` response to stdout.

---

## 5. Root Configuration Files

- **`next.config.ts`**: Configures Next.js Turbopack CSS loaders and injects critical HTTP security headers (HSTS, Content Security Policy, X-Frame-Options, X-Content-Type-Options) into every response.
- **`package.json`**: Specifies project dependencies, version constraints, and npm scripts (`dev`, `build`, `start`, `lint`).
- **`tsconfig.json`**: Configures strict TypeScript checking, module resolution (`@/*` alias pointing to `src/*`), and Next.js compiler plugins.
- **`eslint.config.mjs`**: ESLint flat config with Next.js Core Web Vitals rules, TypeScript rules, and ignores for compiled files.
- **`.gitignore`**: Tells Git which files to never commit (e.g., `node_modules/`, `.next/`, `.env*`, `.agents/`).

---

## 6. How the Files Connect (A Typical Request Lifecycle)

```
1. User visits: https://toolkit.com/tools/pdf/merge
2. Next.js router matches: src/app/tools/pdf/merge/page.tsx
3. Root Layout renders: src/app/layout.tsx (injects globals.css, ThemeProvider, Header)
4. Header reads catalog: src/lib/tools-data.ts (for search autocomplete)
5. Page renders UI: Breadcrumb, drag-and-drop zone, merge action buttons
6. User drops files: Handled in page.tsx via FileReader
7. Processing happens: page.tsx executes `pdf-lib` in browser RAM
8. Output generated: Blob created -> user downloads -> temporary memory revoked
9. Footer renders: src/components/Footer.tsx
```
