// src/tema2/agent.ts
//
// Agentul temei 2: aceleasi tool-uri si anonimizarePii in toate scripturile.
// Fiecare script isi aduce modelul fals; HITL si checkpointer-ul sunt optionale.

import { createAgent, humanInTheLoopMiddleware, type FakeToolCallingModel } from "langchain";
import type { MemorySaver } from "@langchain/langgraph";
import { anonimizarePii } from "./anonimizare-pii.js";
import { cautaClient, trimiteEmailConfirmare } from "./agentie.js";

export function creeazaAgentAgentie({
  model,
  hitl = false,
  checkpointer,
}: {
  model: FakeToolCallingModel;
  hitl?: boolean;
  checkpointer?: MemorySaver;
}) {
  return createAgent({
    model,
    tools: [cautaClient, trimiteEmailConfirmare],
    middleware: [
      anonimizarePii(),
      ...(hitl
        ? [
            humanInTheLoopMiddleware({
              interruptOn: { trimiteEmailConfirmare: { allowedDecisions: ["approve", "reject"] } },
            }),
          ]
        : []),
    ],
    checkpointer,
  });
}
