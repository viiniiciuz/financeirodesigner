export const dynamic = "force-static";

// Manifesto do app (PWA). Ao trocar ícones, mude os nomes dos arquivos e o ?v= em app/layout.js.
export function GET() {
  const manifest = {
    name: "Zentrix Flow",
    short_name: "Zentrix Flow",
    description: "Financeiro, demandas e contratos para quem presta serviço",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#032446",
    theme_color: "#032446",
    scope: "/",
    lang: "pt-BR",
    icons: [
      { src: "/icons/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } });
}
