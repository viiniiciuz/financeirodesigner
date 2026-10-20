"use client";
import { useEffect, useState } from "react";
import { TrendingUp, CheckCircle2, Clock, ListChecks, Receipt, PiggyBank, Eye, EyeOff } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { useTheme, chartColors } from "@/lib/theme";
import { StatCard, Card, EmptyState, Badge, IconBtn } from "@/components/ui";
import { STATUS_FIN, toBRL, toBRDate, todayISO, sumPagamentos, statusFinanceiroFreela, statusFinanceiroEmpresa, MESES_ABREV, recebidoNoMes, despesasDoMes } from "@/lib/helpers";

export default function DashboardPage() {
  const { userId } = useAuth();
  const [theme] = useTheme();
  const C = chartColors(theme);
  const [loading, setLoading] = useState(true);
  const [demandas, setDemandas] = useState([]);
  const [pagamentosFreela, setPagamentosFreela] = useState([]);
  const [trabalhos, setTrabalhos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [listas, setListas] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [despesas, setDespesas] = useState([]);

  useEffect(() => { if (userId) load(); }, [userId]);

  // Olhinho: esconde os valores em R$ (a escolha fica salva neste aparelho)
  const [oculto, setOculto] = useState(false);
  useEffect(() => { try { setOculto(localStorage.getItem("zf-ocultar") === "1"); } catch {} }, []);
  const alternarOculto = () => setOculto((o) => { const n = !o; try { localStorage.setItem("zf-ocultar", n ? "1" : "0"); } catch {} return n; });
  const money = (v) => (oculto ? "R$ ••••••" : toBRL(v));

  async function load() {
    setLoading(true);
    const [{ data: d }, { data: pf }, { data: te }, { data: e }, { data: c }, { data: l }, { data: t }, { data: desp }] = await Promise.all([
      supabase.from("demandas_freela").select("*"),
      supabase.from("pagamentos_freela").select("*"),
      supabase.from("trabalhos_empresa").select("*"),
      supabase.from("empresas").select("*"),
      supabase.from("clientes").select("*"),
      supabase.from("listas_demandas").select("*"),
      supabase.from("tarefas").select("*"),
      supabase.from("despesas").select("*"),
    ]);
    setDemandas(d || []); setPagamentosFreela(pf || []); setTrabalhos(te || []); setEmpresas(e || []); setClientes(c || []); setListas(l || []); setTarefas(t || []); setDespesas(desp || []);
    setLoading(false);
  }

  if (loading) return <div style={{ color: "var(--muted)" }}>Carregando…</div>;

  const empresasMap = Object.fromEntries(empresas.map((e) => [e.id, e]));
  const pagsDe = (demandaId) => pagamentosFreela.filter((p) => p.demanda_id === demandaId);

  const now = new Date();
  const curMonth = now.getMonth(), curYear = now.getFullYear();
  const inMonth = (dateStr, y, m) => { if (!dateStr) return false; const d = new Date(dateStr); return d.getUTCFullYear() === y && d.getUTCMonth() === m; };

  const freelaMes = demandas.filter((d) => inMonth(d.data_contratacao, curYear, curMonth));
  const empresaMes = trabalhos.filter((t) => inMonth(t.mes_referencia || t.data, curYear, curMonth));

  const fatFreela = freelaMes.reduce((a, d) => a + Number(d.valor_total || 0), 0);
  const fatEmpresa = empresaMes.reduce((a, t) => a + Number(t.valor || 0), 0);
  const fatTotal = fatFreela + fatEmpresa;

  const pendFreela = freelaMes.reduce((a, d) => a + Math.max(0, Number(d.valor_total) - sumPagamentos(pagsDe(d.id))), 0);
  const pendEmpresa = empresaMes.filter((t) => !t.pago).reduce((a, t) => a + Number(t.valor || 0), 0);
  const pendTotal = pendFreela + pendEmpresa;
  const recTotal = fatTotal - pendTotal;

  const despMes = despesasDoMes(despesas, curYear, curMonth).reduce((a, x) => a + Number(x.valor || 0), 0);
  const recebidoCaixa = recebidoNoMes(pagamentosFreela, trabalhos, curYear, curMonth).total;
  const lucroMes = recebidoCaixa - despMes;

  const today = todayISO();
  const listaHoje = listas.find((l) => l.data === today);
  const tarefasHoje = listaHoje ? tarefas.filter((t) => t.lista_id === listaHoje.id) : [];
  const doneHoje = tarefasHoje.filter((t) => t.concluida).length;

  const allStFreela = demandas.map((d) => statusFinanceiroFreela(d, pagsDe(d.id)));
  const allStEmpresa = trabalhos.map(statusFinanceiroEmpresa);
  const pagamentosPendentes = allStFreela.filter((s) => s === "pendente" || s === "parcial").length + allStEmpresa.filter((s) => s === "pendente").length;
  const pagamentosAtrasados = allStFreela.filter((s) => s === "atrasado").length + allStEmpresa.filter((s) => s === "atrasado").length;

  // últimos 6 meses
  const chartMonths = [];
  { let y = curYear, m = curMonth - 5; if (m < 0) { y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; } for (let i = 0; i < 6; i++) { chartMonths.push({ y, m }); m++; if (m > 11) { m = 0; y++; } } }
  const chartData = chartMonths.map(({ y, m }) => {
    const fF = demandas.filter((d) => inMonth(d.data_contratacao, y, m));
    const fE = trabalhos.filter((t) => inMonth(t.mes_referencia || t.data, y, m));
    return { name: `${MESES_ABREV[m]}/${String(y).slice(2)}`, total: fF.reduce((a, d) => a + Number(d.valor_total || 0), 0) + fE.reduce((a, t) => a + Number(t.valor || 0), 0) };
  });

  const pieData = [{ name: "Freelancer", value: fatFreela, color: C.bar }, { name: "Empresas", value: fatEmpresa, color: C.pie2 }];

  const upcoming = [];
  demandas.forEach((d) => { const st = statusFinanceiroFreela(d, pagsDe(d.id)); if (st !== "pago" && st !== "cancelado") upcoming.push({ nome: d.cliente, valor: Number(d.valor_total) - sumPagamentos(pagsDe(d.id)), venc: d.vencimento_pagamento, status: st }); });
  trabalhos.forEach((t) => { const st = statusFinanceiroEmpresa(t); if (st !== "pago" && st !== "cancelado") upcoming.push({ nome: empresasMap[t.empresa_id]?.nome || "—", valor: t.valor, venc: t.data_prevista_pagamento, status: st }); });
  upcoming.sort((a, b) => (a.venc || "9999").localeCompare(b.venc || "9999"));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <IconBtn icon={oculto ? EyeOff : Eye} title={oculto ? "Mostrar valores" : "Ocultar valores"} onClick={alternarOculto} />
      </div>
      <div className="grid-4">
        <StatCard label="Faturamento do mês" value={money(fatTotal)} icon={TrendingUp} accent={C.accent} />
        <StatCard label="Total recebido" value={money(recTotal)} icon={CheckCircle2} accent="#7FB89A" />
        <StatCard label="Total pendente" value={money(pendTotal)} icon={Clock} accent="#D1A85F" />
        <StatCard label="Demandas de hoje" value={`${doneHoje}/${tarefasHoje.length}`} icon={ListChecks} accent={C.neutral} />
      </div>

      <div className="grid-4" style={{ marginTop: 14 }}>
        <StatCard label="Faturamento Freelancer" value={money(fatFreela)} />
        <StatCard label="Faturamento Empresas" value={money(fatEmpresa)} />
        <StatCard label="Pagamentos pendentes" value={pagamentosPendentes} accent="#D1A85F" />
        <StatCard label="Pagamentos atrasados" value={pagamentosAtrasados} accent="#C9726F" />
      </div>

      <div className="grid-4" style={{ marginTop: 14 }}>
        <StatCard label="Despesas do mês" value={money(despMes)} icon={Receipt} accent="#C9726F" />
        <StatCard label="Lucro do mês" value={money(lucroMes)} icon={PiggyBank} accent={lucroMes < 0 ? "#C9726F" : C.accent} sub="Recebido no mês menos despesas" />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Faturamento por mês</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartData}>
              <CartesianGrid stroke={C.grid} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" stroke={C.axis} fontSize={11.5} tickLine={false} axisLine={false} />
              <YAxis stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => (oculto ? "•••" : `${(v / 1000).toFixed(0)}k`)} />
              <Tooltip contentStyle={{ background: C.tipBg, border: `1px solid ${C.tipBorder}`, borderRadius: 12, fontSize: 12.5, color: C.tipText }} itemStyle={{ color: C.tipText }} cursor={{ fill: C.cursor }} formatter={(v) => money(v)} />
              <Bar dataKey="total" radius={[10, 10, 0, 0]} fill={C.bar} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Origem do faturamento</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {pieData.map((p, i) => <Cell key={i} fill={p.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.tipBg, border: `1px solid ${C.tipBorder}`, borderRadius: 12, fontSize: 12.5, color: C.tipText }} itemStyle={{ color: C.tipText }} cursor={{ fill: C.cursor }} formatter={(v) => money(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{ padding: 20, marginTop: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Próximos recebimentos</div>
        {upcoming.length === 0 ? <EmptyState text="Nenhum recebimento pendente." /> : (
          <div className="mini-table">
            {upcoming.slice(0, 8).map((p, i) => (
              <div className="mini-row" key={i}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nome}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Vencimento: {toBRDate(p.venc)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{money(p.valor)}</div>
                  <Badge color={STATUS_FIN[p.status].color} bg={STATUS_FIN[p.status].bg}>{STATUS_FIN[p.status].label}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
