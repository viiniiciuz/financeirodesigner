import { NextResponse } from "next/server";

// CSP com nonce por requisição: scripts só executam se tiverem o nonce
// (sem 'unsafe-inline' em script-src). Estilos inline continuam permitidos
// porque o React usa o atributo style.
export function proxy(request) {
  const nonce = btoa(crypto.randomUUID());
  const supa = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let origin = "https://*.supabase.co";
  try { if (supa) origin = new URL(supa).origin; } catch {}
  const host = origin.replace(/^https?:\/\//, "");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${origin}`,
    "font-src 'self' data:",
    `connect-src 'self' ${origin} wss://${host} https://challenges.cloudflare.com`,
    `frame-src 'self' https://challenges.cloudflare.com ${origin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [{
    source: "/((?!_next/static|_next/image|icons/|fonts/|logo-horizontal|theme\\.js|favicon).*)",
    missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }],
  }],
};
