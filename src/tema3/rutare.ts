// src/tema3/rutare.ts
//
// Rulare: pnpm t3:rutare
//
// Punctul 1: o intrebare simpla ajunge la modelul ieftin, una complexa la cel
// scump. Instanta scumpa e si modelul agentului, deci exista un singur client scump.

import { createAgent } from "langchain";
import { pathToFileURL } from "node:url";
import { garda, modelFals } from "./agent.js";

const INTREBARI = ["Cat e ceasul in Tokyo?", "Explică-mi diferența dintre camera standard și cea superioară"];

export async function ruleaza(log: (...args: unknown[]) => void = console.log, verbose = true) {
  const apeluri = [];
  for (const intrebare of INTREBARI) {
    const ieftin = modelFals(1, "ieftin");
    const scump = modelFals(1, "scump");
    const agent = createAgent({ model: scump, tools: [], middleware: [garda(ieftin, scump, verbose)] });

    log(`intrebare: ${intrebare}`);
    await agent.invoke({ messages: [{ role: "user", content: intrebare }] });
    log(`apeluri: ieftin=${ieftin.callCount} scump=${scump.callCount}`);
    apeluri.push({ intrebare, ieftin: ieftin.callCount, scump: scump.callCount });
  }
  return apeluri;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
