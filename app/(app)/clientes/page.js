"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Button, Card, EmptyState, IconBtn, Modal, Field, Input } from "@/components/ui";
import { toBRL, sumPagamentos, colorForName } from "@/lib/helpers";

export default function ClientesPage() {
  const { userId } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [demandas, setDemandas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [{ data: c }, { data: d }, { data: p }] = await Promise.all([
      supabase.from("clientes").select("*").order("created_at", { ascending: true }),
      supabase.from("demandas_freela").select("id, cliente, valor_total"),
      supabase.from("pagamentos_freela").select("demanda_id, valor"),
    ]);
    setClientes(c || []); setDemandas(d || []); setPagamentos(p || []);
    setLoading(false);
  }

  const save = async (item) => {
    const payload = { ...item, user_id: userId };
    if (item.id) {
      await supabase.from("clientes").update(payload).eq("id", item.id);
    } else {
      delete payload.id;
      await supabase.from("clientes").insert(payload);
      // sincroniza: se ainda não existir uma empresa com esse nome, cria uma também
      const { data: existente } = await supabase.from("empresas").select("id").eq("nome", item.nome).maybeSingle();
      if (!existente) {
        await supabase.from("empresas").insert({ nome: item.nome, cor: colorForName(item.nome), tipo_contratacao: "Demanda", ativo: true, user_id: userId });
      }
    }
    setModal(null); load();
  };
  const remove = async (id) => { if (!confirm("Excluir este cliente?")) return; await supabase.from("clientes").delete().eq("id", id); load(); };

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Clientes</div>
        <Button onClick={() => setModal({})}><Plus size={14} /> Novo cliente</Button>
      </div>
      {loading ? <div style={{ color: "var(--muted)" }}>Carregando…</div> : clientes.length === 0 ? (
        <Card style={{ padding: 0 }}><EmptyState text="Nenhum cliente cadastrado." action={<Button onClick={() => setModal({})}><Plus size={14} /> Criar primeiro cliente</Button>} /></Card>
      ) : (
        <div className="cards-grid">
          {clientes.map((c) => {
            const servicos = demandas.filter((d) => d.cliente === c.nome);
            const totalContratado = servicos.reduce((a, s) => a + Number(s.valor_total || 0), 0);
            const totalRecebido = servicos.reduce((a, s) => a + sumPagamentos(pagamentos.filter((p) => p.demanda_id === s.id)), 0);
            return (
              <Card key={c.id} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{c.nome}</div>
                    {c.empresa_texto && <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.empresa_texto}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <IconBtn icon={Pencil} onClick={() => setModal(c)} />
                    <IconBtn icon={Trash2} danger onClick={() => remove(c.id)} />
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 3 }}>
                  {c.whatsapp && <div>📱 {c.whatsapp}</div>}
                  {c.email && <div>✉️ {c.email}</div>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: "var(--muted)" }}>Serviços</div><div style={{ fontWeight: 700, fontSize: 13, overflowWrap: "break-word" }}>{servicos.length}</div></div>
                  <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: "var(--muted)" }}>Contratado</div><div style={{ fontWeight: 700, fontSize: 13, overflowWrap: "break-word" }}>{toBRL(totalContratado)}</div></div>
                  <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: "var(--muted)" }}>Pendente</div><div style={{ fontWeight: 700, fontSize: 13, color: "#F59E0B", overflowWrap: "break-word" }}>{toBRL(totalContratado - totalRecebido)}</div></div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {modal && <ClienteForm item={modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

function ClienteForm({ item, onClose, onSave }) {
  const [f, setF] = useState({ nome: "", empresa_texto: "", whatsapp: "", email: "", ...item });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={item.id ? "Editar cliente" : "Novo cliente"} width={480} onClose={onClose}>
      <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Field label="Nome"><Input value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Field>
        <Field label="Empresa (opcional)"><Input value={f.empresa_texto || ""} onChange={(e) => set("empresa_texto", e.target.value)} /></Field>
        <Field label="WhatsApp"><Input value={f.whatsapp || ""} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
        <Field label="E-mail"><Input value={f.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => { if (!f.nome) { alert("Informe o nome."); return; } onSave(f); }}>Salvar</Button>
      </div>
    </Modal>
  );
}
