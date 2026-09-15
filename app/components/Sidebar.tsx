"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";

const ITENS = [
  { href: "/", label: "Visão geral", icon: "◧" },
  { href: "/atendimento", label: "Atendimento", icon: "◈" },
  { href: "/casos", label: "Casos", icon: "◫" },
  { href: "/agendamento", label: "Agendamento", icon: "◔" },
  { href: "/tipos-caso", label: "Tipos de caso", icon: "◪" },
  { href: "/metricas", label: "Métricas", icon: "◩" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 shrink-0 flex flex-col gap-1 p-4 border-r"
      style={{ borderColor: "var(--border-hairline)", background: "var(--surface-card)" }}
    >
      <div className="flex items-center gap-2 px-2 py-3 mb-2">
        <LogoMark size={26} />
        <span className="font-semibold tracking-tight">JuriTech</span>
      </div>

      {ITENS.map((item) => {
        const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              background: ativo ? "var(--surface-card-hover)" : "transparent",
              color: ativo ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: ativo ? 600 : 400,
            }}
          >
            <span aria-hidden style={{ color: ativo ? "var(--brand)" : "var(--text-muted)" }}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
