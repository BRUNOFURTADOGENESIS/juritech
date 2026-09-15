"use client";

import { useState } from "react";
import { Card } from "@/app/components/Card";

type Msg = { remetente: "lead" | "ia"; texto: string };

const inputStyle: React.CSSProperties = {
  background: "var(--surface-card-hover)",
  border: "1px solid var(--border-hairline)",
  color: "var(--text-primary)",
};

export default function AtendimentoPage() {
  const [leadId, setLeadId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function iniciar() {
    setErro(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, canalOrigem: "chat_site" }),
    });
    const lead = await res.json();
    setLeadId(lead.id);
    setMsgs([]);
    setStatus("novo");
  }

  async function enviar() {
    if (!leadId || !texto.trim()) return;
    setLoading(true);
    setErro(null);
    setMsgs((m) => [...m, { remetente: "lead", texto }]);
    const textoEnviado = texto;
    setTexto("");
    try {
      const res = await fetch("/api/atendimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, canal: "chat_site", texto: textoEnviado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "erro");
      setMsgs((m) => [...m, { remetente: "ia", texto: data.resposta_para_cliente }]);
      setStatus(data.status);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl p-8 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Atendimento / Qualificação</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Simula a conversa que um lead teria pelo WhatsApp/site/e-mail. Requer ANTHROPIC_API_KEY configurada.
        </p>
      </div>

      {!leadId ? (
        <div className="flex gap-2">
          <input
            className="rounded-lg px-3 py-2 flex-1 text-sm outline-none"
            style={inputStyle}
            placeholder="Nome do lead (simulado)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
            onClick={iniciar}
          >
            Iniciar conversa
          </button>
        </div>
      ) : (
        <>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Status atual: <span className="font-mono">{status}</span>
          </div>
          <Card className="space-y-2 min-h-[300px]">
            {msgs.map((m, i) => (
              <div key={i} className={m.remetente === "lead" ? "text-right" : "text-left"}>
                <span
                  className="inline-block px-3 py-2 rounded-lg text-sm max-w-[80%]"
                  style={
                    m.remetente === "lead"
                      ? { background: "var(--brand)", color: "var(--brand-ink)" }
                      : { background: "var(--surface-card-hover)", color: "var(--text-primary)" }
                  }
                >
                  {m.texto}
                </span>
              </div>
            ))}
          </Card>
          {erro && (
            <div
              className="text-sm rounded-lg p-3"
              style={{ color: "var(--status-warning)", background: "rgba(250,178,25,0.1)", border: "1px solid rgba(250,178,25,0.3)" }}
            >
              {erro}
            </div>
          )}
          <div className="flex gap-2">
            <input
              className="rounded-lg px-3 py-2 flex-1 text-sm outline-none"
              style={inputStyle}
              placeholder="Digite a mensagem do lead..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
            />
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
              onClick={enviar}
              disabled={loading}
            >
              {loading ? "..." : "Enviar"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
