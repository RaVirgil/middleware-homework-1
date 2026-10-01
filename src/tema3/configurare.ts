// src/tema3/configurare.ts
//
// Rulare: pnpm t3:configurare
//
// Punctul 4: o configuratie gresita arunca la costGuard(...), inainte de
// createAgent, nu la prima intrebare simpla.

import { createAgent, FakeToolCallingModel, tool } from "langchain";
import { RunnableLambda } from "@langchain/core/runnables";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { z } from "zod";
import { pathToFileURL } from "node:url";
import { garda, modelFals } from "./agent.js";

const unTool = tool(async () => "ok", { name: "unTool", description: "Tool de demo.", schema: z.object({}) });

// Modelul ieftin e cel stricat: la curs, asta crapa abia la prima intrebare simpla.
const CAZURI: { caz: string; ieftin: () => unknown }[] = [
  { caz: "model lipsa", ieftin: () => undefined },
  { caz: "obiect fara bindTools", ieftin: () => RunnableLambda.from(async () => "raspuns") },
  { caz: "fake cu tool-uri legate", ieftin: () => new FakeToolCallingModel().bindTools([unTool]) },
  { caz: "configuratie valida", ieftin: () => modelFals(1, "ieftin") },
];

export async function ruleaza(log: (...args: unknown[]) => void = console.log) {
  const rezultate = [];
  for (const { caz, ieftin } of CAZURI) {
    log(`--- ${caz} ---`);
    let agentCreat = false;
    let eroare: string | undefined;
    const scump = modelFals(1, "scump");
    let g: ReturnType<typeof garda> | undefined;
    try {
      g = garda(ieftin() as BaseChatModel, scump);
    } catch (e) {
      eroare = (e as Error).message;
      log(`costGuard(...) a aruncat: ${eroare}`);
    }
    if (g) {
      const agent = createAgent({ model: scump, tools: [unTool], middleware: [g] });
      agentCreat = true;
      await agent.invoke({ messages: [{ role: "user", content: "Cat e ceasul in Tokyo?" }] });
      log("ok");
    }
    log(`createAgent apelat: ${agentCreat ? "da" : "nu"}`);
    rezultate.push({ caz, agentCreat, eroare });
  }
  return rezultate;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
