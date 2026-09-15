"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const ROTULO: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  chat_site: "Chat no site",
  instagram: "Instagram",
};

// Ordem fixa de cores categóricas (slots 1-4) — nunca reatribuída por rank/valor.
const CORES: Record<string, string> = {
  whatsapp: "var(--series-1)",
  email: "var(--series-2)",
  chat_site: "var(--series-3)",
  instagram: "var(--series-4)",
};

export function CanalDonutChart({ dados }: { dados: { canal: string; total: number }[] }) {
  if (dados.every((d) => d.total === 0)) {
    return (
      <div className="h-56 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Sem leads ainda
      </div>
    );
  }

  return (
    <div className="h-56 w-full flex items-center gap-4">
      <div className="flex-1 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={dados} dataKey="total" nameKey="canal" innerRadius="60%" outerRadius="90%" paddingAngle={2}>
              {dados.map((d) => (
                <Cell key={d.canal} fill={CORES[d.canal]} stroke="var(--surface-card)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--surface-card-hover)",
                border: "1px solid var(--border-hairline)",
                borderRadius: 8,
                color: "var(--text-primary)",
                fontSize: 12,
              }}
              formatter={(value, name) => [value, ROTULO[String(name)] ?? String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="text-xs space-y-1.5 shrink-0" style={{ color: "var(--text-secondary)" }}>
        {dados.map((d) => (
          <li key={d.canal} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CORES[d.canal] }} />
            {ROTULO[d.canal] ?? d.canal}
            <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
              {d.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
