import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/app/components/Card";

export default async function CasosPage() {
  const casos = await prisma.caso.findMany({
    orderBy: { createdAt: "desc" },
    include: { lead: true, tipoCaso: true, contrato: true },
  });

  return (
    <main className="max-w-3xl p-8 space-y-4">
      <h1 className="text-xl font-bold">Casos</h1>
      <div className="space-y-3">
        {casos.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhum caso qualificado ainda.
          </p>
        )}
        {casos.map((c) => (
          <Link key={c.id} href={`/casos/${c.id}`} className="block">
            <Card className="transition-colors hover:brightness-110">
              <div className="font-semibold text-sm">
                {c.lead.nome ?? "Sem nome"} — {c.tipoCaso.nome}
              </div>
              <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                status: {c.status} {c.contrato ? `· contrato: ${c.contrato.status}` : ""}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
