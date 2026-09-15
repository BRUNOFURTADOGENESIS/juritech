"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogoMark } from "../components/Logo";

type Msg = { remetente: "lead" | "ia"; texto: string };

const inputStyle: React.CSSProperties = {
  background: "var(--surface-card-hover)",
  border: "1px solid var(--border-hairline)",
  color: "var(--text-primary)",
};

function ChatWidget() {
  const searchParams = useSearchParams();
  const utm = searchParams.get("utm") ?? undefined;

  const [leadId, setLeadId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [encerrado, setEncerrado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function iniciar() {
    if (!nome.trim()) return;
    setErro(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, canalOrigem: "chat_site", origemUtm: utm }),
    });
    const lead = await res.json();
    setLeadId(lead.id);
    setMsgs([
      {
        remetente: "ia",
        texto: `Olá, ${nome}! Sou a assistente virtual do escritório. Me conta rapidinho o que aconteceu, que eu te ajudo a entender se conseguimos atuar no seu caso.`,
      },
    ]);
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
      if (!res.ok) throw new Error(data.error ?? "Não consegui processar sua mensagem, tenta de novo?");
      setMsgs((m) => [...m, { remetente: "ia", texto: data.resposta_para_cliente }]);
      if (data.status.startsWith("desqualificado")) setEncerrado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-full flex flex-col items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-2xl border flex flex-col overflow-hidden"
        style={{ background: "var(--surface-card)", borderColor: "var(--border-hairline)", minHeight: 520 }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2 border-b"
          style={{ borderColor: "var(--border-hairline)" }}
        >
          <LogoMark size={26} />
          <div>
            <div className="text-sm font-semibold">Fale conosco</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Resposta imediata
            </div>
          </div>
        </div>

        {!leadId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Antes de começar, como podemos te chamar?
            </p>
            <input
              className="rounded-lg px-3 py-2 w-full text-sm outline-none"
              style={inputStyle}
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && iniciar()}
            />
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium w-full"
              style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
              onClick={iniciar}
            >
              Começar conversa
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {msgs.map((m, i) => (
                <div key={i} className={m.remetente === "lead" ? "text-right" : "text-left"}>
                  <span
                    className="inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] text-left"
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
              {erro && (
                <div className="text-xs text-center" style={{ color: "var(--status-warning)" }}>
                  {erro}
                </div>
              )}
            </div>
            {!encerrado && (
              <div className="p-3 border-t flex gap-2" style={{ borderColor: "var(--border-hairline)" }}>
                <input
                  className="rounded-lg px-3 py-2 flex-1 text-sm outline-none"
                  style={inputStyle}
                  placeholder="Digite sua mensagem..."
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviar()}
                  disabled={loading}
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
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatWidget />
    </Suspense>
  );
}
