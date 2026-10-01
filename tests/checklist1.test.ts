import { describe, expect, it } from "vitest";
import { ruleaza } from "../src/checklist1.js";
import { cautaClientSuport } from "../src/tools/suport.js";

const fara = () => {};

describe("checklist 1 · piiMiddleware pe rezultatul lui cautaClientSuport", () => {
  it("ToolMessage-ul din istoric are emailul mascat", async () => {
    const mesaje = await ruleaza(fara);
    const tool = mesaje.filter((m) => m.getType() === "tool");

    expect(tool).toHaveLength(1);
    expect(tool[0].content).toBe(
      "Client: Ana Radu | email: a***@example.com | plan: pro | card: **** **** **** 4242",
    );
  });

  it("emailul in clar nu apare in niciun mesaj", async () => {
    const mesaje = await ruleaza(fara);
    for (const m of mesaje) {
      expect(JSON.stringify(m.content)).not.toContain("ana.radu@example.com");
    }
  });

  it("un id necunoscut intoarce un text cu id-urile valide", async () => {
    const text = await cautaClientSuport.invoke({ idClient: "cl-999" });
    expect(text).toContain("cl-999");
    expect(text).toContain("cl-101, cl-102, cl-103");
  });
});
