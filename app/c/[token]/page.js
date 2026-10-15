"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { Copy, Check, MessageCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toBRL, toBRDate, todayISO } from "@/lib/helpers";
import { gerarPixCopiaECola, inferirTipo } from "@/lib/pix";
import { Button, ThemeToggle } from "@/components/ui";

function Linha({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{children}</span>
    </div>
  );
}

export default function CobrancaPublica() {
  const { token } = useParams();
  const [dados, setDados] = useState(undefined); // undefined = carregando, null = não encontrado
  const [qr, setQr] = useState("");
  const [copiado, setCopiado] = useState("");

  useEffect(() => {
    if (!token) return;
    supabase.rpc("get_cobranca", { p_token: String(token) }).then(({ data, error }) => setDados(error ? null : data || null));
  }, [token]);

  const payload = dados?.pix_chave
    ? gerarPixCopiaECola({ chave: dados.pix_chave, tipo: dados.pix_tipo || inferirTipo(dados.pix_chave), nome: dados.pix_nome || dados.profissional, cidade: dados.pix_cidade, valor: dados.valor })
    : "";

  useEffect(() => {
    if (!payload) return;
    QRCode.toDataURL(payload, { margin: 1, width: 280, errorCorrectionLevel: "M" }).then(setQr).catch(() => setQr(""));
  }, [payload]);

  const copiar = async (texto, chave) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(chave); setTimeout(() => setCopiado(""), 2000); }
    catch { alert("Não foi possível copiar. Selecione o texto e copie manualmente."); }
  };

  const vencido = dados?.vencimento && dados.vencimento < todayISO();
  const avisar = dados?.telefone
    ? `https://wa.me/${String(dados.telefone).replace(/\D/g, "").replace(/^(\d{10,11})$/, "55$1")}?text=${encodeURIComponent(`Olá! Já fiz o pagamento de ${toBRL(dados.valor)}${dados.servico ? ` (${dados.servico})` : ""}. Segue o comprovante.`)}`
    : "";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px 40px" }}>
      <div style={{ width: "100%", maxWidth: 440, display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><ThemeToggle /></div>
      <div className="card" style={{ width: "100%", maxWidth: 440, padding: 26 }}>
        {dados === undefined && <div style={{ color: "var(--muted)", textAlign: "center", padding: 30 }}>Carregando…</div>}
        {dados === null && (
          <div style={{ textAlign: "center", padding: "24px 6px" }}>
            <Clock size={28} style={{ color: "var(--muted)" }} />
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 12 }}>Link indisponível</div>
            <div style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 6 }}>Este link não existe ou já expirou. Peça um novo link a quem enviou a cobrança.</div>
          </div>
        )}
        {dados && (
          <>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Cobrança de {dados.profissional || "prestador de serviço"}</div>
            <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", margin: "6px 0 14px" }}>{toBRL(dados.valor)}</div>
            <div>
              {dados.cliente && <Linha label="Cliente">{dados.cliente}</Linha>}
              {dados.servico && <Linha label="Serviço">{dados.servico}</Linha>}
              {dados.vencimento && <Linha label="Vencimento"><span style={{ color: vencido ? "var(--danger)" : "inherit" }}>{toBRDate(dados.vencimento)}{vencido ? " (vencido)" : ""}</span></Linha>}
            </div>
            {dados.descricao && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, whiteSpace: "pre-wrap" }}>{dados.descricao}</div>}

            {payload ? (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Pague com Pix</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                  {qr && <img src={qr} alt="QR Code do Pix" width={220} height={220} style={{ background: "#fff", padding: 8, borderRadius: 14 }} />}
                </div>
                <Button onClick={() => copiar(payload, "codigo")} style={{ width: "100%", justifyContent: "center" }}>
                  {copiado === "codigo" ? <Check size={15} /> : <Copy size={15} />} {copiado === "codigo" ? "Código copiado" : "Copiar código Pix (copia e cola)"}
                </Button>
                <div style={{ fontSize: 12, color: "var(--muted)", margin: "10px 2px 0", textAlign: "center" }}>
                  No app do seu banco: Pix &rarr; Pagar com QR Code ou Pix copia e cola.
                </div>
                <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface2)", borderRadius: 14, fontSize: 12.5 }}>
                  <div style={{ color: "var(--muted)", marginBottom: 2 }}>Chave Pix{dados.pix_nome ? ` — ${dados.pix_nome}` : ""}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, wordBreak: "break-all" }}>{dados.pix_chave}</span>
                    <button onClick={() => copiar(dados.pix_chave, "chave")} style={{ background: "none", border: "none", color: "var(--accent-text)", fontWeight: 700, cursor: "pointer", fontSize: 12.5, flexShrink: 0 }}>{copiado === "chave" ? "Copiada" : "Copiar"}</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 20, fontSize: 13.5, color: "var(--muted)" }}>Combine a forma de pagamento diretamente com {dados.profissional || "o prestador"}.</div>
            )}

            {avisar && (
              <a href={avisar} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 16 }}>
                <Button variant="secondary" style={{ width: "100%", justifyContent: "center" }}><MessageCircle size={15} /> Já paguei — avisar no WhatsApp</Button>
              </a>
            )}
          </>
        )}
      </div>
      <div style={{ marginTop: 18, fontSize: 12, color: "var(--muted)" }}>Gerado com Zentrix Flow</div>
    </div>
  );
}
