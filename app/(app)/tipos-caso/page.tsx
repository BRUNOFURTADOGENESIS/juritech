"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/Card";

type Requisito = { pergunta: string; obrigatorio: boolean };
type TipoCaso = {
  id: string;
  nome: string;
  nicho: string;
  percentualExitoPadrao: number;
  honorarioInicialPadrao: number;
  requisitos: Requisito[];
};

const inputStyle: React.CSSProperties = {
  background: "var(--surface-card-hover)",
  border: "1px solid var(--border-hairline)",
  color: "var(--text-primary)",
};

export default function TiposCasoPage() {
  const [tipos, setTipos] = useState<TipoCaso[]>([]);
  const [nome, setNome] = useState("");
  const [nicho, setNicho] = useState("");
  const [honorario, setHonorario] = useState("");
  const [percentual, setPercentual] = useState("");
  const [requisitos, setRequisitos] = useState("");

  async function carregar() {
    const res = await fetch("/api/tipos-caso");
    setTipos(await res.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    await fetch("/api/tipos-caso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        nicho,
        honorarioInicialPadrao: Number(honorario),
        percentualExitoPadrao: Number(percentual) / 100,
        requisitos: requisitos
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((pergunta) => ({ pergunta, obrigatorio: true })),
      }),
    });
    setNome("");
    setNicho("");
    setHonorario("");
    setPercentual("");
    setRequisitos("");
    carregar();
  }

  return (
    <main className="max-w-3xl p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Tipos de Caso — Requisitos de Qualificação</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Cada tipo de caso define o checklist que a IA aplica na triagem, e os valores padrão da proposta híbrida (honorário fixo + % de êxito).
        </p>
      </div>

      <Card className="space-y-3">
        <input className="rounded-lg px-3 py-2 w-full text-sm outline-none" style={inputStyle} placeholder="Nome (ex: Licença Maternidade)" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className="rounded-lg px-3 py-2 w-full text-sm outline-none" style={inputStyle} placeholder="Nicho (ex: previdenciario, consumidor)" value={nicho} onChange={(e) => setNicho(e.target.value)} />
        <div className="flex gap-3">
          <input className="rounded-lg px-3 py-2 flex-1 text-sm outline-none" style={inputStyle} placeholder="Honorário inicial (R$)" value={honorario} onChange={(e) => setHonorario(e.target.value)} />
          <input className="rounded-lg px-3 py-2 flex-1 text-sm outline-none" style={inputStyle} placeholder="% de êxito (ex: 20)" value={percentual} onChange={(e) => setPercentual(e.target.value)} />
        </div>
        <textarea
          className="rounded-lg px-3 py-2 w-full h-28 text-sm outline-none"
          style={inputStyle}
          placeholder={"Requisitos, um por linha, em forma de pergunta.\nEx: A cliente teve o filho nos últimos 5 anos?\nEla contribuiu para o INSS?"}
          value={requisitos}
          onChange={(e) => setRequisitos(e.target.value)}
        />
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
          onClick={salvar}
        >
          Cadastrar tipo de caso
        </button>
      </Card>

      <div className="space-y-3">
        {tipos.map((t) => (
          <Card key={t.id}>
            <div className="font-semibold text-sm">
              {t.nome} <span style={{ color: "var(--text-muted)" }}>({t.nicho})</span>
            </div>
            <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              R$ {t.honorarioInicialPadrao.toFixed(2)} + {(t.percentualExitoPadrao * 100).toFixed(0)}% de êxito
            </div>
            <ul className="list-disc list-inside text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              {t.requisitos.map((r, i) => (
                <li key={i}>{r.pergunta}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </main>
  );
}
