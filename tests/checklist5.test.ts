import { beforeEach, describe, expect, it } from "vitest";
import { AIMessage } from "@langchain/core/messages";
import { ruleaza } from "../src/checklist5.js";
import { tichetEscaladate } from "../src/tools/suport.js";

const fara = () => {};

describe("checklist 5 · acelasi thread_id vs thread_id diferit, dupa aprobare", () => {
  beforeEach(() => {
    tichetEscaladate.length = 0;
  });

  it("fiecare rulare cere aprobare si fiecare aprobare escaladeaza din nou", async () => {
    const { rulari } = await ruleaza(fara);

    expect(rulari.map((r) => r.thread_id)).toEqual(["fir-A", "fir-A", "fir-B"]);
    expect(rulari.map((r) => r.actiuniIntrerupte)).toEqual([
      ["escaladeazaTicket"],
      ["escaladeazaTicket"],
      ["escaladeazaTicket"],
    ]);
    expect(rulari.map((r) => r.escaladariLaIntrerupere)).toEqual([0, 1, 2]);
    expect(rulari.map((r) => r.escaladariDupaResume)).toEqual([1, 2, 3]);
    expect(tichetEscaladate).toHaveLength(3);
  });

  it("pe fir-A istoricul creste, iar fir-B porneste de la zero", async () => {
    const { rulari } = await ruleaza(fara);
    const [a1, a2, b] = rulari;

    expect(a1.mesajeDupaInvoke).toBeLessThan(a1.mesajeDupaResume);
    expect(a1.mesajeDupaResume).toBeLessThan(a2.mesajeDupaInvoke);
    expect(a2.mesajeDupaInvoke).toBeLessThan(a2.mesajeDupaResume);
    expect(b.mesajeDupaInvoke).toBe(a1.mesajeDupaInvoke);
    expect(b.mesajeDupaResume).toBe(a1.mesajeDupaResume);
  });

  it("id-urile mesajelor AI de pe fir-A sunt unice", async () => {
    const { mesajeFirA } = await ruleaza(fara);
    const ids = mesajeFirA.filter((m) => AIMessage.isInstance(m)).map((m) => m.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
