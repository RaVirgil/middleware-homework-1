import { beforeEach, describe, expect, it } from "vitest";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createAgent, detectEmail, FakeToolCallingModel } from "langchain";
import { anonimizarePii, detecteazaCard, resetHarti } from "../../src/tema2/anonimizare-pii.js";

const ecou = tool(async ({ text }: { text: string }) => text, {
  name: "ecou",
  description: "Intoarce textul primit.",
  schema: z.object({ text: z.string() }),
});

async function mascheaza(fir: string, iesiri: string[]): Promise<string[]> {
  const model = new FakeToolCallingModel({
    toolCalls: [...iesiri.map((text, i) => [{ name: "ecou", args: { text }, id: `t${i}` }]), []],
  });
  const agent = createAgent({ model, tools: [ecou], middleware: [anonimizarePii()] });
  const rezultat = await agent.invoke(
    { messages: [{ role: "user", content: "ecou" }] },
    { configurable: { thread_id: fir } },
  );
  return rezultat.messages.filter((m) => m.getType() === "tool").map((m) => String(m.content));
}

describe("tema 2 · anonimizarePii · valori cunoscute lipite de alt text", () => {
  beforeEach(() => {
    resetHarti();
  });

  it("un card cunoscut lipit de un email nu lasa emailul in clar", async () => {
    const tool = await mascheaza("fir-card-email", [
      "card: 4111 1111 1111 1111 |",
      "4111 1111 1111 1111ion@ex.com",
    ]);

    expect(tool[1]).not.toContain("ion@ex.com");
    expect(detectEmail(tool[1])).toEqual([]);
  });

  it("un card nou lipit de un email cunoscut e mascat", async () => {
    const tool = await mascheaza("fir-email-card", ["a@b.ro", "a@b.ro4111 1111 1111 1111"]);

    expect(tool[1]).toBe("[ID_EMAIL_1][ID_CARD_1]");
  });

  it("un card nou lipit de un card cunoscut e mascat", async () => {
    const tool = await mascheaza("fir-card-card", [
      "4111 1111 1111 1111",
      "4111 1111 1111 11115555666677778888",
    ]);

    expect(tool[1]).toBe("[ID_CARD_1][ID_CARD_2]");
    expect(detecteazaCard(tool[1])).toEqual([]);
  });
});
