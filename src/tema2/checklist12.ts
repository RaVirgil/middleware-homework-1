// src/tema2/checklist12.ts
//
// Rulare: pnpm t2:checklist12
//
// Checklist 1 si 2: tura 1 cauta ionel.popescu, tura 2 trimite confirmarea la
// id-ul opac scris de mana. Dupa istoric, array-ul tool-ului arata ce email a
// primit efectiv, din afara conversatiei.

import { FakeToolCallingModel } from "langchain";
import type { BaseMessage } from "@langchain/core/messages";
import { pathToFileURL } from "node:url";
import { creeazaAgentAgentie } from "./agent.js";
import { afiseazaMesajele } from "../afisare.js";
import { emailuriTrimise } from "./agentie.js";

export async function ruleaza(
  log: (...args: unknown[]) => void = console.log,
  config: { configurable?: { thread_id: string } } = { configurable: { thread_id: "fir-tema2" } },
): Promise<BaseMessage[]> {
  const model = new FakeToolCallingModel({
    toolCalls: [
      [{ name: "cautaClient", args: { idClient: "ionel.popescu" }, id: "c1" }],
      [
        {
          name: "trimiteEmailConfirmare",
          args: { email: "[ID_EMAIL_1]", mesaj: "Rezervarea este confirmata." },
          id: "e1",
        },
      ],
      [],
    ],
  });
  const agent = creeazaAgentAgentie({ model });

  const rezultat = await agent.invoke(
    { messages: [{ role: "user", content: "cauta clientul ionel.popescu si trimite-i confirmarea" }] },
    config,
  );
  afiseazaMesajele(rezultat.messages, log);
  log(`emailuriTrimise (din afara conversatiei): ${JSON.stringify(emailuriTrimise)}`);
  return rezultat.messages;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
