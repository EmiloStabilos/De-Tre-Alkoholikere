import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TasterProvider } from "@/components/TasterProvider";

export const metadata: Metadata = {
  title: "De Tre Alkoholikere",
  description: "Smagning og bedømmelse af øl, vin, vermouth og meget mere.",
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body className="min-h-screen antialiased">
        <TasterProvider>{children}</TasterProvider>
      </body>
    </html>
  );
}
