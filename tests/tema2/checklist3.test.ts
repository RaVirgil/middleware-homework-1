import { beforeEach, describe, expect, it } from "vitest";
import { detectEmail, FakeToolCallingModel } from "langchain";
import { ruleaza } from "../../src/tema2/checklist3.js";
import { creeazaAgentAgentie } from "../../src/tema2/agent.js";
import { detecteazaCard, iduriDinFir, resetHarti } from "../../src/tema2/anonimizare-pii.js";

const fara = () => {};

describe("tema 2 · checklist 3 · acelasi client de doua ori in aceeasi conversatie", () => {
  beforeEach(() => {
    resetHarti();
  });

  it("ambele cautari din fir-A primesc aceleasi id-uri opace", async () => {
    const { firA } = await ruleaza(fara);
    const tool = firA.filter((m) => m.getType() === "tool").map((m) => m.content);

    expect(tool).toEqual([
      "Client Ionel Popescu | email: [ID_EMAIL_1] | card: [ID_CARD_1] | oras: Cluj-Napoca",
      "Client Ionel Popescu | email: [ID_EMAIL_1] | card: [ID_CARD_1] | oras: Cluj-Napoca",
    ]);
  });

  it("harta din fir-A are un singur id de email si un singur id de card", async () => {
    await ruleaza(fara);

    expect(iduriDinFir("fir-A")).toEqual(["[ID_EMAIL_1]", "[ID_CARD_1]"]);
  });

  it("fir-B are harta lui: maria primeste tot [ID_EMAIL_1] / [ID_CARD_1]", async () => {
    const { firB } = await ruleaza(fara);
    const tool = firB.filter((m) => m.getType() === "tool").map((m) => m.content);

    expect(tool).toEqual(["Client Maria Ionescu | email: [ID_EMAIL_1] | card: [ID_CARD_1] | oras: Iasi"]);
    expect(iduriDinFir("fir-B")).toEqual(["[ID_EMAIL_1]", "[ID_CARD_1]"]);
  });

  it("toate cele trei carduri din curs devin id-uri opace, inclusiv Amex-ul de 15 cifre", async () => {
    const model = new FakeToolCallingModel({
      toolCalls: [
        [{ name: "cautaClient", args: { idClient: "ionel.popescu" }, id: "c1" }],
        [{ name: "cautaClient", args: { idClient: "maria.ionescu" }, id: "c2" }],
        [{ name: "cautaClient", args: { idClient: "andrei.dumitru" }, id: "c3" }],
        [],
      ],
    });
    const rezultat = await creeazaAgentAgentie({ model }).invoke(
      { messages: [{ role: "user", content: "cauta toti clientii" }] },
      { configurable: { thread_id: "fir-carduri" } },
    );
    const tool = rezultat.messages.filter((m) => m.getType() === "tool").map((m) => String(m.content));

    expect(tool.map((t) => t.match(/card: (\S+)/)?.[1])).toEqual(["[ID_CARD_1]", "[ID_CARD_2]", "[ID_CARD_3]"]);
    for (const card of ["4111 1111 1111 1111", "5500 0000 0000 0004", "3400 0000 0000 009"]) {
      expect(JSON.stringify(rezultat.messages)).not.toContain(card);
    }
  });

  it("o valoare deja cunoscuta e mascata si cand e lipita de alte caractere", async () => {
    const model = new FakeToolCallingModel({
      toolCalls: [
        [{ name: "cautaClient", args: { idClient: "ionel.popescu" }, id: "c1" }],
        [{ name: "cautaClient", args: { idClient: "[ID_CARD_1]5" }, id: "c2" }],
        [],
      ],
    });
    const rezultat = await creeazaAgentAgentie({ model }).invoke(
      { messages: [{ role: "user", content: "cauta clientul ionel.popescu" }] },
      { configurable: { thread_id: "fir-lipit" } },
    );
    const tool = rezultat.messages.filter((m) => m.getType() === "tool").map((m) => String(m.content));

    expect(tool[1]).toContain("Nu exista clientul '[ID_CARD_1]5'.");
    expect(JSON.stringify(rezultat.messages)).not.toContain("4111 1111 1111 1111");
  });

  it("id-urile opace nu sunt detectate din nou ca email sau card", () => {
    expect(detectEmail("[ID_CARD_1] [ID_EMAIL_1] [ID_CARD_12]")).toEqual([]);
    expect(detecteazaCard("[ID_CARD_1] [ID_EMAIL_1] [ID_CARD_12]")).toEqual([]);
    expect(detecteazaCard("card: 3400 0000 0000 009")).toEqual([
      { text: "3400 0000 0000 009", start: 6, end: 24 },
    ]);
  });
});
