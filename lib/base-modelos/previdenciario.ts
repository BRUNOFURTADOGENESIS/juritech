import type { ModeloCaso } from "./tipos";

const L8213 = "https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm";
const LOAS = "https://www.planalto.gov.br/ccivil_03/leis/l8742compilado.htm";
const CPC = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm";

export const MODELOS_PREVIDENCIARIO: ModeloCaso[] = [
  {
    id: "previdenciario-salario-maternidade",
    area: "previdenciario",
    nome: "Salário-maternidade",
    tiposPeticao: ["inicial"],
    palavrasChave: ["licença maternidade", "salário-maternidade", "salario maternidade", "gestante", "parto"],
    descricao: "Concessão de salário-maternidade negado ou não requerido, com prova da qualidade de segurada e do evento.",
    estruturaPeca: [
      "Endereçamento (Justiça Federal / Juizado Especial Federal)",
      "Qualificação da parte",
      "Dos fatos (requerimento administrativo e indeferimento)",
      "Do direito (qualidade de segurada, carência, evento)",
      "Dos pedidos",
      "Do valor da causa",
      "Das provas e fecho",
    ],
    fatosEssenciais: ["Data do parto/adoção/guarda", "Categoria de segurada e contribuições/atividade rural", "Requerimento no INSS e resposta", "Documentos da criança"],
    documentosUsuais: ["Certidão de nascimento", "CNIS/contribuições", "Indeferimento do INSS", "Provas da atividade (se rural/especial)"],
    pedidosTipicos: ["Concessão do benefício", "Pagamento das parcelas atrasadas", "Juros e correção", "Honorários"],
    pontosDeAtencao: ["Conferir carência exigida para a categoria", "Conferir existência de requerimento administrativo prévio", "Prazos de prescrição das parcelas"],
    fundamentos: [
      { norma: "Lei 8.213/1991 (Planos de Benefícios da Previdência Social)", artigos: "arts. 71 a 73", tema: "Salário-maternidade", url: L8213, verificado: false },
      { norma: "Lei 8.213/1991 (Planos de Benefícios da Previdência Social)", artigos: "arts. 25 e 26", tema: "Carência", url: L8213, verificado: false },
      { norma: "Código de Processo Civil (Lei 13.105/2015)", artigos: "arts. 319 e 320", tema: "Requisitos da petição inicial", url: CPC, verificado: false },
    ],
    buscaJurisprudencia: ["salário-maternidade segurada especial prova", "salário-maternidade contribuinte individual carência"],
  },
  {
    id: "previdenciario-incapacidade",
    area: "previdenciario",
    nome: "Benefício por incapacidade (auxílio-doença / aposentadoria por invalidez)",
    tiposPeticao: ["inicial"],
    palavrasChave: ["auxílio-doença", "auxilio doença", "incapacidade", "invalidez", "perícia", "inss negou"],
    descricao: "Concessão ou restabelecimento de benefício por incapacidade laboral, com perícia judicial.",
    estruturaPeca: [
      "Endereçamento (Justiça Federal / Juizado Especial Federal)",
      "Qualificação da parte",
      "Dos fatos (doença, limitações, perícia do INSS)",
      "Do direito (qualidade de segurado, carência, incapacidade)",
      "Da tutela de urgência",
      "Dos pedidos (incluindo perícia judicial)",
      "Do valor da causa",
      "Das provas e fecho",
    ],
    fatosEssenciais: ["Doença/lesão e data de início", "Profissão e limitações", "Contribuições ou vínculo", "Requerimentos no INSS e resultado"],
    documentosUsuais: ["Laudos e exames", "Atestados", "CNIS", "Comunicação de decisão do INSS"],
    pedidosTipicos: ["Concessão/restabelecimento", "Perícia médica judicial", "Parcelas atrasadas", "Tutela de urgência"],
    pontosDeAtencao: ["Nomenclatura e regras mudaram com a reforma da previdência: conferir texto vigente", "Provas médicas são o centro do caso"],
    fundamentos: [
      { norma: "Lei 8.213/1991 (Planos de Benefícios da Previdência Social)", artigos: "arts. 42 a 47 e 59 a 63", tema: "Benefícios por incapacidade", url: L8213, verificado: false },
      { norma: "Código de Processo Civil (Lei 13.105/2015)", artigos: "art. 300", tema: "Tutela de urgência", url: CPC, verificado: false },
    ],
    buscaJurisprudencia: ["benefício por incapacidade laudo pericial livre convencimento", "restabelecimento auxílio por incapacidade temporária"],
  },
  {
    id: "previdenciario-bpc-loas",
    area: "previdenciario",
    nome: "Benefício de prestação continuada (BPC/LOAS)",
    tiposPeticao: ["inicial"],
    palavrasChave: ["bpc", "loas", "benefício assistencial", "deficiência", "idoso", "baixa renda"],
    descricao: "Concessão de BPC a pessoa com deficiência ou idosa em situação de miserabilidade.",
    estruturaPeca: [
      "Endereçamento (Justiça Federal / Juizado Especial Federal)",
      "Qualificação da parte",
      "Dos fatos",
      "Do direito (deficiência/idade e renda familiar)",
      "Dos pedidos (perícias médica e social)",
      "Do valor da causa",
      "Das provas e fecho",
    ],
    fatosEssenciais: ["Composição do grupo familiar e renda", "Deficiência/idade", "Requerimento no INSS e indeferimento"],
    documentosUsuais: ["CadÚnico", "Laudos médicos", "Comprovantes de renda e despesas", "Indeferimento do INSS"],
    pedidosTipicos: ["Concessão do BPC", "Parcelas atrasadas", "Perícia social e médica"],
    pontosDeAtencao: ["Critério de renda e conceito de família: conferir lei vigente e entendimento do STF/STJ na fonte oficial"],
    fundamentos: [
      { norma: "Lei 8.742/1993 (LOAS)", artigos: "art. 20", tema: "Benefício de prestação continuada", url: LOAS, verificado: false },
      { norma: "Código de Processo Civil (Lei 13.105/2015)", artigos: "arts. 319 e 320", tema: "Requisitos da petição inicial", url: CPC, verificado: false },
    ],
    buscaJurisprudencia: ["BPC LOAS renda per capita miserabilidade", "benefício assistencial pessoa com deficiência"],
  },
];
