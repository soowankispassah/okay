import { Providers } from "./providers";
import { ThemeScript } from "./theme-script";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "KhasiGPT",
  description: "A secure and modern authentication system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-white dark:bg-[#101010] text-gray-900 dark:text-gray-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
