// Gerador de Pix "copia e cola" (BR Code estático) — padrão do Banco Central

const tlv = (id, valor) => id + String(valor.length).padStart(2, "0") + valor;

export function crc16(texto) {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const ascii = (s, max) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().toUpperCase().slice(0, max);

export const TIPOS_CHAVE = [
  { value: "cpf_cnpj", label: "CPF ou CNPJ" },
  { value: "telefone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "aleatoria", label: "Chave aleatória" },
];

export function normalizarChave(chave, tipo) {
  const c = String(chave || "").trim();
  if (tipo === "telefone") { const d = c.replace(/\D/g, ""); return "+" + (d.startsWith("55") && d.length > 11 ? d : "55" + d); }
  if (tipo === "cpf_cnpj") return c.replace(/\D/g, "");
  if (tipo === "email") return c.toLowerCase();
  return c;
}

export function gerarPixCopiaECola({ chave, tipo, nome, cidade, valor, txid }) {
  const k = normalizarChave(chave, tipo);
  let p = tlv("00", "01") + tlv("01", "11") + tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", k)) + tlv("52", "0000") + tlv("53", "986");
  if (Number(valor) > 0) p += tlv("54", Number(valor).toFixed(2));
  const id = String(txid || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  p += tlv("58", "BR") + tlv("59", ascii(nome, 25) || "RECEBEDOR") + tlv("60", ascii(cidade, 15) || "BRASILIA") + tlv("62", tlv("05", id));
  p += "6304";
  return p + crc16(p);
}

// Tenta descobrir o tipo da chave pelo formato (o usuário pode corrigir em Configurações)
export function inferirTipo(chave) {
  const c = String(chave || "").trim();
  if (!c) return "cpf_cnpj";
  if (c.includes("@")) return "email";
  if (/^\+|[()]/.test(c)) return "telefone";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)) return "aleatoria";
  return "cpf_cnpj";
}
