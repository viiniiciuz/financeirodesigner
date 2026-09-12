"use client";
import { useEffect, useState } from "react";
import { TrendingUp, CheckCircle2, Clock, ListChecks } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { StatCard, Card, EmptyState, Badge } from "@/components/ui";
import { STATUS_FIN, toBRL, toBRDate, todayISO, sumPagamentos, statusFinanceiroFreela, statusFinanceiroEmpresa, MESES_ABREV } from "@/lib/helpers";

export default function DashboardPage() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [demandas, setDemandas] = useState([]);
  const [pagamentosFreela, setPagamentosFreela] = useState([]);
  const [trabalhos, setTrabalhos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [listas, setListas] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [{ data: d }, { data: pf }, { data: te }, { data: e }, { data: c }, { data: l }, { data: t }] = await Promise.all([
      supabase.from("demandas_freela").select("*"),
      supabase.from("pagamentos_freela").select("*"),
      supabase.from("trabalhos_empresa").select("*"),
      supabase.from("empresas").select("*"),
      supabase.from("clientes").select("*"),
      supabase.from("listas_demandas").select("*"),
      supabase.from("tarefas").select("*"),
    ]);
    setDemandas(d || []); setPagamentosFreela(pf || []); setTrabalhos(te || []); setEmpresas(e || []); setClientes(c || []); setListas(l || []); setTarefas(t || []);
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

  const pieData = [{ name: "Freelancer", value: fatFreela, color: "#3B82F6" }, { name: "Empresas", value: fatEmpresa, color: "#22D3EE" }];

  const upcoming = [];
  demandas.forEach((d) => { const st = statusFinanceiroFreela(d, pagsDe(d.id)); if (st !== "pago" && st !== "cancelado") upcoming.push({ nome: d.cliente, valor: Number(d.valor_total) - sumPagamentos(pagsDe(d.id)), venc: d.vencimento_pagamento, status: st }); });
  trabalhos.forEach((t) => { const st = statusFinanceiroEmpresa(t); if (st !== "pago" && st !== "cancelado") upcoming.push({ nome: empresasMap[t.empresa_id]?.nome || "—", valor: t.valor, venc: t.data_prevista_pagamento, status: st }); });
  upcoming.sort((a, b) => (a.venc || "9999").localeCompare(b.venc || "9999"));

  return (
    <div>
      <div className="grid-4">
        <StatCard label="Faturamento do mês" value={toBRL(fatTotal)} icon={TrendingUp} accent="#3B82F6" />
        <StatCard label="Total recebido" value={toBRL(recTotal)} icon={CheckCircle2} accent="#22C55E" />
        <StatCard label="Total pendente" value={toBRL(pendTotal)} icon={Clock} accent="#F59E0B" />
        <StatCard label="Demandas de hoje" value={`${doneHoje}/${tarefasHoje.length}`} icon={ListChecks} accent="#22D3EE" />
      </div>

      <div className="grid-4" style={{ marginTop: 14 }}>
        <StatCard label="Faturamento Freelancer" value={toBRL(fatFreela)} />
        <StatCard label="Faturamento Empresas" value={toBRL(fatEmpresa)} />
        <StatCard label="Pagamentos pendentes" value={pagamentosPendentes} accent="#F59E0B" />
        <StatCard label="Pagamentos atrasados" value={pagamentosAtrasados} accent="#EF4444" />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Faturamento por mês</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#1C2436" vertical={false} />
              <XAxis dataKey="name" stroke="#8B96AB" fontSize={11.5} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B96AB" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#141B2B", border: "1px solid #232B3D", borderRadius: 8, fontSize: 12.5 }} formatter={(v) => toBRL(v)} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#3B82F6" />
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
              <Tooltip contentStyle={{ background: "#141B2B", border: "1px solid #232B3D", borderRadius: 8, fontSize: 12.5 }} formatter={(v) => toBRL(v)} />
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
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{toBRL(p.valor)}</div>
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
