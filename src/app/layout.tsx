import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFC PRO",
  description: "Gestão de placas NFC, QR Codes e clientes.",
  applicationName: "NFC PRO",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/nfc-pro-icon.svg", apple: "/nfc-pro-icon.svg" },
  appleWebApp: { capable: true, title: "NFC PRO", statusBarStyle: "default" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eef2f8"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
