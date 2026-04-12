import type { Metadata } from "next";
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
