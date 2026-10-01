import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { genereazaOutputTema3 } from "../../src/tema3/genereaza-output.js";
import { PUNCTE_TEMA3 } from "../../src/tema3/raspunsuri.js";

const log = () => readFileSync(new URL("../../output-tema3.log", import.meta.url), "utf8");

describe("output-tema3.log", () => {
  it("are 5 puncte, fiecare cu scriptul lui t3:* si cel putin o linie citata", () => {
    expect(PUNCTE_TEMA3.map((p) => p.script)).toEqual([
      "t3:rutare",
      "t3:tura2",
      "t3:euristica",
      "t3:configurare",
      "t3:cost",
    ]);
    for (const p of PUNCTE_TEMA3) expect(p.dovezi.length).toBeGreaterThan(0);
  });

  it("e la zi: regenerat acum, iese identic", () => {
    expect(log()).toBe(genereazaOutputTema3());
  }, 120_000);

  it("nu e ignorat de git", () => {
    const r = spawnSync("git", ["check-ignore", "-q", "output-tema3.log"], {
      cwd: new URL("../..", import.meta.url),
    });
    expect(r.status).toBe(1);
  });
});
