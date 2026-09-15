// Z-API (zapi.io) — conecta via QR code como o WhatsApp Web, sem precisar de
// app aprovado pela Meta. Rápido de subir, ideal pro estágio atual (baixo/médio
// volume); migrar pra Cloud API oficial da Meta mais pra frente é só trocar
// este arquivo e o webhook — o resto do sistema (lib/atendimento.ts) não muda.
function getConfig() {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;
  if (!instanceId || !token) {
    throw new Error(
      "ZAPI_INSTANCE_ID / ZAPI_TOKEN não configurados — crie uma instância em z-api.io, conecte via QR code e copie as credenciais pra .env"
    );
  }
  return { instanceId, token, clientToken };
}

export async function enviarWhatsapp(params: { to: string; texto: string }) {
  const { instanceId, token, clientToken } = getConfig();

  const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(clientToken ? { "Client-Token": clientToken } : {}),
    },
    body: JSON.stringify({ phone: params.to, message: params.texto }),
  });

  if (!res.ok) {
    throw new Error(`Z-API respondeu ${res.status}: ${await res.text()}`);
  }
}
