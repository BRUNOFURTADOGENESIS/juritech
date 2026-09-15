"use client";

import { useEffect, useState } from "react";
import { Card, KpiCard } from "@/app/components/Card";

type Metricas = {
  totalLeads: number;
  leadsQualificados: number;
  taxaQualificacao: number;
  contratosAssinados: number;
  taxaFechamento: number;
  ticketMedioFixo: number;
  percentualExitoMedio: number;
  taxaProcedencia: number;
  gastoTrafego: number;
  cac: number | null;
};

export default function MetricasPage() {
  const [gasto, setGasto] = useState("5000");
  const [m, setM] = useState<Metricas | null>(null);

  async function carregar() {
    const res = await fetch(`/api/metricas?gastoTrafego=${gasto}`);
    setM(await res.json());
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-xl font-bold">Unit Economics do Funil</h1>

      <Card className="flex gap-3 items-end w-fit">
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>
            Gasto em tráfego no período (R$)
          </label>
          <input
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--surface-card-hover)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
            value={gasto}
            onChange={(e) => setGasto(e.target.value)}
          />
        </div>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
          onClick={carregar}
        >
          Recalcular
        </button>
      </Card>

      {m && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Leads totais" valor={m.totalLeads} />
          <KpiCard label="Qualificados" valor={`${m.leadsQualificados}`} sublinha={`${(m.taxaQualificacao * 100).toFixed(0)}% dos leads`} />
          <KpiCard label="Contratos assinados" valor={m.contratosAssinados} />
          <KpiCard label="Taxa de fechamento" valor={`${(m.taxaFechamento * 100).toFixed(0)}%`} sublinha="qualificado → contrato" />
          <KpiCard label="Ticket médio (fixo)" valor={`R$ ${m.ticketMedioFixo.toFixed(2)}`} />
          <KpiCard label="% de êxito médio" valor={`${(m.percentualExitoMedio * 100).toFixed(0)}%`} />
          <KpiCard label="Taxa de procedência" valor={`${(m.taxaProcedencia * 100).toFixed(0)}%`} />
          <KpiCard label="CAC" valor={m.cac ? `R$ ${m.cac.toFixed(2)}` : "—"} sublinha={m.cac ? undefined : "sem contratos ainda"} />
        </div>
      )}
    </main>
  );
}
