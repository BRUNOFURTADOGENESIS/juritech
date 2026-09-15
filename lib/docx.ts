import { Document, Packer, Paragraph, TextRun } from "docx";

export async function textoParaDocxBuffer(titulo: string, conteudo: string): Promise<Buffer> {
  const paragrafos = conteudo
    .split("\n")
    .map(
      (linha) =>
        new Paragraph({
          children: [new TextRun(linha)],
          spacing: { after: 120 },
        })
    );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: titulo, bold: true, size: 28 })],
            spacing: { after: 300 },
          }),
          ...paragrafos,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
