"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { Card, EmptyState, IconBtn, Tag, Badge, StatCard, ProgressBar } from "@/components/ui";
import { MESES, toBRDate } from "@/lib/helpers";

const norm = (s) => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const prefixo = (a, m) => `${a}-${String(m + 1).padStart(2, "0")}`;

// Agrupa as demandas do mês por empresa / cliente
function agrupar(tarefas, listaData, empresasMap) {
  const grupos = {};
  for (const t of tarefas) {
    let key, nome, tipo, cor = null;
    if (t.vinculo_tipo === "empresa" && empresasMap[t.vinculo_id]) { const e = empresasMap[t.vinculo_id]; key = "e:" + e.id; nome = e.nome; tipo = "Empresa"; cor = e.cor; }
    else if (t.vinculo_tipo === "cliente" && norm(t.vinculo_texto)) { key = "c:" + norm(t.vinculo_texto); nome = t.vinculo_texto.trim(); tipo = "Cliente"; }
    else { key = "n:"; nome = "Sem cliente ou empresa"; tipo = "Sem vínculo"; }
    const g = (grupos[key] = grupos[key] || { key, nome, tipo, cor, itens: [] });
    g.itens.push({ ...t, data: listaData[t.lista_id] });
  }
  return grupos;
}

export default function DemandasPorClientePage() {
  const { userId } = useAuth();
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [listas, setListas] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [abertos, setAbertos] = useState({});

  useEffect(() => { if (userId) load(); }, [userId]);
  async function load() {
    const [{ data: l }, { data: t }, { data: e }] = await Promise.all([
      supabase.from("listas_demandas").select("id, data"),
      supabase.from("tarefas").select("*"),
      supabase.from("empresas").select("*"),
    ]);
    setListas(l || []); setTarefas(t || []); setEmpresas(e || []); setLoading(false);
  }

  const mudarMes = (d) => { let m = mes + d, a = ano; if (m < 0) { m = 11; a--; } if (m > 11) { m = 0; a++; } setMes(m); setAno(a); };

  const { grupos, anteriores, kpi } = useMemo(() => {
    const listaData = Object.fromEntries(listas.map((l) => [l.id, l.data]));
    const empresasMap = Object.fromEntries(empresas.map((e) => [e.id, e]));
    const doMes = (a, m) => tarefas.filter((t) => (listaData[t.lista_id] || "").startsWith(prefixo(a, m)));
    const atual = agrupar(doMes(ano, mes), listaData, empresasMap);
    const pm = mes === 0 ? 11 : mes - 1, pa = mes === 0 ? ano - 1 : ano;
    const ant = agrupar(doMes(pa, pm), listaData, empresasMap);
    const lista = Object.values(atual).map((g) => {
      const feitas = g.itens.filter((i) => i.concluida).length;
      return { ...g, feitas, total: g.itens.length, pend: g.itens.length - feitas, itens: g.itens.sort((a, b) => (b.data || "").localeCompare(a.data || "")) };
    }).sort((a, b) => b.feitas - a.feitas || b.total - a.total);
    const anteriores = Object.fromEntries(Object.values(ant).map((g) => [g.key, g.itens.filter((i) => i.concluida).length]));
    const feitas = lista.reduce((s, g) => s + g.feitas, 0), total = lista.reduce((s, g) => s + g.total, 0);
    return { grupos: lista, anteriores, kpi: { feitas, total, pend: total - feitas, atendidos: lista.filter((g) => g.key !== "n:" && g.feitas > 0).length } };
  }, [listas, tarefas, empresas, ano, mes]);

  const visiveis = grupos.filter((g) => filtro === "todos" || (filtro === "empresa" && g.tipo === "Empresa") || (filtro === "cliente" && g.tipo === "Cliente"));
  const maxFeitas = Math.max(1, ...grupos.map((g) => g.feitas));

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Demandas por cliente</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconBtn icon={ChevronLeft} title="Mês anterior" onClick={() => mudarMes(-1)} />
          <div style={{ fontWeight: 700, minWidth: 150, textAlign: "center" }}>{MESES[mes]} {ano}</div>
          <IconBtn icon={ChevronRight} title="Próximo mês" onClick={() => mudarMes(1)} />
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <StatCard label="Demandas feitas" value={kpi.feitas} sub="Concluídas no mês" />
        <StatCard label="Total no mês" value={kpi.total} />
        <StatCard label="Em aberto" value={kpi.pend} />
        <StatCard label="Clientes e empresas atendidos" value={kpi.atendidos} />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[["todos", "Todos"], ["empresa", "Empresas"], ["cliente", "Clientes"]].map(([k, l]) => (
          <button key={k} className={`chip ${filtro === k ? "chip-active" : ""}`} onClick={() => setFiltro(k)}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ color: "var(--muted)" }}>Carregando…</div> : visiveis.length === 0 ? (
        <Card style={{ padding: 0 }}><EmptyState text="Nenhuma demanda neste mês. Elas entram aqui sozinhas quando você as adiciona na lista do dia (menu Demandas)." /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visiveis.map((g) => {
            const aberto = !!abertos[g.key];
            const ant = anteriores[g.key] || 0;
            const dif = g.feitas - ant;
            return (
              <Card key={g.key} style={{ padding: 0, overflow: "hidden" }}>
                <button onClick={() => setAbertos((p) => ({ ...p, [g.key]: !aberto }))} className="link-btn" style={{ width: "100%", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {g.tipo === "Empresa" && g.cor ? <Tag nome={g.nome} cor={g.cor} /> : <span style={{ fontWeight: 700, fontSize: 14.5 }}>{g.nome}</span>}
                      <Badge>{g.tipo}</Badge>
                    </div>
                    <div style={{ marginTop: 10, maxWidth: 360 }}><ProgressBar pct={Math.round((g.feitas / maxFeitas) * 100)} /></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>{g.feitas}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>feitas de {g.total}{g.pend > 0 ? ` · ${g.pend} em aberto` : ""}</div>
                    <div style={{ fontSize: 11.5, color: dif > 0 ? "var(--success)" : dif < 0 ? "var(--danger)" : "var(--muted)", marginTop: 2 }}>
                      {dif === 0 ? `Igual ao mês anterior (${ant})` : `${dif > 0 ? "+" : ""}${dif} vs mês anterior (${ant})`}
                    </div>
                  </div>
                  {aberto ? <ChevronUp size={16} style={{ color: "var(--muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--muted)" }} />}
                </button>
                {aberto && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "8px 18px 14px" }}>
                    {g.itens.map((i) => (
                      <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13.5 }}>
                        <span className={`checkbox ${i.concluida ? "checked" : ""}`} style={{ cursor: "default" }}>{i.concluida && <Check size={12} />}</span>
                        <span style={{ flex: 1, opacity: i.concluida ? 1 : 0.7 }}>{i.descricao}</span>
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>{toBRDate(i.data)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 14 }}>A data de cada demanda é a da lista do dia em que ela está. Para aparecer separada por cliente, vincule a demanda a uma empresa ou cliente ao adicioná-la.</div>
    </div>
  );
}
