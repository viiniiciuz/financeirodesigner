export const PALETTE = ["#C8B88A", "#6F8FAF", "#8FA68E", "#B5835A", "#9AA8BD", "#A9A27C", "#B07C7C", "#5E7A8C", "#B49FB8", "#D6C7A1"];

export const SERVICO_TIPOS = ["Landing Page", "Site institucional", "Identidade visual", "Social Media", "Carrossel", "Post", "Flyer", "Banner", "Apresentação", "E-book", "Thumbnail", "Edição de vídeo", "VSL", "Outros"];
export const FORMAS_PAGAMENTO = ["Pix", "Dinheiro", "Cartão", "Transferência", "Boleto", "Outro"];
export const TIPO_CONTRATACAO = ["Mensal", "Projeto", "Demanda", "Outro"];

export const STATUS_TRABALHO = [
  { value: "nao_iniciado", label: "Não iniciado", color: "#8B96AB" },
  { value: "em_andamento", label: "Em andamento", color: "#6F9BC8" },
  { value: "aguardando_cliente", label: "Aguardando cliente", color: "#D1A85F" },
  { value: "em_revisao", label: "Em revisão", color: "#A79BC9" },
  { value: "concluido", label: "Concluído", color: "#7FB89A" },
  { value: "cancelado", label: "Cancelado", color: "#C9726F" },
];

export const STATUS_FIN = {
  pendente: { label: "Pendente", color: "#D1A85F", bg: "rgba(209,168,95,0.14)" },
  parcial: { label: "Parcial", color: "#6F9BC8", bg: "rgba(111,155,200,0.14)" },
  pago: { label: "Pago", color: "#7FB89A", bg: "rgba(127,184,154,0.14)" },
  atrasado: { label: "Atrasado", color: "#C9726F", bg: "rgba(201,114,111,0.14)" },
  cancelado: { label: "Cancelado", color: "#8B96AB", bg: "rgba(139,150,171,0.14)" },
};

export const PRIORIDADES = [
  { value: "baixa", label: "Baixa", color: "#8B96AB" },
  { value: "normal", label: "Normal", color: "#6F9BC8" },
  { value: "alta", label: "Alta", color: "#D1A85F" },
  { value: "urgente", label: "Urgente", color: "#C9726F" },
];

export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Datas sempre no horário LOCAL (o dia só vira à meia-noite de quem usa, e não às 21h como no UTC)
export const localISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayISO = () => localISO();
export const diasAtrasISO = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return localISO(d); };
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

// Converte strings vazias em null, para o Postgres aceitar campos de data/número em branco
export function limparVazios(obj, camposNumericos = []) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined) out[k] = null;
    else if (camposNumericos.includes(k)) out[k] = Number(v) || 0;
    else out[k] = v;
  }
  return out;
}

export function formatCentsToBR(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- Despesas e lucro ----------
export const CATEGORIAS_DESPESA = ["Assinaturas e ferramentas", "Impostos e taxas", "Equipamento", "Marketing e anúncios", "Internet e telefone", "Contador", "Outros"];

const noMes = (d, y, m) => { if (!d) return false; const [yy, mm] = d.split("-").map(Number); return yy === y && mm - 1 === m; };

// Dinheiro que realmente entrou no mês (regime de caixa)
export function recebidoNoMes(pagamentosFreela, trabalhos, y, m) {
  const freela = (pagamentosFreela || []).filter((p) => noMes(p.data, y, m)).reduce((a, p) => a + (Number(p.valor) || 0), 0);
  const empresa = (trabalhos || []).filter((t) => t.pago && noMes(t.data_pagamento || t.data, y, m)).reduce((a, t) => a + (Number(t.valor) || 0), 0);
  return { freela, empresa, total: freela + empresa };
}

// Despesas do mês: as avulsas daquele mês + as mensais já iniciadas
export function despesasDoMes(despesas, y, m) {
  const fim = `${y}-${String(m + 1).padStart(2, "0")}-31`;
  return (despesas || []).filter((d) => (d.recorrente ? d.data && d.data <= fim : noMes(d.data, y, m)));
}

// Link do WhatsApp (número brasileiro; sem número, o WhatsApp deixa escolher o contato)
export function linkWhatsApp(telefone, texto) {
  const digits = String(telefone || "").replace(/\D/g, "");
  const full = digits && digits.length <= 11 ? "55" + digits : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(texto || "")}`;
}
