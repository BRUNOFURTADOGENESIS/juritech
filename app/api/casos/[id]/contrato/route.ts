import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularProposta, textoContrato, criarDocumentoParaAssinatura } from "@/lib/contratacao";
import { textoParaDocxBuffer } from "@/lib/docx";

// Gera a proposta híbrida (fixo + êxito), monta o contrato e cria o link de
// assinatura eletrônica. Dispara depois que o lead sai de "qualificado".
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const caso = await prisma.caso.findUniqueOrThrow({
    where: { id },
    include: { lead: true, tipoCaso: true, contrato: true },
  });

  if (caso.contrato) {
    return NextResponse.json(caso.contrato);
  }

  const proposta = calcularProposta({
    honorarioInicialPadrao: caso.tipoCaso.honorarioInicialPadrao,
    percentualExitoPadrao: caso.tipoCaso.percentualExitoPadrao,
  });

  const texto = textoContrato({
    nomeCliente: caso.lead.nome ?? "Cliente",
    tipoCaso: caso.tipoCaso.nome,
    ...proposta,
  });

  let linkAssinatura: string | undefined;
  let provedorAssinatura: string | undefined;
  let idDocumentoExterno: string | undefined;
  let avisoAssinatura: string | undefined;

  try {
    const docxBuffer = await textoParaDocxBuffer(`Contrato — ${caso.lead.nome ?? "Cliente"}`, texto);
    const assinatura = await criarDocumentoParaAssinatura({
      nomeDocumento: `Contrato ${caso.tipoCaso.nome} - ${caso.lead.nome ?? caso.id}`,
      conteudoDocx: docxBuffer,
      nomeSignatario: caso.lead.nome ?? "Cliente",
      emailSignatario: caso.lead.email ?? undefined,
      telefoneSignatario: caso.lead.telefone ?? undefined,
    });
    linkAssinatura = assinatura.linkAssinatura;
    provedorAssinatura = assinatura.provedor;
    idDocumentoExterno = assinatura.idDocumentoExterno;
  } catch (err) {
    // Contrato é criado mesmo sem ZapSign configurado, só fica sem link até a chave ser adicionada.
    avisoAssinatura = err instanceof Error ? err.message : "Falha ao gerar link de assinatura";
  }

  const contrato = await prisma.contrato.create({
    data: {
      casoId: caso.id,
      honorarioInicial: proposta.honorarioInicial,
      percentualExito: proposta.percentualExito,
      linkAssinatura,
      provedorAssinatura,
      idDocumentoExterno,
    },
  });

  await prisma.caso.update({
    where: { id: caso.id },
    data: { status: linkAssinatura ? "aguardando_assinatura" : "proposta_enviada" },
  });

  return NextResponse.json({ ...contrato, avisoAssinatura, textoContrato: texto });
}
