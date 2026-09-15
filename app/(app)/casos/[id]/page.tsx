"use client";

import { useEffect, useState, use } from "react";
import { Card } from "@/app/components/Card";

type Peticao = { id: string; tipoPeticao: string; status: string; conteudo: string };
type Contrato = { id: string; honorarioInicial: number; percentualExito: number; status: string; linkAssinatura?: string };
type Caso = {
  id: string;
  status: string;
  fatos: string;
  lead: { nome: string | null; telefone: string | null; email: string | null };
  tipoCaso: { nome: string };
  contrato: Contrato | null;
  peticoes: Peticao[];
};

const botaoPrimario: React.CSSProperties = { background: "var(--brand)", color: "var(--brand-ink)" };

export default function CasoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [caso, setCaso] = useState<Caso | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    const res = await fetch(`/api/casos/${id}`);
    setCaso(await res.json());
  }

  useEffect(() => {
    carregar();
  }, [id]);

  async function gerarContrato() {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/casos/${id}/contrato`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.avisoAssinatura) setErro(data.avisoAssinatura);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }

  async function gerarPeticao() {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/casos/${id}/peticao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoPeticao: "inicial" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }

  async function aprovarPeticao(peticaoId: string) {
    await fetch(`/api/peticoes/${peticaoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "aprovado_advogado" }),
    });
    await carregar();
  }

  if (!caso)
    return (
      <main className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>
        Carregando...
      </main>
    );

  return (
    <main className="max-w-3xl p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          {caso.lead.nome ?? "Sem nome"} — {caso.tipoCaso.nome}
        </h1>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          status: {caso.status}
        </div>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          {caso.fatos}
        </p>
      </div>

      {erro && (
        <div
          className="text-sm rounded-lg p-3"
          style={{ color: "var(--status-warning)", background: "rgba(250,178,25,0.1)", border: "1px solid rgba(250,178,25,0.3)" }}
        >
          {erro}
        </div>
      )}

      <Card className="space-y-2">
        <h2 className="font-semibold text-sm">Contratação</h2>
        {caso.contrato ? (
          <div className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
            <div>Honorário inicial: R$ {caso.contrato.honorarioInicial.toFixed(2)}</div>
            <div>% de êxito: {(caso.contrato.percentualExito * 100).toFixed(0)}%</div>
            <div>Status: {caso.contrato.status}</div>
            {caso.contrato.linkAssinatura && (
              <a className="underline" style={{ color: "var(--series-1)" }} href={caso.contrato.linkAssinatura} target="_blank">
                Link de assinatura (ZapSign)
              </a>
            )}
          </div>
        ) : (
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style={botaoPrimario} onClick={gerarContrato} disabled={loading}>
            Gerar proposta e contrato
          </button>
        )}
      </Card>

      <Card className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-sm">Petições</h2>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium" style={botaoPrimario} onClick={gerarPeticao} disabled={loading}>
            {loading ? "Gerando..." : "Gerar nova petição"}
          </button>
        </div>
        {caso.peticoes.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhuma petição gerada ainda.
          </p>
        )}
        {caso.peticoes.map((p) => (
          <div key={p.id} className="rounded-lg p-3 space-y-2" style={{ border: "1px solid var(--border-hairline)" }}>
            <div className="flex justify-between text-sm">
              <span className="font-medium">{p.tipoPeticao}</span>
              <span style={{ color: "var(--text-muted)" }}>{p.status}</span>
            </div>
            <pre
              className="text-xs whitespace-pre-wrap max-h-48 overflow-auto p-2 rounded"
              style={{ background: "var(--surface-card-hover)", color: "var(--text-secondary)" }}
            >
              {p.conteudo}
            </pre>
            <div className="flex gap-3">
              <a className="text-sm underline" style={{ color: "var(--series-1)" }} href={`/api/peticoes/${p.id}/docx`}>
                Baixar .docx
              </a>
              {p.status !== "aprovado_advogado" && p.status !== "protocolado" && (
                <button className="text-sm underline" style={{ color: "var(--status-good)" }} onClick={() => aprovarPeticao(p.id)}>
                  Aprovar (advogado)
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </main>
  );
}
