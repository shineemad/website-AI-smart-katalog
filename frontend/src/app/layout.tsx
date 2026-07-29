import type { Metadata } from "next";
import { Archivo, Fragment_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Preloader } from "@/components/preloader";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
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
        className={`${archivo.variable} ${fragmentMono.variable} font-body antialiased`}
      >
        <Preloader />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
