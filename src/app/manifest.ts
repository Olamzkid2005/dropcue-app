import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dropcue",
    short_name: "Dropcue",
    description: "Sell digital products and deliver them securely.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfa",
    theme_color: "#3a30c7",
    lang: "en",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
