"use client";

function inline(s) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <b key={i}>{p.slice(2, -2)}</b> : p));
}

// Mostra o texto do contrato como uma folha de papel (também usada na impressão/PDF)
export default function Documento({ texto }) {
  return (
    <div className="doc-paper">
      {String(texto || "").split("\n").map((l, i) => {
        if (l.startsWith("# ")) return <h1 key={i}>{inline(l.slice(2))}</h1>;
        if (l.startsWith("## ")) return <h2 key={i}>{inline(l.slice(3))}</h2>;
        if (l.startsWith("- ")) return <p key={i} className="doc-li">• {inline(l.slice(2))}</p>;
        if (!l.trim()) return <div key={i} style={{ height: 9 }} />;
        return <p key={i}>{inline(l)}</p>;
      })}
    </div>
  );
}
