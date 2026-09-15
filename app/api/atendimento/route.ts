import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processarMensagemLead } from "@/lib/atendimento";

const schema = z.object({
  leadId: z.string(),
  canal: z.enum(["whatsapp", "email", "chat_site", "instagram"]),
  texto: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());
  try {
    const decisao = await processarMensagemLead(body);
    return NextResponse.json(decisao);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
