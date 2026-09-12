import "./globals.css";

export const metadata = {
  title: "Gestão Financeira | Designer",
  description: "Sistema de gestão para designer freelancer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
