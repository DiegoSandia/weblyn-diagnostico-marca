import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebLynMX Brand Diagnosis",
  description: "Diagnóstico estratégico de marca con análisis generado por OpenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
