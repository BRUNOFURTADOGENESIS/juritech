import { NextRequest, NextResponse } from "next/server";
import { listarModelos, type Area } from "@/lib/base-modelos";

const AREAS: Area[] = ["civel", "consumidor", "trabalhista"];

// Base de modelos de caso do Dr. Carlos. ?area=civel|consumidor|trabalhista
export async function GET(req: NextRequest) {
  const area = req.nextUrl.searchParams.get("area");
  if (area && !AREAS.includes(area as Area)) {
    return NextResponse.json({ error: "area inválida" }, { status: 400 });
  }
  return NextResponse.json(listarModelos((area as Area) ?? undefined));
}
