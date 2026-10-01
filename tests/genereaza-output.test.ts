import { describe, expect, it } from "vitest";
import { verificaDovezi } from "../src/genereaza-output.js";
import type { Punct } from "../src/raspunsuri.js";

const consola = new Map([
  ["checklist1", "[human] salut\n[ai] salut\n"],
  ["checklist2", "[tool] Client: Ana Radu | plan: pro\ninvoke() s-a intors normal.\n"],
]);

const punct = (script: string | undefined, dovezi: string[]): Punct => ({
  intrebare: "?",
  script,
  raspuns: "-",
  dovezi,
});

describe("verificaDovezi", () => {
  it("respinge o linie citata care apare doar in consola altui punct", () => {
    expect(() =>
      verificaDovezi([punct("checklist1", ["[tool] Client: Ana Radu | plan: pro"])], consola),
    ).toThrow("Checklist 1");
  });

  it("respinge o bucata de linie: linia citata trebuie sa fie o linie intreaga", () => {
    expect(() => verificaDovezi([punct("checklist2", ["Client: Ana Radu"])], consola)).toThrow(
      "Checklist 1",
    );
  });

  it("accepta linii intregi din consola proprie", () => {
    expect(() =>
      verificaDovezi([punct("checklist2", ["invoke() s-a intors normal."])], consola),
    ).not.toThrow();
  });

  it("un punct fara script poate cita din consola oricarui script", () => {
    expect(() =>
      verificaDovezi([punct(undefined, ["[ai] salut", "[tool] Client: Ana Radu | plan: pro"])], consola),
    ).not.toThrow();
  });
});
