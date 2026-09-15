-- CreateTable
CREATE TABLE "EventoWebhookProcessado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provedor" TEXT NOT NULL,
    "idEvento" TEXT NOT NULL,
    "processadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SlotAgendamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inicio" DATETIME NOT NULL,
    "fim" DATETIME NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "casoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SlotAgendamento_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "casoId" TEXT NOT NULL,
    "honorarioInicial" REAL NOT NULL,
    "percentualExito" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "linkAssinatura" TEXT,
    "provedorAssinatura" TEXT,
    "idDocumentoExterno" TEXT,
    "assinadoEm" DATETIME,
    "ultimoLembreteEm" DATETIME,
    "tentativasLembrete" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contrato_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Contrato" ("assinadoEm", "casoId", "createdAt", "honorarioInicial", "id", "idDocumentoExterno", "linkAssinatura", "percentualExito", "provedorAssinatura", "status") SELECT "assinadoEm", "casoId", "createdAt", "honorarioInicial", "id", "idDocumentoExterno", "linkAssinatura", "percentualExito", "provedorAssinatura", "status" FROM "Contrato";
DROP TABLE "Contrato";
ALTER TABLE "new_Contrato" RENAME TO "Contrato";
CREATE UNIQUE INDEX "Contrato_casoId_key" ON "Contrato"("casoId");
CREATE UNIQUE INDEX "Contrato_idDocumentoExterno_key" ON "Contrato"("idDocumentoExterno");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EventoWebhookProcessado_provedor_idEvento_key" ON "EventoWebhookProcessado"("provedor", "idEvento");

-- CreateIndex
CREATE UNIQUE INDEX "SlotAgendamento_casoId_key" ON "SlotAgendamento"("casoId");
