"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Button, Card, EmptyState, IconBtn, Tag, Badge, Modal, Field, Input, Select, TextArea, CurrencyInput } from "@/components/ui";
import { TIPO_CONTRATACAO, colorForName, toBRL } from "@/lib/helpers";

export default function EmpresasPage() {
  const { userId } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [trabalhos, setTrabalhos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [{ data: e }, { data: t }] = await Promise.all([
      supabase.from("empresas").select("*").order("created_at", { ascending: true }),
      supabase.from("trabalhos_empresa").select("empresa_id, valor"),
    ]);
    setEmpresas(e || []);
    setTrabalhos(t || []);
    setLoading(false);
  }

  const save = async (item) => {
    const payload = { ...item, user_id: userId };
    if (item.id) await supabase.from("empresas").update(payload).eq("id", item.id);
    else { delete payload.id; await supabase.from("empresas").insert(payload); }
    setModal(null);
    load();
  };
  const remove = async (id) => { if (!confirm("Excluir esta empresa?")) return; await supabase.from("empresas").delete().eq("id", id); load(); };

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Empresas</div>
        <Button onClick={() => setModal({})}><Plus size={14} /> Nova empresa</Button>
      </div>
      {loading ? <div style={{ color: "var(--muted)" }}>Carregando…</div> : empresas.length === 0 ? (
        <Card style={{ padding: 0 }}><EmptyState text="Nenhuma empresa cadastrada." action={<Button onClick={() => setModal({})}><Plus size={14} /> Criar primeira empresa</Button>} /></Card>
      ) : (
        <div className="cards-grid">
          {empresas.map((e) => {
            const total = trabalhos.filter((t) => t.empresa_id === e.id).reduce((a, t) => a + Number(t.valor || 0), 0);
            return (
              <Card key={e.id} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Tag nome={e.nome} cor={e.cor} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <IconBtn icon={Pencil} onClick={() => setModal(e)} />
                    <IconBtn icon={Trash2} danger onClick={() => remove(e.id)} />
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 3 }}>
                  {e.responsavel && <div>👤 {e.responsavel}</div>}
                  {e.telefone && <div>📱 {e.telefone}</div>}
                  {e.email && <div>✉️ {e.email}</div>}
                  <div>Contratação: {e.tipo_contratacao}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <div><div style={{ fontSize: 11, color: "var(--muted)" }}>Faturado total</div><div style={{ fontWeight: 700 }}>{toBRL(total)}</div></div>
                  <Badge color={e.ativo ? "#22C55E" : "#8B96AB"} bg={e.ativo ? "rgba(34,197,94,0.14)" : "rgba(139,150,171,0.14)"}>{e.ativo ? "Ativa" : "Inativa"}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {modal && <EmpresaForm item={modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

function EmpresaForm({ item, onClose, onSave }) {
  const [f, setF] = useState({ nome: "", responsavel: "", telefone: "", email: "", valor_padrao: "", tipo_contratacao: "Mensal", observacoes: "", ativo: true, cor: null, ...item });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={item.id ? "Editar empresa" : "Nova empresa"} width={520} onClose={onClose}>
      <div className="form-grid">
        <Field label="Nome" full><Input value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Field>
        <Field label="Responsável"><Input value={f.responsavel || ""} onChange={(e) => set("responsavel", e.target.value)} /></Field>
        <Field label="Telefone"><Input value={f.telefone || ""} onChange={(e) => set("telefone", e.target.value)} /></Field>
        <Field label="E-mail"><Input value={f.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Valor padrão"><CurrencyInput value={f.valor_padrao} onChange={(v) => set("valor_padrao", v)} /></Field>
        <Field label="Tipo de contratação"><Select value={f.tipo_contratacao} onChange={(e) => set("tipo_contratacao", e.target.value)}>{TIPO_CONTRATACAO.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
        <Field label="Status"><Select value={f.ativo ? "1" : "0"} onChange={(e) => set("ativo", e.target.value === "1")}><option value="1">Ativa</option><option value="0">Inativa</option></Select></Field>
        <Field label="Observações" full><TextArea value={f.observacoes || ""} onChange={(e) => set("observacoes", e.target.value)} /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => { if (!f.nome) { alert("Informe o nome."); return; } onSave({ ...f, cor: f.cor || colorForName(f.nome) }); }}>Salvar</Button>
      </div>
    </Modal>
  );
}
