import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { textoParaDocxBuffer } from "@/lib/docx";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const peticao = await prisma.peticao.findUniqueOrThrow({
    where: { id },
    include: { caso: { include: { lead: true, tipoCaso: true } } },
  });

  const buffer = await textoParaDocxBuffer(
    `${peticao.tipoPeticao} — ${peticao.caso.tipoCaso.nome} — ${peticao.caso.lead.nome ?? ""}`,
    peticao.conteudo
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="peticao-${peticao.id}.docx"`,
    },
  });
}
