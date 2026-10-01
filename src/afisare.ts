// src/afisare.ts

import type { BaseMessage } from "@langchain/core/messages";

/** Tipareste istoricul in formatul din enunt: `[tip] continut`. */
export function afiseazaMesajele(mesaje: BaseMessage[], log: (...args: unknown[]) => void = console.log) {
  for (const m of mesaje) {
    log(`[${m.getType()}]`, m.content);
  }
}
