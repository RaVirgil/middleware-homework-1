import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { genereazaOutput } from "../src/genereaza-output.js";

const log = () => readFileSync(new URL("../output.log", import.meta.url), "utf8");

describe("output.log", () => {
  it("nu contine niciun email in clar", () => {
    const text = log();
    for (const email of ["ana.radu@example.com", "mihai.stan@firma.ro", "elena.dobre@corp.io"]) {
      expect(text).not.toContain(email);
    }
  });

  it("e la zi: regenerat acum, iese identic", () => {
    expect(log()).toBe(genereazaOutput());
  }, 120_000);

  it("nu e ignorat de git", () => {
    const r = spawnSync("git", ["check-ignore", "-q", "output.log"], {
      cwd: new URL("..", import.meta.url),
    });
    expect(r.status).toBe(1);
  });
});
