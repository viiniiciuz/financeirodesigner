import "./globals.css";

export const metadata = {
  title: "Zentrix Flow",
  description: "Financeiro, demandas e contratos para quem presta serviço",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
