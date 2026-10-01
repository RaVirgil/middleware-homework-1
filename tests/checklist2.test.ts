import { describe, expect, it } from "vitest";
import { ToolMessage } from "@langchain/core/messages";
import { ruleaza } from "../src/checklist2.js";

const fara = () => {};

describe("checklist 2 · toolCallLimitMiddleware runLimit 3, exitBehavior end", () => {
  it("al 4-lea tool call opreste rularea elegant, fara exceptie", async () => {
    const mesaje = await ruleaza(fara);

    const executate = mesaje.filter(
      (m) => m.getType() === "tool" && String(m.content).startsWith("Client: "),
    );
    expect(executate).toHaveLength(3);

    const penultimul = mesaje[mesaje.length - 2];
    expect(ToolMessage.isInstance(penultimul)).toBe(true);
    expect((penultimul as ToolMessage).status).toBe("error");
    expect(penultimul.content).toBe("Tool call limit exceeded. Do not make additional tool calls.");

    const ultimul = mesaje[mesaje.length - 1];
    expect(ultimul.getType()).toBe("ai");
    expect(ultimul.content).toBe("Tool call limit reached: run limit exceeded (4/3 calls).");
  });
});
