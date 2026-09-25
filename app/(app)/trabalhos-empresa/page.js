"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Button, Card, EmptyState, IconBtn, Tag, Badge, Modal, Field, Input, Select, TextArea, CurrencyInput } from "@/components/ui";
import { FORMAS_PAGAMENTO, STATUS_TRABALHO, STATUS_FIN, toBRL, toBRDate, todayISO, statusFinanceiroEmpresa, MESES_ABREV, limparVazios } from "@/lib/helpers";

export default function TrabalhosEmpresaPage() {
  const { userId } = useAuth();
  const [trabalhos, setTrabalhos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [{ data: t }, { data: e }] = await Promise.all([
      supabase.from("trabalhos_empresa").select("*").order("data", { ascending: false }),
      supabase.from("empresas").select("*"),
    ]);
    setTrabalhos(t || []); setEmpresas(e || []);
    setLoading(false);
  }
  const empresasMap = Object.fromEntries(empresas.map((e) => [e.id, e]));

  const saveItem = async (item) => {
    const payload = limparVazios({ ...item, user_id: userId }, ["valor"]);
    let error;
    if (item.id) ({ error } = await supabase.from("trabalhos_empresa").update(payload).eq("id", item.id));
    else { delete payload.id; ({ error } = await supabase.from("trabalhos_empresa").insert(payload)); }
    if (error) { alert("Não foi possível salvar: " + error.message); return; }
    setModal(null); load();
  };
  const removeItem = async (id) => { if (!confirm("Excluir este trabalho?")) return; await supabase.from("trabalhos_empresa").delete().eq("id", id); load(); };
  const marcarPago = async (item) => { await supabase.from("trabalhos_empresa").update({ pago: true, data_pagamento: todayISO() }).eq("id", item.id); load(); };

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Trabalhos de Empresa</div>
        <Button onClick={() => setModal({})}><Plus size={14} /> Novo trabalho</Button>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>Carregando…</div> : trabalhos.length === 0 ? (
          <EmptyState text="Nenhum trabalho de empresa cadastrado." action={<Button onClick={() => setModal({})}><Plus size={14} /> Criar primeiro trabalho</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Empresa</th><th>Serviço</th><th>Mês ref.</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Financeiro</th><th></th></tr></thead>
              <tbody>
                {trabalhos.map((item) => {
                  const emp = empresasMap[item.empresa_id];
                  const stFin = statusFinanceiroEmpresa(item);
                  const stTrab = STATUS_TRABALHO.find((s) => s.value === item.status);
                  return (
                    <tr key={item.id}>
                      <td data-label="Empresa">{emp ? <Tag nome={emp.nome} cor={emp.cor} /> : "—"}</td>
                      <td data-label="Serviço">{item.servico}</td>
                      <td data-label="Mês ref.">{item.mes_referencia ? `${MESES_ABREV[new Date(item.mes_referencia).getUTCMonth()]}/${new Date(item.mes_referencia).getUTCFullYear()}` : "—"}</td>
                      <td data-label="Valor">{toBRL(item.valor)}</td>
                      <td data-label="Vencimento">{toBRDate(item.data_prevista_pagamento)}</td>
                      <td data-label="Status"><Badge color={stTrab?.color} bg={`${stTrab?.color}22`}>{stTrab?.label}</Badge></td>
                      <td data-label="Financeiro"><Badge color={STATUS_FIN[stFin].color} bg={STATUS_FIN[stFin].bg}>{STATUS_FIN[stFin].label}</Badge></td>
                      <td data-label="" style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {!item.pago && <IconBtn icon={Check} title="Marcar como pago" onClick={() => marcarPago(item)} />}
                        <IconBtn icon={Pencil} title="Editar" onClick={() => setModal(item)} />
                        <IconBtn icon={Trash2} title="Excluir" danger onClick={() => removeItem(item.id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {modal && <TrabalhoForm userId={userId} item={modal} empresas={empresas} onClose={() => setModal(null)} onSave={saveItem} />}
    </div>
  );
}

function TrabalhoForm({ userId, item, empresas, onClose, onSave }) {
  const [f, setF] = useState({ empresa_id: empresas[0]?.id || "", servico: "", descricao: "", data: todayISO(), mes_referencia: todayISO().slice(0, 7) + "-01", valor: "", data_prevista_pagamento: "", status: "em_andamento", observacoes: "", pago: false, data_pagamento: "", forma_pagamento: FORMAS_PAGAMENTO[0], nf_numero: "", nf_data_emissao: "", ...item });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));


  return (
    <Modal title={item.id ? "Editar trabalho" : "Novo trabalho de empresa"} onClose={onClose}>
      <div className="form-grid">
        <Field label="Cliente / Empresa" full><Select value={f.empresa_id} onChange={(e) => set("empresa_id", e.target.value)}>{empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</Select></Field>
        <Field label="Serviço / Projeto"><Input value={f.servico} onChange={(e) => set("servico", e.target.value)} /></Field>
        <Field label="Data"><Input type="date" value={f.data || ""} onChange={(e) => set("data", e.target.value)} /></Field>
        <Field label="Descrição" full><TextArea value={f.descricao || ""} onChange={(e) => set("descricao", e.target.value)} /></Field>
        <Field label="Mês de referência"><Input type="month" value={(f.mes_referencia || "").slice(0, 7)} onChange={(e) => set("mes_referencia", e.target.value + "-01")} /></Field>
        <Field label="Valor"><CurrencyInput value={f.valor} onChange={(v) => set("valor", v)} /></Field>
        <Field label="Data prevista de pagamento"><Input type="date" value={f.data_prevista_pagamento || ""} onChange={(e) => set("data_prevista_pagamento", e.target.value)} /></Field>
        <Field label="Status"><Select value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUS_TRABALHO.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></Field>
        <Field label="Pago?"><Select value={f.pago ? "sim" : "nao"} onChange={(e) => set("pago", e.target.value === "sim")}><option value="nao">Não</option><option value="sim">Sim</option></Select></Field>
        {f.pago && <>
          <Field label="Data do pagamento"><Input type="date" value={f.data_pagamento || ""} onChange={(e) => set("data_pagamento", e.target.value)} /></Field>
          <Field label="Forma de pagamento"><Select value={f.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value)}>{FORMAS_PAGAMENTO.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
        </>}
        <Field label="Observações" full><TextArea value={f.observacoes || ""} onChange={(e) => set("observacoes", e.target.value)} /></Field>
        <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Nota fiscal</div>
          <div className="form-grid">
            <Field label="Número da NF"><Input value={f.nf_numero || ""} onChange={(e) => set("nf_numero", e.target.value)} /></Field>
            <Field label="Data de emissão"><Input type="date" value={f.nf_data_emissao || ""} onChange={(e) => set("nf_data_emissao", e.target.value)} /></Field>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave({ ...f, empresa_id: f.empresa_id || null, valor: Number(f.valor) || 0 })}>Salvar</Button>
      </div>
    </Modal>
  );
}
