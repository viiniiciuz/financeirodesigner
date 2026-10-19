"use client";
import { useEffect, useState } from "react";

export function getTheme() {
  try { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; } catch { return "dark"; }
}
export function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("zf-theme", t); } catch {}
  window.dispatchEvent(new Event("zf-theme"));
}
export function useTheme() {
  const [theme, setT] = useState("dark");
  useEffect(() => {
    const sync = () => setT(getTheme());
    sync();
    window.addEventListener("zf-theme", sync);
    return () => window.removeEventListener("zf-theme", sync);
  }, []);
  return [theme, setTheme];
}
// Cores usadas dentro dos gráficos (SVG não lê variáveis CSS de forma confiável)
export function chartColors(theme) {
  return theme === "light"
    ? { bar: "#032446", pie2: "#B9A878", grid: "rgba(3,36,70,0.10)", axis: "#66707F", tipBg: "#FCFAF4", tipBorder: "rgba(3,36,70,0.16)", tipText: "#0B1B2E", cursor: "rgba(3,36,70,0.05)", accent: "#032446", neutral: "#5B6B80" }
    : { bar: "#EBE0CA", pie2: "#6F8FAF", grid: "rgba(235,224,202,0.08)", axis: "#8E9AAB", tipBg: "#0A2440", tipBorder: "rgba(235,224,202,0.16)", tipText: "#F1EADB", cursor: "rgba(235,224,202,0.06)", accent: "#EBE0CA", neutral: "#8FA3BA" };
}
