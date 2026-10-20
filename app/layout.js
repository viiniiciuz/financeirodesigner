import "./globals.css";

export const metadata = {
  title: "Zentrix Flow",
  description: "Financeiro, demandas e contratos para quem presta serviço",
  manifest: "/manifest.webmanifest?v=2",
  icons: {
    icon: [
      { url: "/icons/icon.svg?v=1", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/icons/favicon-dark-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [{ url: "/icons/apple-touch-icon-v1.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "Zentrix Flow", statusBarStyle: "black-translucent" },
};

export const viewport = { colorScheme: "light dark" };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script src="/theme.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
