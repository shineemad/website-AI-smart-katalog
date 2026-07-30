import type { Metadata } from "next";
import { DM_Sans, Fragment_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Preloader } from "@/components/preloader";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  display: "swap",
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fragment",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KATALIS AI, Katalog yang berpikir",
  description:
    "Katalog produk elektronik dengan AI advisor. Temukan produk yang tepat lebih cepat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${spaceGrotesk.variable} ${dmSans.variable} ${fragmentMono.variable} font-body antialiased`}
      >
        <Preloader />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
