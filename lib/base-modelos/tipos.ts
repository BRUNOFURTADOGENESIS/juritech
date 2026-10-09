// Base de modelos de caso do Dr. Carlos.
//
// Regras desta base:
//  - Só entram fontes oficiais (ver DOMINIOS_OFICIAIS). Toda `fonte.url` é validada contra essa lista.
//  - A base NÃO guarda súmula, ementa nem número de processo: jurisprudência só entra
//    pela pesquisa em lib/jurisprudencia.ts, com URL oficial retornada na hora.
//  - Os dispositivos legais abaixo são ponteiros (lei + artigo + link do Planalto). O texto
//    não é copiado; o advogado confere na fonte (`verificado` fica false até alguém conferir).

export const DOMINIOS_OFICIAIS = [
  "planalto.gov.br",
  "stf.jus.br",
  "stj.jus.br",
  "tst.jus.br",
  "cnj.jus.br",
  "tjsp.jus.br",
] as const;

export function urlOficial(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return DOMINIOS_OFICIAIS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export const AREAS = ["civel", "consumidor", "trabalhista", "familia", "previdenciario"] as const;
export type Area = (typeof AREAS)[number];

export type DispositivoLegal = {
  norma: string; // ex: "Lei 8.078/1990 (CDC)"
  artigos: string; // ex: "arts. 14 e 42, parágrafo único"
  tema: string; // para que serve na peça
  url: string; // link oficial da norma (Planalto)
  verificado: boolean; // true só depois de conferência humana na fonte
};

export type ModeloCaso = {
  id: string;
  area: Area;
  nome: string;
  tiposPeticao: string[]; // ex: ["inicial"]
  palavrasChave: string[]; // usadas para casar com o tipo de caso do funil
  descricao: string;
  estruturaPeca: string[]; // seções esperadas, em ordem
  fatosEssenciais: string[]; // o que precisa constar nos fatos; se faltar, vira pendência
  documentosUsuais: string[];
  pedidosTipicos: string[];
  pontosDeAtencao: string[]; // prazos, competência, riscos a conferir pelo advogado
  fundamentos: DispositivoLegal[];
  buscaJurisprudencia: string[]; // teses para pesquisa em fonte oficial (não são citações)
};
