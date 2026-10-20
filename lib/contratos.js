import { MESES, toBRL, toBRDate } from "@/lib/helpers";

export const STATUS_CONTRATO = {
  rascunho: { label: "Rascunho", color: "#8B96AB", bg: "rgba(139,150,171,0.14)" },
  enviado: { label: "Enviado", color: "#6F9BC8", bg: "rgba(111,155,200,0.14)" },
  assinado: { label: "Assinado", color: "#7FB89A", bg: "rgba(127,184,154,0.14)" },
  cancelado: { label: "Cancelado", color: "#C9726F", bg: "rgba(201,114,111,0.14)" },
};

// ---------- Valor por extenso ----------
const U = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const D = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const C = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n) {
  if (n === 100) return "cem";
  const c = Math.floor(n / 100), r = n % 100, p = [];
  if (c) p.push(C[c]);
  if (r) {
    if (r < 20) p.push(U[r]);
    else { const d = Math.floor(r / 10), u = r % 10; p.push(D[d] + (u ? " e " + U[u] : "")); }
  }
  return p.join(" e ");
}

function inteiroExtenso(n) {
  if (n === 0) return "zero";
  const mi = Math.floor(n / 1e6), mil = Math.floor(n / 1e3) % 1000, resto = n % 1000;
  const partes = [];
  if (mi) partes.push({ v: mi, t: ate999(mi) + (mi === 1 ? " milhão" : " milhões") });
  if (mil) partes.push({ v: mil, t: mil === 1 ? "mil" : ate999(mil) + " mil" });
  if (resto) partes.push({ v: resto, t: ate999(resto) });
  let out = partes[0].t;
  for (let i = 1; i < partes.length; i++) {
    const ultimo = i === partes.length - 1;
    out += (ultimo && (partes[i].v < 100 || partes[i].v % 100 === 0) ? " e " : " ") + partes[i].t;
  }
  if (mi && !mil && !resto) out += " de";
  return out;
}

export function valorExtenso(valor) {
  const total = Math.round((Number(valor) || 0) * 100);
  const reais = Math.floor(total / 100), cent = total % 100;
  const partes = [];
  if (reais > 0 || cent === 0) partes.push(`${inteiroExtenso(reais)} ${reais === 1 ? "real" : "reais"}`);
  if (cent > 0) partes.push(`${inteiroExtenso(cent)} ${cent === 1 ? "centavo" : "centavos"}`);
  return partes.join(" e ");
}

export function dataExtenso(d = new Date()) {
  return `${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

// ---------- Preenchimento ----------
const BLANK = "________";
const OPCIONAIS = ["descricao"];

export function montarVars(f) {
  const doc = (d) => (d ? `inscrito(a) no CPF/CNPJ nº ${d}` : `inscrito(a) no CPF/CNPJ nº ${BLANK}`);
  return {
    contratante: f.contratante, contratante_qualif: doc(f.contratante_doc),
    contratado: f.contratado, contratado_qualif: doc(f.contratado_doc),
    servico: f.servico, descricao: f.descricao,
    valor: f.valor ? toBRL(f.valor) : "", valor_extenso: f.valor ? valorExtenso(f.valor) : "",
    prazo: f.prazo ? toBRDate(f.prazo) : "", vencimento: f.vencimento ? toBRDate(f.vencimento) : "",
    cidade: f.cidade, pix: f.pix, data_hoje: dataExtenso(),
  };
}

export function preencher(texto, vars) {
  return String(texto || "").replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = vars[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    return OPCIONAIS.includes(k) ? "" : BLANK;
  });
}

// Transforma um texto já preenchido de volta em modelo (para "Salvar como modelo")
export function virarModelo(texto, vars) {
  let t = String(texto || "");
  const chaves = Object.keys(vars || {}).filter((k) => String(vars[k] || "").length >= 4 && k !== "data_hoje")
    .sort((a, b) => String(vars[b]).length - String(vars[a]).length);
  for (const k of chaves) t = t.split(String(vars[k])).join(`{{${k}}}`);
  return t;
}

// ---------- Modelos prontos ----------
export const MODELOS = [
  {
    id: "contrato-completo", tipo: "contrato", nome: "Contrato de prestação de serviços (completo)",
    conteudo: `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento, de um lado **{{contratante}}**, {{contratante_qualif}}, doravante denominado(a) CONTRATANTE, e de outro lado **{{contratado}}**, {{contratado_qualif}}, doravante denominado(a) CONTRATADO(A), têm entre si justo e acordado o seguinte:

## CLÁUSULA 1 — DO OBJETO
O CONTRATADO(A) prestará ao CONTRATANTE o serviço de **{{servico}}**.
{{descricao}}

## CLÁUSULA 2 — DO PRAZO
O serviço será entregue até **{{prazo}}**, desde que o CONTRATANTE forneça os materiais e as informações necessárias dentro dos prazos combinados. Atrasos no envio de materiais ou de retornos prorrogam o prazo de entrega na mesma medida.

## CLÁUSULA 3 — DO VALOR E DO PAGAMENTO
Pelo serviço, o CONTRATANTE pagará ao CONTRATADO(A) o valor total de **{{valor}}** ({{valor_extenso}}), com vencimento em **{{vencimento}}**, por Pix ou transferência. Chave Pix: {{pix}}.
Parágrafo único. O atraso no pagamento poderá suspender a continuidade dos trabalhos e a entrega dos arquivos finais.

## CLÁUSULA 4 — DAS REVISÕES
Estão incluídas até 2 (duas) rodadas de ajustes dentro do escopo combinado. Alterações fora do escopo ou rodadas adicionais poderão ser cobradas à parte, mediante prévio acordo.

## CLÁUSULA 5 — DAS RESPONSABILIDADES DO CONTRATANTE
O CONTRATANTE se compromete a fornecer textos, imagens, logotipos, acessos e demais materiais necessários, responsabilizando-se por sua autoria e licença de uso, e a dar retorno às entregas em tempo razoável.

## CLÁUSULA 6 — DOS DIREITOS AUTORAIS
Após a quitação integral do valor, o CONTRATANTE passa a ter o direito de uso do material final entregue. O CONTRATADO(A) poderá exibir o trabalho em seu portfólio, salvo se houver pedido de sigilo por escrito.

## CLÁUSULA 7 — DA CONFIDENCIALIDADE
As partes se comprometem a manter sigilo sobre informações confidenciais a que tiverem acesso em razão deste contrato.

## CLÁUSULA 8 — DA RESCISÃO
Qualquer das partes pode rescindir este contrato mediante aviso por escrito. Em caso de rescisão, o CONTRATANTE pagará o valor proporcional ao trabalho já executado até a data do aviso.

## CLÁUSULA 9 — DO FORO
Fica eleito o foro da comarca de **{{cidade}}** para dirimir quaisquer dúvidas oriundas deste contrato.

E, por estarem de acordo, as partes assinam o presente instrumento.

{{cidade}}, {{data_hoje}}.


______________________________________
{{contratante}} (CONTRATANTE)


______________________________________
{{contratado}} (CONTRATADO(A))`,
  },
  {
    id: "contrato-simples", tipo: "contrato", nome: "Contrato simples (1 página)",
    conteudo: `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS

**CONTRATANTE:** {{contratante}}, {{contratante_qualif}}.
**CONTRATADO(A):** {{contratado}}, {{contratado_qualif}}.

## 1. Serviço
{{servico}}. {{descricao}}

## 2. Prazo de entrega
Até {{prazo}}.

## 3. Valor e pagamento
{{valor}} ({{valor_extenso}}), com vencimento em {{vencimento}}. Pix: {{pix}}.

## 4. Condições
Estão incluídas até 2 rodadas de ajustes. O material final será liberado após a confirmação do pagamento. Em caso de cancelamento, será pago o valor proporcional ao trabalho já realizado.

{{cidade}}, {{data_hoje}}.


______________________________________
{{contratante}}


______________________________________
{{contratado}}`,
  },
  {
    id: "proposta", tipo: "proposta", nome: "Proposta comercial",
    conteudo: `# PROPOSTA COMERCIAL

**Para:** {{contratante}}
**De:** {{contratado}}
**Data:** {{data_hoje}}

## Escopo
{{servico}}
{{descricao}}

## Prazo de entrega
{{prazo}}

## Investimento
**{{valor}}** ({{valor_extenso}})

## Condições de pagamento
Pagamento via Pix ({{pix}}), com vencimento em {{vencimento}}. O material final é liberado após a confirmação do pagamento.

## O que está incluído
- Até 2 rodadas de ajustes dentro do escopo
- Entrega dos arquivos finais nos formatos combinados

## Validade
Esta proposta é válida por 7 dias a partir da data acima.

## Aceite
Para aprovar, basta responder confirmando ou assinar abaixo.


______________________________________
{{contratante}}`,
  },
];
