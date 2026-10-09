// Central catalogue — all tools and categories

export interface Tool {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: string; // Lucide icon name
  categoryId: string;
  popular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: string;
  toolCount: number;
  color: string; // CSS token for icon container bg
}

export const categories: Category[] = [
  {
    id: "pdf",
    name: "PDF Tools",
    description: "Merge, split, compress, and convert PDF documents in seconds.",
    href: "/tools/pdf",
    icon: "FileText",
    toolCount: 12,
    color: "var(--amber-tint)",
  },
  {
    id: "qr",
    name: "QR Code Tools",
    description: "Generate custom QR codes for links, Wi-Fi, vCards, and text.",
    href: "/tools/qr",
    icon: "QrCode",
    toolCount: 4,
    color: "var(--amber-tint)",
  },
  {
    id: "image",
    name: "Image Tools",
    description: "Resize, crop, convert formats, and optimize images directly in-browser.",
    href: "/tools/image",
    icon: "Image",
    toolCount: 3,
    color: "var(--amber-tint)",
  },
  {
    id: "student",
    name: "Student Tools",
    description: "Calculators, percentage tools, GPA calculators, and study helpers.",
    href: "/tools/student",
    icon: "GraduationCap",
    toolCount: 6,
    color: "var(--amber-tint)",
  },
  {
    id: "developer",
    name: "Developer Tools",
    description: "JSON formatters, Base64 enc/decoders, regex testers, and hashers.",
    href: "/tools/developer",
    icon: "Code2",
    toolCount: 7,
    color: "var(--amber-tint)",
  },
  {
    id: "utilities",
    name: "Everyday Utilities",
    description: "Unit converters, timer, word counters, and quick daily utilities.",
    href: "/tools/utilities",
    icon: "Wrench",
    toolCount: 5,
    color: "var(--amber-tint)",
  },
];

export const tools: Tool[] = [
  // PDF Tools
  {
    id: "merge-pdf",
    name: "Merge PDF",
    description: "Combine multiple PDF files into one. Drag to reorder, then merge.",
    href: "/tools/pdf/merge",
    icon: "FilePlus2",
    categoryId: "pdf",
    popular: true,
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    description: "Extract individual pages or page ranges from any PDF file.",
    href: "/tools/pdf/split",
    icon: "Scissors",
    categoryId: "pdf",
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    description: "Reduce PDF file size while keeping quality acceptable.",
    href: "/tools/pdf/compress",
    icon: "Minimize2",
    categoryId: "pdf",
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    description: "Convert Microsoft Word (.docx) files to formatted PDF documents.",
    href: "/tools/pdf/word-to-pdf",
    icon: "FileType2",
    categoryId: "pdf",
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    description: "Convert JPG, PNG, or WEBP images into a single PDF document.",
    href: "/tools/pdf/image-to-pdf",
    icon: "ImageDown",
    categoryId: "pdf",
    popular: true,
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG & PNG",
    description: "Export every PDF page as a high-quality JPG or PNG image file.",
    href: "/tools/pdf/to-jpg",
    icon: "FileImage",
    categoryId: "pdf",
  },
  {
    id: "pdf-to-text",
    name: "PDF to Plain Text",
    description: "Extract clean Unicode plain text (.txt) from any PDF document.",
    href: "/tools/pdf/to-text",
    icon: "FileText",
    categoryId: "pdf",
  },
  {
    id: "text-to-pdf",
    name: "Plain Text to PDF",
    description: "Convert raw text or .txt files into paginated, styled PDF documents.",
    href: "/tools/pdf/text-to-pdf",
    icon: "FileText",
    categoryId: "pdf",
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    description: "Rotate pages in a PDF document by 90, 180, or 270 degrees.",
    href: "/tools/pdf/rotate",
    icon: "RotateCw",
    categoryId: "pdf",
  },
  {
    id: "reorder-pages",
    name: "Reorder PDF Pages",
    description: "Drag and rearrange pages within a PDF into your desired order.",
    href: "/tools/pdf/reorder",
    icon: "ListOrdered",
    categoryId: "pdf",
  },
  {
    id: "ppt-to-pdf",
    name: "PPT to PDF",
    description: "Convert PowerPoint (.pptx) presentations into PDF documents in your browser.",
    href: "/tools/pdf/ppt-to-pdf",
    icon: "Presentation",
    categoryId: "pdf",
  },
  {
    id: "pdf-to-ppt",
    name: "PDF to PPT",
    description: "Convert PDF pages into a PowerPoint (.pptx) presentation with page images.",
    href: "/tools/pdf/to-ppt",
    icon: "Presentation",
    categoryId: "pdf",
  },

  // QR Code Tools
  {
    id: "qr-generator",
    name: "QR Code Generator",
    description: "Create QR codes for URLs, text, emails, and phone numbers.",
    href: "/tools/qr/generator",
    icon: "QrCode",
    categoryId: "qr",
    popular: true,
  },
  {
    id: "wifi-qr",
    name: "Wi-Fi QR Code",
    description: "Allow guests to join your Wi-Fi instantly by scanning a QR code.",
    href: "/tools/qr/wifi",
    icon: "Wifi",
    categoryId: "qr",
    popular: true,
  },
  {
    id: "vcard-qr",
    name: "vCard QR Code",
    description: "Encode your contact details into a scannable QR code.",
    href: "/tools/qr/vcard",
    icon: "Contact",
    categoryId: "qr",
  },
  {
    id: "qr-scanner",
    name: "QR Code Scanner",
    description: "Scan and decode a QR code image from your device.",
    href: "/tools/qr/scanner",
    icon: "ScanLine",
    categoryId: "qr",
  },

  // Image Tools
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize images to exact dimensions without uploading to any server.",
    href: "/tools/image/resize",
    icon: "Expand",
    categoryId: "image",
    popular: true,
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Reduce image file size with adjustable quality control.",
    href: "/tools/image/compress",
    icon: "Minimize2",
    categoryId: "image",
  },
  {
    id: "image-converter",
    name: "Image Converter",
    description: "Convert between JPG, PNG, WEBP, GIF, and AVIF formats.",
    href: "/tools/image/convert",
    icon: "RefreshCcw",
    categoryId: "image",
  },

  // Student Tools
  {
    id: "gpa-calculator",
    name: "CGPA & SGPA Calculator",
    description: "Calculate semester SGPA, cumulative CGPA, and equivalent percentage quickly.",
    href: "/tools/student/gpa",
    icon: "Calculator",
    categoryId: "student",
    popular: true,
  },
  {
    id: "attendance-calculator",
    name: "Attendance Calculator",
    description: "Calculate current attendance percentage, bunk margin, and classes needed to reach your target.",
    href: "/tools/student/attendance",
    icon: "CalendarCheck",
    categoryId: "student",
    popular: true,
  },
  {
    id: "word-counter",
    name: "Word Counter",
    description: "Count words, characters, sentences, and reading time.",
    href: "/tools/student/word-counter",
    icon: "AlignLeft",
    categoryId: "student",
    popular: true,
  },

  // Student Tools continued
  {
    id: "percentage-calculator",
    name: "Percentage Calculator",
    description: "Calculate mark percentages, ratios, mark fractions, and percentage changes.",
    href: "/tools/student/percentage-calculator",
    icon: "Percent",
    categoryId: "student",
    popular: true,
  },
  {
    id: "case-converter",
    name: "Text Case Converter",
    description: "Convert text to UPPERCASE, lowercase, Title Case, camelCase, and kebab-case.",
    href: "/tools/student/case-converter",
    icon: "CaseUpper",
    categoryId: "student",
  },
  {
    id: "scientific-calculator",
    name: "Scientific Calculator",
    description: "Calculate trigonometric functions, logarithms, powers, roots, and view history.",
    href: "/tools/student/scientific-calculator",
    icon: "Calculator",
    categoryId: "student",
  },

  // Developer Tools
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON data with syntax highlighting.",
    href: "/tools/developer/json",
    icon: "Braces",
    categoryId: "developer",
    popular: true,
  },
  {
    id: "base64",
    name: "Base64 Encoder / Decoder",
    description: "Encode and decode strings and files to/from Base64.",
    href: "/tools/developer/base64",
    icon: "Binary",
    categoryId: "developer",
    popular: true,
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test and debug regular expressions with live match highlighting.",
    href: "/tools/developer/regex",
    icon: "Terminal",
    categoryId: "developer",
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate SHA-1, SHA-256, SHA-384, and SHA-512 cryptographic digests.",
    href: "/tools/developer/hash",
    icon: "Hash",
    categoryId: "developer",
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate cryptographically secure v4 UUIDs in bulk.",
    href: "/tools/developer/uuid",
    icon: "Fingerprint",
    categoryId: "developer",
  },
  {
    id: "url-encoder",
    name: "URL Encoder / Decoder",
    description: "Safely percent-encode URLs or decode encoded strings and query params.",
    href: "/tools/developer/url",
    icon: "Link",
    categoryId: "developer",
  },
  {
    id: "markdown-editor",
    name: "Markdown Editor & Preview",
    description: "Edit Markdown with live HTML preview and export options.",
    href: "/tools/developer/markdown",
    icon: "FileText",
    categoryId: "developer",
  },

  // Everyday Utilities
  {
    id: "pomodoro",
    name: "Pomodoro Timer",
    description: "Simple interval timer for focused work sessions.",
    href: "/tools/utilities/pomodoro",
    icon: "Timer",
    categoryId: "utilities",
    popular: true,
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    description: "Convert length, weight, temperature, area, and more.",
    href: "/tools/utilities/unit-converter",
    icon: "ArrowLeftRight",
    categoryId: "utilities",
  },
  {
    id: "password-generator",
    name: "Password Generator",
    description: "Generate high-entropy secure passwords using hardware randomness.",
    href: "/tools/utilities/password-generator",
    icon: "KeyRound",
    categoryId: "utilities",
    popular: true,
  },
  {
    id: "barcode-generator",
    name: "Barcode Generator",
    description: "Create Code-128 linear barcodes with custom sizing and PNG download.",
    href: "/tools/utilities/barcode",
    icon: "Barcode",
    categoryId: "utilities",
  },
  {
    id: "text-to-speech",
    name: "Text to Speech",
    description: "Read text aloud with voice, speed, and pitch controls using Web Speech.",
    href: "/tools/utilities/text-to-speech",
    icon: "Volume2",
    categoryId: "utilities",
  },
];

export function getToolsByCategory(categoryId: string): Tool[] {
  return tools.filter((t) => t.categoryId === categoryId);
}

export function getPopularTools(): Tool[] {
  return tools.filter((t) => t.popular);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
