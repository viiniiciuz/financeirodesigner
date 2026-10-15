"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { TIPOS_CHAVE, inferirTipo } from "@/lib/pix";

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
    const { error } = await supabase.from("config").upsert({ ...f, pix_tipo: f.chave_pix ? (f.pix_tipo || inferirTipo(f.chave_pix)) : null, user_id: userId, updated_at: new Date().toISOString() });
    if (error) { alert("Não foi possível salvar: " + error.message + (/chave_pix|pix_tipo|pix_cidade/.test(error.message) ? "\n\nRode o SQL das migrações 003 e 004 no Supabase (SQL Editor)." : "")); return; }
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
          <Field label="Chave Pix (aparece nas mensagens e no link de cobrança)"><Input value={f.chave_pix || ""} onChange={(e) => set("chave_pix", e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" /></Field>
          <Field label="Tipo da chave Pix (necessário para gerar o QR Code)">
            <Select value={f.pix_tipo || inferirTipo(f.chave_pix)} onChange={(e) => set("pix_tipo", e.target.value)}>
              {TIPOS_CHAVE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Cidade do recebedor (exigida pelo Pix)"><Input value={f.pix_cidade || ""} onChange={(e) => set("pix_cidade", e.target.value)} placeholder="Brasília" maxLength={15} /></Field>
          <Field label="Moeda"><Select value={f.moeda} onChange={(e) => set("moeda", e.target.value)}><option value="BRL">Real (R$)</option></Select></Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <Button onClick={salvar}><Check size={14} /> Salvar configurações</Button>
        </div>
      </Card>
    </div>
  );
}
