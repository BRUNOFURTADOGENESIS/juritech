import { prisma } from "./db";
import { anthropic, CLAUDE_MODEL } from "./anthropic";
import type { Canal } from "@prisma/client";

const TOOL_DECISAO = {
  name: "registrar_decisao",
  description:
    "Registra o resultado desta rodada da conversa: o que responder ao lead e como atualizar o status dele no funil.",
  input_schema: {
    type: "object" as const,
    properties: {
      resposta_para_cliente: {
        type: "string",
        description: "Mensagem a enviar ao lead nesta rodada, em português, tom acolhedor e direto.",
      },
      ja_tem_advogado: {
        type: "boolean",
        description: "true/false quando o lead respondeu se já tem advogado cuidando do caso; omitir se ainda não perguntou/respondeu.",
      },
      tipo_caso_identificado: {
        type: "string",
        description: "Nome do tipo de caso identificado na conversa, deve bater exatamente com um dos tipos de caso cadastrados fornecidos no contexto. Omitir se ainda não identificado.",
      },
      status: {
        type: "string",
        enum: [
          "em_triagem",
          "desqualificado_ja_tem_advogado",
          "desqualificado_nao_atende_requisitos",
          "qualificado",
        ],
        description: "Status do lead após esta rodada.",
      },
      fatos_resumo: {
        type: "string",
        description: "Resumo acumulado dos fatos relevantes coletados até agora (atualize a cada rodada). Omitir se nada novo.",
      },
    },
    required: ["resposta_para_cliente", "status"],
  },
};

export async function processarMensagemLead(params: {
  leadId: string;
  canal: Canal;
  texto: string;
}) {
  const { leadId, canal, texto } = params;

  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: { mensagens: { orderBy: { createdAt: "asc" } }, caso: true },
  });

  await prisma.mensagem.create({
    data: { leadId, canal, remetente: "lead", texto },
  });

  const tiposCaso = await prisma.tipoCaso.findMany({
    include: { requisitos: { orderBy: { ordem: "asc" } } },
  });

  const catalogoTipos = tiposCaso
    .map(
      (t) =>
        `- ${t.nome} (nicho: ${t.nicho})\n  Requisitos a checar:\n${t.requisitos
          .map((r) => `    ${r.ordem}. ${r.pergunta}`)
          .join("\n")}`
    )
    .join("\n");

  const historico = [...lead.mensagens, { remetente: "lead" as const, texto }]
    .map((m) => `${m.remetente === "lead" ? "Lead" : m.remetente === "ia" ? "IA" : "Advogado"}: ${m.texto}`)
    .join("\n");

  const systemPrompt = `Você conduz o atendimento inicial de um escritório de advocacia (múltiplos nichos). Sua tarefa nesta conversa:

1. Se ainda não perguntou, pergunte se a pessoa já está sendo acompanhada por outro advogado no MESMO caso. Se ela confirmar que sim, marque status "desqualificado_ja_tem_advogado" e encerre educadamente — o escritório não atende quem já tem advogado no caso.
2. Se não tem advogado, identifique de qual tipo de caso se trata entre os cadastrados abaixo, e conduza o checklist de requisitos daquele tipo, uma ou duas perguntas por vez (não bombardeie o lead com tudo de uma vez).
3. Se, pelas respostas, ela não atender aos requisitos, marque "desqualificado_nao_atende_requisitos" e explique com empatia por que não podemos seguir.
4. Se atender a todos os requisitos, marque "qualificado".
5. Enquanto o caso ainda não foi resolvido (não desqualificado nem qualificado), mantenha status "em_triagem".

Tipos de caso cadastrados:
${catalogoTipos || "(nenhum tipo de caso cadastrado ainda — peça pra IA apenas descrever o problema e mantenha em_triagem até haver cadastro)"}

Responda SEMPRE usando a ferramenta registrar_decisao.`;

  const resposta = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    tools: [TOOL_DECISAO],
    tool_choice: { type: "tool", name: "registrar_decisao" },
    messages: [{ role: "user", content: `Histórico da conversa até agora:\n${historico}` }],
  });

  const toolUse = resposta.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Modelo não retornou decisão estruturada.");
  }

  const decisao = toolUse.input as {
    resposta_para_cliente: string;
    ja_tem_advogado?: boolean;
    tipo_caso_identificado?: string;
    status: "em_triagem" | "desqualificado_ja_tem_advogado" | "desqualificado_nao_atende_requisitos" | "qualificado";
    fatos_resumo?: string;
  };

  await prisma.mensagem.create({
    data: { leadId, canal, remetente: "ia", texto: decisao.resposta_para_cliente },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: decisao.status,
      ...(decisao.ja_tem_advogado !== undefined ? { jaTemAdvogado: decisao.ja_tem_advogado } : {}),
    },
  });

  // Quando qualifica, cria o Caso (se ainda não existir) pra Contratação assumir a partir daqui.
  if (decisao.status === "qualificado" && !lead.caso && decisao.tipo_caso_identificado) {
    const tipoCaso = tiposCaso.find((t) => t.nome === decisao.tipo_caso_identificado);
    if (tipoCaso) {
      await prisma.caso.create({
        data: {
          leadId,
          tipoCasoId: tipoCaso.id,
          fatos: decisao.fatos_resumo ?? "",
          status: "qualificado",
        },
      });
    }
  }

  return decisao;
}
