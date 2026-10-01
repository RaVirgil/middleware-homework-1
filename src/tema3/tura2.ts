// src/tema3/tura2.ts
//
// Rulare: pnpm t3:tura2
//
// Punctul 2: in tura 2 ultimul mesaj e un ToolMessage. A: intrebare simpla,
// rezultat de tool lung. B: intrebare complexa, rezultat de tool scurt.

import { AIMessage, createAgent, fakeModel, tool } from "langchain";
import { z } from "zod";
import { pathToFileURL } from "node:url";
import { garda } from "./agent.js";

const programRestaurant = tool(
  async () =>
    "Restaurantul hotelului e deschis zilnic intre 07:00 si 23:00; micul dejun se serveste intre " +
    "07:00 si 10:30, iar room service-ul functioneaza non-stop.",
  { name: "programRestaurant", description: "Programul restaurantului hotelului.", schema: z.object({}) },
);

const disponibilitate = tool(async () => "da", {
  name: "disponibilitate",
  description: "Spune daca mai sunt camere libere.",
  schema: z.object({}),
});

// Fiecare model raspunde in tura 1 cu un tool call si in tura 2 fara; coada goala arunca.
// Mesajele n-au id: respondWithTools pune id-ul = indexul apelului, iar doua modele s-ar suprascrie in state.
const modelCuTool = (numeTool: string) =>
  fakeModel()
    .respond(new AIMessage({ content: "", tool_calls: [{ name: numeTool, args: {}, id: `${numeTool}-1` }] }))
    .respond(new AIMessage({ content: "gata" }));

async function rulare(log: (...args: unknown[]) => void, verbose: boolean, intrebare: string, numeTool: string) {
  const ieftin = modelCuTool(numeTool);
  const scump = modelCuTool(numeTool);
  const agent = createAgent({
    model: scump,
    tools: [programRestaurant, disponibilitate],
    middleware: [garda(ieftin, scump, verbose)],
  });

  log(`intrebare: ${intrebare}`);
  const { messages } = await agent.invoke({ messages: [{ role: "user", content: intrebare }] });
  const tipuri = messages.map((m) => m.getType());
  const lungimeTool = String(messages.find((m) => m.getType() === "tool")?.content).length;
  log(`mesaje: ${tipuri.join(" > ")} | rezultat tool: ${lungimeTool} caractere`);
  log(`apeluri: ieftin=${ieftin.callCount} scump=${scump.callCount}`);
  return { tipuri, lungimeTool, ieftin: ieftin.callCount, scump: scump.callCount };
}

export async function ruleaza(log: (...args: unknown[]) => void = console.log, verbose = true) {
  log("=== A: intrebare simpla, rezultat de tool lung ===");
  const A = await rulare(log, verbose, "La ce ora se deschide restaurantul?", "programRestaurant");
  log("\n=== B: intrebare complexa, rezultat de tool scurt ===");
  const B = await rulare(log, verbose, "Recomanda-mi o camera pentru o familie cu doi copii", "disponibilitate");
  return { A, B };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ruleaza();
}
