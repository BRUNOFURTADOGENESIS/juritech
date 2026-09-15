"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ROTULO: Record<string, string> = {
  qualificado: "Qualificado",
  proposta_enviada: "Proposta enviada",
  aguardando_assinatura: "Aguard. assinatura",
  contratado: "Contratado",
  agendado: "Agendado",
  em_andamento_advogado: "Com advogado",
  peticao_em_elaboracao: "Petição em elab.",
  peticao_aprovada: "Petição aprovada",
  protocolado: "Protocolado",
  encerrado: "Encerrado",
};

export function CasosBarChart({ dados }: { dados: { status: string; total: number }[] }) {
  const dadosRotulados = dados.map((d) => ({ ...d, label: ROTULO[d.status] ?? d.status }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dadosRotulados} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-hairline)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            axisLine={{ stroke: "var(--border-hairline)" }}
            tickLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={50}
          />
          <YAxis allowDecimals={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{
              background: "var(--surface-card-hover)",
              border: "1px solid var(--border-hairline)",
              borderRadius: 8,
              color: "var(--text-primary)",
              fontSize: 12,
            }}
            cursor={{ fill: "var(--surface-card-hover)" }}
          />
          <Bar dataKey="total" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
