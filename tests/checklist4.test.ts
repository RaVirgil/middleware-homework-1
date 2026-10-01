import { beforeEach, describe, expect, it } from "vitest";
import { ruleaza } from "../src/checklist4.js";
import { tichetEscaladate } from "../src/tools/suport.js";

const fara = () => {};

describe("checklist 4 · HITL fara checkpointer", () => {
  beforeEach(() => {
    tichetEscaladate.length = 0;
  });

  it("arunca MISSING_CHECKPOINTER si nu escaladeaza nimic", async () => {
    const eroare = await ruleaza(fara);

    expect(eroare.name).toBe("GraphValueError");
    expect(eroare.lc_error_code).toBe("MISSING_CHECKPOINTER");
    expect(eroare.message).toContain("No checkpointer set");
    expect(tichetEscaladate).toHaveLength(0);
  });
});
