export const PALETTE = ["#3B82F6", "#22D3EE", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#EF4444", "#6366F1", "#14B8A6", "#F472B6"];

export const SERVICO_TIPOS = ["Landing Page", "Site institucional", "Identidade visual", "Social Media", "Carrossel", "Post", "Flyer", "Banner", "Apresentação", "E-book", "Thumbnail", "Edição de vídeo", "VSL", "Outros"];
export const FORMAS_PAGAMENTO = ["Pix", "Dinheiro", "Cartão", "Transferência", "Boleto", "Outro"];
export const TIPO_CONTRATACAO = ["Mensal", "Projeto", "Demanda", "Outro"];

export const STATUS_TRABALHO = [
  { value: "nao_iniciado", label: "Não iniciado", color: "#8B96AB" },
  { value: "em_andamento", label: "Em andamento", color: "#3B82F6" },
  { value: "aguardando_cliente", label: "Aguardando cliente", color: "#F59E0B" },
  { value: "em_revisao", label: "Em revisão", color: "#8B5CF6" },
  { value: "concluido", label: "Concluído", color: "#22C55E" },
  { value: "cancelado", label: "Cancelado", color: "#EF4444" },
];

export const STATUS_FIN = {
  pendente: { label: "Pendente", color: "#F59E0B", bg: "rgba(245,158,11,0.14)" },
  parcial: { label: "Parcial", color: "#3B82F6", bg: "rgba(59,130,246,0.14)" },
  pago: { label: "Pago", color: "#22C55E", bg: "rgba(34,197,94,0.14)" },
  atrasado: { label: "Atrasado", color: "#EF4444", bg: "rgba(239,68,68,0.14)" },
  cancelado: { label: "Cancelado", color: "#8B96AB", bg: "rgba(139,150,171,0.14)" },
};

export const PRIORIDADES = [
  { value: "baixa", label: "Baixa", color: "#8B96AB" },
  { value: "normal", label: "Normal", color: "#3B82F6" },
  { value: "alta", label: "Alta", color: "#F59E0B" },
  { value: "urgente", label: "Urgente", color: "#EF4444" },
];

export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const toBRL = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const toBRDate = (d) => { if (!d) return "—"; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

export function colorForName(name) {
  let hash = 0;
  const s = name || "?";
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function sumPagamentos(pagamentos) {
  return (pagamentos || []).reduce((a, p) => a + (Number(p.valor) || 0), 0);
}

export function statusFinanceiroFreela(item, pagamentos) {
  if (item.status_trabalho === "cancelado") return "cancelado";
  const pago = sumPagamentos(pagamentos);
  let st = pago <= 0 ? "pendente" : pago < Number(item.valor_total) ? "parcial" : "pago";
  if (st !== "pago" && item.vencimento_pagamento && item.vencimento_pagamento < todayISO()) st = "atrasado";
  return st;
}

export function statusFinanceiroEmpresa(item) {
  if (item.status === "cancelado") return "cancelado";
  if (item.pago) return "pago";
  if (item.data_prevista_pagamento && item.data_prevista_pagamento < todayISO()) return "atrasado";
  return "pendente";
}

export function formatCentsToBR(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
