"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Calendar, CheckSquare, ExternalLink, Trash2, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Button, Badge, Modal, Field, Input, Select, TextArea, ProgressBar, IconBtn } from "@/components/ui";
import { STATUS_TRABALHO, STATUS_FIN, PRIORIDADES, toBRL, toBRDate, todayISO, statusFinanceiroFreela, limparVazios } from "@/lib/helpers";

const COLS = STATUS_TRABALHO.filter((s) => s.value !== "cancelado");
const ETIQUETAS = ["#E1FE1C", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#EF4444"];
const uid = () => Math.random().toString(36).slice(2, 10);
const validStatus = (s) => (COLS.some((c) => c.value === s) ? s : "nao_iniciado");
const statsDe = (list) => {
  const l = list || [];
  const done = l.filter((i) => i.feito).length;
  return { total: l.length, done, pct: l.length ? Math.round((done / l.length) * 100) : 0 };
};

function Checklist({ value, onChange }) {
  const [txt, setTxt] = useState("");
  const list = value || [];
  const st = statsDe(list);
  const add = () => {
    const t = txt.trim();
    if (!t) return;
    onChange([...list, { id: uid(), texto: t, feito: false }]);
    setTxt("");
  };
  return (
    <div>
      {list.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: "var(--muted)", width: 34 }}>{st.pct}%</span>
          <div style={{ flex: 1 }}><ProgressBar pct={st.pct} /></div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list.map((i) => (
          <div key={i.id} className="task-row">
            <button type="button" className={`checkbox ${i.feito ? "checked" : ""}`} onClick={() => onChange(list.map((x) => (x.id === i.id ? { ...x, feito: !x.feito } : x)))}>
              {i.feito && <Check size={13} />}
            </button>
            <span style={{ flex: 1, fontSize: 13.5, textDecoration: i.feito ? "line-through" : "none", color: i.feito ? "var(--muted)" : "var(--text)" }}>{i.texto}</span>
            <IconBtn icon={Trash2} danger title="Remover item" onClick={() => onChange(list.filter((x) => x.id !== i.id))} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Input value={txt} placeholder="Adicionar um item" onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button variant="secondary" onClick={add}>Adicionar</Button>
      </div>
    </div>
  );
}

function CardModal({ item, novoStatus, pagamentos, onClose, onSave, onDelete, onAbrirLista }) {
  const freela = item?.tipo === "freela";
  const raw = item?.raw;
  const [f, setF] = useState(() =>
    freela
      ? { status_trabalho: raw.status_trabalho || "nao_iniciado", prazo_entrega: raw.prazo_entrega || "", checklist: raw.checklist || [] }
      : { titulo: raw?.titulo || "", descricao: raw?.descricao || "", status: raw?.status || novoStatus || "nao_iniciado", etiqueta: raw?.etiqueta || "", prioridade: raw?.prioridade || "", prazo: raw?.prazo || "", checklist: raw?.checklist || [] }
  );
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const stFin = freela ? statusFinanceiroFreela(raw, pagamentos) : null;

  return (
    <Modal title={freela ? "Demanda freela" : item ? "Editar cartão" : "Novo cartão"} onClose={onClose} width={620}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {freela ? (
          <div className="card" style={{ padding: 14, background: "var(--surface2)", borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{raw.cliente}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{raw.servico_custom || raw.servico || "Sem serviço informado"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>{toBRL(raw.valor_total)}</div>
                <div style={{ marginTop: 4 }}><Badge color={STATUS_FIN[stFin].color} bg={STATUS_FIN[stFin].bg}>{STATUS_FIN[stFin].label}</Badge></div>
              </div>
            </div>
            {raw.descricao && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>{raw.descricao}</div>}
            <button type="button" onClick={onAbrirLista} className="link-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, marginTop: 10, color: "var(--accent-text)", fontWeight: 600 }}>
              <ExternalLink size={13} /> Ver valores e pagamentos na lista
            </button>
          </div>
        ) : (
          <>
            <Field label="Título"><Input autoFocus value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Carrossel 03 — quarta-feira" /></Field>
            <Field label="Descrição"><TextArea value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Detalhes, links, referências…" /></Field>
          </>
        )}

        <div className="form-grid">
          <Field label="Coluna (status)">
            <Select value={freela ? f.status_trabalho : f.status} onChange={(e) => set(freela ? "status_trabalho" : "status", e.target.value)}>
              {(freela ? STATUS_TRABALHO : COLS).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Prazo">
            <Input type="date" value={freela ? f.prazo_entrega : f.prazo} onChange={(e) => set(freela ? "prazo_entrega" : "prazo", e.target.value)} />
          </Field>
          {!freela && (
            <>
              <Field label="Prioridade">
                <Select value={f.prioridade} onChange={(e) => set("prioridade", e.target.value)}>
                  <option value="">Sem prioridade</option>
                  {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </Select>
              </Field>
              <Field label="Etiqueta">
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", minHeight: 40 }}>
                  <button type="button" onClick={() => set("etiqueta", "")} title="Sem etiqueta" style={{ width: 24, height: 24, borderRadius: 99, border: "1.5px dashed var(--border-strong)", background: "none", cursor: "pointer", outline: f.etiqueta === "" ? "2px solid var(--text)" : "none", outlineOffset: 2 }} />
                  {ETIQUETAS.map((c) => (
                    <button key={c} type="button" onClick={() => set("etiqueta", c)} style={{ width: 24, height: 24, borderRadius: 99, border: "none", background: c, cursor: "pointer", outline: f.etiqueta === c ? "2px solid var(--text)" : "none", outlineOffset: 2 }} />
                  ))}
                </div>
              </Field>
            </>
          )}
        </div>

        <Field label="Checklist"><Checklist value={f.checklist} onChange={(v) => set("checklist", v)} /></Field>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
          <div>{!freela && item && <Button variant="danger" onClick={() => onDelete(item)}><Trash2 size={14} /> Excluir</Button>}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(item, f)}>Salvar</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function Quadro({ onAbrirLista }) {
  const { userId } = useAuth();
  const [freela, setFreela] = useState([]);
  const [cards, setCards] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semMigracao, setSemMigracao] = useState(false);
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(null); // { key } | { novo: true, status }
  const [dragKey, setDragKey] = useState(null);
  const [over, setOver] = useState(null); // { col, idx }
  const [addingIn, setAddingIn] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState("");

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [f, c, p] = await Promise.all([
      supabase.from("demandas_freela").select("*"),
      supabase.from("quadro_cards").select("*"),
      supabase.from("pagamentos_freela").select("*"),
    ]);
    setFreela(f.data || []); setPagamentos(p.data || []);
    if (c.error) { setSemMigracao(true); setCards([]); } else { setSemMigracao(false); setCards(c.data || []); }
    setLoading(false);
  }

  const items = useMemo(() => [
    ...freela.filter((d) => d.status_trabalho !== "cancelado").map((d) => ({ key: "f" + d.id, tipo: "freela", id: d.id, status: validStatus(d.status_trabalho), pos: Number(d.quadro_pos) || 0, created: d.created_at || "", raw: d })),
    ...cards.map((c) => ({ key: "c" + c.id, tipo: "livre", id: c.id, status: validStatus(c.status), pos: Number(c.posicao) || 0, created: c.created_at || "", raw: c })),
  ], [freela, cards]);

  const q = busca.trim().toLowerCase();
  const tituloDe = (i) => (i.tipo === "freela" ? i.raw.cliente || "Sem cliente" : i.raw.titulo);
  const subDe = (i) => (i.tipo === "freela" ? i.raw.servico_custom || i.raw.servico || "" : "");
  const colItems = (status) => items.filter((i) => i.status === status).sort((a, b) => a.pos - b.pos || a.created.localeCompare(b.created));
  const visiveis = (status) => colItems(status).filter((i) => !q || `${tituloDe(i)} ${subDe(i)} ${i.raw.descricao || ""}`.toLowerCase().includes(q));

  async function moveItem(key, toStatus, index) {
    const moving = items.find((i) => i.key === key);
    if (!moving) return;
    const target = colItems(toStatus).filter((i) => i.key !== key);
    target.splice(Math.max(0, Math.min(index, target.length)), 0, moving);
    const updates = target.map((it, idx) => ({ it, pos: (idx + 1) * 10 })).filter(({ it, pos }) => it.key === key || it.pos !== pos);
    setFreela((prev) => prev.map((d) => { const u = updates.find((x) => x.it.key === "f" + d.id); return u ? { ...d, status_trabalho: toStatus, quadro_pos: u.pos } : d; }));
    setCards((prev) => prev.map((c) => { const u = updates.find((x) => x.it.key === "c" + c.id); return u ? { ...c, status: toStatus, posicao: u.pos } : c; }));
    const results = await Promise.all(updates.map(({ it, pos }) => it.tipo === "freela"
      ? supabase.from("demandas_freela").update({ status_trabalho: toStatus, quadro_pos: pos }).eq("id", it.id)
      : supabase.from("quadro_cards").update({ status: toStatus, posicao: pos }).eq("id", it.id)));
    const falha = results.find((r) => r.error);
    if (falha) { alert("Não foi possível mover o cartão: " + falha.error.message); load(); }
  }

  function indexFromEvent(e, colEl, excludeKey) {
    const els = [...colEl.querySelectorAll("[data-kb-card]")].filter((el) => el.dataset.kbCard !== excludeKey);
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) return i;
    }
    return els.length;
  }

  async function criarRapido(status) {
    const titulo = novoTitulo.trim();
    if (!titulo) return;
    const pos = colItems(status).reduce((m, i) => Math.max(m, i.pos), 0) + 10;
    const { error } = await supabase.from("quadro_cards").insert({ user_id: userId, titulo, status, posicao: pos });
    if (error) { alert("Não foi possível salvar: " + error.message); return; }
    setNovoTitulo(""); setAddingIn(null); load();
  }

  async function salvar(item, f) {
    if (item?.tipo === "freela") {
      const mudouColuna = f.status_trabalho !== item.raw.status_trabalho;
      const payload = limparVazios({ status_trabalho: f.status_trabalho, prazo_entrega: f.prazo_entrega, checklist: f.checklist });
      if (mudouColuna) payload.quadro_pos = colItems(f.status_trabalho).reduce((m, i) => Math.max(m, i.pos), 0) + 10;
      const { error } = await supabase.from("demandas_freela").update(payload).eq("id", item.id);
      if (error) { alert("Não foi possível salvar: " + error.message); return; }
    } else {
      if (!f.titulo.trim()) { alert("Dê um título ao cartão."); return; }
      const payload = limparVazios({ ...f, user_id: userId });
      if (item) {
        const { error } = await supabase.from("quadro_cards").update(payload).eq("id", item.id);
        if (error) { alert("Não foi possível salvar: " + error.message); return; }
      } else {
        payload.posicao = colItems(f.status).reduce((m, i) => Math.max(m, i.pos), 0) + 10;
        const { error } = await supabase.from("quadro_cards").insert(payload);
        if (error) { alert("Não foi possível salvar: " + error.message); return; }
      }
    }
    setModal(null); load();
  }

  async function excluir(item) {
    if (!confirm("Excluir este cartão?")) return;
    await supabase.from("quadro_cards").delete().eq("id", item.id);
    setModal(null); load();
  }

  const modalItem = modal?.key ? items.find((i) => i.key === modal.key) : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
          <Search size={15} style={{ position: "absolute", left: 14, top: 12, color: "var(--muted)" }} />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cartão ou cliente" style={{ paddingLeft: 38, borderRadius: 999 }} />
        </div>
        <Button onClick={() => setModal({ novo: true, status: "nao_iniciado" })}><Plus size={14} /> Novo cartão</Button>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>As demandas freela aparecem aqui sozinhas: mover o cartão muda o status delas.</span>
      </div>

      {semMigracao && (
        <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: "var(--danger)" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Falta uma atualização no banco de dados</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Abra o Supabase, vá em SQL Editor, cole o conteúdo do arquivo <b>supabase/migracao-002.sql</b> e clique em Run. Depois, recarregue esta página para criar cartões e salvar a ordem do quadro.</div>
        </div>
      )}

      {loading ? <div style={{ color: "var(--muted)" }}>Carregando…</div> : (
        <div className="kb-board">
          {COLS.map((col) => {
            const lista = visiveis(col.value);
            return (
              <div key={col.value} className={`kb-col ${over?.col === col.value ? "over" : ""}`}
                onDragOver={(e) => { if (!dragKey) return; e.preventDefault(); const idx = indexFromEvent(e, e.currentTarget, dragKey); if (over?.col !== col.value || over?.idx !== idx) setOver({ col: col.value, idx }); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver((o) => (o?.col === col.value ? null : o)); }}
                onDrop={(e) => { e.preventDefault(); if (dragKey) moveItem(dragKey, col.value, indexFromEvent(e, e.currentTarget, dragKey)); setDragKey(null); setOver(null); }}>
                <div className="kb-col-head">
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: col.color }} />{col.label}</span>
                  <span className="kb-count">{lista.length}</span>
                </div>
                <div className="kb-list">
                  {lista.map((i, idx) => {
                    const st = statsDe(i.raw.checklist);
                    const prazo = i.tipo === "freela" ? i.raw.prazo_entrega : i.raw.prazo;
                    const atrasado = prazo && prazo < todayISO() && col.value !== "concluido";
                    const stFin = i.tipo === "freela" ? statusFinanceiroFreela(i.raw, pagamentos.filter((p) => p.demanda_id === i.id)) : null;
                    const prio = i.tipo === "livre" ? PRIORIDADES.find((p) => p.value === i.raw.prioridade) : null;
                    return (
                      <div key={i.key} style={{ display: "contents" }}>
                        {over?.col === col.value && over.idx === idx && dragKey && <div className="kb-drop" />}
                        <div className={`kb-card ${dragKey === i.key ? "dragging" : ""}`} data-kb-card={i.key} draggable={!q}
                          onDragStart={(e) => { e.dataTransfer.setData("text/plain", i.key); e.dataTransfer.effectAllowed = "move"; setDragKey(i.key); }}
                          onDragEnd={() => { setDragKey(null); setOver(null); }}
                          onClick={() => setModal({ key: i.key })}>
                          {i.tipo === "livre" && i.raw.etiqueta && <div style={{ height: 6, width: 44, borderRadius: 99, background: i.raw.etiqueta, marginBottom: 9 }} />}
                          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{tituloDe(i)}</div>
                          {subDe(i) && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{subDe(i)}</div>}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center", fontSize: 12, color: "var(--muted)" }}>
                            {i.tipo === "freela" && <Badge>Freela</Badge>}
                            {stFin && <Badge color={STATUS_FIN[stFin].color} bg={STATUS_FIN[stFin].bg}>{STATUS_FIN[stFin].label}</Badge>}
                            {prio && <Badge color={prio.color}>{prio.label}</Badge>}
                            {prazo && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: atrasado ? "var(--danger)" : undefined, fontWeight: atrasado ? 600 : 500 }}><Calendar size={13} />{toBRDate(prazo)}</span>}
                            {st.total > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CheckSquare size={13} />{st.done}/{st.total}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {over?.col === col.value && dragKey && over.idx >= lista.length && <div className="kb-drop" />}
                </div>
                {addingIn === col.value ? (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <Input autoFocus value={novoTitulo} placeholder="Título do cartão" onChange={(e) => setNovoTitulo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") criarRapido(col.value); if (e.key === "Escape") { setAddingIn(null); setNovoTitulo(""); } }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button size="sm" onClick={() => criarRapido(col.value)}>Adicionar</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAddingIn(null); setNovoTitulo(""); }}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <button className="kb-add" onClick={() => { setAddingIn(col.value); setNovoTitulo(""); }}><Plus size={15} /> Adicionar um cartão</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (modal.novo || modalItem) && (
        <CardModal key={modal.key || "novo"} item={modalItem} novoStatus={modal.status} pagamentos={modalItem?.tipo === "freela" ? pagamentos.filter((p) => p.demanda_id === modalItem.id) : []}
          onClose={() => setModal(null)} onSave={salvar} onDelete={excluir} onAbrirLista={() => { setModal(null); onAbrirLista && onAbrirLista(); }} />
      )}
    </div>
  );
}
