import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ inicio: z.string().datetime(), fim: z.string().datetime() });

// Cadastro de horários disponíveis do advogado. Sem Google Calendar por
// enquanto — é o time interno que abre os horários aqui.
export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());
  const slot = await prisma.slotAgendamento.create({
    data: { inicio: new Date(body.inicio), fim: new Date(body.fim) },
  });
  return NextResponse.json(slot, { status: 201 });
}

export async function GET(req: NextRequest) {
  const apenasDisponiveis = req.nextUrl.searchParams.get("disponiveis") === "true";
  const slots = await prisma.slotAgendamento.findMany({
    where: apenasDisponiveis ? { disponivel: true, inicio: { gte: new Date() } } : undefined,
    orderBy: { inicio: "asc" },
    include: { caso: { include: { lead: true } } },
  });
  return NextResponse.json(slots);
}
