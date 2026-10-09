import { anthropic, CLAUDE_MODEL } from "./anthropic";
import { pesquisarJurisprudencia, type FontJurisprudencia } from "./jurisprudencia";
import { urlOficial, type ModeloCaso } from "./base-modelos";

export const AVISO_RASCUNHO =
  "RASCUNHO GERADO POR IA — NÃO PROTOCOLAR. Exige revisão integral do advogado responsável: conferir fatos, dispositivos legais e toda citação diretamente na fonte oficial.";

export type RascunhoPeticao = {
  conteudo: string;
  jurisprudenciaCitada: FontJurisprudencia[];
  avisos: string[]; // pendências e alertas para o advogado revisar
};

// URLs presentes no texto que não vieram das fontes pesquisadas nem do modelo de caso.
function urlsNaoRastreaveis(texto: string, permitidas: Set<string>): string[] {
  const achadas = texto.match(/https?:\/\/[^\s)\]>"']+/g) ?? [];
  return [...new Set(achadas.map((u) => u.replace(/[.,;]+$/, "")))].filter(
    (u) => !permitidas.has(u) || !urlOficial(u)
  );
}

export async function gerarPeticao(params: {
  tipoCaso: string;
  tipoPeticao: string; // "inicial" | "contestação" | "recurso" etc.
  fatos: string;
  nomeCliente: string;
  modelo?: ModeloCaso; // modelo da base do Dr. Carlos (opcional)
  persona?: string; // instruções extras de sistema (ex.: persona do Dr. Carlos)
}): Promise<RascunhoPeticao> {
  const { tipoCaso, tipoPeticao, fatos, nomeCliente, modelo, persona } = params;

  const jurisprudencia = await pesquisarJurisprudencia(tipoCaso, fatos, modelo?.buscaJurisprudencia ?? []);

  const modeloTexto = modelo
    ? `\n\nModelo de caso a seguir (${modelo.nome}):\nEstrutura: ${modelo.estruturaPeca.join("; ")}\nFatos essenciais (se algum faltar nos fatos coletados, liste como PENDÊNCIA no rascunho, sem inventar): ${modelo.fatosEssenciais.join("; ")}\nPedidos típicos: ${modelo.pedidosTipicos.join("; ")}\nPontos de atenção para o advogado: ${modelo.pontosDeAtencao.join("; ")}\nDispositivos legais (ponteiros da base; cite só estes, com a URL, e marque "a conferir"): ${modelo.fundamentos
        .map((f) => `${f.norma}, ${f.artigos} — ${f.tema} (${f.url})`)
        .join(" | ")}`
    : "";

  const fontesTexto = jurisprudencia
    .map((f, i) => `[${i + 1}] ${f.titulo} — ${f.url}\n${f.trecho}`)
    .join("\n\n");

  const geracao = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system:
      (persona ? persona + "\n\n" : "") +
      "Você é um assistente de redação jurídica. Gera rascunhos de peças processuais em português formal, seguindo a estrutura processual civil brasileira (endereçamento, qualificação das partes, dos fatos, do direito, dos pedidos, valor da causa, fecho). " +
      "SÓ cite jurisprudência que estiver literalmente nas fontes fornecidas, com a URL entre parênteses. Nunca invente lei, artigo, número de processo, ementa, súmula ou tribunal; não cite súmula que não esteja nas fontes. Se não houver fonte pra sustentar um ponto, diga isso explicitamente no rascunho em vez de inventar.",
    messages: [
      {
        role: "user",
        content: `Tipo de caso: ${tipoCaso}\nTipo de peça: ${tipoPeticao}\nCliente: ${nomeCliente}\nFatos coletados na triagem: ${fatos}\n\nFontes de jurisprudência disponíveis:\n${fontesTexto || "(nenhuma fonte encontrada — não cite jurisprudência, apenas fundamente na legislação geral e sinalize a ausência de precedentes localizados)"}\n\nGere o rascunho completo da peça.${modeloTexto}`,
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

  const permitidas = new Set([
    ...jurisprudencia.map((f) => f.url),
    ...(modelo?.fundamentos.map((f) => f.url) ?? []),
  ]);
  const avisos = [
    ...(jurisprudencia.length === 0 ? ["Nenhuma jurisprudência oficial localizada: a peça não deve citar precedentes até o advogado pesquisar."] : []),
    ...(modelo ? [] : ["Nenhum modelo de caso correspondente na base: estrutura genérica."]),
    ...(modelo?.fundamentos.some((f) => !f.verificado) ? ["Dispositivos legais do modelo ainda não conferidos na fonte oficial."] : []),
    ...urlsNaoRastreaveis(conteudoFinal, permitidas).map((u) => `Link não rastreável às fontes pesquisadas (remover ou conferir): ${u}`),
  ];

  const cabecalho = `> **${AVISO_RASCUNHO}**\n${avisos.length ? "\n" + avisos.map((a) => `> - ${a}`).join("\n") + "\n" : ""}\n`;

  return { conteudo: cabecalho + conteudoFinal, jurisprudenciaCitada: jurisprudencia, avisos };
}
