// src/checklist5.ts
//
// Rulare: pnpm checklist5
//
// Checklist 5: acelasi flux (cauta clientul, escaladeaza T-1, aprobat in cod)
// rulat de trei ori: fir-A, din nou fir-A, apoi fir-B.

import { FakeToolCallingModel } from "langchain";
import type { HITLRequest, HITLResponse } from "langchain";
import type { BaseMessage } from "@langchain/core/messages";
import { Command, MemorySaver } from "@langchain/langgraph";
import { pathToFileURL } from "node:url";
import { creeazaAgentSuport } from "./agent.js";
import { afiseazaMesajele } from "./afisare.js";
import { tichetEscaladate } from "./tools/suport.js";

type Rulare = {
  thread_id: string;
  actiuniIntrerupte: string[];
  escaladariLaIntrerupere: number;
  mesajeDupaInvoke: number;
  mesajeDupaResume: number;
  escaladariDupaResume: number;
};

export async function ruleaza(
  log: (...args: unknown[]) => void = console.log,
): Promise<{ rulari: Rulare[]; mesajeFirA: BaseMessage[] }> {
  // O singura lista continua pentru ambele rulari de pe fir-A: id-ul mesajului
  // AI e indexul din lista, deci un model nou pe acelasi fir ar suprascrie mesaje.
  const model = new FakeToolCallingModel({
    toolCalls: [
      [{ name: "cautaClientSuport", args: { idClient: "cl-101" }, id: "c1" }],
      [{ name: "escaladeazaTicket", args: { idTicket: "T-1", motiv: "client nemultumit" }, id: "e1" }],
      [],
      [{ name: "cautaClientSuport", args: { idClient: "cl-101" }, id: "c2" }],
      [{ name: "escaladeazaTicket", args: { idTicket: "T-1", motiv: "client nemultumit" }, id: "e2" }],
      [],
    ],
  });
  const agent = creeazaAgentSuport({ model, hitl: true, checkpointer: new MemorySaver() });

  const rulari: Rulare[] = [];
  let mesajeFirA: BaseMessage[] = [];

  for (const [eticheta, thread_id] of [
    ["rularea 1", "fir-A"],
    ["rularea 2", "fir-A"],
    ["rularea 3", "fir-B"],
  ]) {
    const config = { configurable: { thread_id } };
    log(`\n=== ${eticheta} · thread_id "${thread_id}" ===`);

    const r1 = await agent.invoke(
      { messages: [{ role: "user", content: "clientul cl-101 e nemultumit, escaladeaza tichetul T-1" }] },
      config,
    );
    const cerere = r1.__interrupt__?.[0]?.value as HITLRequest | undefined;
    const escaladariLaIntrerupere = tichetEscaladate.length;
    log(
      `dupa invoke: ${r1.messages.length} mesaje | intrerupere: ` +
        (cerere
          ? cerere.actionRequests.map((a) => `${a.name} ${JSON.stringify(a.args)}`).join(", ")
          : "nu") +
        ` | tichete escaladate: ${escaladariLaIntrerupere}` +
        ` | runToolCallCount=${JSON.stringify(r1.runToolCallCount)}` +
        ` threadToolCallCount=${JSON.stringify(r1.threadToolCallCount)}`,
    );

    const resume: HITLResponse = { decisions: [{ type: "approve" }] };
    log(`decizie trimisa: ${JSON.stringify(resume)}`);
    const r2 = await agent.invoke(new Command({ resume }), config);
    log(
      `dupa resume: ${r2.messages.length} mesaje` +
        ` | tichete escaladate: ${tichetEscaladate.length}` +
        ` | runToolCallCount=${JSON.stringify(r2.runToolCallCount)}` +
        ` threadToolCallCount=${JSON.stringify(r2.threadToolCallCount)}`,
    );

    if (eticheta === "rularea 2") {
      log(`istoricul de pe "${thread_id}" dupa rularea 2:`);
      afiseazaMesajele(r2.messages, log);
      mesajeFirA = r2.messages;
    }

    rulari.push({
      thread_id,
      actiuniIntrerupte: cerere?.actionRequests.map((a) => a.name) ?? [],
      escaladariLaIntrerupere,
      mesajeDupaInvoke: r1.messages.length,
      mesajeDupaResume: r2.messages.length,
      escaladariDupaResume: tichetEscaladate.length,
    });
  }

  log(`\nTichete escaladate (${tichetEscaladate.length}):`);
  for (const t of tichetEscaladate) log(`  ${t}`);

  return { rulari, mesajeFirA };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
