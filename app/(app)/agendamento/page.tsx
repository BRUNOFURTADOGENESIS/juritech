"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/Card";

type Slot = {
  id: string;
  inicio: string;
  fim: string;
  disponivel: boolean;
  caso: { lead: { nome: string | null } } | null;
};

const inputStyle: React.CSSProperties = {
  background: "var(--surface-card-hover)",
  border: "1px solid var(--border-hairline)",
  color: "var(--text-primary)",
};

export default function AgendamentoPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");

  async function carregar() {
    const res = await fetch("/api/slots");
    setSlots(await res.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criarSlot() {
    if (!data || !horaInicio || !horaFim) return;
    await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inicio: new Date(`${data}T${horaInicio}`).toISOString(),
        fim: new Date(`${data}T${horaFim}`).toISOString(),
      }),
    });
    setHoraInicio("");
    setHoraFim("");
    carregar();
  }

  return (
    <main className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Agendamento</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Abra horários aqui — depois que um contrato é assinado, o lead recebe um link pra escolher um destes.
        </p>
      </div>

      <Card className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Data</label>
          <input type="date" className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Início</label>
          <input type="time" className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Fim</label>
          <input type="time" className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
        </div>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
          onClick={criarSlot}
        >
          Abrir horário
        </button>
      </Card>

      <div className="space-y-2">
        {slots.map((s) => (
          <Card key={s.id} className="flex justify-between items-center text-sm">
            <span>{new Date(s.inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
            <span style={{ color: s.disponivel ? "var(--status-good)" : "var(--text-muted)" }}>
              {s.disponivel ? "Disponível" : `Reservado — ${s.caso?.lead.nome ?? ""}`}
            </span>
          </Card>
        ))}
      </div>
    </main>
  );
}
