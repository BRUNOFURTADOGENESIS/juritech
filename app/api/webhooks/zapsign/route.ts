import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarMensagemParaLead } from "@/lib/mensageria";

// Webhook de assinatura concluída/recusada do ZapSign. Configurar em
// app.zapsign.com.br apontando pra esta URL. O nome exato dos campos abaixo
// (token/event/status) é o formato documentado pelo ZapSign para o evento de
// assinatura — confirme contra o payload real assim que a conta for criada e
// o primeiro teste de assinatura for feito; se algo não bater, é só ajustar
// a extração abaixo, o resto do fluxo (idempotência, atualização de status,
// aviso ao lead) não muda.
export async function POST(req: NextRequest) {
  const body = await req.json();

  const token: string | undefined = body.token ?? body.doc?.token;
  const evento: string = body.event ?? body.status ?? "desconhecido";

  if (!token) {
    return NextResponse.json({ ok: false, erro: "payload sem token do documento" }, { status: 400 });
  }

  // Idempotência: se o ZapSign reenviar o mesmo evento (comum em retry de
  // webhook), a segunda chamada não deve duplicar o efeito.
  try {
    await prisma.eventoWebhookProcessado.create({
      data: { provedor: "zapsign", idEvento: `${token}:${evento}` },
    });
  } catch {
    return NextResponse.json({ ok: true, duplicado: true });
  }

  const contrato = await prisma.contrato.findUnique({
    where: { idDocumentoExterno: token },
    include: { caso: { include: { lead: true } } },
  });

  if (!contrato) {
    return NextResponse.json({ ok: false, erro: "contrato não encontrado pra este token" }, { status: 404 });
  }

  const assinado = /sign/i.test(evento) && !/reject|decline|cancel/i.test(evento);
  const recusado = /reject|decline|cancel/i.test(evento);

  if (assinado && contrato.status !== "assinado") {
    await prisma.$transaction([
      prisma.contrato.update({
        where: { id: contrato.id },
        data: { status: "assinado", assinadoEm: new Date() },
      }),
      prisma.caso.update({
        where: { id: contrato.casoId },
        data: { status: "contratado" },
      }),
    ]);

    const baseUrl = process.env.APP_URL ?? "";
    const linkAgendamento = baseUrl ? `${baseUrl}/agendar/${contrato.casoId}` : `/agendar/${contrato.casoId}`;

    await enviarMensagemParaLead(
      contrato.caso.lead,
      `Recebemos sua assinatura, obrigado! Seu processo já está em andamento. Escolha um horário pra falar com o advogado responsável: ${linkAgendamento}`
    );
  } else if (recusado && contrato.status !== "recusado") {
    await prisma.contrato.update({ where: { id: contrato.id }, data: { status: "recusado" } });
  }

  return NextResponse.json({ ok: true });
}
