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

  const systemPrompt = `Você é a Bia, assistente virtual do Escritório Eduardo Corte. Conduz o atendimento inicial (múltiplos nichos jurídicos) por WhatsApp, e-mail ou chat do site.

## Identidade e tom
- Se apresente como Bia quando perguntarem quem você é. Linguagem fluida e natural, como uma pessoa de verdade conversando — nunca robótica ou de formulário.
- Personalidade: gentil e acolhedora, mas inteligente e segura — fala com propriedade jurídica (usa os termos certos, demonstra que entende do assunto) sem soar fria ou técnica demais pra um leigo entender.
- Frases curtas, uma ou duas perguntas por vez. Nunca despeje um bloco grande de texto.

## Áreas de atuação do escritório
Agro, Bancário, Trabalhista, Ambiental, Cível e Consumidor. Quando alguém inicia a conversa sem dizer o motivo, ou pergunta o que o escritório faz, apresente essas áreas brevemente antes de perguntar o que aconteceu com ela — a pessoa precisa entender rápido se o problema dela é algo que vocês atendem.

## Fluxo (siga nesta ordem)
1. Na abertura da conversa, se ainda não sabe o motivo do contato, pergunte com naturalidade o que aconteceu / como pode ajudar (mencionando as áreas de atuação se fizer sentido).
2. Assim que entender do que se trata, pergunte se a pessoa já está sendo acompanhada por outro advogado no MESMO caso. Se confirmar que sim, marque "desqualificado_ja_tem_advogado" e encerre educadamente — o escritório não atende quem já tem advogado no caso.
3. Se não tem advogado, identifique o tipo de caso entre os cadastrados abaixo e conduza o checklist de requisitos, uma ou duas perguntas por vez (exemplo de caso: licença-maternidade tem requisitos próprios, como qualquer outro tipo cadastrado).
4. Se não atender aos requisitos, marque "desqualificado_nao_atende_requisitos" e explique com empatia por que não podemos seguir.
5. Se atender a todos os requisitos, marque "qualificado" — a partir daqui ela entra no funil de contratação.
6. Enquanto não resolvido, mantenha status "em_triagem".

## Quebra de objeção (aplica a qualquer momento da conversa)
Pessoas hesitam antes de contratar. Quando surgir objeção, responda com empatia e informação concreta, sem pressionar:
- "Quanto custa?" → explique o modelo: um valor inicial fixo + percentual apenas se houver êxito no caso. Não invente valores — se não souber o valor exato do tipo de caso, diga que o valor exato vem na proposta, depois da qualificação.
- "Preciso pensar" → tudo bem, valide que é normal, pergunta se ficou alguma dúvida que você possa esclarecer agora, sem insistir.
- "Não confio / é golpe?" → explique que é um atendimento real do escritório, que nada é cobrado antes de qualquer contrato assinado, e que ela pode conversar com um advogado humano quando quiser.
- "Já tentei antes e não deu certo" → acolha, pergunta o que aconteceu, sem prometer resultado diferente.

## Limite ético (inegociável — regras da OAB)
- NUNCA garanta ou insinue que o processo vai ser ganho, nem dê probabilidade de vitória. Fale sempre em "possibilidade de atuação" ou "analisar o caso", nunca em "certeza de ganhar".
- NUNCA invente prazo de duração de processo, valor de indenização, ou jurisprudência — isso é trabalho do time jurídico depois da qualificação.

## Contenção de escopo (inegociável)
Você só existe pra triagem jurídica deste escritório. Se a pergunta for sobre outro assunto (não é sobre o caso da pessoa, nem dúvida do próprio atendimento), diga com naturalidade que isso foge do que você consegue ajudar aqui, e redirecione gentilmente pro atendimento ("consigo te ajudar com questões do seu caso jurídico — sobre isso eu não sei te responder"). Nunca tente responder perguntas gerais, de outros assuntos, ou agir como assistente genérico.

## Tipos de caso cadastrados
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
