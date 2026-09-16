// Transcrição de áudio (mensagens de voz do WhatsApp) via Groq — Whisper
// hospedado, free tier generoso e bem mais barato que a API da OpenAI direta.
export async function transcreverAudio(audioUrl: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY não configurada — crie uma conta grátis em console.groq.com pra transcrever áudios do WhatsApp."
    );
  }

  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Não consegui baixar o áudio (${audioRes.status}).`);
  }
  const audioBuffer = await audioRes.arrayBuffer();

  const form = new FormData();
  form.append("file", new Blob([audioBuffer]), "audio.ogg");
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "pt");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Groq respondeu ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.text as string;
}
