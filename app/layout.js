import "./globals.css";

export const metadata = {
  title: "Zentrix Flow",
  description: "Financeiro, demandas e contratos para quem presta serviço",
  icons: {
    icon: [{ url: "/icon-dark.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "1024x1024", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "Zentrix Flow", statusBarStyle: "black-translucent" },
};

export const viewport = { themeColor: "#011121" };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('zf-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
