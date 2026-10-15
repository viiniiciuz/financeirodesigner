import "./globals.css";

export const metadata = {
  title: "Zentrix Flow",
  description: "Financeiro, demandas e contratos para quem presta serviço",
};

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
