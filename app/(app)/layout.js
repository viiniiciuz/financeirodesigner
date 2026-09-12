"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ListChecks, Briefcase, Building2, Users, Wallet, Settings, Menu, Building, LogOut } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabaseClient";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/demandas", label: "Demandas", icon: ListChecks },
  { href: "/freela", label: "Demandas Freela", icon: Briefcase },
  { href: "/trabalhos-empresa", label: "Trabalhos de Empresa", icon: Building2 },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/empresas", label: "Empresas", icon: Building },
  { href: "/pagamentos", label: "Pagamentos", icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function AppLayout({ children }) {
  const { loading, session } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B96AB" }}>Carregando…</div>;
  if (!session) return null; // useAuth já redireciona para /login

  const logout = async () => { await supabase.auth.signOut(); router.replace("/login"); };

  return (
    <div className="shell">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <div className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">Financeiro Designer</div>
        <div className="nav">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={`nav-item ${pathname === n.href ? "active" : ""}`} onClick={() => setOpen(false)}>
              <n.icon size={16} /> <span>{n.label}</span>
            </a>
          ))}
        </div>
        <div className="sidebar-foot">
          <button onClick={logout} className="nav-item" style={{ width: "100%" }}><LogOut size={16} /> <span>Sair</span></button>
        </div>
      </div>
      <div className="main">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setOpen((o) => !o)}><Menu size={18} /></button>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
