// src/tema3/genereaza-output.ts
//
// Rulare: pnpm t3:output
//
// Ruleaza fiecare script al temei 3 o singura data, in procesul lui, verifica
// liniile citate si scrie output-tema3.log.

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { captureazaConsola, verificaDovezi } from "../genereaza-output.js";
import { PUNCTE_TEMA3 } from "./raspunsuri.js";

export function genereazaOutputTema3(): string {
  const consola = new Map<string, string>();
  for (const { script } of PUNCTE_TEMA3) consola.set(script!, captureazaConsola(script!));

  verificaDovezi(PUNCTE_TEMA3, consola);

  const sectiuni = PUNCTE_TEMA3.map((p, i) => {
    const linii = [`==================== PUNCTUL ${i + 1} ====================`, p.intrebare, ""];
    linii.push(`$ pnpm ${p.script}`, consola.get(p.script!)!.trimEnd(), "");
    linii.push(`Raspuns: ${p.raspuns}`, "", "Linii citate din consola:");
    for (const d of p.dovezi) linii.push(`  ${d}`);
    return linii.join("\n");
  });

  return "Tema 3 · Lab 9 costGuard cu doua modele · consola capturata de `pnpm t3:output`\n\n" + sectiuni.join("\n\n") + "\n";
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(new URL("../../output-tema3.log", import.meta.url), genereazaOutputTema3());
  console.log("output-tema3.log scris.");
}
