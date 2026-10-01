// src/tema2/checklist4.ts
//
// Rulare: pnpm t2:checklist4
//
// Checklist 4: HITL pe trimiteEmailConfirmare. A: restart simulat intre pauza si
// aprobare (harta golita, acelasi MemorySaver, agent nou). B: procesul moare cu
// MemorySaver, deci aprobarea ajunge pe un checkpointer nou, gol.

import { FakeToolCallingModel } from "langchain";
import type { HITLRequest, HITLResponse } from "langchain";
import { Command, MemorySaver } from "@langchain/langgraph";
import { pathToFileURL } from "node:url";
import { creeazaAgentAgentie } from "./agent.js";
import { iduriDinFir, resetHarti } from "./anonimizare-pii.js";
import { emailuriTrimise } from "./agentie.js";

const TURE = [
  [{ name: "cautaClient", args: { idClient: "ionel.popescu" }, id: "c1" }],
  [
    {
      name: "trimiteEmailConfirmare",
      args: { email: "[ID_EMAIL_1]", mesaj: "Rezervarea este confirmata." },
      id: "e1",
    },
  ],
  [],
];

const INTRARE = {
  messages: [{ role: "user", content: "cauta clientul ionel.popescu si trimite-i confirmarea" }],
};

const APROBARE: HITLResponse = { decisions: [{ type: "approve" }] };

// Agentul de dupa restart continua aceeasi lista de ture de la tura 3: id-ul mesajului
// AI e indexul din lista, deci un model pornit de la 0 ar suprascrie mesaje din checkpoint.
const agentDupaRestart = (checkpointer: MemorySaver) =>
  creeazaAgentAgentie({
    model: new FakeToolCallingModel({ toolCalls: TURE, index: 2 }),
    hitl: true,
    checkpointer,
  });

export async function ruleaza(
  log: (...args: unknown[]) => void = console.log,
  { restart }: { restart: boolean } = { restart: true },
) {
  log('=== A: checkpointer pastrat, harta pierduta · thread_id "fir-hitl" ===');
  const configA = { configurable: { thread_id: "fir-hitl" } };
  const checkpointer = new MemorySaver();
  const agent = creeazaAgentAgentie({ model: new FakeToolCallingModel({ toolCalls: TURE }), hitl: true, checkpointer });

  const r1 = await agent.invoke(INTRARE, configA);
  const cerere = r1.__interrupt__?.[0]?.value as HITLRequest | undefined;
  const emailuriLaIntrerupere = emailuriTrimise.length;
  log(
    "dupa invoke: intrerupere: " +
      (cerere ? cerere.actionRequests.map((a) => `${a.name} ${JSON.stringify(a.args)}`).join(", ") : "nu") +
      ` | emailuri trimise: ${emailuriLaIntrerupere}`,
  );
  const iduriInainteDeRestart = iduriDinFir("fir-hitl").length;
  log(`id-uri in harta fir-hitl: ${iduriInainteDeRestart}`);

  if (restart) {
    resetHarti();
    log("--- restart simulat: harta din memorie golita; acelasi MemorySaver, agent nou ---");
  }
  const iduriDupaRestart = iduriDinFir("fir-hitl").length;
  log(`id-uri in harta fir-hitl: ${iduriDupaRestart}`);

  log(`decizie trimisa: ${JSON.stringify(APROBARE)}`);
  const r2 = await agentDupaRestart(checkpointer).invoke(new Command({ resume: APROBARE }), configA);
  log(`dupa resume: ${r2.messages.length} mesaje | ultimul [tool]: ${r2.messages.filter((m) => m.getType() === "tool").at(-1)?.content}`);
  log(`emailuriTrimise (din afara conversatiei): ${JSON.stringify(emailuriTrimise)}`);

  log('\n=== B: procesul moare cu MemorySaver · thread_id "fir-hitl-b" ===');
  const configB = { configurable: { thread_id: "fir-hitl-b" } };
  const agentB = creeazaAgentAgentie({
    model: new FakeToolCallingModel({ toolCalls: TURE }),
    hitl: true,
    checkpointer: new MemorySaver(),
  });
  const emailuriLaStartB = emailuriTrimise.length;
  const r3 = await agentB.invoke(INTRARE, configB);
  const emailuriLaIntrerupereB = emailuriTrimise.length - emailuriLaStartB;
  log(`dupa invoke: intrerupere: ${r3.__interrupt__ ? "da" : "nu"} | emailuri trimise in B: ${emailuriLaIntrerupereB}`);

  resetHarti();
  log("--- procesul moare: MemorySaver-ul si harta se pierd; aprobarea vine pe un MemorySaver nou ---");
  log(`decizie trimisa: ${JSON.stringify(APROBARE)}`);
  const r4 = await agentDupaRestart(new MemorySaver()).invoke(new Command({ resume: APROBARE }), configB);
  const emailuriDupaResumeB = emailuriTrimise.length - emailuriLaStartB;
  log(
    `dupa resume: ${r4.messages.length} mesaje | intrerupere: ${r4.__interrupt__ ? "da" : "nu"}` +
      ` | emailuri trimise in B: ${emailuriDupaResumeB}`,
  );

  return {
    parteaA: {
      actiuniIntrerupte: cerere?.actionRequests.map((a) => a.name) ?? [],
      emailLaIntrerupere: cerere?.actionRequests[0]?.args.email,
      emailuriLaIntrerupere,
      iduriInainteDeRestart,
      iduriDupaRestart,
    },
    parteaB: {
      mesaje: r4.messages.length,
      intrerupere: Boolean(r4.__interrupt__),
      emailuriLaIntrerupere: emailuriLaIntrerupereB,
      emailuriDupaResume: emailuriDupaResumeB,
    },
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
