"use client";
import { useState } from "react";
import { MessageCircle, Copy, Check, Link2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { inferirTipo } from "@/lib/pix";
import { useAuth } from "@/lib/useAuth";
import { Modal, Button, Field, Input, TextArea } from "@/components/ui";
import { toBRL, toBRDate, linkWhatsApp } from "@/lib/helpers";

function montarMensagem(item, config) {
  const nome = (item.contato || item.nome || "").trim().split(" ")[0];
  const valor = toBRL(item.saldo);
  const parcial = item.total && item.saldo < item.total;
  const servico = item.servico ? ` de ${item.servico}` : "";
  const venc = item.vencimento ? toBRDate(item.vencimento) : null;
  const corpo = item.status === "atrasado"
    ? `Passando para lembrar do pagamento${servico}${parcial ? " (saldo restante)" : ""} de ${valor}${venc ? `, que venceu em ${venc}` : ", que está em aberto"}. Se já realizou o pagamento, me envie o comprovante, por favor.`
    : `Passando para lembrar do pagamento${servico}${parcial ? " (saldo restante)" : ""}: ${valor}${venc ? `, com vencimento em ${venc}` : ""}.`;
  const pix = config?.chave_pix ? `\n\nChave Pix: ${config.chave_pix}${config.nome ? `\nFavorecido: ${config.nome}` : ""}` : "";
  return `Olá${nome ? `, ${nome}` : ""}! Tudo bem?\n\n${corpo}${pix}\n\nQualquer dúvida, é só me chamar. Obrigado!`;
}

export default function CobrancaModal({ item, config, onClose }) {
  const { userId } = useAuth();
  const [msg, setMsg] = useState(() => montarMensagem(item, config));
  const [tel, setTel] = useState(item.telefone || "");
  const [copiado, setCopiado] = useState(false);
  const [link, setLink] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erroLink, setErroLink] = useState("");

  const novoToken = () => { const a = new Uint8Array(18); crypto.getRandomValues(a); return Array.from(a, (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join(""); };

  const gerarLink = async () => {
    setGerando(true); setErroLink("");
    const token = novoToken();
    const { error } = await supabase.from("cobranca_links").insert({
      token, user_id: userId, cliente: item.nome, servico: item.servico || null, valor: item.saldo,
      vencimento: item.vencimento || null, profissional: config?.nome || config?.nome_profissional || null,
      telefone: config?.telefone || null, pix_chave: config?.chave_pix || null,
      pix_tipo: config?.pix_tipo || inferirTipo(config?.chave_pix), pix_nome: config?.nome || null, pix_cidade: config?.pix_cidade || null,
    });
    setGerando(false);
    if (error) { setErroLink(/cobranca_links|schema cache|relation/.test(error.message) ? "Falta rodar a migração 004 no Supabase (SQL Editor)." : "Não foi possível gerar o link: " + error.message); return; }
    const url = `${window.location.origin}/c/${token}`;
    setLink(url);
    setMsg((m) => m.replace(/\n\nQualquer dúvida/, `\n\nPague pelo link (QR Code e Pix copia e cola): ${url}\n\nQualquer dúvida`));
  };

  const copiar = async () => {
    try { await navigator.clipboard.writeText(msg); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }
    catch { alert("Não foi possível copiar. Selecione o texto e copie manualmente."); }
  };

  return (
    <Modal title={`Cobrar ${item.nome}`} onClose={onClose} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="WhatsApp do cliente">
          <Input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="(61) 99999-9999 — deixe em branco para escolher o contato no WhatsApp" />
        </Field>
        <Field label="Mensagem (pode editar antes de enviar)">
          <TextArea value={msg} onChange={(e) => setMsg(e.target.value)} style={{ minHeight: 210 }} />
        </Field>
        {!config?.chave_pix && (
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Sua chave Pix ainda não está cadastrada, então ela não entra na mensagem. Cadastre em <a href="/configuracoes" style={{ color: "var(--accent-text)", fontWeight: 600 }}>Configurações</a>.</div>
        )}
        <div style={{ background: "var(--surface2)", borderRadius: 16, padding: "12px 14px", fontSize: 12.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Link de cobrança</div>
          {link ? (
            <div style={{ color: "var(--muted)", wordBreak: "break-all" }}>O cliente abre sem login e vê valor, prazo e Pix com QR Code. Já incluí o link na mensagem: <a href={link} target="_blank" rel="noreferrer" style={{ color: "var(--accent-text)", fontWeight: 600 }}>{link}</a> (válido por 30 dias)</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "var(--muted)", flex: 1, minWidth: 200 }}>Uma página para o cliente ver valor, prazo e pagar por Pix (QR Code e copia e cola).</span>
              <Button size="sm" variant="secondary" onClick={gerarLink} disabled={gerando || !config?.chave_pix}><Link2 size={13} /> {gerando ? "Gerando…" : "Gerar link"}</Button>
            </div>
          )}
          {!config?.chave_pix && !link && <div style={{ color: "var(--muted)", marginTop: 6 }}>Cadastre sua chave Pix em Configurações para gerar o link.</div>}
          {erroLink && <div style={{ color: "var(--danger)", marginTop: 6 }}>{erroLink}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={copiar}>{copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "Copiado" : "Copiar mensagem"}</Button>
          <Button onClick={() => window.open(linkWhatsApp(tel, msg), "_blank", "noopener")}><MessageCircle size={14} /> Abrir no WhatsApp</Button>
        </div>
      </div>
    </Modal>
  );
}
