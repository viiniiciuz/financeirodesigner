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
    ? { bar: "#1D6A7B", pie2: "#9CC7D0", grid: "rgba(22,78,92,0.10)", axis: "#60767E", tipBg: "#FFFFFF", tipBorder: "rgba(22,78,92,0.16)", tipText: "#12303A", cursor: "rgba(22,78,92,0.05)", accent: "#1D6A7B", neutral: "#6B8189" }
    : { bar: "#5FB4C4", pie2: "#3F8798", grid: "rgba(228,238,241,0.08)", axis: "#8FA6AE", tipBg: "#17353F", tipBorder: "rgba(228,238,241,0.16)", tipText: "#E4EEF1", cursor: "rgba(228,238,241,0.06)", accent: "#7CC6D4", neutral: "#8FA9B2" };
}
