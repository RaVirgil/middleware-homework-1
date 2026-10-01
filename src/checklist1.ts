// src/checklist1.ts
//
// Rulare: pnpm checklist1
//
// Checklist 1: ce apare EFECTIV in ToolMessage cand cautaClientSuport
// intoarce emailul. piiMiddleware rescrie ToolMessage-ul inainte de model,
// cu acelasi id, deci si istoricul pastreaza varianta mascata.

import { FakeToolCallingModel } from "langchain";
import type { BaseMessage } from "@langchain/core/messages";
import { pathToFileURL } from "node:url";
import { creeazaAgentSuport } from "./agent.js";
import { afiseazaMesajele } from "./afisare.js";

export async function ruleaza(log: (...args: unknown[]) => void = console.log): Promise<BaseMessage[]> {
  const model = new FakeToolCallingModel({
    toolCalls: [
      [{ name: "cautaClientSuport", args: { idClient: "cl-101" }, id: "1" }],
      [],
    ],
  });
  const agent = creeazaAgentSuport({ model });

  const rezultat = await agent.invoke({
    messages: [{ role: "user", content: "cauta clientul cl-101, vreau sa vad planul lui" }],
  });
  afiseazaMesajele(rezultat.messages, log);
  return rezultat.messages;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
