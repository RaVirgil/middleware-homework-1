import { beforeEach, describe, expect, it } from "vitest";
import { AIMessage } from "@langchain/core/messages";
import { createAgent, FakeToolCallingModel } from "langchain";
import { ruleaza } from "../../src/tema2/checklist12.js";
import { creeazaAgentAgentie } from "../../src/tema2/agent.js";
import { anonimizarePii, resetHarti } from "../../src/tema2/anonimizare-pii.js";
import {
  cautaClient,
  emailuriTrimise,
  resetEmailuriTrimise,
  trimiteEmailConfirmare,
} from "../../src/tema2/agentie.js";

const fara = () => {};

describe("tema 2 · checklist 1+2 · anonimizarePii pe doua ture", () => {
  beforeEach(() => {
    resetHarti();
    resetEmailuriTrimise();
  });

  it("ToolMessage-ul lui cautaClient are id-uri opace, nu emailul si cardul reale", async () => {
    const mesaje = await ruleaza(fara);
    const tool = mesaje.filter((m) => m.getType() === "tool");

    expect(tool).toHaveLength(2);
    expect(tool[0].content).toBe(
      "Client Ionel Popescu | email: [ID_EMAIL_1] | card: [ID_CARD_1] | oras: Cluj-Napoca",
    );
  });

  it("tool-ul trimiteEmailConfirmare primeste emailul real", async () => {
    await ruleaza(fara);

    expect(emailuriTrimise).toHaveLength(1);
    expect(emailuriTrimise[0].email).toBe("ionel.popescu@example.com");
  });

  it("niciun mesaj din istoric nu contine emailul sau cardul reale", async () => {
    const mesaje = await ruleaza(fara);
    for (const m of mesaje) {
      expect(JSON.stringify(m)).not.toContain("ionel.popescu@example.com");
      expect(JSON.stringify(m)).not.toContain("4111 1111 1111 1111");
    }
  });

  it("rezultatul lui trimiteEmailConfirmare e mascat din nou", async () => {
    const mesaje = await ruleaza(fara);
    const tool = mesaje.filter((m) => m.getType() === "tool");

    expect(tool[1].content).toContain("[ID_EMAIL_1]");
  });

  it("sub version v1, tool_calls din AIMessage pastreaza id-ul opac (argumente noi, nu mutate)", async () => {
    const model = new FakeToolCallingModel({
      toolCalls: [
        [{ name: "cautaClient", args: { idClient: "ionel.popescu" }, id: "c1" }],
        [{ name: "trimiteEmailConfirmare", args: { email: "[ID_EMAIL_1]", mesaj: "m" }, id: "e1" }],
        [],
      ],
    });
    const agent = createAgent({
      model,
      tools: [cautaClient, trimiteEmailConfirmare],
      middleware: [anonimizarePii()],
      version: "v1",
    });
    const rezultat = await agent.invoke(
      { messages: [{ role: "user", content: "cauta clientul ionel.popescu si trimite-i confirmarea" }] },
      { configurable: { thread_id: "fir-v1" } },
    );
    const apel = rezultat.messages
      .filter((m) => AIMessage.isInstance(m))
      .flatMap((m) => (m as AIMessage).tool_calls ?? [])
      .find((c) => c.name === "trimiteEmailConfirmare");

    expect(emailuriTrimise[0].email).toBe("ionel.popescu@example.com");
    expect(apel?.args.email).toBe("[ID_EMAIL_1]");
  });

  it("eroarea de validare a argumentelor ajunge in istoric mascata, nu cu emailul real", async () => {
    const model = new FakeToolCallingModel({
      toolCalls: [
        [{ name: "cautaClient", args: { idClient: "ionel.popescu" }, id: "c1" }],
        [{ name: "trimiteEmailConfirmare", args: { email: "[ID_EMAIL_1]" }, id: "e1" }],
        [],
      ],
    });
    const rezultat = await creeazaAgentAgentie({ model }).invoke(
      { messages: [{ role: "user", content: "cauta clientul ionel.popescu si trimite-i confirmarea" }] },
      { configurable: { thread_id: "fir-eroare" } },
    );
    const eroare = rezultat.messages.filter((m) => m.getType() === "tool")[1];

    expect(emailuriTrimise).toHaveLength(0);
    expect(eroare.content).toContain("[ID_EMAIL_1]");
    expect(JSON.stringify(rezultat.messages)).not.toContain("ionel.popescu@example.com");
  });

  it("fara thread_id, ambele ture folosesc harta implicita si emailul real tot ajunge la tool", async () => {
    await ruleaza(fara, {});

    expect(emailuriTrimise[0].email).toBe("ionel.popescu@example.com");
  });
});
