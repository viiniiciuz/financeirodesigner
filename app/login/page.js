"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button, Input, Field, Card } from "@/components/ui";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace("/dashboard"); });
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setMsg(""); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message); else router.replace("/dashboard");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMsg("Conta criada! Verifique seu e-mail para confirmar (ou já faça login se a confirmação estiver desativada no seu projeto Supabase).");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", padding: 16 }}>
      <Card style={{ padding: 32, width: 400, maxWidth: "100%", boxShadow: "none" }}>
        <img src="/logo.svg" alt="Zentrix Flow" style={{ height: 52, marginBottom: 18, display: "block" }} />
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{mode === "login" ? "Entrar" : "Criar conta"}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Financeiro, demandas e contratos para quem presta serviço</div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Senha"><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          {error && <div style={{ color: "#FF7A93", fontSize: 12.5 }}>{error}</div>}
          {msg && <div style={{ color: "#2DD4A0", fontSize: 12.5 }}>{msg}</div>}
          <Button type="submit" disabled={loading} style={{ justifyContent: "center", marginTop: 4 }}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <div style={{ marginTop: 16, textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
          {mode === "login" ? (
            <>Ainda não tem conta? <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: "#E1FE1C", cursor: "pointer" }}>Criar conta</button></>
          ) : (
            <>Já tem conta? <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "#E1FE1C", cursor: "pointer" }}>Entrar</button></>
          )}
        </div>
      </Card>
    </div>
  );
}
