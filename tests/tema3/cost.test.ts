import { afterEach, describe, expect, it, vi } from "vitest";
import { AIMessage, createAgent, createMiddleware, fakeModel, toolStrategy } from "langchain";
import { z } from "zod";
import { alegereaPentru, type Alegere } from "../../src/tema3/cost-guard.js";
import { ruleaza } from "../../src/tema3/cost.js";
import { garda, modelFals } from "../../src/tema3/agent.js";

const fara = () => {};

const SIMPLA = "Cat e ceasul in Tokyo?";
const COMPLEXA = "Explică-mi diferența dintre camera standard și cea superioară";

describe("tema 3 · cost · atribuit modelului folosit efectiv", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("o sonda exterioara citeste alegerea costGuard pe AIMessage-ul intors: nume, tokeni si cost", async () => {
    const alegeri: (Alegere | undefined)[] = [];
    const sonda = createMiddleware({
      name: "Sonda",
      wrapModelCall: async (request, handler) => {
        const raspuns = await handler(request);
        alegeri.push(alegereaPentru(raspuns));
        return raspuns;
      },
    });
    const ieftin = modelFals(1, "ieftin");
    const scump = modelFals(1, "scump");
    const agent = createAgent({ model: scump, tools: [], middleware: [sonda, garda(ieftin, scump)] });

    await agent.invoke({ messages: [{ role: "user", content: SIMPLA }] });
    await agent.invoke({ messages: [{ role: "user", content: COMPLEXA }] });

    expect(alegeri).toEqual([
      { ruta: "SIMPLA", nume: "claude-haiku-4-5", tokenIntrare: 100, tokenIesire: 20, cost: expect.closeTo(0.0002, 10) },
      { ruta: "COMPLEXA", nume: "gpt-x", tokenIntrare: 100, tokenIesire: 20, cost: expect.closeTo(0.0018, 10) },
    ]);
  });

  it("fara usage_metadata: cost n/a, nu 0, iar linia verbose o spune", async () => {
    const spion = vi.spyOn(console, "log").mockImplementation(() => {});
    const alegeri: (Alegere | undefined)[] = [];
    const sonda = createMiddleware({
      name: "Sonda",
      wrapModelCall: async (request, handler) => {
        const raspuns = await handler(request);
        alegeri.push(alegereaPentru(raspuns));
        return raspuns;
      },
    });
    const ieftin = fakeModel().respond(new AIMessage("fara usage"));
    const scump = fakeModel();
    const agent = createAgent({ model: scump, tools: [], middleware: [sonda, garda(ieftin, scump, true)] });

    await agent.invoke({ messages: [{ role: "user", content: SIMPLA }] });

    expect(alegeri[0]?.cost).toBe("n/a");
    expect(alegeri[0]?.tokenIntrare).toBeUndefined();
    expect(String(spion.mock.calls[0][0])).toContain("fara usage_metadata");
  });

  it("cu responseFormat: usage se citeste din AIMessage-ul din wrapper; alegerea se gaseste pe wrapper si pe AIMessage", async () => {
    const spion = vi.spyOn(console, "log").mockImplementation(() => {});
    let primit: unknown;
    const sonda = createMiddleware({
      name: "Sonda",
      wrapModelCall: async (request, handler) => {
        const raspuns = await handler(request);
        primit = raspuns;
        return raspuns;
      },
    });
    const ieftin = fakeModel().respond(
      new AIMessage({
        content: "",
        tool_calls: [{ name: "Raspuns", args: { ora: "21:00" }, id: "c1" }],
        usage_metadata: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
      }),
    );
    const scump = fakeModel();
    const agent = createAgent({
      model: scump,
      tools: [],
      responseFormat: toolStrategy(z.object({ ora: z.string() }).meta({ title: "Raspuns" })),
      middleware: [sonda, garda(ieftin, scump, true)],
    });

    const rezultat = await agent.invoke({ messages: [{ role: "user", content: SIMPLA }] });

    expect(rezultat.structuredResponse).toEqual({ ora: "21:00" });
    const wrapper = primit as { structuredResponse: unknown; messages: AIMessage[] };
    expect(AIMessage.isInstance(wrapper)).toBe(false);
    const asteptat = {
      ruta: "SIMPLA",
      nume: "claude-haiku-4-5",
      tokenIntrare: 100,
      tokenIesire: 20,
      cost: expect.closeTo(0.0002, 10),
    };
    expect(alegereaPentru(wrapper.messages[0])).toEqual(asteptat);
    expect(alegereaPentru(wrapper as unknown as AIMessage)).toEqual(asteptat);
    expect(String(spion.mock.calls[0][0])).toContain("100 in / 20 out | cost $0.000200");
  });

  it("ordinea: sonda dupa costGuard vede instanta aleasa; sonda inainte vede modelul agentului", async () => {
    const vazute: Record<string, unknown> = {};
    const sonda = (nume: string) =>
      createMiddleware({
        name: `Sonda${nume}`,
        wrapModelCall: async (request, handler) => {
          vazute[nume] = request.model;
          return handler(request);
        },
      });
    const ieftin = modelFals(1, "ieftin");
    const scump = modelFals(1, "scump");
    const agent = createAgent({
      model: scump,
      tools: [],
      middleware: [sonda("Exterioara"), garda(ieftin, scump), sonda("Interioara")],
    });

    await agent.invoke({ messages: [{ role: "user", content: SIMPLA }] });

    expect(vazute.Interioara).toBe(ieftin);
    expect(vazute.Exterioara).toBe(scump);
  });

  it("t3:cost: ordinea corecta vede ieftin apoi scump; ordinea gresita da numele scump, alegerea costGuard da numele ieftin", async () => {
    const r = await ruleaza(fara, false);

    expect(r.ordineCorecta).toEqual(["claude-haiku-4-5", "gpt-x"]);
    expect(r.ordineGresita).toEqual({ sonda: "gpt-x", costGuard: "claude-haiku-4-5" });
  });
});
