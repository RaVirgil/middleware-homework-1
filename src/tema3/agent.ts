// src/tema3/agent.ts
//
// Modelele false, numele si preturile de exemplu comune scripturilor temei 3.

import { AIMessage, fakeModel } from "langchain";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { costGuard } from "./cost-guard.js";

export const NUME_IEFTIN = "claude-haiku-4-5";
export const NUME_SCUMP = "gpt-x";

// Preturi de exemplu, $ / 1M tokeni (intrare / iesire); nu sunt preturi reale de lista.
export const PRET_IEFTIN = { intrare: 1, iesire: 5 };
export const PRET_SCUMP = { intrare: 10, iesire: 40 };

/** fakeModel cu `n` raspunsuri distincte (AgentNode le modifica `name`), toate cu 100 in / 20 out. */
export function modelFals(n: number, eticheta: string) {
  const model = fakeModel();
  for (let i = 1; i <= n; i++) {
    model.respond(
      new AIMessage({
        content: `raspuns ${eticheta} ${i}`,
        usage_metadata: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
      }),
    );
  }
  return model;
}

export function garda(ieftin: BaseChatModel, scump: BaseChatModel, verbose = false) {
  return costGuard({
    ieftin: { model: ieftin, nume: NUME_IEFTIN, pret: PRET_IEFTIN },
    scump: { model: scump, nume: NUME_SCUMP, pret: PRET_SCUMP },
    verbose,
  });
}
