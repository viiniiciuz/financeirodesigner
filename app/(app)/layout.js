"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ListChecks, Briefcase, Building2, Users, Wallet, Settings, Menu, Building, LogOut, FolderKanban, FileSignature, Receipt } from "lucide-react";
import { ThemeToggle } from "@/components/ui";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabaseClient";

const LOGO_SRC = "/logo.png";

const TOPO = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/empresas", label: "Empresas", icon: Building },
  { href: "/pagamentos", label: "Pagamentos", icon: Wallet },
  { href: "/despesas", label: "Despesas", icon: Receipt },
];
const SECOES = [
  { label: "Trabalho", icon: FolderKanban, itens: [
    { href: "/demandas", label: "Demandas", icon: ListChecks },
    { href: "/freela", label: "Demandas Freela", icon: Briefcase },
    { href: "/trabalhos-empresa", label: "Trabalhos de Empresa", icon: Building2 },
  ] },
  { label: "Contrato", icon: FileSignature, itens: [
    { href: "/contratos", label: "Contratos", icon: FileSignature },
  ] },
];

export default function AppLayout({ children }) {
  const { loading, session } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8C929C" }}>Carregando…</div>;
  if (!session) return null; // useAuth já redireciona para /login

  const logout = async () => { await supabase.auth.signOut(); router.replace("/login"); };

  return (
    <div className="shell">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <div className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <img className="logo-dark" src={LOGO_SRC} alt="Zentrix Flow" style={{ width: 150, height: "auto" }} />
          <img className="logo-light" src="/logo-light.png" alt="Zentrix Flow" style={{ width: 150, height: "auto" }} />
        </div>
        <div className="nav">
          {TOPO.map((n) => (
            <a key={n.href} href={n.href} className={`nav-item ${pathname === n.href ? "active" : ""}`} onClick={() => setOpen(false)}>
              <n.icon size={16} /> <span>{n.label}</span>
            </a>
          ))}
          {SECOES.map((s) => (
            <div key={s.label}>
              <div className="nav-section"><s.icon size={13} /><span>{s.label}</span>{s.emBreve && <b className="tag-soon">Em breve</b>}<i /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {s.itens.map((c) => (
                  <a key={c.href} href={c.href} className={`nav-item ${pathname === c.href ? "active" : ""}`} onClick={() => setOpen(false)}>
                    <c.icon size={16} /> <span>{c.label}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="sidebar-foot">
          <a href="/configuracoes" className={`nav-item ${pathname === "/configuracoes" ? "active" : ""}`} onClick={() => setOpen(false)}><Settings size={16} /> <span>Configurações</span></a>
          <button onClick={logout} className="nav-item" style={{ width: "100%" }}><LogOut size={16} /> <span>Sair</span></button>
        </div>
      </div>
      <div className="main">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setOpen((o) => !o)}><Menu size={18} /></button>
          <div style={{ marginLeft: "auto" }}><ThemeToggle /></div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
