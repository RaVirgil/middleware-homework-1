// src/agent.ts
//
// Agentul de suport: aceleasi tool-uri si acelasi middleware obligatoriu in
// toate scripturile. Fiecare script isi aduce modelul fals.

import {
  createAgent,
  humanInTheLoopMiddleware,
  piiMiddleware,
  toolCallLimitMiddleware,
  type FakeToolCallingModel,
} from "langchain";
import type { MemorySaver } from "@langchain/langgraph";
import { cautaClientSuport, escaladeazaTicket } from "./tools/suport.js";

export function creeazaAgentSuport({
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
    tools: [cautaClientSuport, escaladeazaTicket],
    middleware: [
      // Limita pe index 0: altfel "end" sare peste afterAgent si contorul de run nu se reseteaza.
      toolCallLimitMiddleware({ runLimit: 3, exitBehavior: "end" }),
      piiMiddleware("email", { strategy: "mask", applyToToolResults: true }),
      ...(hitl
        ? [
            humanInTheLoopMiddleware({
              interruptOn: { escaladeazaTicket: { allowedDecisions: ["approve", "reject"] } },
            }),
          ]
        : []),
    ],
    checkpointer,
  });
}
