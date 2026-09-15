import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  nome: z.string(),
  nicho: z.string(),
  percentualExitoPadrao: z.number().min(0).max(1),
  honorarioInicialPadrao: z.number().min(0),
  requisitos: z.array(z.object({ pergunta: z.string(), obrigatorio: z.boolean().default(true) })),
});

// Cadastro dos "requisitos" por tipo de caso — definido pelo escritório
// (advogados), a IA só aplica na conversa de triagem. Ver lib/atendimento.ts.
export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());

  const tipoCaso = await prisma.tipoCaso.create({
    data: {
      nome: body.nome,
      nicho: body.nicho,
      percentualExitoPadrao: body.percentualExitoPadrao,
      honorarioInicialPadrao: body.honorarioInicialPadrao,
      requisitos: {
        create: body.requisitos.map((r, i) => ({
          ordem: i + 1,
          pergunta: r.pergunta,
          obrigatorio: r.obrigatorio,
        })),
      },
    },
    include: { requisitos: true },
  });

  return NextResponse.json(tipoCaso, { status: 201 });
}

export async function GET() {
  const tipos = await prisma.tipoCaso.findMany({ include: { requisitos: true } });
  return NextResponse.json(tipos);
}
