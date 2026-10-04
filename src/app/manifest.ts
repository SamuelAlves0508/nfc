import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NFC PRO",
    short_name: "NFC PRO",
    description: "Gestão de placas NFC, QR Codes e clientes.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef2f8",
    theme_color: "#eef2f8",
    orientation: "portrait",
    icons: [
      { src: "/nfc-pro-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/nfc-pro-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
