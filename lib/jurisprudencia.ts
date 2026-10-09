import { anthropic, CLAUDE_MODEL } from "./anthropic";
import { DOMINIOS_OFICIAIS, urlOficial } from "./base-modelos/tipos";

export type FontJurisprudencia = {
  titulo: string;
  url: string;
  trecho: string;
};

// Somente fontes oficiais (Planalto, STF, STJ, TST, CNJ, TJSP). Sem agregadores.
const FONTES_CONFIAVEIS: string[] = [...DOMINIOS_OFICIAIS];

async function buscarTavily(query: string): Promise<FontJurisprudencia[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY não configurada — pesquisa de jurisprudência desativada até a chave ser adicionada em .env"
    );
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      include_domains: FONTES_CONFIAVEIS,
      max_results: 5,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily respondeu ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  // include_domains é só uma dica ao provedor: revalida o domínio de cada resultado.
  return (data.results ?? [])
    .filter((r: { url: string }) => urlOficial(r.url))
    .map((r: { title: string; url: string; content: string }) => ({
      titulo: r.title,
      url: r.url,
      trecho: r.content,
    }));
}

// A partir dos fatos do caso, o Claude sugere 2-4 queries de busca específicas
// (não usa os fatos crus como query — jurisprudência se busca por tese jurídica).
async function gerarQueries(tipoCaso: string, fatos: string): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Caso: ${tipoCaso}\nFatos: ${fatos}\n\nGere de 2 a 4 queries de busca objetivas (em português, estilo busca jurídica) para encontrar jurisprudência do STJ/STF/TJs aplicável a este caso. Responda só com as queries, uma por linha, sem numeração.`,
      },
    ],
  });

  const texto = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");

  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export async function pesquisarJurisprudencia(
  tipoCaso: string,
  fatos: string,
  tesesExtras: string[] = [] // teses do modelo de caso; viram queries, nunca citações
): Promise<FontJurisprudencia[]> {
  const queries = [...tesesExtras, ...(await gerarQueries(tipoCaso, fatos))].slice(0, 5);

  const resultadosPorQuery = await Promise.all(
    queries.map((q) => buscarTavily(q).catch(() => [] as FontJurisprudencia[]))
  );

  const vistos = new Set<string>();
  const resultados: FontJurisprudencia[] = [];
  for (const lista of resultadosPorQuery) {
    for (const r of lista) {
      if (!vistos.has(r.url)) {
        vistos.add(r.url);
        resultados.push(r);
      }
    }
  }
  return resultados;
}
