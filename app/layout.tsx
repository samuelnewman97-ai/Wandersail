import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-stamp",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Wandersail — Katie's Travel Journal",
  description: "Plan unforgettable trips, one stamp at a time.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Wandersail",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1e5f5a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${bebas.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
