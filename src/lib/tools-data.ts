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
    toolCount: 8,
    color: "var(--amber-tint)",
  },
  {
    id: "image",
    name: "Image Tools",
    description: "Resize, crop, convert formats, and optimize images directly in-browser.",
    href: "/tools/image",
    icon: "Image",
    toolCount: 15,
    color: "var(--amber-tint)",
  },
  {
    id: "student",
    name: "Student Tools",
    description: "Calculators, citation generators, GPA tools, and study helpers.",
    href: "/tools/student",
    icon: "GraduationCap",
    toolCount: 9,
    color: "var(--amber-tint)",
  },
  {
    id: "developer",
    name: "Developer Tools",
    description: "JSON formatters, Base64 enc/decoders, regex testers, and hashers.",
    href: "/tools/developer",
    icon: "Code2",
    toolCount: 18,
    color: "var(--amber-tint)",
  },
  {
    id: "utilities",
    name: "Everyday Utilities",
    description: "Unit converters, timer, word counters, and quick daily utilities.",
    href: "/tools/utilities",
    icon: "Wrench",
    toolCount: 14,
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
    id: "pdf-to-word",
    name: "PDF to Word",
    description: "Convert PDF documents to editable Word (.docx) files.",
    href: "/tools/pdf/to-word",
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
    name: "PDF to JPG",
    description: "Export every PDF page as a high-quality JPG image file.",
    href: "/tools/pdf/to-jpg",
    icon: "FileImage",
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
    name: "GPA Calculator",
    description: "Calculate semester and cumulative GPA quickly.",
    href: "/tools/student/gpa",
    icon: "Calculator",
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
