"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button, Input, Field, Card, ThemeToggle } from "@/components/ui";

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
      if (error) setError("E-mail ou senha incorretos."); else router.replace("/dashboard");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError("Não foi possível criar a conta. Verifique os dados e tente de novo.");
      else setMsg("Pedido enviado. Se o e-mail for novo, você receberá a confirmação; caso contrário, tente entrar.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", padding: 16 }}>
      <div style={{ position: "absolute", top: 16, right: 16 }}><ThemeToggle /></div>
      <Card style={{ padding: 32, width: 400, maxWidth: "100%", boxShadow: "none" }}>
        <img className="logo-dark" src="/logo.png" alt="Zentrix Flow" style={{ height: 46, marginBottom: 20 }} />
        <img className="logo-light" src="/logo-light.png" alt="Zentrix Flow" style={{ height: 46, marginBottom: 20 }} />
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{mode === "login" ? "Entrar" : "Criar conta"}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Financeiro, demandas e contratos para quem presta serviço</div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Senha"><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          {error && <div style={{ color: "#D98A87", fontSize: 12.5 }}>{error}</div>}
          {msg && <div style={{ color: "#7FB89A", fontSize: 12.5 }}>{msg}</div>}
          <Button type="submit" disabled={loading} style={{ justifyContent: "center", marginTop: 4 }}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <div style={{ marginTop: 16, textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
          {mode === "login" ? (
            <>Ainda não tem conta? <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: "var(--accent-text)", cursor: "pointer" }}>Criar conta</button></>
          ) : (
            <>Já tem conta? <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "var(--accent-text)", cursor: "pointer" }}>Entrar</button></>
          )}
        </div>
      </Card>
    </div>
  );
}
