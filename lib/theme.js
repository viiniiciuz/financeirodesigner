"use client";
import { useEffect, useState } from "react";

// A lógica de tema vive em /theme.js (carregado no <head>); aqui só lemos e pedimos mudanças.
export function getPref() {
  try { return window.zfTheme ? window.zfTheme.get() : "auto"; } catch { return "auto"; }
}
export function setPref(p) {
  try { if (window.zfTheme) window.zfTheme.set(p); } catch {}
}
export const setTheme = setPref;
export function getTheme() {
  try { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; } catch { return "dark"; }
}

// [tema efetivo ("light" | "dark"), setPref]
export function useTheme() {
  const [theme, setT] = useState("dark");
  useEffect(() => {
    const sync = () => setT(getTheme());
    sync();
    window.addEventListener("zf-theme", sync);
    return () => window.removeEventListener("zf-theme", sync);
  }, []);
  return [theme, setPref];
}

// [preferência ("auto" | "light" | "dark"), setPref, tema efetivo]
export function usePref() {
  const [pref, setP] = useState("auto");
  const [theme, setT] = useState("dark");
  useEffect(() => {
    const sync = () => { setP(getPref()); setT(getTheme()); };
    sync();
    window.addEventListener("zf-theme", sync);
    return () => window.removeEventListener("zf-theme", sync);
  }, []);
  return [pref, setPref, theme];
}

// Cores usadas dentro dos gráficos (SVG não lê variáveis CSS de forma confiável)
export function chartColors(theme) {
  return theme === "light"
    ? { bar: "#032446", pie2: "#B9A878", grid: "rgba(3,36,70,0.10)", axis: "#66707F", tipBg: "#FCFAF4", tipBorder: "rgba(3,36,70,0.16)", tipText: "#0B1B2E", cursor: "rgba(3,36,70,0.05)", accent: "#032446", neutral: "#5B6B80" }
    : { bar: "#EBE0CA", pie2: "#6F8FAF", grid: "rgba(235,224,202,0.08)", axis: "#8E9AAB", tipBg: "#0A2440", tipBorder: "rgba(235,224,202,0.16)", tipText: "#F1EADB", cursor: "rgba(235,224,202,0.06)", accent: "#EBE0CA", neutral: "#8FA3BA" };
}
