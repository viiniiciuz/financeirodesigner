"use client";
import { useEffect, useState } from "react";
import Quadro from "./Quadro";
import ListaFreela from "./ListaFreela";

export default function FreelaPage() {
  const [aba, setAba] = useState("quadro");
  useEffect(() => {
    try { const a = localStorage.getItem("zf-freela-aba"); if (a === "lista" || a === "quadro") setAba(a); } catch {}
  }, []);
  const trocar = (a) => { setAba(a); try { localStorage.setItem("zf-freela-aba", a); } catch {} };

  return (
    <div>
      <div className="section-head">
        <div className="section-title">Demandas Freela</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["quadro", "Quadro"], ["lista", "Lista e pagamentos"]].map(([k, l]) => (
            <button key={k} className={`chip ${aba === k ? "chip-active" : ""}`} onClick={() => trocar(k)}>{l}</button>
          ))}
        </div>
      </div>
      {aba === "quadro" ? <Quadro onAbrirLista={() => trocar("lista")} /> : <ListaFreela />}
    </div>
  );
}
