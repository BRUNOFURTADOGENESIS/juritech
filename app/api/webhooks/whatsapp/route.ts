import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processarMensagemLead } from "@/lib/atendimento";
import { enviarWhatsapp } from "@/lib/whatsapp";

// Webhook "ao receber mensagem" da Z-API — configurar em z-api.io na instância,
// apontando pra esta URL. Protegido por um segredo na querystring (não é a
// mesma coisa que o Client-Token do envio): configure a URL no painel da Z-API
// como .../api/webhooks/whatsapp?secret=SEU_SEGREDO e defina o mesmo valor em
// ZAPI_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const secretEsperado = process.env.ZAPI_WEBHOOK_SECRET;
  if (secretEsperado && req.nextUrl.searchParams.get("secret") !== secretEsperado) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await req.json();

  // Ignora eco de mensagens enviadas por nós mesmos e mensagens de grupo.
  if (body.fromMe || body.isGroup) {
    return NextResponse.json({ ok: true });
  }

  const telefone: string | undefined = body.phone;
  const texto: string | undefined = body.text?.message ?? body.message?.text;
  if (!telefone || !texto) {
    return NextResponse.json({ ok: true }); // outros tipos de evento (status, imagem, etc.), ignorar por ora
  }

  let lead = await prisma.lead.findFirst({ where: { telefone } });
  if (!lead) {
    lead = await prisma.lead.create({ data: { telefone, canalOrigem: "whatsapp" } });
  }

  const decisao = await processarMensagemLead({ leadId: lead.id, canal: "whatsapp", texto });

  try {
    await enviarWhatsapp({ to: telefone, texto: decisao.resposta_para_cliente });
  } catch {
    // Conversa já ficou registrada no banco; só a resposta automática não saiu.
  }

  return NextResponse.json({ ok: true });
}
