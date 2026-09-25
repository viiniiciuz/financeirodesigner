"use client";
import { useEffect, useState } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Button, Card, EmptyState, IconBtn, Tag, Badge, Modal, Field, Input, Select, ProgressBar } from "@/components/ui";
import { PRIORIDADES, toBRDate, todayISO, limparVazios } from "@/lib/helpers";

export default function DemandasPage() {
  const { userId } = useAuth();
  const [listas, setListas] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("hoje");
  const [customDate, setCustomDate] = useState(todayISO());
  const [novaListaOpen, setNovaListaOpen] = useState(false);
  const [addTarefaFor, setAddTarefaFor] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [{ data: l }, { data: t }, { data: e }] = await Promise.all([
      supabase.from("listas_demandas").select("*").order("data", { ascending: false }),
      supabase.from("tarefas").select("*"),
      supabase.from("empresas").select("*"),
    ]);
    setListas(l || []); setTarefas(t || []); setEmpresas(e || []);
    setLoading(false);
  }
  const empresasMap = Object.fromEntries(empresas.map((e) => [e.id, e]));
  const tarefasDe = (listaId) => tarefas.filter((t) => t.lista_id === listaId);

  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const monthAgo = today.slice(0, 7) + "-01";

  const filteredListas = listas.filter((l) => {
    if (filtro === "hoje") return l.data === today;
    if (filtro === "ontem") return l.data === yesterday;
    if (filtro === "semana") return l.data >= weekAgo;
    if (filtro === "mes") return l.data >= monthAgo;
    if (filtro === "custom") return l.data === customDate;
    return true;
  });

  const criarLista = async (lista) => { const { error } = await supabase.from("listas_demandas").insert(limparVazios({ ...lista, user_id: userId })); if (error) { alert("Não foi possível salvar: " + error.message); return; } setNovaListaOpen(false); load(); };
  const removerLista = async (id) => { if (!confirm("Excluir esta lista?")) return; await supabase.from("listas_demandas").delete().eq("id", id); load(); };
  const toggleTarefa = async (t) => { await supabase.from("tarefas").update({ concluida: !t.concluida }).eq("id", t.id); load(); };
  const removerTarefa = async (id) => { await supabase.from("tarefas").delete().eq("id", id); load(); };
  const addTarefa = async (t) => { const { error } = await supabase.from("tarefas").insert(limparVazios({ ...t, lista_id: addTarefaFor, user_id: userId })); if (error) { alert("Não foi possível salvar: " + error.message); return; } setAddTarefaFor(null); load(); };

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Demandas</div>
        <Button onClick={() => setNovaListaOpen(true)}><Plus size={14} /> Nova lista</Button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {[["hoje", "Hoje"], ["ontem", "Ontem"], ["semana", "Esta semana"], ["mes", "Este mês"], ["custom", "Data personalizada"]].map(([k, l]) => (
          <button key={k} className={`chip ${filtro === k ? "chip-active" : ""}`} onClick={() => setFiltro(k)}>{l}</button>
        ))}
        {filtro === "custom" && <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} style={{ width: 160 }} />}
      </div>
      {loading ? <div style={{ color: "var(--muted)" }}>Carregando…</div> : filteredListas.length === 0 ? (
        <Card style={{ padding: 0 }}><EmptyState text="Nenhuma lista de demandas neste período." action={<Button onClick={() => setNovaListaOpen(true)}><Plus size={14} /> Criar lista</Button>} /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredListas.map((lista) => {
            const ts = tarefasDe(lista.id);
            const done = ts.filter((t) => t.concluida).length;
            const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
            return (
              <Card key={lista.id} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{lista.titulo}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{toBRDate(lista.data)} {lista.observacao && `· ${lista.observacao}`}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <IconBtn icon={Plus} title="Adicionar tarefa" onClick={() => setAddTarefaFor(lista.id)} />
                    <IconBtn icon={Trash2} danger title="Excluir lista" onClick={() => removerLista(lista.id)} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}><ProgressBar pct={pct} /></div>
                  <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>{done} de {ts.length} · {pct}%</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {ts.map((t) => {
                    const vinculo = t.vinculo_tipo === "empresa" ? empresasMap[t.vinculo_id] : null;
                    const prio = PRIORIDADES.find((p) => p.value === t.prioridade);
                    return (
                      <div key={t.id} className="task-row">
                        <button onClick={() => toggleTarefa(t)} className={`checkbox ${t.concluida ? "checked" : ""}`}>{t.concluida && <Check size={12} />}</button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ textDecoration: t.concluida ? "line-through" : "none", opacity: t.concluida ? 0.55 : 1, fontSize: 13.5 }}>{t.descricao}</span>
                          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                            {vinculo && <Tag nome={vinculo.nome} cor={vinculo.cor} />}
                            {t.vinculo_tipo === "cliente" && t.vinculo_texto && <Badge color="#8B96AB">{t.vinculo_texto}</Badge>}
                            {prio && prio.value !== "normal" && <Badge color={prio.color} bg={`${prio.color}22`}>{prio.label}</Badge>}
                          </div>
                        </div>
                        <IconBtn icon={Trash2} danger onClick={() => removerTarefa(t.id)} />
                      </div>
                    );
                  })}
                  {ts.length === 0 && <div style={{ fontSize: 12.5, color: "var(--muted)", padding: "8px 0" }}>Nenhuma tarefa ainda.</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {novaListaOpen && <NovaListaForm onClose={() => setNovaListaOpen(false)} onSave={criarLista} />}
      {addTarefaFor && <AddTarefaModal empresas={empresas} onClose={() => setAddTarefaFor(null)} onSave={addTarefa} />}
    </div>
  );
}

function NovaListaForm({ onClose, onSave }) {
  const [titulo, setTitulo] = useState(`Demandas de ${toBRDate(todayISO())}`);
  const [data, setData] = useState(todayISO());
  const [obs, setObs] = useState("");
  return (
    <Modal title="Nova lista de demandas" width={460} onClose={onClose}>
      <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Field label="Título"><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></Field>
        <Field label="Data"><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></Field>
        <Field label="Observação"><Input value={obs} onChange={(e) => setObs(e.target.value)} /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave({ titulo, data, observacao: obs })}>Criar lista</Button>
      </div>
    </Modal>
  );
}

function AddTarefaModal({ empresas, onClose, onSave }) {
  const [desc, setDesc] = useState("");
  const [vinculoTipo, setVinculoTipo] = useState("nenhum");
  const [vinculoId, setVinculoId] = useState(empresas[0]?.id || "");
  const [vinculoTexto, setVinculoTexto] = useState("");
  const [prioridade, setPrioridade] = useState("normal");
  return (
    <Modal title="Adicionar demanda" width={460} onClose={onClose}>
      <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Field label="Descrição"><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        <Field label="Vincular a">
          <Select value={vinculoTipo} onChange={(e) => setVinculoTipo(e.target.value)}>
            <option value="nenhum">Nenhum cliente / empresa</option>
            <option value="empresa">Empresa</option>
            <option value="cliente">Cliente (texto livre)</option>
          </Select>
        </Field>
        {vinculoTipo === "empresa" && <Field label="Empresa"><Select value={vinculoId} onChange={(e) => setVinculoId(e.target.value)}>{empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</Select></Field>}
        {vinculoTipo === "cliente" && <Field label="Nome do cliente"><Input value={vinculoTexto} onChange={(e) => setVinculoTexto(e.target.value)} /></Field>}
        <Field label="Prioridade"><Select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>{PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave({ descricao: desc, vinculo_tipo: vinculoTipo === "nenhum" ? null : vinculoTipo, vinculo_id: vinculoTipo === "empresa" ? vinculoId : null, vinculo_texto: vinculoTipo === "cliente" ? vinculoTexto : null, prioridade, concluida: false })}>Adicionar</Button>
      </div>
    </Modal>
  );
}
