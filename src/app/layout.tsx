import type { Metadata } from "next";
import { Inter, Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ENLACE Digital Intelligence",
  description: "Construimos infraestructuras que interceptan la demanda y la convierten en oportunidades reales para tu negocio.",
  keywords: ["agencia digital", "inteligencia artificial", "captación de clientes", "sistemas digitales"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased bg-dark-bg text-text-light">
        {children}
      </body>
    </html>
  );
}
