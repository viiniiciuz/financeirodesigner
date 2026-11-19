/** @type {import('next').NextConfig} */
const seguranca = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      // Todas as rotas: cabeçalhos de segurança (a CSP com nonce vem do proxy.js)
      { source: "/:path*", headers: seguranca },
      // Páginas do app: nunca guardar em cache compartilhado/CDN
      {
        source: "/((?!_next/static|_next/image|icons/|fonts/|logo-horizontal|theme\\.js).*)",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
