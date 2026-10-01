import { beforeEach, describe, expect, it } from "vitest";
import { ruleaza } from "../../src/tema2/checklist4.js";
import { resetHarti } from "../../src/tema2/anonimizare-pii.js";
import { emailuriTrimise, resetEmailuriTrimise } from "../../src/tema2/agentie.js";

const fara = () => {};

describe("tema 2 · checklist 4 · HITL + restart intre pauza si aprobare", () => {
  beforeEach(() => {
    resetHarti();
    resetEmailuriTrimise();
  });

  it("pauza cere aprobare pentru trimiteEmailConfirmare, cu id-ul opac, inainte sa ruleze tool-ul", async () => {
    const { parteaA } = await ruleaza(fara);

    expect(parteaA.actiuniIntrerupte).toEqual(["trimiteEmailConfirmare"]);
    expect(parteaA.emailLaIntrerupere).toBe("[ID_EMAIL_1]");
    expect(parteaA.emailuriLaIntrerupere).toBe(0);
  });

  it("dupa restart (harta golita, checkpointer pastrat) tool-ul primeste id-ul opac", async () => {
    const { parteaA } = await ruleaza(fara);

    expect(parteaA.iduriInainteDeRestart).toBe(2);
    expect(parteaA.iduriDupaRestart).toBe(0);
    expect(emailuriTrimise[0].email).toBe("[ID_EMAIL_1]");
  });

  it("control: fara restart, aceeasi aprobare trimite emailul real", async () => {
    await ruleaza(fara, { restart: false });

    expect(emailuriTrimise[0].email).toBe("ionel.popescu@example.com");
  });

  it("procesul moare cu MemorySaver: resume pe un checkpointer nou nu arunca si nu face nimic", async () => {
    const { parteaB } = await ruleaza(fara);

    expect(parteaB.mesaje).toBe(0);
    expect(parteaB.intrerupere).toBe(false);
    expect(parteaB.emailuriLaIntrerupere).toBe(0);
    expect(parteaB.emailuriDupaResume).toBe(0);
  });
});
