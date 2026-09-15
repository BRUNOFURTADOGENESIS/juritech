import { prisma } from "./db";
import { enviarEmail } from "./email";
import { enviarWhatsapp } from "./whatsapp";
import type { Lead } from "@prisma/client";

// Ponto único de saída pra qualquer notificação automática (confirmação de
// assinatura, lembrete de cobrança, convite pra agendar) — sempre grava a
// mensagem no histórico do lead, mesmo se o envio no canal falhar, porque a
// falha de entrega não pode apagar o rastro do que o sistema tentou fazer.
export async function enviarMensagemParaLead(lead: Lead, texto: string): Promise<{ enviado: boolean; erro?: string }> {
  await prisma.mensagem.create({
    data: { leadId: lead.id, canal: lead.canalOrigem, remetente: "ia", texto },
  });

  try {
    if (lead.canalOrigem === "whatsapp" && lead.telefone) {
      await enviarWhatsapp({ to: lead.telefone, texto });
    } else if ((lead.canalOrigem === "email" || lead.canalOrigem === "chat_site") && lead.email) {
      await enviarEmail({ to: lead.email, subject: "Atualização do seu atendimento", texto });
    } else {
      // Lead veio do chat do site sem e-mail cadastrado (fluxo de teste/anônimo) —
      // não há canal externo pra notificar; a mensagem já ficou registrada acima
      // e aparece pro cliente na própria tela de chat na próxima visita.
      return { enviado: false, erro: "Lead sem contato externo cadastrado (telefone/e-mail) pra este canal" };
    }
    return { enviado: true };
  } catch (err) {
    return { enviado: false, erro: err instanceof Error ? err.message : "falha ao enviar" };
  }
}
