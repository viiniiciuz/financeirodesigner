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
    ? { bar: "#B5D100", pie2: "#14161A", grid: "rgba(16,18,20,0.08)", axis: "#6B7280", tipBg: "#FFFFFF", tipBorder: "rgba(16,18,20,0.12)", tipText: "#14161A", cursor: "rgba(16,18,20,0.05)", accent: "#4D5E00", neutral: "#14161A" }
    : { bar: "#E1FE1C", pie2: "#E8EAED", grid: "rgba(255,255,255,0.07)", axis: "#8C929C", tipBg: "#262A30", tipBorder: "rgba(255,255,255,0.1)", tipText: "#F2F4F7", cursor: "rgba(255,255,255,0.05)", accent: "#E1FE1C", neutral: "#E8EAED" };
}
