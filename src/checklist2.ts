// src/checklist2.ts
//
// Rulare: pnpm checklist2
//
// Checklist 2: modelul cere 4 tool call-uri la rand, cate unul pe tura,
// acelasi client. runLimit 3 + "end" blocheaza al 4-lea inainte sa se
// execute si termina rularea cu un mesaj AI normal, fara exceptie.

import { FakeToolCallingModel } from "langchain";
import type { BaseMessage } from "@langchain/core/messages";
import { pathToFileURL } from "node:url";
import { creeazaAgentSuport } from "./agent.js";
import { afiseazaMesajele } from "./afisare.js";

export async function ruleaza(log: (...args: unknown[]) => void = console.log): Promise<BaseMessage[]> {
  const model = new FakeToolCallingModel({
    toolCalls: [
      [{ name: "cautaClientSuport", args: { idClient: "cl-101" }, id: "c1" }],
      [{ name: "cautaClientSuport", args: { idClient: "cl-101" }, id: "c2" }],
      [{ name: "cautaClientSuport", args: { idClient: "cl-101" }, id: "c3" }],
      [{ name: "cautaClientSuport", args: { idClient: "cl-101" }, id: "c4" }],
      [],
    ],
  });
  const agent = creeazaAgentSuport({ model });

  const rezultat = await agent.invoke({
    messages: [{ role: "user", content: "verifica de 4 ori clientul cl-101" }],
  });
  afiseazaMesajele(rezultat.messages, log);
  log("invoke() s-a intors normal, fara exceptie.");
  return rezultat.messages;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
