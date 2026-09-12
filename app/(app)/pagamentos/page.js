"use client";
import { useEffect, useState } from "react";
import { Paperclip, FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Card, EmptyState, Tag, Badge } from "@/components/ui";
import { STATUS_FIN, toBRL, toBRDate, statusFinanceiroEmpresa } from "@/lib/helpers";

export default function PagamentosPage() {
  const { userId } = useAuth();
  const [rows, setRows] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [{ data: pf }, { data: df }, { data: te }, { data: emp }] = await Promise.all([
      supabase.from("pagamentos_freela").select("*"),
      supabase.from("demandas_freela").select("id, cliente, servico, servico_custom"),
      supabase.from("trabalhos_empresa").select("*"),
      supabase.from("empresas").select("*"),
    ]);
    const empresasMap = Object.fromEntries((emp || []).map((e) => [e.id, e]));
    const demandasMap = Object.fromEntries((df || []).map((d) => [d.id, d]));
    const list = [];
    (pf || []).forEach((p) => { const d = demandasMap[p.demanda_id]; list.push({ data: p.data, nome: d?.cliente || "—", tag: null, tipo: "Freelancer", servico: d ? (d.servico === "Outros" ? d.servico_custom : d.servico) : "—", valor: p.valor, forma: p.forma, status: "pago", comprovante: p.comprovante_url, nf: null }); });
    (te || []).forEach((t) => { const e = empresasMap[t.empresa_id]; list.push({ data: t.pago ? (t.data_pagamento || t.data) : (t.data_prevista_pagamento || t.data), nome: e?.nome || "—", tag: e, tipo: "Empresa", servico: t.servico, valor: t.valor, forma: t.forma_pagamento || "—", status: statusFinanceiroEmpresa(t), comprovante: t.comprovante_url, nf: t.nf_arquivo_url }); });
    list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    setRows(list); setLoading(false);
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
