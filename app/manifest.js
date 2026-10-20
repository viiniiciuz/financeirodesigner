export default function manifest() {
  return {
    name: "Zentrix Flow",
    short_name: "Zentrix Flow",
    description: "Financeiro, demandas e contratos para quem presta serviço",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#032446",
    theme_color: "#032446",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
