"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Wallet, Paperclip } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { uploadArquivo, removeArquivo } from "@/lib/storage";
import { Button, Card, EmptyState, IconBtn, Badge, Modal, Field, Input, Select, TextArea, CurrencyInput, StatCard, FileField } from "@/components/ui";
import { SERVICO_TIPOS, FORMAS_PAGAMENTO, STATUS_TRABALHO, STATUS_FIN, toBRL, toBRDate, todayISO, sumPagamentos, statusFinanceiroFreela } from "@/lib/helpers";

export default function FreelaPage() {
  const { userId } = useAuth();
  const [demandas, setDemandas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [payModal, setPayModal] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [{ data: d }, { data: p }, { data: c }] = await Promise.all([
      supabase.from("demandas_freela").select("*").order("data_contratacao", { ascending: false }),
      supabase.from("pagamentos_freela").select("*"),
      supabase.from("clientes").select("*"),
    ]);
    setDemandas(d || []); setPagamentos(p || []); setClientes(c || []);
    setLoading(false);
  }

  const pagamentosDe = (demandaId) => pagamentos.filter((p) => p.demanda_id === demandaId);

  const saveItem = async (item, entrada) => {
    const payload = { ...item, user_id: userId };
    let demandaId = item.id;
    if (item.id) { await supabase.from("demandas_freela").update(payload).eq("id", item.id); }
    else {
      delete payload.id;
      const { data, error } = await supabase.from("demandas_freela").insert(payload).select().single();
      if (error) { alert("Erro ao salvar: " + error.message); return; }
      demandaId = data.id;
    }
    if (entrada && entrada.valor > 0) {
      await supabase.from("pagamentos_freela").insert({ demanda_id: demandaId, user_id: userId, valor: entrada.valor, data: item.data_contratacao, forma: entrada.forma, descricao: "Entrada / início" });
    }
    setModal(null); load();
  };
  const removeItem = async (id) => { if (!confirm("Excluir esta demanda?")) return; await supabase.from("demandas_freela").delete().eq("id", id); load(); };

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Demandas Freela</div>
        <Button onClick={() => setModal({})}><Plus size={14} /> Nova demanda</Button>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>Carregando…</div> : demandas.length === 0 ? (
          <EmptyState text="Nenhuma demanda cadastrada ainda." action={<Button onClick={() => setModal({})}><Plus size={14} /> Criar primeira demanda</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Cliente</th><th>Serviço</th><th>Data</th><th>Prazo</th><th>Total</th><th>Recebido</th><th>Restante</th><th>Financeiro</th><th>Trabalho</th><th></th></tr></thead>
              <tbody>
                {demandas.map((item) => {
                  const pags = pagamentosDe(item.id);
                  const rec = sumPagamentos(pags);
                  const rest = Math.max(0, Number(item.valor_total) - rec);
                  const stFin = statusFinanceiroFreela(item, pags);
                  const stTrab = STATUS_TRABALHO.find((s) => s.value === item.status_trabalho);
                  return (
                    <tr key={item.id}>
                      <td data-label="Cliente" style={{ fontWeight: 600 }}>{item.cliente}</td>
                      <td data-label="Serviço">{item.servico === "Outros" ? item.servico_custom : item.servico}</td>
                      <td data-label="Data">{toBRDate(item.data_contratacao)}</td>
                      <td data-label="Prazo">{toBRDate(item.prazo_entrega)}</td>
                      <td data-label="Total">{toBRL(item.valor_total)}</td>
                      <td data-label="Recebido">{toBRL(rec)}</td>
                      <td data-label="Restante">{toBRL(rest)}</td>
                      <td data-label="Financeiro"><Badge color={STATUS_FIN[stFin].color} bg={STATUS_FIN[stFin].bg}>{STATUS_FIN[stFin].label}</Badge></td>
                      <td data-label="Trabalho"><Badge color={stTrab?.color} bg={`${stTrab?.color}22`}>{stTrab?.label}</Badge></td>
                      <td data-label="" style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <IconBtn icon={Wallet} title="Pagamentos" onClick={() => setPayModal(item)} />
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
      {modal && <DemandaForm item={modal} clientes={clientes} onClose={() => setModal(null)} onSave={saveItem} />}
      {payModal && <PagamentosModal userId={userId} item={payModal} pagamentos={pagamentosDe(payModal.id)} onClose={() => setPayModal(null)} onChange={load} />}
    </div>
  );
}

function DemandaForm({ item, clientes, onClose, onSave }) {
  const [f, setF] = useState({ cliente: "", servico: SERVICO_TIPOS[0], servico_custom: "", descricao: "", data_contratacao: todayISO(), prazo_entrega: "", vencimento_pagamento: "", valor_total: "", observacoes: "", status_trabalho: "nao_iniciado", ...item });
  const [entradaValor, setEntradaValor] = useState("");
  const [entradaForma, setEntradaForma] = useState(FORMAS_PAGAMENTO[0]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const isNew = !item.id;
  const restante = Math.max(0, (Number(f.valor_total) || 0) - (isNew ? Number(entradaValor) || 0 : 0));

  return (
    <Modal title={isNew ? "Nova demanda freela" : "Editar demanda"} onClose={onClose}>
      <div className="form-grid">
        <Field label="Nome do cliente" full>
          <Input list="clientes-list" value={f.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Digite ou selecione..." />
          <datalist id="clientes-list">{clientes.map((c) => <option key={c.id} value={c.nome} />)}</datalist>
        </Field>
        <Field label="Tipo de serviço"><Select value={f.servico} onChange={(e) => set("servico", e.target.value)}>{SERVICO_TIPOS.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
        {f.servico === "Outros" && <Field label="Especifique o serviço"><Input value={f.servico_custom || ""} onChange={(e) => set("servico_custom", e.target.value)} /></Field>}
        <Field label="Descrição" full><TextArea value={f.descricao || ""} onChange={(e) => set("descricao", e.target.value)} /></Field>
        <Field label="Data da contratação"><Input type="date" value={f.data_contratacao || ""} onChange={(e) => set("data_contratacao", e.target.value)} /></Field>
        <Field label="Prazo de entrega"><Input type="date" value={f.prazo_entrega || ""} onChange={(e) => set("prazo_entrega", e.target.value)} /></Field>
        <Field label="Vencimento do pagamento"><Input type="date" value={f.vencimento_pagamento || ""} onChange={(e) => set("vencimento_pagamento", e.target.value)} /></Field>
        <Field label="Valor total"><CurrencyInput value={f.valor_total} onChange={(v) => set("valor_total", v)} /></Field>
        {isNew && (
          <>
            <Field label="Valor pago (entrada / início)"><CurrencyInput value={entradaValor} onChange={setEntradaValor} /></Field>
            <Field label="Forma de pagamento da entrada"><Select value={entradaForma} onChange={(e) => setEntradaForma(e.target.value)}>{FORMAS_PAGAMENTO.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
          </>
        )}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 14, padding: "10px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11.5, color: "var(--muted)" }}>Pago na entrada</div><div style={{ fontWeight: 700, fontSize: 15, color: "#22C55E" }}>{toBRL(isNew ? entradaValor : 0)}</div></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11.5, color: "var(--muted)" }}>Valor restante</div><div style={{ fontWeight: 700, fontSize: 15, color: "#F59E0B" }}>{toBRL(restante)}</div></div>
        </div>
        <Field label="Status do trabalho"><Select value={f.status_trabalho} onChange={(e) => set("status_trabalho", e.target.value)}>{STATUS_TRABALHO.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></Field>
        <Field label="Observações" full><TextArea value={f.observacoes || ""} onChange={(e) => set("observacoes", e.target.value)} /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => { onSave({ ...f, valor_total: Number(f.valor_total) || 0 }, isNew ? { valor: Number(entradaValor) || 0, forma: entradaForma } : null); }}>Salvar</Button>
      </div>
    </Modal>
  );
}

function PagamentosModal({ userId, item, pagamentos, onClose, onChange }) {
  const [showAdd, setShowAdd] = useState(false);
  const rec = sumPagamentos(pagamentos);
  const rest = Math.max(0, Number(item.valor_total) - rec);

  const addPagamento = async (p) => {
    await supabase.from("pagamentos_freela").insert({ demanda_id: item.id, user_id: userId, ...p });
    setShowAdd(false); onChange();
  };
  const removePagamento = async (p) => { if (p.comprovante_path) await removeArquivo(p.comprovante_path); await supabase.from("pagamentos_freela").delete().eq("id", p.id); onChange(); };

  return (
    <Modal title={`Pagamentos — ${item.cliente}`} onClose={onClose}>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <StatCard label="Valor total" value={toBRL(item.valor_total)} />
        <StatCard label="Recebido" value={toBRL(rec)} accent="#22C55E" />
        <StatCard label="Restante" value={toBRL(rest)} accent="#F59E0B" />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Adicionar pagamento</Button>
      </div>
      {pagamentos.length === 0 ? <EmptyState text="Nenhum pagamento registrado." /> : (
        <div className="mini-table">
          {pagamentos.map((p) => (
            <div className="mini-row" key={p.id}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{toBRL(p.valor)} <span style={{ fontWeight: 400, color: "var(--muted)" }}>· {p.forma}</span></div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{toBRDate(p.data)} {p.descricao && `· ${p.descricao}`}</div>
              </div>
              {p.comprovante_url && <a href={p.comprovante_url} target="_blank" rel="noreferrer" style={{ color: "var(--muted)", marginRight: 8 }}><Paperclip size={14} /></a>}
              <IconBtn icon={Trash2} danger title="Excluir" onClick={() => removePagamento(p)} />
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddPagamentoForm userId={userId} max={rest} onCancel={() => setShowAdd(false)} onSave={addPagamento} />}
    </Modal>
  );
}

function AddPagamentoForm({ userId, onSave, onCancel }) {
  const [valor, setValor] = useState("");
  const [dataP, setDataP] = useState(todayISO());
  const [forma, setForma] = useState(FORMAS_PAGAMENTO[0]);
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState(null); // {path, signedUrl, name}
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (f) => {
    setUploading(true);
    try { setFile(await uploadArquivo(userId, f)); }
    catch (e) { alert("Erro no upload: " + e.message); }
    setUploading(false);
  };

  return (
    <div style={{ marginTop: 14, padding: 14, background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
      <div className="form-grid">
        <Field label="Valor"><CurrencyInput value={valor} onChange={setValor} /></Field>
        <Field label="Data"><Input type="date" value={dataP} onChange={(e) => setDataP(e.target.value)} /></Field>
        <Field label="Forma de pagamento"><Select value={forma} onChange={(e) => setForma(e.target.value)}>{FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}</Select></Field>
        <Field label="Descrição"><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></Field>
        <FileField label="Comprovante" fileUrl={file?.signedUrl} fileName={file?.name} uploading={uploading} onUpload={handleUpload} onRemove={() => setFile(null)} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={() => onSave({ valor: Number(valor) || 0, data: dataP, forma, descricao, comprovante_url: file?.signedUrl || null, comprovante_path: file?.path || null })}>Salvar pagamento</Button>
      </div>
    </div>
  );
}
