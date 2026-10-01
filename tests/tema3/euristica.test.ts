import { describe, expect, it } from "vitest";
import { AIMessage, createAgent, HumanMessage, ToolMessage } from "langchain";
import { esteSimpla, textulIntrebarii } from "../../src/tema3/cost-guard.js";
import { LUNGA, ruleaza } from "../../src/tema3/euristica.js";
import { garda, modelFals } from "../../src/tema3/agent.js";

const fara = () => {};

const imagine = { type: "image_url", image_url: { url: `data:image/png;base64,${"A".repeat(500)}` } };

describe("tema 3 · euristica · diacritice, flexiuni, limite de cuvant", () => {
  it("textul doar din spatii nu e dovada de intrebare simpla", () => {
    expect(esteSimpla("   ")).toBe(false);
  });

  it("intrebarea lunga are peste 120 de caractere si niciun cuvant greu", () => {
    expect(LUNGA.length).toBeGreaterThan(120);
    expect(esteSimpla(LUNGA.slice(0, 120))).toBe(true);
  });

  it("pragul de 120 se masoara pe textul normalizat: forma NFC si forma NFD a aceleiasi intrebari merg la fel", () => {
    const nfc =
      "Buna ziua, am o rezervare pentru doua persoane si as vrea sa stiu la ce oră pot face check-in și dacă " +
      "parcarea e gratis.";
    const nfd = nfc.normalize("NFD");

    expect([nfc.length, nfd.length]).toEqual([120, 123]);
    expect(esteSimpla(nfd)).toBe(esteSimpla(nfc));
    expect(esteSimpla(nfc)).toBe(true);
  });

  it("tabelul scriptului: coloana tema3 = asteptat pe fiecare rand; regexul cursului greseste pe randurile stiute", async () => {
    const randuri = await ruleaza(fara);

    for (const r of randuri) expect(r.tema3, r.intrebare).toBe(r.asteptat);
    const gresiteCurs = randuri.filter((r) => r.curs !== r.asteptat).map((r) => r.intrebare);
    expect(gresiteCurs).toEqual(
      expect.arrayContaining([
        "explică",
        "Explică-mi diferența",
        "Ce recomanzi?",
        "cea mai bună cameră",
        "Vreau un compartiment de tren",
        "Am nevoie de cearceafuri",
        '""',
      ]),
    );
  });
});

describe("tema 3 · extragerea textului din ultimul HumanMessage", () => {
  it("continut multimodal: conteaza doar partile text, imaginea nu intra in lungime sau regex", () => {
    const mesaje = [new HumanMessage({ content: [{ type: "text", text: "Cat e ceasul in Tokyo?" }, imagine] })];

    expect(textulIntrebarii(mesaje)).toBe("Cat e ceasul in Tokyo?");
    expect(esteSimpla(textulIntrebarii(mesaje))).toBe(true);
  });

  it("parti text separate de o imagine: cuvantul greu de la inceputul partii a doua tot se prinde", () => {
    const mesaje = [
      new HumanMessage({
        content: [{ type: "text", text: "Uite poza" }, imagine, { type: "text", text: "explica-mi ce vezi" }],
      }),
    ];

    expect(esteSimpla(textulIntrebarii(mesaje))).toBe(false);
  });

  it("doar imagine, fara text: ruta scump", async () => {
    const ieftin = modelFals(1, "ieftin");
    const scump = modelFals(1, "scump");
    const agent = createAgent({ model: scump, tools: [], middleware: [garda(ieftin, scump)] });

    await agent.invoke({ messages: [new HumanMessage({ content: [imagine] })] });

    expect([ieftin.callCount, scump.callCount]).toEqual([0, 1]);
  });

  it("fara niciun HumanMessage: text gol, deci scump", () => {
    const mesaje = [new AIMessage("Buna!"), new ToolMessage({ content: "ok", tool_call_id: "t1" })];

    expect(textulIntrebarii(mesaje)).toBe("");
    expect(esteSimpla(textulIntrebarii(mesaje))).toBe(false);
  });
});
