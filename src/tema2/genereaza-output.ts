// src/tema2/genereaza-output.ts
//
// Rulare: pnpm t2:output
//
// Ruleaza fiecare script al temei 2 o singura data, in procesul lui (harta si
// array-ul pornesc goale), verifica liniile citate si scrie output-tema2.log.

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { captureazaConsola, verificaDovezi } from "../genereaza-output.js";
import { PUNCTE_TEMA2 } from "./raspunsuri.js";

export function genereazaOutputTema2(): string {
  const consola = new Map<string, string>();
  for (const { script } of PUNCTE_TEMA2) {
    if (script && !consola.has(script)) consola.set(script, captureazaConsola(script));
  }

  verificaDovezi(PUNCTE_TEMA2, consola);

  const sectiuni = PUNCTE_TEMA2.map((p, i) => {
    const linii = [`==================== CHECKLIST ${i + 1} ====================`, p.intrebare, ""];
    const script = p.script!;
    const primul = PUNCTE_TEMA2.findIndex((q) => q.script === script);
    if (primul === i) {
      linii.push(`$ pnpm ${script}`, consola.get(script)!.trimEnd(), "");
    } else {
      linii.push(`(aceeasi consola ca la checklist ${primul + 1}: $ pnpm ${script})`, "");
    }
    linii.push(`Raspuns: ${p.raspuns}`, "", "Linii citate din consola:");
    for (const d of p.dovezi) linii.push(`  ${d}`);
    return linii.join("\n");
  });

  return "Tema 2 · Lab 9 middleware custom · consola capturata de `pnpm t2:output`\n\n" + sectiuni.join("\n\n") + "\n";
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(new URL("../../output-tema2.log", import.meta.url), genereazaOutputTema2());
  console.log("output-tema2.log scris.");
}
