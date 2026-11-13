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
    ? { bar: "#0056FF", pie2: "#9BBFFF", grid: "rgba(0,40,140,0.10)", axis: "#5F6785", tipBg: "#FFFFFF", tipBorder: "rgba(0,40,140,0.16)", tipText: "#0A0F24", cursor: "rgba(0,86,255,0.06)", accent: "#0056FF", neutral: "#6B7699" }
    : { bar: "#4C8DFF", pie2: "#2A4FB0", grid: "rgba(214,224,255,0.08)", axis: "#8D9AC4", tipBg: "#131F47", tipBorder: "rgba(214,224,255,0.16)", tipText: "#EAF0FF", cursor: "rgba(214,224,255,0.06)", accent: "#86B0FF", neutral: "#8E9BC6" };
}
