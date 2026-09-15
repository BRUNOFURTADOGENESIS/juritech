"use client";

import { useEffect, useState, use } from "react";

type Slot = { id: string; inicio: string; fim: string };

export default function AgendarPage({ params }: { params: Promise<{ casoId: string }> }) {
  const { casoId } = use(params);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [confirmado, setConfirmado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    const res = await fetch("/api/slots?disponiveis=true");
    setSlots(await res.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  async function escolher(slotId: string) {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/casos/${casoId}/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error);
        await carregar();
        return;
      }
      setConfirmado(data.horario);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-full flex flex-col items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-2xl border p-6 space-y-4"
        style={{ background: "var(--surface-card)", borderColor: "var(--border-hairline)" }}
      >
        <h1 className="text-lg font-semibold">Escolha um horário pra conversar com o advogado</h1>

        {confirmado ? (
          <p className="text-sm" style={{ color: "var(--status-good)" }}>
            Consulta confirmada para {confirmado}. Te esperamos!
          </p>
        ) : (
          <>
            {erro && (
              <p className="text-sm" style={{ color: "var(--status-warning)" }}>
                {erro}
              </p>
            )}
            {slots.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Nenhum horário disponível no momento. Em breve alguém do time entra em contato.
              </p>
            )}
            <div className="space-y-2">
              {slots.map((s) => (
                <button
                  key={s.id}
                  disabled={loading}
                  onClick={() => escolher(s.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm disabled:opacity-50"
                  style={{ background: "var(--surface-card-hover)", color: "var(--text-primary)" }}
                >
                  {new Date(s.inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
