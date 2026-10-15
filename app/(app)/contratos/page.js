"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Printer, Trash2, Save, FileSignature, BookmarkPlus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Card, EmptyState, Badge, Button, IconBtn, Modal, Field, Input, Select, TextArea, CurrencyInput } from "@/components/ui";
import Documento from "@/components/Documento";
import { toBRL, toBRDate, limparVazios } from "@/lib/helpers";
import { MODELOS, STATUS_CONTRATO, montarVars, preencher, virarModelo } from "@/lib/contratos";

const lerLocal = (k, def = "") => { try { return localStorage.getItem(k) || def; } catch { return def; } };
const gravarLocal = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

function nomeServico(d) { return d ? (d.servico === "Outros" ? d.servico_custom : d.servico) : ""; }

export default function ContratosPage() {
  const { userId } = useAuth();
  const [rows, setRows] = useState([]);
  const [demandas, setDemandas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [faltaMigracao, setFaltaMigracao] = useState(false);
  const [novo, setNovo] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [c, d, m, cfg] = await Promise.all([
      supabase.from("contratos").select("*").order("created_at", { ascending: false }),
      supabase.from("demandas_freela").select("*").order("created_at", { ascending: false }),
      supabase.from("contrato_modelos").select("*").order("created_at", { ascending: false }),
      supabase.from("config").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    setFaltaMigracao(!!(c.error || m.error));
    setRows(c.data || []); setDemandas(d.data || []); setModelos(m.data || []); setConfig(cfg.data || null);
    setLoading(false);
  }

  const excluir = async (r) => {
    if (!confirm(`Excluir "${r.titulo}"?`)) return;
    await supabase.from("contratos").delete().eq("id", r.id);
    load();
  };
  const mudarStatus = async (r, status) => {
    await supabase.from("contratos").update({ status, updated_at: new Date().toISOString() }).eq("id", r.id);
    setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status } : x)));
  };
  const demandaDe = (r) => demandas.find((d) => d.id === r.demanda_id);

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Contratos e propostas</div>
        <Button onClick={() => setNovo(true)} disabled={faltaMigracao}><Plus size={15} /> Novo contrato ou proposta</Button>
      </div>

      {faltaMigracao && (
        <Card style={{ padding: 16, marginBottom: 16, borderColor: "var(--danger)" }}>
          <b>Falta uma atualização no banco.</b> <span style={{ color: "var(--muted)", fontSize: 13.5 }}>Abra o Supabase &rarr; SQL Editor, cole o conteúdo do arquivo <code>supabase/migracao-004.sql</code> e clique em Run. Depois recarregue esta página.</span>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>Carregando…</div> : rows.length === 0 ? (
          <EmptyState text="Nenhum contrato ainda. Crie um a partir de uma demanda: cliente, valor e prazo entram sozinhos." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Documento</th><th>Cliente</th><th>Demanda</th><th>Valor</th><th>Prazo</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Documento"><button className="link-btn" style={{ fontWeight: 600 }} onClick={() => setEditando(r)}>{r.titulo}</button></td>
                    <td data-label="Cliente">{r.cliente || "—"}</td>
                    <td data-label="Demanda">{demandaDe(r) ? nomeServico(demandaDe(r)) || demandaDe(r).cliente : "—"}</td>
                    <td data-label="Valor">{r.valor ? toBRL(r.valor) : "—"}</td>
                    <td data-label="Prazo">{toBRDate(r.prazo)}</td>
                    <td data-label="Status">
                      <Select value={r.status || "rascunho"} onChange={(e) => mudarStatus(r, e.target.value)} style={{ padding: "5px 10px", borderRadius: 999, fontSize: 12.5, width: "auto", color: STATUS_CONTRATO[r.status || "rascunho"]?.color }}>
                        {Object.entries(STATUS_CONTRATO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </Select>
                    </td>
                    <td data-label="" style={{ display: "flex", gap: 6 }}>
                      <Button size="sm" variant="secondary" onClick={() => setEditando(r)}><Printer size={13} /> Abrir / PDF</Button>
                      <IconBtn icon={Trash2} title="Excluir" danger onClick={() => excluir(r)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>Os modelos são genéricos e não substituem a orientação de um advogado. Revise o texto antes de enviar.</div>

      {novo && <NovoModal userId={userId} config={config} demandas={demandas} modelos={modelos} onClose={() => setNovo(false)} onCriado={(r) => { setNovo(false); load(); setEditando(r); }} />}
      {editando && <EditorModal contrato={editando} userId={userId} onClose={() => { setEditando(null); load(); }} />}
    </div>
  );
}

function NovoModal({ userId, config, demandas, modelos, onClose, onCriado }) {
  const [modeloId, setModeloId] = useState(MODELOS[0].id);
  const [demandaId, setDemandaId] = useState("");
  const [f, setF] = useState({
    contratante: "", contratante_doc: "", servico: "", descricao: "", valor: "", prazo: "", vencimento: "",
    contratado: config?.nome || "", contratado_doc: lerLocal("zf-doc-contratado"), cidade: lerLocal("zf-cidade", config?.pix_cidade || "Brasília"),
  });
  const [salvando, setSalvando] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const todos = [...MODELOS, ...modelos.map((m) => ({ ...m, id: "m:" + m.id, custom: true }))];
  const modelo = todos.find((m) => m.id === modeloId) || MODELOS[0];

  const escolherDemanda = (id) => {
    setDemandaId(id);
    const d = demandas.find((x) => x.id === id);
    if (!d) return;
    setF((p) => ({ ...p, contratante: d.cliente || "", servico: nomeServico(d) || "", descricao: d.descricao || "", valor: Number(d.valor_total) || "", prazo: d.prazo_entrega || "", vencimento: d.vencimento_pagamento || "" }));
  };

  const criar = async () => {
    if (!f.contratante.trim()) { alert("Informe o nome do cliente (contratante)."); return; }
    setSalvando(true);
    gravarLocal("zf-doc-contratado", f.contratado_doc); gravarLocal("zf-cidade", f.cidade);
    const vars = montarVars({ ...f, pix: config?.chave_pix || "" });
    const tipoLabel = modelo.tipo === "proposta" ? "Proposta" : "Contrato";
    const payload = limparVazios({
      user_id: userId, demanda_id: demandaId || "", titulo: `${tipoLabel} — ${f.contratante}${f.servico ? ` (${f.servico})` : ""}`,
      tipo: modelo.tipo, status: "rascunho", conteudo: preencher(modelo.conteudo, vars), cliente: f.contratante,
      valor: f.valor, prazo: f.prazo, vars,
    }, ["valor"]);
    const { data, error } = await supabase.from("contratos").insert(payload).select().single();
    setSalvando(false);
    if (error) { alert("Não foi possível criar: " + error.message); return; }
    onCriado(data);
  };

  return (
    <Modal title="Novo contrato ou proposta" onClose={onClose} width={720}>
      <div className="form-grid">
        <Field label="Modelo" full>
          <Select value={modeloId} onChange={(e) => setModeloId(e.target.value)}>
            <optgroup label="Modelos prontos">{MODELOS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</optgroup>
            {modelos.length > 0 && <optgroup label="Meus modelos">{modelos.map((m) => <option key={m.id} value={"m:" + m.id}>{m.nome}</option>)}</optgroup>}
          </Select>
        </Field>
        <Field label="Puxar dados de uma demanda (opcional)" full>
          <Select value={demandaId} onChange={(e) => escolherDemanda(e.target.value)}>
            <option value="">— preencher manualmente —</option>
            {demandas.map((d) => <option key={d.id} value={d.id}>{d.cliente} · {nomeServico(d) || "sem serviço"}{d.valor_total ? ` · ${toBRL(d.valor_total)}` : ""}</option>)}
          </Select>
        </Field>
        <Field label="Cliente (contratante)"><Input value={f.contratante} onChange={(e) => set("contratante", e.target.value)} /></Field>
        <Field label="CPF/CNPJ do cliente"><Input value={f.contratante_doc} onChange={(e) => set("contratante_doc", e.target.value)} placeholder="opcional" /></Field>
        <Field label="Serviço"><Input value={f.servico} onChange={(e) => set("servico", e.target.value)} /></Field>
        <Field label="Valor total"><CurrencyInput value={f.valor} onChange={(v) => set("valor", v)} /></Field>
        <Field label="Prazo de entrega"><Input type="date" value={f.prazo} onChange={(e) => set("prazo", e.target.value)} /></Field>
        <Field label="Vencimento do pagamento"><Input type="date" value={f.vencimento} onChange={(e) => set("vencimento", e.target.value)} /></Field>
        <Field label="Descrição do escopo (opcional)" full><TextArea value={f.descricao} onChange={(e) => set("descricao", e.target.value)} style={{ minHeight: 70 }} /></Field>
        <Field label="Seu nome (contratado)"><Input value={f.contratado} onChange={(e) => set("contratado", e.target.value)} /></Field>
        <Field label="Seu CPF/CNPJ"><Input value={f.contratado_doc} onChange={(e) => set("contratado_doc", e.target.value)} placeholder="opcional" /></Field>
        <Field label="Cidade (foro e assinatura)"><Input value={f.cidade} onChange={(e) => set("cidade", e.target.value)} /></Field>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>Campos em branco ficam como ________ no texto, para você completar à mão ou editar na próxima tela.</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={criar} disabled={salvando}><FileSignature size={14} /> {salvando ? "Criando…" : "Criar documento"}</Button>
      </div>
    </Modal>
  );
}

function EditorModal({ contrato, userId, onClose }) {
  const [titulo, setTitulo] = useState(contrato.titulo);
  const [texto, setTexto] = useState(contrato.conteudo || "");
  const [status, setStatus] = useState(contrato.status || "rascunho");
  const [aba, setAba] = useState("editar");
  const [salvo, setSalvo] = useState(true);
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const salvar = async () => {
    const { error } = await supabase.from("contratos").update({ titulo, conteudo: texto, status, updated_at: new Date().toISOString() }).eq("id", contrato.id);
    if (error) { alert("Não foi possível salvar: " + error.message); return false; }
    setSalvo(true); return true;
  };
  const imprimir = async () => { if (!salvo) await salvar(); const t = document.title; document.title = titulo; window.print(); document.title = t; };
  const salvarModelo = async () => {
    const nome = prompt("Nome do modelo:", titulo.replace(/ — .*/, ""));
    if (!nome) return;
    const { error } = await supabase.from("contrato_modelos").insert({ user_id: userId, nome, tipo: contrato.tipo || "contrato", conteudo: virarModelo(texto, contrato.vars) });
    alert(error ? "Não foi possível salvar o modelo: " + error.message : "Modelo salvo! Ele aparece em “Meus modelos” ao criar um novo documento.");
  };
  const fechar = async () => { if (!salvo && confirm("Salvar as alterações antes de fechar?")) await salvar(); onClose(); };

  return (
    <Modal title={titulo || "Documento"} onClose={fechar} width={860}>
      <div className="form-grid" style={{ marginBottom: 14 }}>
        <Field label="Título"><Input value={titulo} onChange={(e) => { setTitulo(e.target.value); setSalvo(false); }} /></Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setSalvo(false); }}>
            {Object.entries(STATUS_CONTRATO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button className={`chip ${aba === "editar" ? "chip-active" : ""}`} onClick={() => setAba("editar")}>Editar texto</button>
        <button className={`chip ${aba === "ver" ? "chip-active" : ""}`} onClick={() => setAba("ver")}>Visualizar</button>
      </div>
      {aba === "editar" ? (
        <>
          <TextArea value={texto} onChange={(e) => { setTexto(e.target.value); setSalvo(false); }} style={{ minHeight: 420, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, lineHeight: 1.5 }} />
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Dicas: <code># Título</code>, <code>## Cláusula</code>, <code>**negrito**</code> e <code>- item</code>.</div>
        </>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto", background: "var(--surface2)", padding: 12, borderRadius: 14 }}><Documento texto={texto} /></div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={salvarModelo}><BookmarkPlus size={14} /> Salvar como modelo</Button>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={salvar} disabled={salvo}><Save size={14} /> {salvo ? "Salvo" : "Salvar"}</Button>
          <Button onClick={imprimir}><Printer size={14} /> Baixar PDF / Imprimir</Button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>No diálogo de impressão, escolha “Salvar como PDF” como destino.</div>
      {montado && createPortal(<div className="print-only"><Documento texto={texto} /></div>, document.body)}
    </Modal>
  );
}
