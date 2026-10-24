"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Button, Card, EmptyState, IconBtn, Badge, Modal, Field, Input, Select, TextArea, CurrencyInput, StatCard, ProgressBar } from "@/components/ui";
import { CATEGORIAS_DESPESA, MESES, toBRL, toBRDate, todayISO, limparVazios, recebidoNoMes, despesasDoMes } from "@/lib/helpers";

export default function DespesasPage() {
  const { userId } = useAuth();
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [despesas, setDespesas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [trabalhos, setTrabalhos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semMigracao, setSemMigracao] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [d, pf, te] = await Promise.all([
      supabase.from("despesas").select("*"),
      supabase.from("pagamentos_freela").select("*"),
      supabase.from("trabalhos_empresa").select("*"),
    ]);
    if (d.error) { setSemMigracao(true); setDespesas([]); } else { setSemMigracao(false); setDespesas(d.data || []); }
    setPagamentos(pf.data || []); setTrabalhos(te.data || []);
    setLoading(false);
  }

  const mudarMes = (delta) => {
    let m = mes + delta, a = ano;
    if (m < 0) { m = 11; a--; } else if (m > 11) { m = 0; a++; }
    setMes(m); setAno(a);
  };

  const doMes = despesasDoMes(despesas, ano, mes).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const totalDesp = doMes.reduce((a, d) => a + Number(d.valor || 0), 0);
  const recebido = recebidoNoMes(pagamentos, trabalhos, ano, mes).total;
  const lucro = recebido - totalDesp;
  const margem = recebido > 0 ? Math.round((lucro / recebido) * 100) : null;

  const porCategoria = Object.entries(doMes.reduce((acc, d) => { const c = d.categoria || "Outros"; acc[c] = (acc[c] || 0) + Number(d.valor || 0); return acc; }, {})).sort((a, b) => b[1] - a[1]);

  const salvar = async (item) => {
    if (!item.descricao?.trim()) { alert("Informe a descrição da despesa."); return; }
    const payload = limparVazios({ ...item, user_id: userId }, ["valor"]);
    if (!item.id) delete payload.id;
    const { error } = item.id
      ? await supabase.from("despesas").update(payload).eq("id", item.id)
      : await supabase.from("despesas").insert(payload);
    if (error) { alert("Não foi possível salvar. Tente novamente."); return; }
    setModal(null); load();
  };
  const excluir = async (id) => { if (!confirm("Excluir esta despesa?")) return; await supabase.from("despesas").delete().eq("id", id); load(); };

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Despesas e lucro</div>
        <Button onClick={() => setModal({ descricao: "", categoria: CATEGORIAS_DESPESA[0], valor: "", data: todayISO(), recorrente: false, observacoes: "" })}><Plus size={14} /> Nova despesa</Button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <IconBtn icon={ChevronLeft} title="Mês anterior" onClick={() => mudarMes(-1)} />
        <div style={{ fontWeight: 700, minWidth: 150, textAlign: "center" }}>{MESES[mes]} {ano}</div>
        <IconBtn icon={ChevronRight} title="Próximo mês" onClick={() => mudarMes(1)} />
      </div>

      {semMigracao && (
        <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: "var(--danger)" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Falta uma atualização no banco de dados</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Abra o Supabase, vá em SQL Editor, cole o conteúdo do arquivo <b>supabase/migracao-003.sql</b> e clique em Run. Depois, recarregue esta página.</div>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <StatCard label="Recebido no mês" value={toBRL(recebido)} sub="Pagamentos que entraram" />
        <StatCard label="Despesas do mês" value={toBRL(totalDesp)} sub={`${doMes.length} lançamento${doMes.length === 1 ? "" : "s"}`} />
        <StatCard label="Lucro do mês" value={toBRL(lucro)} sub="Recebido menos despesas" accent={lucro < 0 ? "var(--danger)" : "var(--success)"} />
        <StatCard label="Margem de lucro" value={margem === null ? "—" : `${margem}%`} sub="Quanto sobra de cada R$ recebido" />
      </div>

      {porCategoria.length > 0 && (
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Despesas por categoria</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {porCategoria.map(([cat, v]) => (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span>{cat}</span><b>{toBRL(v)}</b></div>
                <ProgressBar pct={totalDesp ? Math.round((v / totalDesp) * 100) : 0} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>Carregando…</div> : doMes.length === 0 ? (
          <EmptyState text="Nenhuma despesa neste mês." action={<Button onClick={() => setModal({ descricao: "", categoria: CATEGORIAS_DESPESA[0], valor: "", data: todayISO(), recorrente: false, observacoes: "" })}><Plus size={14} /> Adicionar despesa</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th></th></tr></thead>
              <tbody>
                {doMes.map((d) => (
                  <tr key={d.id}>
                    <td data-label="Data">{toBRDate(d.data)}</td>
                    <td data-label="Descrição">{d.descricao} {d.recorrente && <Badge>Mensal</Badge>}</td>
                    <td data-label="Categoria">{d.categoria || "—"}</td>
                    <td data-label="Valor" style={{ fontWeight: 600 }}>{toBRL(d.valor)}</td>
                    <td data-label="" style={{ display: "flex", gap: 6 }}>
                      <IconBtn icon={Pencil} title="Editar" onClick={() => setModal({ ...d, valor: d.valor ?? "" })} />
                      <IconBtn icon={Trash2} title="Excluir" danger onClick={() => excluir(d.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && <DespesaModal item={modal} onClose={() => setModal(null)} onSave={salvar} />}
    </div>
  );
}

function DespesaModal({ item, onClose, onSave }) {
  const [f, setF] = useState(item);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={item.id ? "Editar despesa" : "Nova despesa"} onClose={onClose} width={520}>
      <div className="form-grid">
        <Field label="Descrição" full><Input autoFocus value={f.descricao || ""} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Assinatura Adobe, Imposto DAS, Hospedagem" /></Field>
        <Field label="Categoria"><Select value={f.categoria || ""} onChange={(e) => set("categoria", e.target.value)}>{CATEGORIAS_DESPESA.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Valor"><CurrencyInput value={f.valor} onChange={(v) => set("valor", v)} /></Field>
        <Field label="Data"><Input type="date" value={f.data || ""} onChange={(e) => set("data", e.target.value)} /></Field>
        <Field label="Repetição">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, minHeight: 40, cursor: "pointer" }}>
            <input type="checkbox" checked={!!f.recorrente} onChange={(e) => set("recorrente", e.target.checked)} /> Mensal: conta em todos os meses a partir da data
          </label>
        </Field>
        <Field label="Observações" full><TextArea value={f.observacoes || ""} onChange={(e) => set("observacoes", e.target.value)} /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave(f)}>Salvar</Button>
      </div>
    </Modal>
  );
}
