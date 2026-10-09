import { MODELOS_CIVEL } from "./civel";
import { MODELOS_CONSUMIDOR } from "./consumidor";
import { MODELOS_TRABALHISTA } from "./trabalhista";
import { urlOficial, type Area, type ModeloCaso } from "./tipos";

export * from "./tipos";

export const MODELOS: ModeloCaso[] = [...MODELOS_CIVEL, ...MODELOS_CONSUMIDOR, ...MODELOS_TRABALHISTA];

// Garante em tempo de carga que nenhuma fonte fora da lista oficial entrou na base.
for (const m of MODELOS) {
  for (const f of m.fundamentos) {
    if (!urlOficial(f.url)) throw new Error(`Modelo ${m.id}: fonte não oficial (${f.url})`);
  }
}

export function listarModelos(area?: Area): ModeloCaso[] {
  return area ? MODELOS.filter((m) => m.area === area) : MODELOS;
}

export function obterModelo(id: string): ModeloCaso | undefined {
  return MODELOS.find((m) => m.id === id);
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Escolhe o modelo que melhor casa com o tipo de caso/fatos pelas palavras-chave.
// Sem casamento, devolve undefined (o agente segue sem modelo e avisa o advogado).
export function sugerirModelo(tipoCaso: string, nicho: string | undefined, fatos: string): ModeloCaso | undefined {
  const texto = norm(`${tipoCaso} ${fatos}`);
  const n = nicho ? norm(nicho) : "";
  let melhor: { m: ModeloCaso; score: number } | undefined;
  for (const m of MODELOS) {
    const hits = m.palavrasChave.filter((p) => texto.includes(norm(p))).length;
    if (hits === 0) continue; // sem palavra-chave, só o nicho não basta
    const score = hits + (n === m.area ? 1 : 0);
    if (!melhor || score > melhor.score) melhor = { m, score };
  }
  return melhor?.m;
}
