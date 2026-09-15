export function calcularProposta(params: {
  honorarioInicialPadrao: number;
  percentualExitoPadrao: number;
}) {
  // Ponto único de cálculo da proposta híbrida (fixo + êxito). Hoje aplica o
  // padrão do tipo de caso; centralizar aqui é o que permite, no futuro, ajustar
  // por perfil de risco do caso sem mexer em quem consome esse valor.
  return {
    honorarioInicial: params.honorarioInicialPadrao,
    percentualExito: params.percentualExitoPadrao,
  };
}

export function textoContrato(params: {
  nomeCliente: string;
  tipoCaso: string;
  honorarioInicial: number;
  percentualExito: number;
}): string {
  const { nomeCliente, tipoCaso, honorarioInicial, percentualExito } = params;
  return [
    "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS",
    "",
    `CONTRATANTE: ${nomeCliente}`,
    `OBJETO: prestação de serviços advocatícios relativos a ${tipoCaso}.`,
    "",
    "DOS HONORÁRIOS",
    `1. Honorário inicial fixo de R$ ${honorarioInicial.toFixed(2)}, devido na assinatura deste instrumento.`,
    `2. Honorário de êxito de ${(percentualExito * 100).toFixed(0)}% sobre o proveito econômico obtido, devido ao final do processo em caso de êxito.`,
    "",
    "As partes elegem o foro do domicílio do CONTRATANTE para dirimir eventuais controvérsias.",
  ].join("\n");
}

export type LinkAssinatura = {
  provedor: "zapsign";
  linkAssinatura: string;
  idDocumentoExterno: string;
};

// Integração real com a API do ZapSign. Requer ZAPSIGN_API_TOKEN em .env —
// enquanto não configurado, lança erro claro em vez de fingir sucesso.
export async function criarDocumentoParaAssinatura(params: {
  nomeDocumento: string;
  conteudoDocx: Buffer;
  nomeSignatario: string;
  emailSignatario?: string;
  telefoneSignatario?: string;
}): Promise<LinkAssinatura> {
  const token = process.env.ZAPSIGN_API_TOKEN;
  if (!token) {
    throw new Error(
      "ZAPSIGN_API_TOKEN não configurado — crie uma conta em zapsign.com.br, gere o token e adicione em .env antes de gerar links de assinatura."
    );
  }

  const base64 = params.conteudoDocx.toString("base64");

  const res = await fetch("https://api.zapsign.com.br/api/v1/docs/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: params.nomeDocumento,
      base64_docx: base64,
      signers: [
        {
          name: params.nomeSignatario,
          email: params.emailSignatario,
          phone_country: "55",
          phone_number: params.telefoneSignatario,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`ZapSign respondeu ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    provedor: "zapsign",
    linkAssinatura: data.signers?.[0]?.sign_url ?? data.url,
    idDocumentoExterno: data.token,
  };
}
