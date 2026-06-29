import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Providers from "@/components/providers";
import { Header } from "./components/layout/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = new URL(
  process.env.NEXT_PUBLIC_WEBAPP_URL! || "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase: APP_URL,
  title: "Worship Library",
  description: "Бібліотека християнських пісень",
  openGraph: {
    title: "Worship Library",
    description: "Бібліотека християнських пісень",
    url: APP_URL,
    siteName: "Worship Library",
    images: [
      {
        url: "/opengraph-image.webp",
        width: 1200,
        height: 630,
        alt: "Worship Library",
      },
    ],
    type: "website",
    locale: "uk_UA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Worship Library",
    description: "Бібліотека християнських пісень",
    images: [
      {
        url: "/opengraph-image.webp",
        width: 1200,
        height: 630,
        alt: "Worship Library",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <Providers>
          <Header />

          <main className="flex min-h-dvh max-w-[1920px] m-auto w-full flex-col items-center px-4 -mt-14 pt-18 text-foreground pb-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
