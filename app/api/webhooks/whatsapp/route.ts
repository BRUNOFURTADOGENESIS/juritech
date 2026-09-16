import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processarMensagemLead } from "@/lib/atendimento";
import { enviarWhatsapp } from "@/lib/whatsapp";
import { transcreverAudio } from "@/lib/transcricao";

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
  if (!telefone) {
    return NextResponse.json({ ok: true });
  }

  // Mensagem de voz: Bia precisa entender áudio, não só texto — transcreve
  // antes de seguir pro mesmo pipeline de qualificação (o resto do fluxo não
  // sabe nem precisa saber que veio de áudio).
  const audioUrl: string | undefined = body.audio?.audioUrl ?? body.audio?.url;
  let texto: string | undefined = body.text?.message ?? body.message?.text;

  if (!texto && audioUrl) {
    try {
      texto = await transcreverAudio(audioUrl);
    } catch {
      // Sem transcrição configurada/disponível — segue sem travar o atendimento,
      // o time humano acompanha essa conversa depois pelo dashboard.
      return NextResponse.json({ ok: true, aviso: "falha ao transcrever áudio" });
    }
  }

  if (!texto) {
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
