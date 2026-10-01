// src/tema2/checklist3.ts
//
// Rulare: pnpm t2:checklist3
//
// Checklist 3: pe fir-A, ionel.popescu e cautat in doua ture la rand; pe fir-B,
// maria.ionescu o data. Se tiparesc doar id-urile din harta, niciodata valorile.

import { FakeToolCallingModel } from "langchain";
import type { BaseMessage } from "@langchain/core/messages";
import { pathToFileURL } from "node:url";
import { creeazaAgentAgentie } from "./agent.js";
import { afiseazaMesajele } from "../afisare.js";
import { iduriDinFir } from "./anonimizare-pii.js";

export async function ruleaza(
  log: (...args: unknown[]) => void = console.log,
): Promise<{ firA: BaseMessage[]; firB: BaseMessage[] }> {
  log('=== thread_id "fir-A" · ionel.popescu cautat de doua ori ===');
  const modelA = new FakeToolCallingModel({
    toolCalls: [
      [{ name: "cautaClient", args: { idClient: "ionel.popescu" }, id: "c1" }],
      [{ name: "cautaClient", args: { idClient: "ionel.popescu" }, id: "c2" }],
      [],
    ],
  });
  const rezultatA = await creeazaAgentAgentie({ model: modelA }).invoke(
    { messages: [{ role: "user", content: "cauta clientul ionel.popescu, apoi verifica-l inca o data" }] },
    { configurable: { thread_id: "fir-A" } },
  );
  afiseazaMesajele(rezultatA.messages, log);
  log(`id-uri in harta fir-A: ${iduriDinFir("fir-A").join(", ")}`);

  log('\n=== thread_id "fir-B" · maria.ionescu cautata o data ===');
  const modelB = new FakeToolCallingModel({
    toolCalls: [[{ name: "cautaClient", args: { idClient: "maria.ionescu" }, id: "c1" }], []],
  });
  const rezultatB = await creeazaAgentAgentie({ model: modelB }).invoke(
    { messages: [{ role: "user", content: "cauta clientul maria.ionescu" }] },
    { configurable: { thread_id: "fir-B" } },
  );
  afiseazaMesajele(rezultatB.messages, log);
  log(`id-uri in harta fir-B: ${iduriDinFir("fir-B").join(", ")}`);

  return { firA: rezultatA.messages, firB: rezultatB.messages };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
