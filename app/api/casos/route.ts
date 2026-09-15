import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const casos = await prisma.caso.findMany({
    orderBy: { createdAt: "desc" },
    include: { lead: true, tipoCaso: true, contrato: true },
  });
  return NextResponse.json(casos);
}
