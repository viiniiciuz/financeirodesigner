import "./globals.css";

export const metadata = {
  title: "Zentrix Flow",
  description: "Financeiro, demandas e contratos para quem presta serviço",
  manifest: "/manifest.webmanifest?v=5",
  icons: {
    icon: [
      { url: "/icons/favicon-light.svg?v=4", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/icons/favicon-dark.svg?v=4", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
      { url: "/icons/favicon-32.png?v=4", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/icons/favicon-dark-32.png?v=4", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [{ url: "/icons/apple-touch-icon-v4.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "Zentrix Flow", statusBarStyle: "black-translucent" },
};

export const viewport = { colorScheme: "light dark" };

import { headers } from "next/headers";

export default async function RootLayout({ children }) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script src="/theme.js" nonce={nonce} />
      </head>
      <body>{children}</body>
    </html>
  );
}
