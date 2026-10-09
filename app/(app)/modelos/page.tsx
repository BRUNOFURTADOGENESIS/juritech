"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/Card";
import type { Area, ModeloCaso } from "@/lib/base-modelos/tipos";

const ROTULOS: Record<Area, string> = {
  civel: "Cível",
  consumidor: "Consumidor",
  trabalhista: "Trabalhista",
  familia: "Família",
  previdenciario: "Previdenciário",
};

export default function ModelosPage() {
  const [modelos, setModelos] = useState<ModeloCaso[]>([]);
  const [area, setArea] = useState<Area | "todas">("todas");

  useEffect(() => {
    fetch("/api/modelos")
      .then((r) => r.json())
      .then(setModelos);
  }, []);

  const visiveis = modelos.filter((m) => area === "todas" || m.area === area);

  return (
    <main className="max-w-3xl p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Modelos de caso — Dr. Carlos</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Estruturas e dispositivos legais com link para fonte oficial. Tudo aqui é ponto de partida: o advogado confere cada dispositivo na fonte antes de usar.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["todas", ...Object.keys(ROTULOS)] as (Area | "todas")[]).map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className="px-3 py-1 rounded-lg text-sm"
            style={{
              background: area === a ? "var(--surface-card-hover)" : "transparent",
              border: "1px solid var(--border-hairline)",
              fontWeight: area === a ? 600 : 400,
            }}
          >
            {a === "todas" ? "Todas" : ROTULOS[a]}
          </button>
        ))}
      </div>

      {visiveis.map((m) => (
        <Card key={m.id}>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{ROTULOS[m.area]}</div>
          <div className="font-semibold">{m.nome}</div>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{m.descricao}</p>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer">Detalhes</summary>
            <div className="mt-2 space-y-2">
              <div><b>Fatos essenciais:</b> {m.fatosEssenciais.join("; ")}</div>
              <div><b>Pedidos típicos:</b> {m.pedidosTipicos.join("; ")}</div>
              <div><b>Atenção:</b> {m.pontosDeAtencao.join("; ")}</div>
              <ul className="list-disc pl-5">
                {m.fundamentos.map((f) => (
                  <li key={f.norma + f.artigos}>
                    <a href={f.url} target="_blank" rel="noreferrer" className="underline">
                      {f.norma}, {f.artigos}
                    </a>{" "}
                    — {f.tema} {f.verificado ? "✓ conferido" : "(a conferir na fonte)"}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </Card>
      ))}
    </main>
  );
}
