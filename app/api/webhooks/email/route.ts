import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { processarMensagemLead } from "@/lib/atendimento";
import { enviarEmail } from "@/lib/email";

// Formato normalizado — a maioria dos provedores de "inbound email → webhook"
// (Postmark, SendGrid Inbound Parse, Mailgun Routes) manda algo equivalente a
// isto; se o provedor escolhido usar outros nomes de campo, mapear aqui.
const schema = z.object({
  from: z.string().email(),
  subject: z.string().optional().default(""),
  text: z.string(),
});

export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());

  let lead = await prisma.lead.findFirst({ where: { email: body.from } });
  if (!lead) {
    lead = await prisma.lead.create({
      data: { email: body.from, canalOrigem: "email" },
    });
  }

  const decisao = await processarMensagemLead({ leadId: lead.id, canal: "email", texto: body.text });

  try {
    await enviarEmail({
      to: body.from,
      subject: body.subject || "Sobre seu atendimento",
      texto: decisao.resposta_para_cliente,
      emResposta: body.subject,
    });
  } catch (err) {
    // A conversa já foi registrada no banco mesmo se o envio falhar — não perde o
    // atendimento, só a resposta não sai até o SMTP ser configurado.
    return NextResponse.json(
      { ok: true, enviado: false, aviso: err instanceof Error ? err.message : "falha ao enviar e-mail" },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, enviado: true });
}
