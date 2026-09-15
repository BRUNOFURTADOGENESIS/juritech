import { anthropic, CLAUDE_MODEL } from "./anthropic";
import { pesquisarJurisprudencia, type FontJurisprudencia } from "./jurisprudencia";

export type RascunhoPeticao = {
  conteudo: string;
  jurisprudenciaCitada: FontJurisprudencia[];
};

export async function gerarPeticao(params: {
  tipoCaso: string;
  tipoPeticao: string; // "inicial" | "contestação" | "recurso" etc.
  fatos: string;
  nomeCliente: string;
}): Promise<RascunhoPeticao> {
  const { tipoCaso, tipoPeticao, fatos, nomeCliente } = params;

  const jurisprudencia = await pesquisarJurisprudencia(tipoCaso, fatos);

  const fontesTexto = jurisprudencia
    .map((f, i) => `[${i + 1}] ${f.titulo} — ${f.url}\n${f.trecho}`)
    .join("\n\n");

  const geracao = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system:
      "Você é um assistente de redação jurídica. Gera rascunhos de peças processuais em português formal, seguindo a estrutura processual civil brasileira (endereçamento, qualificação das partes, dos fatos, do direito, dos pedidos, valor da causa, fecho). " +
      "SÓ cite jurisprudência que estiver literalmente nas fontes fornecidas, com a URL entre parênteses. Nunca invente número de processo, ementa ou tribunal. Se não houver fonte pra sustentar um ponto, diga isso explicitamente no rascunho em vez de inventar.",
    messages: [
      {
        role: "user",
        content: `Tipo de caso: ${tipoCaso}\nTipo de peça: ${tipoPeticao}\nCliente: ${nomeCliente}\nFatos coletados na triagem: ${fatos}\n\nFontes de jurisprudência disponíveis:\n${fontesTexto || "(nenhuma fonte encontrada — não cite jurisprudência, apenas fundamente na legislação geral e sinalize a ausência de precedentes localizados)"}\n\nGere o rascunho completo da peça.`,
      },
    ],
  });

  const conteudoBruto = geracao.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");

  // Segunda passada: revisão de coerência, citações e formatação.
  const revisao = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system:
      "Você é um revisor jurídico sênior. Revise o rascunho abaixo checando: (1) toda citação de jurisprudência corresponde de fato a uma das fontes fornecidas — remova qualquer citação que pareça inventada; (2) coerência entre fatos, fundamentação e pedidos; (3) formatação processual correta. Devolva o texto revisado final, pronto para o advogado aprovar.",
    messages: [
      {
        role: "user",
        content: `Fontes originais disponíveis:\n${fontesTexto || "(nenhuma)"}\n\nRascunho a revisar:\n${conteudoBruto}`,
      },
    ],
  });

  const conteudoFinal = revisao.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");

  return { conteudo: conteudoFinal, jurisprudenciaCitada: jurisprudencia };
}
