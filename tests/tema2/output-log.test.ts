import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { genereazaOutputTema2 } from "../../src/tema2/genereaza-output.js";

const log = () => readFileSync(new URL("../../output-tema2.log", import.meta.url), "utf8");

const LINIE_ARRAY =
  'emailuriTrimise (din afara conversatiei): [{"email":"ionel.popescu@example.com","mesaj":"Rezervarea este confirmata."}]';

describe("output-tema2.log", () => {
  it("emailul real al lui ionel apare doar pe linia array-ului populat de tool", () => {
    const linii = log()
      .split("\n")
      .filter((l) => l.includes("ionel.popescu@example.com"));

    expect(linii.length).toBeGreaterThan(0);
    for (const l of linii) expect(l.trim()).toBe(LINIE_ARRAY);
  });

  it("nu contine emailurile celorlalti clienti si niciun numar de card", () => {
    const text = log();
    for (const pii of [
      "maria.ionescu@example.com",
      "andrei.dumitru@example.com",
      "4111 1111 1111 1111",
      "5500 0000 0000 0004",
      "3400 0000 0000 009",
    ]) {
      expect(text).not.toContain(pii);
    }
  });

  it("e la zi: regenerat acum, iese identic", () => {
    expect(log()).toBe(genereazaOutputTema2());
  }, 120_000);

  it("nu e ignorat de git", () => {
    const r = spawnSync("git", ["check-ignore", "-q", "output-tema2.log"], {
      cwd: new URL("../..", import.meta.url),
    });
    expect(r.status).toBe(1);
  });
});
