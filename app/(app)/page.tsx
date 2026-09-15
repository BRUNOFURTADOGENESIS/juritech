import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, KpiCard } from "@/app/components/Card";
import { LeadsLineChart } from "@/app/components/charts/LeadsLineChart";
import { CanalDonutChart } from "@/app/components/charts/CanalDonutChart";
import { CasosBarChart } from "@/app/components/charts/CasosBarChart";

const CANAIS = ["whatsapp", "email", "chat_site", "instagram"] as const;

async function getDados() {
  const [totalLeads, leadsQualificados, contratosAssinados, contratos, leadsRecentes, leadsPorCanal, casos] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "qualificado" } }),
      prisma.contrato.count({ where: { status: "assinado" } }),
      prisma.contrato.findMany({ where: { status: "assinado" } }),
      prisma.lead.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) } },
        select: { createdAt: true },
      }),
      Promise.all(CANAIS.map((canal) => prisma.lead.count({ where: { canalOrigem: canal } }))),
      prisma.caso.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

  const ticketMedio = contratos.length ? contratos.reduce((s, c) => s + c.honorarioInicial, 0) / contratos.length : 0;

  const porDia = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    porDia.set(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), 0);
  }
  for (const lead of leadsRecentes) {
    const chave = lead.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    porDia.set(chave, (porDia.get(chave) ?? 0) + 1);
  }
  const leadsPorDia = Array.from(porDia, ([dia, leads]) => ({ dia, leads }));

  const canalDados = CANAIS.map((canal, i) => ({ canal, total: leadsPorCanal[i] }));
  const casosDados = casos.map((c) => ({ status: c.status, total: c._count._all }));

  return { totalLeads, leadsQualificados, contratosAssinados, ticketMedio, leadsPorDia, canalDados, casosDados };
}

export default async function Home() {
  const d = await getDados();

  return (
    <main className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Visão geral</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Captação → Atendimento/Qualificação → Contratação → Agendamento → Petições
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Leads totais" valor={d.totalLeads} />
        <KpiCard
          label="Qualificados"
          valor={d.leadsQualificados}
          sublinha={d.totalLeads ? `${((d.leadsQualificados / d.totalLeads) * 100).toFixed(0)}% dos leads` : undefined}
        />
        <KpiCard label="Contratos assinados" valor={d.contratosAssinados} />
        <KpiCard label="Ticket médio (fixo)" valor={`R$ ${d.ticketMedio.toFixed(0)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="text-sm font-medium mb-2">Leads nos últimos 14 dias</div>
          <LeadsLineChart dados={d.leadsPorDia} />
        </Card>
        <Card>
          <div className="text-sm font-medium mb-2">Leads por canal</div>
          <CanalDonutChart dados={d.canalDados} />
        </Card>
      </div>

      <Card>
        <div className="text-sm font-medium mb-2">Casos por etapa do funil</div>
        <CasosBarChart dados={d.casosDados} />
      </Card>

      <nav className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NavCard href="/atendimento" titulo="Atendimento" desc="Testar o chat de triagem/qualificação" />
        <NavCard href="/casos" titulo="Casos" desc="Contratação e petições por caso" />
        <NavCard href="/tipos-caso" titulo="Tipos de caso" desc="Requisitos de qualificação por nicho" />
        <NavCard href="/metricas" titulo="Métricas" desc="CAC, ticket médio, taxa de procedência" />
      </nav>
    </main>
  );
}

function NavCard({ href, titulo, desc }: { href: string; titulo: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border p-4 block transition-colors"
      style={{ background: "var(--surface-card)", borderColor: "var(--border-hairline)" }}
    >
      <div className="font-semibold text-sm">{titulo}</div>
      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        {desc}
      </div>
    </Link>
  );
}
