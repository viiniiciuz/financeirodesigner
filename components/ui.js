"use client";
import { useState, useEffect } from "react";
import { X, Upload, Paperclip, Eye, Trash2 } from "lucide-react";
import { formatCentsToBR } from "@/lib/helpers";

export function Badge({ color, bg, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999,
      fontSize: 12, fontWeight: 600, color: color || "#E8ECF3", background: bg || "rgba(255,255,255,0.06)",
      whiteSpace: "nowrap", border: `1px solid ${(color || "#8B96AB")}33`,
    }}>{children}</span>
  );
}

export function Tag({ nome, cor }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 7,
      fontSize: 12, fontWeight: 600, color: cor, background: `${cor}1F`, border: `1px solid ${cor}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cor }} />
      {nome}
    </span>
  );
}

export function Card({ children, style }) {
  return <div className="card" style={style}>{children}</div>;
}

export function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ color: "var(--muted)", fontSize: 13, fontWeight: 500 }}>{label}</div>
        {Icon && <Icon size={16} style={{ color: accent || "var(--muted)", opacity: 0.8 }} />}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, marginTop: 6, color: "var(--muted)" }}>{sub}</div>}
    </Card>
  );
}

export function Button({ children, variant = "primary", onClick, style, type = "button", size = "md", disabled }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 9, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent", transition: "all .15s ease", opacity: disabled ? 0.6 : 1,
    padding: size === "sm" ? "6px 12px" : "9px 16px", fontSize: size === "sm" ? 12.5 : 13.5,
  };
  const variants = {
    primary: { background: "linear-gradient(135deg,#2F6BFF,#22D3EE)", color: "#04121F" },
    secondary: { background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--muted)" },
    danger: { background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.3)" },
  };
  return <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

export function IconBtn({ icon: Icon, onClick, title, danger }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 30, height: 30, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: "var(--surface2)", border: "1px solid var(--border)", cursor: "pointer",
      color: danger ? "#F87171" : "var(--muted)",
    }}><Icon size={14} /></button>
  );
}

export function Field({ label, children, full }) {
  return <div style={{ gridColumn: full ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>{label}</label>
    {children}
  </div>;
}

const inputStyle = {
  background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 11px",
  color: "var(--text)", fontSize: 13.5, outline: "none", width: "100%", fontFamily: "inherit",
};

export function Input(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
export function Select({ children, ...props }) { return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{children}</select>; }
export function TextArea(props) { return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: 70, ...(props.style || {}) }} />; }

export function CurrencyInput({ value, onChange, placeholder, style }) {
  const isEmpty = value === "" || value === undefined || value === null;
  const [display, setDisplay] = useState(isEmpty ? "" : formatCentsToBR(value));
  useEffect(() => { setDisplay(isEmpty ? "" : formatCentsToBR(value)); }, [value]); // eslint-disable-line
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits === "") { setDisplay(""); onChange(""); return; }
    const num = parseInt(digits, 10) / 100;
    setDisplay(formatCentsToBR(num));
    onChange(num);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "0 11px", ...(style || {}) }}>
      <span style={{ color: "var(--muted)", fontSize: 13.5, marginRight: 4 }}>R$</span>
      <input value={display} onChange={handleChange} placeholder={placeholder || "0,00"} inputMode="decimal"
        style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 13.5, padding: "9px 0", width: "100%", fontFamily: "inherit" }} />
    </div>
  );
}

export function Modal({ title, onClose, children, width = 640 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,8,14,0.65)", backdropFilter: "blur(3px)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", overflowY: "auto" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: width, padding: 0, marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 7, borderRadius: 99, background: "var(--surface2)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color || "linear-gradient(90deg,#2F6BFF,#22D3EE)", borderRadius: 99, transition: "width .3s ease" }} />
    </div>
  );
}

export function EmptyState({ text, action }) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
      <div style={{ fontSize: 13.5, marginBottom: action ? 12 : 0 }}>{text}</div>
      {action}
    </div>
  );
}

// Upload de arquivo para o Supabase Storage (bucket "arquivos", pasta por usuário)
export function FileField({ label, fileUrl, fileName, onUpload, onRemove, uploading }) {
  return (
    <Field label={label}>
      {!fileUrl ? (
        <div>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }} id={`file-${label}`} onChange={(e) => { const f = e.target.files[0]; if (f) onUpload(f); e.target.value = ""; }} />
          <Button variant="secondary" size="sm" onClick={() => document.getElementById(`file-${label}`).click()} disabled={uploading}>
            <Upload size={13} /> {uploading ? "Enviando..." : "Anexar arquivo"}
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px" }}>
          <Paperclip size={13} style={{ color: "var(--muted)" }} />
          <span style={{ fontSize: 12.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName || "arquivo"}</span>
          <a href={fileUrl} target="_blank" rel="noreferrer" title="Visualizar" style={{ color: "var(--muted)" }}><Eye size={14} /></a>
          <button onClick={onRemove} title="Excluir" style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer" }}><Trash2 size={14} /></button>
        </div>
      )}
    </Field>
  );
}
