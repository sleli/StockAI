import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Cormorant_Garamond } from "next/font/google";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "StockAI",
  description: "Calm market intelligence for retail investors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        ibmPlexSans.variable,
        cormorantGaramond.variable,
        ibmPlexMono.variable
      )}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
