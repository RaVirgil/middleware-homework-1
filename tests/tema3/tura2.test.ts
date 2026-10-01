import { describe, expect, it } from "vitest";
import { ruleaza } from "../../src/tema3/tura2.js";

const fara = () => {};

describe("tema 3 · tura 2 · dupa un tool call conteaza ultima intrebare a omului", () => {
  it("A: intrebare simpla, rezultat de tool lung (>120): ambele ture la ieftin; B: intrebare complexa, rezultat de tool scurt: ambele ture la scump", async () => {
    const { A, B } = await ruleaza(fara, false);

    expect([A.ieftin, A.scump]).toEqual([2, 0]);
    expect(A.tipuri).toEqual(["human", "ai", "tool", "ai"]);
    expect(A.lungimeTool).toBeGreaterThan(120);
    expect([B.ieftin, B.scump]).toEqual([0, 2]);
    expect(B.tipuri).toEqual(["human", "ai", "tool", "ai"]);
    expect(B.lungimeTool).toBeLessThan(10);
  });
});
