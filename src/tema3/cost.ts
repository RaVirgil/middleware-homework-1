// src/tema3/cost.ts
//
// Rulare: pnpm t3:cost
//
// Punctul 5: aceiasi tokeni, cost diferit dupa modelul ales. O sonda de audit
// citeste request.model ca numeDinRequest din curs (audit.ts:74-77): pusa dupa
// costGuard vede modelul ales, pusa inainte (ca in demo5) vede modelul agentului.

import { createAgent, createMiddleware } from "langchain";
import { pathToFileURL } from "node:url";
import { alegereaPentru } from "./cost-guard.js";
import { garda, modelFals, NUME_IEFTIN, NUME_SCUMP, PRET_IEFTIN, PRET_SCUMP } from "./agent.js";

const SIMPLA = "Cat e ceasul in Tokyo?";
const COMPLEXA = "Explică-mi diferența dintre camera standard și cea superioară";

// Ca la curs, numele vine din campul `model` al instantei; fake-urile il primesc aici.
const modeleCuNume = () => ({
  ieftin: Object.assign(modelFals(1, "ieftin"), { model: NUME_IEFTIN }),
  scump: Object.assign(modelFals(1, "scump"), { model: NUME_SCUMP }),
});

const numeDinRequest = (model: unknown) => (model as { model?: string }).model ?? "necunoscut";

export async function ruleaza(log: (...args: unknown[]) => void = console.log, verbose = true) {
  log(
    `preturi de exemplu ($ / 1M tokeni, intrare / iesire): ${NUME_IEFTIN} ${PRET_IEFTIN.intrare} / ${PRET_IEFTIN.iesire}` +
      `, ${NUME_SCUMP} ${PRET_SCUMP.intrare} / ${PRET_SCUMP.iesire}`,
  );

  log("\n=== ordinea [costGuard, sonda]: sonda in interior ===");
  const ordineCorecta: string[] = [];
  for (const intrebare of [SIMPLA, COMPLEXA]) {
    const { ieftin, scump } = modeleCuNume();
    const sonda = createMiddleware({
      name: "SondaAudit",
      wrapModelCall: async (request, handler) => {
        const nume = numeDinRequest(request.model);
        log(`[sonda] request.model = ${nume}`);
        ordineCorecta.push(nume);
        return handler(request);
      },
    });
    const agent = createAgent({ model: scump, tools: [], middleware: [garda(ieftin, scump, verbose), sonda] });

    log(`intrebare: ${intrebare}`);
    await agent.invoke({ messages: [{ role: "user", content: intrebare }] });
  }

  log("\n=== ordinea [sonda, costGuard]: sonda in exterior, ca auditLogger in demo5 ===");
  const { ieftin, scump } = modeleCuNume();
  const ordineGresita = { sonda: "", costGuard: "" };
  const sonda = createMiddleware({
    name: "SondaAudit",
    wrapModelCall: async (request, handler) => {
      const raspuns = await handler(request);
      const alegere = alegereaPentru(raspuns);
      ordineGresita.sonda = numeDinRequest(request.model);
      ordineGresita.costGuard = alegere?.nume ?? "necunoscut";
      log(`[sonda] request.model = ${ordineGresita.sonda} | alegerea costGuard pe raspuns = ${ordineGresita.costGuard}`);
      return raspuns;
    },
  });
  const agent = createAgent({ model: scump, tools: [], middleware: [sonda, garda(ieftin, scump, verbose)] });
  log(`intrebare: ${SIMPLA}`);
  await agent.invoke({ messages: [{ role: "user", content: SIMPLA }] });

  return { ordineCorecta, ordineGresita };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
