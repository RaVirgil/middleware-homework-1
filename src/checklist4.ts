// src/checklist4.ts
//
// Rulare: pnpm checklist4
//
// Checklist 4: agentul cu HITL, FARA checkpointer, intentionat. interrupt()
// nu are unde sa salveze starea, deci arunca in momentul in care modelul cere
// escaladeazaTicket, inainte ca tool-ul sa se execute.

import { FakeToolCallingModel } from "langchain";
import { pathToFileURL } from "node:url";
import { creeazaAgentSuport } from "./agent.js";
import { tichetEscaladate } from "./tools/suport.js";

type EroareLangGraph = Error & { lc_error_code?: string };

export async function ruleaza(log: (...args: unknown[]) => void = console.log): Promise<EroareLangGraph> {
  const model = new FakeToolCallingModel({
    toolCalls: [
      [{ name: "escaladeazaTicket", args: { idTicket: "T-1", motiv: "client nemultumit" }, id: "e1" }],
      [],
    ],
  });
  const agent = creeazaAgentSuport({ model, hitl: true });

  try {
    await agent.invoke({
      messages: [{ role: "user", content: "clientul cl-101 e nemultumit, escaladeaza tichetul T-1" }],
    });
  } catch (e) {
    const eroare = e as EroareLangGraph;
    log(`Eroare: ${eroare.name}`);
    log(`lc_error_code: ${eroare.lc_error_code}`);
    log(`message: ${eroare.message}`);
    log(`Tichete escaladate: ${tichetEscaladate.length}`);
    return eroare;
  }
  throw new Error("Rularea fara checkpointer trebuia sa arunce.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
