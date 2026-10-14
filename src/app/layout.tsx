import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const bricolage = Bricolage_Grotesque({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://toolkit-two-sage.vercel.app"),
  title: {
    default: "ToolKit — Free Online Tools",
    template: "%s | ToolKit",
  },
  description:
    "PDF converters, QR code generators, image editors, student tools, developer utilities, and everyday tools — free, no sign-up needed.",
  keywords: [
    "online tools",
    "pdf tools",
    "qr code generator",
    "image tools",
    "developer tools",
    "student tools",
    "free tools",
  ],
  authors: [{ name: "ToolKit" }],
  creator: "ToolKit",
  icons: {
    icon: [
      { url: "/fevicon1.ico", sizes: "any" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/fevicon1.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "ToolKit — Free Online Tools",
    description:
      "PDF converters, QR codes, image editors, calculators, and more — no sign-up needed.",
    siteName: "ToolKit",
    images: [{ url: "/icon.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolKit — Free Online Tools",
    description: "All the tools you need, in one place.",
    images: ["/icon.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
