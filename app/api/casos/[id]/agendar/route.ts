import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { enviarMensagemParaLead } from "@/lib/mensageria";

const schema = z.object({ slotId: z.string() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { slotId } = schema.parse(await req.json());

  const caso = await prisma.caso.findUniqueOrThrow({ where: { id }, include: { lead: true } });

  // updateMany com where disponivel:true faz a reivindicação do horário ser
  // atômica — se dois leads tentarem o mesmo slot ao mesmo tempo, só um
  // updateMany afeta 1 linha; o outro afeta 0 e recebe o erro de conflito.
  const resultado = await prisma.slotAgendamento.updateMany({
    where: { id: slotId, disponivel: true },
    data: { disponivel: false, casoId: id },
  });

  if (resultado.count === 0) {
    return NextResponse.json({ error: "Esse horário já não está mais disponível." }, { status: 409 });
  }

  await prisma.caso.update({ where: { id }, data: { status: "agendado" } });

  const slot = await prisma.slotAgendamento.findUniqueOrThrow({ where: { id: slotId } });
  const horario = slot.inicio.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  await enviarMensagemParaLead(
    caso.lead,
    `Consulta confirmada para ${horario}. Te esperamos! Qualquer imprevisto, é só responder por aqui.`
  );

  return NextResponse.json({ ok: true, horario });
}
