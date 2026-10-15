"use client";
import { useEffect, useState } from "react";
import { Paperclip, FileText, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Card, EmptyState, Tag, Badge, Button } from "@/components/ui";
import CobrancaModal from "@/components/CobrancaModal";
import { STATUS_FIN, toBRL, toBRDate, statusFinanceiroEmpresa, statusFinanceiroFreela, sumPagamentos } from "@/lib/helpers";

export default function PagamentosPage() {
  const { userId } = useAuth();
  const [rows, setRows] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [receber, setReceber] = useState([]);
  const [config, setConfig] = useState(null);
  const [cobrando, setCobrando] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [{ data: pf }, { data: df }, { data: te }, { data: emp }, { data: cli }, { data: cfg }] = await Promise.all([
      supabase.from("pagamentos_freela").select("*"),
      supabase.from("demandas_freela").select("*"),
      supabase.from("trabalhos_empresa").select("*"),
      supabase.from("empresas").select("*"),
      supabase.from("clientes").select("*"),
      supabase.from("config").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    setConfig(cfg || null);
    const empresasMap = Object.fromEntries((emp || []).map((e) => [e.id, e]));
    const demandasMap = Object.fromEntries((df || []).map((d) => [d.id, d]));
    const list = [];
    (pf || []).forEach((p) => { const d = demandasMap[p.demanda_id]; list.push({ data: p.data, nome: d?.cliente || "—", tag: null, tipo: "Freelancer", servico: d ? (d.servico === "Outros" ? d.servico_custom : d.servico) : "—", valor: p.valor, forma: p.forma, status: "pago", comprovante: p.comprovante_url, nf: null }); });
    (te || []).forEach((t) => { const e = empresasMap[t.empresa_id]; list.push({ data: t.pago ? (t.data_pagamento || t.data) : (t.data_prevista_pagamento || t.data), nome: e?.nome || "—", tag: e, tipo: "Empresa", servico: t.servico, valor: t.valor, forma: t.forma_pagamento || "—", status: statusFinanceiroEmpresa(t), comprovante: t.comprovante_url, nf: t.nf_arquivo_url }); });
    list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    setRows(list);

    // A receber: saldos em aberto de freelas e trabalhos de empresa
    const clientesMap = Object.fromEntries((cli || []).map((c) => [(c.nome || "").trim().toLowerCase(), c]));
    const pagsPor = {};
    (pf || []).forEach((x) => { (pagsPor[x.demanda_id] = pagsPor[x.demanda_id] || []).push(x); });
    const abertos = [];
    (df || []).forEach((d) => {
      const pags = pagsPor[d.id] || [];
      const st = statusFinanceiroFreela(d, pags);
      const saldo = Math.max(0, Number(d.valor_total || 0) - sumPagamentos(pags));
      if (st === "pago" || st === "cancelado" || saldo <= 0) return;
      abertos.push({ key: "f" + d.id, nome: d.cliente, servico: d.servico === "Outros" ? d.servico_custom : d.servico, saldo, total: Number(d.valor_total || 0), vencimento: d.vencimento_pagamento, status: st, telefone: clientesMap[(d.cliente || "").trim().toLowerCase()]?.whatsapp || "" });
    });
    (te || []).forEach((t) => {
      const st = statusFinanceiroEmpresa(t);
      if (st === "pago" || st === "cancelado") return;
      const e = empresasMap[t.empresa_id];
      abertos.push({ key: "e" + t.id, nome: e?.nome || "—", contato: e?.responsavel || "", servico: t.servico, saldo: Number(t.valor || 0), total: Number(t.valor || 0), vencimento: t.data_prevista_pagamento, status: st, telefone: e?.telefone || "" });
    });
    abertos.sort((a, b) => (a.status === "atrasado" ? 0 : 1) - (b.status === "atrasado" ? 0 : 1) || (a.vencimento || "9999").localeCompare(b.vencimento || "9999"));
    setReceber(abertos);
    setLoading(false);
  }

  const filtered = rows.filter((r) => filtro === "todos" || r.status === filtro || (filtro === "freelancer" && r.tipo === "Freelancer") || (filtro === "empresa" && r.tipo === "Empresa"));

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Pagamentos</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["todos", "Todos"], ["freelancer", "Freelancer"], ["empresa", "Empresa"], ["pago", "Pago"], ["pendente", "Pendente"], ["parcial", "Parcial"], ["atrasado", "Atrasado"]].map(([k, l]) => (
            <button key={k} className={`chip ${filtro === k ? "chip-active" : ""}`} onClick={() => setFiltro(k)}>{l}</button>
          ))}
        </div>
      </div>
      {!loading && receber.length > 0 && (
        <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "16px 18px 6px", display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>A receber</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Total em aberto: <b style={{ color: "var(--text)" }}>{toBRL(receber.reduce((a, r) => a + r.saldo, 0))}</b></div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Cliente / Empresa</th><th>Serviço</th><th>Em aberto</th><th>Vencimento</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {receber.map((r) => (
                  <tr key={r.key}>
                    <td data-label="Cliente/Empresa">{r.nome}</td>
                    <td data-label="Serviço">{r.servico || "—"}</td>
                    <td data-label="Em aberto" style={{ fontWeight: 600 }}>{toBRL(r.saldo)}</td>
                    <td data-label="Vencimento">{toBRDate(r.vencimento)}</td>
                    <td data-label="Status"><Badge color={STATUS_FIN[r.status].color} bg={STATUS_FIN[r.status].bg}>{STATUS_FIN[r.status].label}</Badge></td>
                    <td data-label=""><Button size="sm" variant={r.status === "atrasado" ? "primary" : "secondary"} onClick={() => setCobrando(r)}><MessageCircle size={13} /> Cobrar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {cobrando && <CobrancaModal item={cobrando} config={config} onClose={() => setCobrando(null)} />}
      <div style={{ fontWeight: 700, fontSize: 15, margin: "4px 2px 10px" }}>Histórico</div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>Carregando…</div> : filtered.length === 0 ? <EmptyState text="Nenhum pagamento encontrado." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Data</th><th>Cliente / Empresa</th><th>Tipo</th><th>Serviço</th><th>Valor</th><th>Forma</th><th>Status</th><th>Arquivos</th></tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td data-label="Data">{toBRDate(r.data)}</td>
                    <td data-label="Cliente/Empresa">{r.tag ? <Tag nome={r.tag.nome} cor={r.tag.cor} /> : r.nome}</td>
                    <td data-label="Tipo">{r.tipo}</td>
                    <td data-label="Serviço">{r.servico}</td>
                    <td data-label="Valor">{toBRL(r.valor)}</td>
                    <td data-label="Forma">{r.forma}</td>
                    <td data-label="Status"><Badge color={STATUS_FIN[r.status].color} bg={STATUS_FIN[r.status].bg}>{STATUS_FIN[r.status].label}</Badge></td>
                    <td data-label="Arquivos" style={{ display: "flex", gap: 8 }}>
                      {r.comprovante && <a href={r.comprovante} target="_blank" rel="noreferrer" style={{ color: "var(--muted)" }} title="Comprovante"><Paperclip size={14} /></a>}
                      {r.nf && <a href={r.nf} target="_blank" rel="noreferrer" style={{ color: "var(--muted)" }} title="Nota fiscal"><FileText size={14} /></a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
