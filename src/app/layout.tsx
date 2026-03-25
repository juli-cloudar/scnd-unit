import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConfirmProvider } from '@/components/ConfirmDialog';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SCND UNIT | Streetwear & Vintage aus Bad Kreuznach",
  description: "Kuratiertes Vintage Reselling aus Bad Kreuznach. Streetwear, Y2K, Gorpcore – Nike, Adidas, Tommy Hilfiger und mehr. Schneller Versand innerhalb 48h.",
  keywords: "vintage streetwear, secondhand jacken, nike vintage, adidas vintage, tommy hilfiger, bad kreuznach, y2k mode, gorpcore",
  verification: {
    google: "BQOclTNVJVpwKdW0Z5I9HV8CPWipPAg6IaNj_24NHSI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </body>
    </html>
  );
}
