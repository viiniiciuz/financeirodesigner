"use client";
import { useState } from "react";
import { MessageCircle, Copy, Check } from "lucide-react";
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
  const [msg, setMsg] = useState(() => montarMensagem(item, config));
  const [tel, setTel] = useState(item.telefone || "");
  const [copiado, setCopiado] = useState(false);

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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={copiar}>{copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "Copiado" : "Copiar mensagem"}</Button>
          <Button onClick={() => window.open(linkWhatsApp(tel, msg), "_blank", "noopener")}><MessageCircle size={14} /> Abrir no WhatsApp</Button>
        </div>
      </div>
    </Modal>
  );
}
