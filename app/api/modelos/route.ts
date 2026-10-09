import { NextRequest, NextResponse } from "next/server";
import { AREAS, listarModelos, type Area } from "@/lib/base-modelos";

// Base de modelos de caso do Dr. Carlos. ?area=civel|consumidor|trabalhista
export async function GET(req: NextRequest) {
  const area = req.nextUrl.searchParams.get("area");
  if (area && !(AREAS as readonly string[]).includes(area)) {
    return NextResponse.json({ error: "area inválida" }, { status: 400 });
  }
  return NextResponse.json(listarModelos((area as Area) ?? undefined));
}
