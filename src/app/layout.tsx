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
  title: {
    default: "Project Name — Free Online Tools",
    template: "%s | Project Name",
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
  authors: [{ name: "Project Name" }],
  creator: "Project Name",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Project Name — Free Online Tools",
    description:
      "PDF converters, QR codes, image editors, calculators, and more — no sign-up needed.",
    siteName: "Project Name",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Name — Free Online Tools",
    description: "All the tools you need, in one place.",
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
