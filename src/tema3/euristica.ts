// src/tema3/euristica.ts
//
// Rulare: pnpm t3:euristica
//
// Punctul 3: tabel intrebare | asteptat | tema3 | regexul cursului, pe diacritice,
// flexiuni, potriviri false si textul gol.

import { pathToFileURL } from "node:url";
import { esteSimpla } from "./cost-guard.js";

// Copie inghetata din curs (src/middlew/middleware/cost-guard.ts:40-55), doar pentru comparatie.
const CUVINTE_GRELE_CURS =
  /compar|analiz|de ce|explica|planific|itinerar|recomand|cel mai (bun|ieftin)|avantaj|dezavantaj/i;
const esteSimplaCurs = (text: string) => !(text.length > 120 || CUVINTE_GRELE_CURS.test(text));

export const LUNGA =
  "Buna ziua, am o rezervare pentru doua persoane la sfarsitul lunii si as vrea sa stiu la ce ora pot " +
  "face check-in si daca parcarea e inclusa in pret.";

type Ruta = "SIMPLA" | "COMPLEXA";

const CAZURI: { text: string; asteptat: Ruta; eticheta?: string }[] = [
  { text: "explică", asteptat: "COMPLEXA" },
  { text: "Explică-mi diferența", asteptat: "COMPLEXA" },
  { text: "explici", asteptat: "COMPLEXA" },
  { text: "explica", asteptat: "COMPLEXA" },
  { text: "explica\u0306", asteptat: "COMPLEXA", eticheta: "explică (NFD)" },
  { text: "Ce recomanzi?", asteptat: "COMPLEXA" },
  { text: "recomandă", asteptat: "COMPLEXA" },
  { text: "compară", asteptat: "COMPLEXA" },
  { text: "analizează", asteptat: "COMPLEXA" },
  { text: "planifică", asteptat: "COMPLEXA" },
  { text: "De ce?", asteptat: "COMPLEXA" },
  { text: "dece nu merge", asteptat: "COMPLEXA" },
  { text: "care e cel mai bun", asteptat: "COMPLEXA" },
  { text: "cea mai bună cameră", asteptat: "COMPLEXA" },
  { text: "cea mai ieftină ofertă", asteptat: "COMPLEXA" },
  { text: "cele mai bune hoteluri", asteptat: "COMPLEXA" },
  { text: "Care sunt dezavantajele?", asteptat: "COMPLEXA" },
  { text: LUNGA, asteptat: "COMPLEXA", eticheta: `(${LUNGA.length} caractere, fara cuvinte grele)` },
  { text: "", asteptat: "COMPLEXA", eticheta: '""' },
  { text: "Vreau un compartiment de tren", asteptat: "SIMPLA" },
  { text: "Am nevoie de cearceafuri", asteptat: "SIMPLA" },
  { text: "Vreau confirmarea explicita a rezervarii", asteptat: "SIMPLA" },
  { text: "Cat e ceasul in Tokyo?", asteptat: "SIMPLA" },
];

const ruta = (simpla: boolean): Ruta => (simpla ? "SIMPLA" : "COMPLEXA");

export async function ruleaza(log: (...args: unknown[]) => void = console.log) {
  const randuri = CAZURI.map(({ text, asteptat, eticheta }) => ({
    intrebare: eticheta ?? text,
    asteptat,
    tema3: ruta(esteSimpla(text)),
    curs: ruta(esteSimplaCurs(text)),
  }));

  const latime = Math.max(...randuri.map((r) => r.intrebare.length));
  log(`${"intrebare".padEnd(latime)} | asteptat | tema3    | regex curs (doar pentru comparatie)`);
  for (const r of randuri) {
    log(
      `${r.intrebare.padEnd(latime)} | ${r.asteptat.padEnd(8)} | ${r.tema3.padEnd(8)} | ${r.curs}` +
        (r.curs !== r.asteptat ? "  <- curs gresit" : ""),
    );
  }
  log(`tema3 corect: ${randuri.filter((r) => r.tema3 === r.asteptat).length}/${randuri.length}`);
  log(`curs corect: ${randuri.filter((r) => r.curs === r.asteptat).length}/${randuri.length}`);
  return randuri;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
