import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ status: z.enum(["rascunho", "em_revisao", "aprovado_advogado", "protocolado"]) });

// Aprovação humana obrigatória: só o advogado move a petição pra
// "aprovado_advogado"/"protocolado" — a IA nunca chama esta rota sozinha.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = schema.parse(await req.json());

  const peticao = await prisma.peticao.update({ where: { id }, data: { status } });

  if (status === "aprovado_advogado") {
    await prisma.caso.update({ where: { id: peticao.casoId }, data: { status: "peticao_aprovada" } });
  }
  if (status === "protocolado") {
    await prisma.caso.update({ where: { id: peticao.casoId }, data: { status: "protocolado" } });
  }

  return NextResponse.json(peticao);
}
