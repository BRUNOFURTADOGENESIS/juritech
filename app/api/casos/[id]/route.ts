import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caso = await prisma.caso.findUniqueOrThrow({
    where: { id },
    include: { lead: true, tipoCaso: true, contrato: true, peticoes: true },
  });
  return NextResponse.json(caso);
}
