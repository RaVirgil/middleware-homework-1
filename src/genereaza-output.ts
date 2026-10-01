// src/genereaza-output.ts
//
// Rulare: pnpm output
//
// Ruleaza fiecare script de checklist in procesul lui (array-ul de tichete
// porneste gol la fiecare), captureaza consola exact si scrie output.log.

import { spawnSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PUNCTE, type Punct } from "./raspunsuri.js";

// stdout si stderr pe acelasi fisier: scrierile in fisier sunt sincrone, deci ordinea ramane cea reala.
export function captureazaConsola(script: string): string {
  const dir = mkdtempSync(join(tmpdir(), "consola-"));
  const fisier = join(dir, `${script}.txt`);
  const fd = openSync(fisier, "w");
  try {
    const r = spawnSync("pnpm", ["--silent", script], { stdio: ["ignore", fd, fd] });
    const text = readFileSync(fisier, "utf8");
    if (r.status !== 0) throw new Error(`pnpm ${script} a iesit cu ${r.status}:\n${text}`);
    return text;
  } finally {
    closeSync(fd);
    rmSync(dir, { recursive: true, force: true });
  }
}

// Un raspuns citeaza doar linii intregi din consola propriului script; punctul fara script, din toate.
export function verificaDovezi(puncte: Punct[], consola: Map<string, string>) {
  const tot = [...consola.values()].join("\n");
  for (const [i, p] of puncte.entries()) {
    const linii = (p.script ? consola.get(p.script)! : tot).split("\n");
    for (const d of p.dovezi) {
      if (!linii.includes(d)) throw new Error(`Checklist ${i + 1}: linia citata nu e in consola: ${d}`);
    }
  }
}

export function genereazaOutput(): string {
  const consola = new Map<string, string>();
  for (const { script } of PUNCTE) {
    if (script) consola.set(script, captureazaConsola(script));
  }

  verificaDovezi(PUNCTE, consola);

  const sectiuni = PUNCTE.map((p, i) => {
    const linii = [`==================== CHECKLIST ${i + 1} ====================`, p.intrebare, ""];
    if (p.script) {
      linii.push(`$ pnpm ${p.script}`, consola.get(p.script)!.trimEnd(), "");
    } else {
      linii.push("(fara script: raspuns scris, cu linii din consola de la checklist 2 si 5)", "");
    }
    linii.push(`Raspuns: ${p.raspuns}`, "", "Linii citate din consola:");
    for (const d of p.dovezi) linii.push(`  ${d}`);
    return linii.join("\n");
  });

  return "Tema 1 · Lab 9 middleware · consola capturata de `pnpm output`\n\n" + sectiuni.join("\n\n") + "\n";
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(new URL("../output.log", import.meta.url), genereazaOutput());
  console.log("output.log scris.");
}
