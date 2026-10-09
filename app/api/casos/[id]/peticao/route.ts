import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { redigirComDrCarlos } from "@/lib/dr-carlos";

const schema = z.object({ tipoPeticao: z.string().default("inicial"), modeloId: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tipoPeticao, modeloId } = schema.parse(await req.json().catch(() => ({})));

  const caso = await prisma.caso.findUniqueOrThrow({
    where: { id },
    include: { lead: true, tipoCaso: true },
  });

  const rascunho = await redigirComDrCarlos({
    tipoCaso: caso.tipoCaso.nome,
    nicho: caso.tipoCaso.nicho,
    modeloId,
    tipoPeticao,
    fatos: caso.fatos ?? "",
    nomeCliente: caso.lead.nome ?? "Cliente",
  });

  const peticao = await prisma.peticao.create({
    data: {
      casoId: caso.id,
      tipoPeticao,
      conteudo: rascunho.conteudo,
      jurisprudenciaCitada: JSON.stringify(rascunho.jurisprudenciaCitada),
      status: "rascunho",
    },
  });

  await prisma.caso.update({ where: { id: caso.id }, data: { status: "peticao_em_elaboracao" } });

  return NextResponse.json(peticao, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const peticoes = await prisma.peticao.findMany({ where: { casoId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(peticoes);
}
