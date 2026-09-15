import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarMensagemParaLead } from "@/lib/mensageria";

const INTERVALO_ENTRE_LEMBRETES_HORAS = 24;
const MAX_TENTATIVAS = 3;
const EXPIRA_APOS_DIAS = 7;

// Follow-up automático de cobrança de assinatura — é o "segue cobrança" do
// fluxo. Precisa ser chamado periodicamente por um agendador externo (Vercel
// Cron, cron-job.org, etc.) batendo nesta URL com o segredo configurado, já
// que este app não roda nenhum processo em segundo plano sozinho.
// Ex. de vercel.json:
// { "crons": [{ "path": "/api/cron/cobranca-assinatura?secret=...", "schedule": "0 * * * *" }] }
export async function GET(req: NextRequest) {
  const secretEsperado = process.env.CRON_SECRET;
  if (secretEsperado && req.nextUrl.searchParams.get("secret") !== secretEsperado) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const agora = new Date();
  const limiteLembrete = new Date(agora.getTime() - INTERVALO_ENTRE_LEMBRETES_HORAS * 60 * 60 * 1000);
  const limiteExpiracao = new Date(agora.getTime() - EXPIRA_APOS_DIAS * 24 * 60 * 60 * 1000);

  const pendentes = await prisma.contrato.findMany({
    where: { status: "pendente", linkAssinatura: { not: null } },
    include: { caso: { include: { lead: true, tipoCaso: true } } },
  });

  let lembretesEnviados = 0;
  let expirados = 0;

  for (const contrato of pendentes) {
    if (contrato.createdAt < limiteExpiracao) {
      await prisma.contrato.update({ where: { id: contrato.id }, data: { status: "expirado" } });
      expirados++;
      continue;
    }

    if (contrato.tentativasLembrete >= MAX_TENTATIVAS) continue;
    if (contrato.ultimoLembreteEm && contrato.ultimoLembreteEm > limiteLembrete) continue;

    const resultado = await enviarMensagemParaLead(
      contrato.caso.lead,
      `Oi! Vi que você ainda não assinou o contrato pra darmos andamento no seu caso de ${contrato.caso.tipoCaso.nome}. Aqui está o link de novo: ${contrato.linkAssinatura}`
    );

    if (resultado.enviado) {
      await prisma.contrato.update({
        where: { id: contrato.id },
        data: { ultimoLembreteEm: agora, tentativasLembrete: { increment: 1 } },
      });
      lembretesEnviados++;
    }
  }

  return NextResponse.json({ ok: true, lembretesEnviados, expirados, avaliados: pendentes.length });
}
