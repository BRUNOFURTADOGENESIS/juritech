import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Ponto de entrada de Captação: cada canal (webhook do WhatsApp, form do site,
// Instagram, e-mail) cria o lead aqui antes de entrar no funil de Atendimento.
const schema = z.object({
  nome: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  canalOrigem: z.enum(["whatsapp", "email", "chat_site", "instagram"]),
  origemUtm: z.string().optional(),
  mensagemInicial: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());

  const lead = await prisma.lead.create({
    data: {
      nome: body.nome,
      telefone: body.telefone,
      email: body.email,
      canalOrigem: body.canalOrigem,
      origemUtm: body.origemUtm,
      mensagens: body.mensagemInicial
        ? {
            create: {
              canal: body.canalOrigem,
              remetente: "lead",
              texto: body.mensagemInicial,
            },
          }
        : undefined,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}

export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { caso: true },
  });
  return NextResponse.json(leads);
}
