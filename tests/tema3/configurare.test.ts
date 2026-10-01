import { describe, expect, it } from "vitest";
import { createAgent, FakeToolCallingModel, fakeModel, tool } from "langchain";
import { RunnableLambda } from "@langchain/core/runnables";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { z } from "zod";
import { costGuard, type OptiuniCostGuard } from "../../src/tema3/cost-guard.js";
import { ruleaza } from "../../src/tema3/configurare.js";
import { modelFals } from "../../src/tema3/agent.js";

const fara = () => {};

const unTool = tool(async () => "ok", { name: "unTool", description: "test", schema: z.object({}) });

const valid = (): OptiuniCostGuard => ({
  ieftin: { model: fakeModel(), nume: "claude-haiku-4-5", pret: { intrare: 1, iesire: 5 } },
  scump: { model: fakeModel(), nume: "gpt-x", pret: { intrare: 10, iesire: 40 } },
});

const cuModel = (rol: "ieftin" | "scump", model: unknown): OptiuniCostGuard => {
  const o = valid();
  o[rol] = { ...o[rol], model: model as BaseChatModel };
  return o;
};

describe("tema 3 · configurare · costGuard arunca la constructie, nu la prima intrebare simpla", () => {
  it.each(["ieftin", "scump"] as const)("rolul %s lipseste cu totul: eroarea numeste rolul", (rol) => {
    const o: Partial<OptiuniCostGuard> = valid();
    delete o[rol];
    expect(() => costGuard(o as OptiuniCostGuard)).toThrow(new RegExp(`costGuard: rolul ${rol} lipseste`));
  });

  it("model lipsa: eroarea numeste rolul", () => {
    expect(() => costGuard(cuModel("ieftin", undefined))).toThrow(/ieftin\.model lipseste/);
  });

  it("string in loc de instanta: nu e un obiect", () => {
    expect(() => costGuard(cuModel("scump", "openai:gpt-x"))).toThrow(/scump\.model lipseste sau nu e un obiect/);
  });

  it("obiect fara bindTools (RunnableLambda): eroarea spune ca lipseste bindTools", () => {
    const lambda = RunnableLambda.from(async () => "x");
    expect(() => costGuard(cuModel("ieftin", lambda))).toThrow(/ieftin\.model nu e un chat model cu bindTools/);
  });

  it("obiect cu bindTools care nu e chat model: respins, ca la langchain", () => {
    const fals = { bindTools: () => fals };
    expect(() => costGuard(cuModel("scump", fals))).toThrow(/scump\.model nu e un chat model cu bindTools/);
  });

  it("RunnableBinding peste ceva care nu e chat model: respins", () => {
    const lambda = RunnableLambda.from(async () => "x").withConfig({ tags: ["ieftin"] });
    expect(() => costGuard(cuModel("ieftin", lambda))).toThrow(/ieftin\.model nu e un chat model cu bindTools/);
  });

  it("chat model invelit in RunnableBinding fara tool-uri (withConfig): acceptat si folosit, ca la langchain", async () => {
    const ieftin = modelFals(1, "ieftin");
    const scump = modelFals(1, "scump");
    const invelit = ieftin.withConfig({ tags: ["ieftin"] });
    const o = cuModel("ieftin", invelit);
    o.scump.model = scump;

    expect(() => costGuard(o)).not.toThrow();
    const agent = createAgent({ model: scump, tools: [unTool], middleware: [costGuard(o)] });
    await agent.invoke({ messages: [{ role: "user", content: "Cat e ceasul in Tokyo?" }] });
    expect([ieftin.callCount, scump.callCount]).toEqual([1, 0]);
  });

  it("model cu tool-uri deja legate: eroare precisa, nu cea despre bindTools", () => {
    const legat = new FakeToolCallingModel().bindTools([unTool]);
    expect(() => costGuard(cuModel("ieftin", legat))).toThrow(/ieftin\.model are deja tool-uri legate/);
  });

  it("RunnableBinding cu tools in config: tot tool-uri legate", () => {
    const legat = fakeModel().withConfig({ tools: [unTool] } as Record<string, unknown>);
    expect(() => costGuard(cuModel("scump", legat))).toThrow(/scump\.model are deja tool-uri legate/);
  });

  it("nume gol", () => {
    const o = valid();
    o.scump.nume = "";
    expect(() => costGuard(o)).toThrow(/scump\.nume lipseste/);
  });

  it.each([
    ["lipsa", undefined],
    ["negativ", { intrare: -1, iesire: 5 }],
    ["infinit", { intrare: 1, iesire: Infinity }],
    ["NaN", { intrare: Number.NaN, iesire: 5 }],
  ])("pret %s", (_, pret) => {
    const o = valid();
    o.ieftin.pret = pret as OptiuniCostGuard["ieftin"]["pret"];
    expect(() => costGuard(o)).toThrow(/ieftin\.pret/);
  });

  it("configuratie valida nu arunca; aceeasi instanta pe ambele roluri e permisa", () => {
    expect(() => costGuard(valid())).not.toThrow();
    const m = fakeModel();
    expect(() =>
      costGuard({
        ieftin: { model: m, nume: "a", pret: { intrare: 0, iesire: 0 } },
        scump: { model: m, nume: "a", pret: { intrare: 0, iesire: 0 } },
      }),
    ).not.toThrow();
  });

  it("t3:configurare: fiecare configuratie gresita arunca inainte de createAgent; cea valida raspunde", async () => {
    const cazuri = await ruleaza(fara);

    expect(cazuri.map((c) => [c.caz, c.agentCreat, Boolean(c.eroare)])).toEqual([
      ["model lipsa", false, true],
      ["obiect fara bindTools", false, true],
      ["fake cu tool-uri legate", false, true],
      ["configuratie valida", true, false],
    ]);
  });
});
