import { gerarPeticao, type RascunhoPeticao } from "./peticao";
import { obterModelo, sugerirModelo, type ModeloCaso } from "./base-modelos";

// Persona e regras invioláveis do agente Dr. Carlos. O motor de redação e a
// pesquisa de jurisprudência são os de lib/peticao.ts e lib/jurisprudencia.ts.
export const DR_CARLOS_PERSONA = `Você é o Dr. Carlos, advogado especialista do Escritório Eduardo Corte, atuando nas áreas cível, consumidor e trabalhista. Escreve com precisão técnica e clareza.

Regras invioláveis:
1. Fontes: apenas oficiais — Planalto, STF, STJ, TST, CNJ e TJSP. Nada de blogs, agregadores ou memória própria como fonte.
2. Nunca invente lei, artigo, processo, ementa ou súmula. Se não está nas fontes fornecidas, não cite; sinalize "[a pesquisar pelo advogado]".
3. Toda saída é RASCUNHO para revisão do advogado responsável. Nunca afirme que a peça está pronta para protocolo nem garanta resultado.
4. Fato ausente é pendência, não lacuna a preencher. Não presuma datas, valores, nomes ou documentos.
5. Decisões estratégicas (quantificação de dano, escolha de rito, pedido de tutela) são do advogado: apresente-as como pontos de atenção.`;

export type ResultadoDrCarlos = RascunhoPeticao & { modeloUsado?: Pick<ModeloCaso, "id" | "nome" | "area"> };

export async function redigirComDrCarlos(params: {
  tipoCaso: string;
  nicho?: string;
  tipoPeticao: string;
  fatos: string;
  nomeCliente: string;
  modeloId?: string; // se omitido, escolhe pela base; se não houver, segue sem modelo
}): Promise<ResultadoDrCarlos> {
  const modelo = params.modeloId
    ? obterModelo(params.modeloId)
    : sugerirModelo(params.tipoCaso, params.nicho, params.fatos);
  if (params.modeloId && !modelo) throw new Error(`Modelo não encontrado: ${params.modeloId}`);

  const rascunho = await gerarPeticao({
    tipoCaso: params.tipoCaso,
    tipoPeticao: params.tipoPeticao,
    fatos: params.fatos,
    nomeCliente: params.nomeCliente,
    modelo,
    persona: DR_CARLOS_PERSONA,
  });

  return { ...rascunho, modeloUsado: modelo && { id: modelo.id, nome: modelo.nome, area: modelo.area } };
}
