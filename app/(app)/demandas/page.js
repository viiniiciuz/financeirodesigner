"use client";
import { useEffect, useState } from "react";
import Quadro from "./Quadro";
import ListaDoDia from "./ListaDoDia";

export default function DemandasPage() {
  const [aba, setAba] = useState("quadro");
  useEffect(() => {
    try { const a = localStorage.getItem("zf-demandas-aba"); if (a === "lista" || a === "quadro") setAba(a); } catch {}
  }, []);
  const trocar = (a) => { setAba(a); try { localStorage.setItem("zf-demandas-aba", a); } catch {} };

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Demandas</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["quadro", "Quadro"], ["lista", "Lista do dia"]].map(([k, l]) => (
            <button key={k} className={`chip ${aba === k ? "chip-active" : ""}`} onClick={() => trocar(k)}>{l}</button>
          ))}
        </div>
      </div>
      {aba === "quadro" ? <Quadro /> : <ListaDoDia />}
    </div>
  );
}
