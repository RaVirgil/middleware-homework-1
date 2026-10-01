import { afterEach, describe, expect, it, vi } from "vitest";
import { createAgent, fakeModel } from "langchain";
import { ruleaza } from "../../src/tema3/rutare.js";
import { garda, modelFals } from "../../src/tema3/agent.js";

const fara = () => {};

const intreaba = (agent: { invoke: (i: { messages: { role: string; content: string }[] }) => Promise<unknown> }, text: string) =>
  agent.invoke({ messages: [{ role: "user", content: text }] });

describe("tema 3 · rutare · intrebare simpla → ieftin, complexa → scump", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("t3:rutare: intrebarea complexa cu diacritice ajunge la modelul scump", async () => {
    const apeluri = await ruleaza(fara, false);

    expect(apeluri).toEqual([
      { intrebare: "Cat e ceasul in Tokyo?", ieftin: 1, scump: 0 },
      { intrebare: "Explică-mi diferența dintre camera standard și cea superioară", ieftin: 0, scump: 1 },
    ]);
  });

  it("daca modelul ales nu are raspuns in coada, invoke arunca: fake-urile sunt stricte", async () => {
    const ieftin = modelFals(0, "ieftin");
    const scump = modelFals(1, "scump");
    const agent = createAgent({ model: scump, tools: [], middleware: [garda(ieftin, scump)] });

    await expect(intreaba(agent, "Cat e ceasul in Tokyo?")).rejects.toThrow("FakeModel: no response queued");
    expect(scump.callCount).toBe(0);
  });

  it("modelul propriu al agentului nu e chemat niciodata", async () => {
    const baza = fakeModel();
    const ieftin = modelFals(1, "ieftin");
    const scump = modelFals(1, "scump");
    const agent = createAgent({ model: baza, tools: [], middleware: [garda(ieftin, scump)] });

    await intreaba(agent, "Cat e ceasul in Tokyo?");
    await intreaba(agent, "Compara camera standard cu cea superioara");

    expect(baza.callCount).toBe(0);
    expect([ieftin.callCount, scump.callCount]).toEqual([1, 1]);
  });

  it("verbose implicit false: costGuard nu scrie nimic in consola", async () => {
    const spion = vi.spyOn(console, "log").mockImplementation(() => {});
    const ieftin = modelFals(1, "ieftin");
    const scump = modelFals(1, "scump");
    const agent = createAgent({ model: scump, tools: [], middleware: [garda(ieftin, scump)] });

    await intreaba(agent, "Cat e ceasul in Tokyo?");

    expect(spion).not.toHaveBeenCalled();
  });

  it("verbose true: o linie per apel de model, cu ruta si numele modelului ales", async () => {
    const spion = vi.spyOn(console, "log").mockImplementation(() => {});
    const ieftin = modelFals(1, "ieftin");
    const scump = modelFals(1, "scump");
    const agent = createAgent({ model: scump, tools: [], middleware: [garda(ieftin, scump, true)] });

    await intreaba(agent, "Cat e ceasul in Tokyo?");
    await intreaba(agent, "Compara camera standard cu cea superioara");

    expect(spion).toHaveBeenCalledTimes(2);
    expect(String(spion.mock.calls[0][0])).toMatch(/^\[costGuard\] SIMPLA → claude-haiku-4-5\b/);
    expect(String(spion.mock.calls[1][0])).toMatch(/^\[costGuard\] COMPLEXA → gpt-x\b/);
  });
});
