"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Button, Card, Field, Input, Select } from "@/components/ui";

export default function ConfiguracoesPage() {
  const { userId } = useAuth();
  const [f, setF] = useState({ nome: "", nome_profissional: "Designer Freelancer", telefone: "", email: "", moeda: "BRL" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    const { data } = await supabase.from("config").select("*").eq("user_id", userId).maybeSingle();
    if (data) setF(data);
    setLoading(false);
  }
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const salvar = async () => {
    await supabase.from("config").upsert({ ...f, user_id: userId, updated_at: new Date().toISOString() });
    alert("Configurações salvas!");
  };

  if (loading) return <div style={{ color: "var(--muted)" }}>Carregando…</div>;

  return (
    <div>
      <div className="section-head"><div className="section-title">Configurações</div></div>
      <Card style={{ padding: 20, maxWidth: 560 }}>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <Field label="Nome"><Input value={f.nome || ""} onChange={(e) => set("nome", e.target.value)} /></Field>
          <Field label="Nome profissional"><Input value={f.nome_profissional || ""} onChange={(e) => set("nome_profissional", e.target.value)} /></Field>
          <Field label="Telefone"><Input value={f.telefone || ""} onChange={(e) => set("telefone", e.target.value)} /></Field>
          <Field label="E-mail"><Input value={f.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Moeda"><Select value={f.moeda} onChange={(e) => set("moeda", e.target.value)}><option value="BRL">Real (R$)</option></Select></Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <Button onClick={salvar}><Check size={14} /> Salvar configurações</Button>
        </div>
      </Card>
    </div>
  );
}
