-- CreateTable
CREATE TABLE "TipoCaso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "nicho" TEXT NOT NULL,
    "percentualExitoPadrao" REAL NOT NULL,
    "honorarioInicialPadrao" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RequisitoChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipoCasoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "pergunta" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RequisitoChecklist_tipoCasoId_fkey" FOREIGN KEY ("tipoCasoId") REFERENCES "TipoCaso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "canalOrigem" TEXT NOT NULL,
    "origemUtm" TEXT,
    "status" TEXT NOT NULL DEFAULT 'novo',
    "jaTemAdvogado" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Caso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "tipoCasoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'qualificado',
    "respostasChecklist" TEXT,
    "fatos" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Caso_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Caso_tipoCasoId_fkey" FOREIGN KEY ("tipoCasoId") REFERENCES "TipoCaso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "casoId" TEXT NOT NULL,
    "honorarioInicial" REAL NOT NULL,
    "percentualExito" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "linkAssinatura" TEXT,
    "provedorAssinatura" TEXT,
    "idDocumentoExterno" TEXT,
    "assinadoEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contrato_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Peticao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "casoId" TEXT NOT NULL,
    "tipoPeticao" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "jurisprudenciaCitada" TEXT,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "arquivoDocxPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Peticao_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "remetente" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mensagem_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoCaso_nome_key" ON "TipoCaso"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Caso_leadId_key" ON "Caso"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_casoId_key" ON "Contrato"("casoId");
