import type { ModeloCaso } from "./tipos";

const CC = "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm";
const CPC = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm";
const ALIM = "https://www.planalto.gov.br/ccivil_03/leis/l5478.htm";

export const MODELOS_FAMILIA: ModeloCaso[] = [
  {
    id: "familia-alimentos",
    area: "familia",
    nome: "Ação de alimentos",
    tiposPeticao: ["inicial"],
    palavrasChave: ["pensão alimentícia", "alimentos", "pensão", "filho", "revisional de alimentos"],
    descricao: "Fixação (ou revisão) de alimentos devidos a filho ou outro alimentando, com tutela de alimentos provisórios.",
    estruturaPeca: [
      "Endereçamento (Vara de Família do domicílio do alimentando)",
      "Qualificação das partes",
      "Dos fatos",
      "Do direito (necessidade, possibilidade, proporcionalidade)",
      "Dos alimentos provisórios",
      "Dos pedidos",
      "Do valor da causa",
      "Das provas e fecho",
    ],
    fatosEssenciais: ["Idade e necessidades do alimentando", "Rendimentos e bens do alimentante, se conhecidos", "Quem detém a guarda", "Histórico de pagamentos"],
    documentosUsuais: ["Certidão de nascimento", "Comprovantes de despesas", "Comprovantes de renda"],
    pedidosTipicos: ["Alimentos provisórios", "Alimentos definitivos", "Desconto em folha, se cabível", "Custas e honorários"],
    pontosDeAtencao: ["Conferir foro competente", "Correr em segredo de justiça conforme o caso", "Valor/percentual é decisão do advogado"],
    fundamentos: [
      { norma: "Código Civil (Lei 10.406/2002)", artigos: "arts. 1.694 a 1.710", tema: "Dos alimentos", url: CC, verificado: false },
      { norma: "Lei de Alimentos (Lei 5.478/1968)", artigos: "art. 4º", tema: "Alimentos provisórios", url: ALIM, verificado: false },
      { norma: "Código de Processo Civil (Lei 13.105/2015)", artigos: "arts. 693 a 699", tema: "Ações de família", url: CPC, verificado: false },
    ],
    buscaJurisprudencia: ["fixação de alimentos binômio necessidade possibilidade", "alimentos provisórios ação de alimentos"],
  },
  {
    id: "familia-divorcio",
    area: "familia",
    nome: "Divórcio (litigioso ou consensual)",
    tiposPeticao: ["inicial"],
    palavrasChave: ["divórcio", "separação", "partilha", "guarda", "união estável"],
    descricao: "Dissolução do casamento, com partilha, guarda, convivência e alimentos quando houver.",
    estruturaPeca: [
      "Endereçamento (Vara de Família)",
      "Qualificação das partes",
      "Dos fatos (casamento, regime de bens, filhos)",
      "Do direito",
      "Da partilha, guarda, convivência e alimentos",
      "Dos pedidos",
      "Do valor da causa",
      "Das provas e fecho",
    ],
    fatosEssenciais: ["Data do casamento e regime de bens", "Filhos menores/incapazes", "Bens e dívidas", "Se há consenso sobre os temas"],
    documentosUsuais: ["Certidão de casamento", "Certidões de nascimento", "Documentos dos bens", "Pacto antenupcial, se houver"],
    pedidosTipicos: ["Decretação do divórcio", "Partilha", "Guarda e convivência", "Alimentos", "Uso do nome"],
    pontosDeAtencao: ["Havendo consenso e sem filhos incapazes, avaliar via extrajudicial (cartório)", "Conferir regime de bens e bens particulares"],
    fundamentos: [
      { norma: "Constituição Federal", artigos: "art. 226, §6º", tema: "Dissolução do casamento civil pelo divórcio", url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicaocompilado.htm", verificado: false },
      { norma: "Código de Processo Civil (Lei 13.105/2015)", artigos: "arts. 693 a 699 e 731 a 734", tema: "Ações de família e divórcio consensual", url: CPC, verificado: false },
      { norma: "Código Civil (Lei 10.406/2002)", artigos: "arts. 1.583 a 1.590", tema: "Proteção da pessoa dos filhos e guarda", url: CC, verificado: false },
    ],
    buscaJurisprudencia: ["divórcio partilha de bens regime de bens", "guarda compartilhada fixação"],
  },
];
