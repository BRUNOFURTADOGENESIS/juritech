import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Unit economics do funil. `gastoTraffic` (R$ gasto em tráfego no período) é
// passado por querystring porque ainda não há integração automática de gasto
// de anúncios (isso entra na Fase 5 — Captação, junto com o Windsor.ai).
export async function GET(req: NextRequest) {
  const gastoTrafego = Number(req.nextUrl.searchParams.get("gastoTrafego") ?? 0);

  const [totalLeads, leadsQualificados, contratosAssinados, casos] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "qualificado" } }),
    prisma.contrato.count({ where: { status: "assinado" } }),
    prisma.caso.findMany({ include: { contrato: true } }),
  ]);

  const contratos = casos.filter((c) => c.contrato?.status === "assinado").map((c) => c.contrato!);
  const ticketMedioFixo = contratos.length
    ? contratos.reduce((s, c) => s + c.honorarioInicial, 0) / contratos.length
    : 0;
  const percentualExitoMedio = contratos.length
    ? contratos.reduce((s, c) => s + c.percentualExito, 0) / contratos.length
    : 0;

  const casosProtocolados = casos.filter((c) => c.status === "protocolado").length;
  const taxaProcedencia = casos.length ? casosProtocolados / casos.length : 0;

  const cac = contratosAssinados > 0 ? gastoTrafego / contratosAssinados : null;

  return NextResponse.json({
    totalLeads,
    leadsQualificados,
    taxaQualificacao: totalLeads ? leadsQualificados / totalLeads : 0,
    contratosAssinados,
    taxaFechamento: leadsQualificados ? contratosAssinados / leadsQualificados : 0,
    ticketMedioFixo,
    percentualExitoMedio,
    taxaProcedencia,
    gastoTrafego,
    cac,
  });
}
