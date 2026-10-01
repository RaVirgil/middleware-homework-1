// src/tema3/cost-guard.ts
//
// costGuard({ ieftin, scump }): la fiecare apel de model alege una din doua
// instante injectate, dupa ultima intrebare a omului. Ordinea: costGuard
// inaintea audit-ului in `middleware: [...]`, ca auditul sa vada modelul ales.

import { AIMessage, createMiddleware, HumanMessage, type BaseMessage } from "langchain";
import { RunnableBinding } from "@langchain/core/runnables";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type Pret = { intrare: number; iesire: number };

export type Rol = { model: BaseChatModel; nume: string; pret: Pret };

export type OptiuniCostGuard = { ieftin: Rol; scump: Rol; verbose?: boolean };

export type Alegere = {
  ruta: "SIMPLA" | "COMPLEXA";
  nume: string;
  tokenIntrare?: number;
  tokenIesire?: number;
  cost: number | "n/a";
};

// Cheiata pe AIMessage-ul intors: un audit pus inaintea costGuard afla aici modelul ales.
const alegeri = new WeakMap<AIMessage, Alegere>();

export function alegereaPentru(raspuns: AIMessage): Alegere | undefined {
  return alegeri.get(raspuns);
}

// Se aplica pe text fara diacritice, cu litere mici. Lookahead-urile scot "compartiment" si "explicit".
const CUVINTE_GRELE =
  /\bcompar(?!tim)|\banaliz|\bde ?ce\b|\bexplic(?!it)|\bplanific|\bitinerar|\brecoman[dz]|\bce(?:l|a|i|le) mai (?:bun|ieftin)|avantaj/;

const PRAG_LUNGIME = 120;

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Simpla = model ieftin. Textul gol nu e dovada de intrebare simpla, deci merge la scump. */
export function esteSimpla(text: string): boolean {
  if (text.trim() === "") return false;
  // Lungimea se masoara dupa normalizare, ca NFC si NFD sa numere la fel.
  const normalizat = fold(text);
  if (normalizat.length > PRAG_LUNGIME) return false;
  return !CUVINTE_GRELE.test(normalizat);
}

/** Doar partile text ale ultimului HumanMessage; imaginile nu intra in lungime sau regex. */
export function textulIntrebarii(mesaje: BaseMessage[]): string {
  for (let i = mesaje.length - 1; i >= 0; i--) {
    const m = mesaje[i];
    // Ca BaseMessage.text, dar cu spatiu intre parti, ca \b sa vada inceputul fiecarei parti.
    if (HumanMessage.isInstance(m)) {
      return m.contentBlocks
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join(" ");
    }
  }
  return "";
}

const areTooluri = (x: unknown) => Array.isArray(x) && x.length > 0;

// Conditiile din validateLLMHasNoBoundTools (langchain agents/utils.js:183-212), care nu e exportata.
function areTooluriLegate(model: object): boolean {
  if (RunnableBinding.isRunnableBinding(model)) {
    const { kwargs, config } = model as { kwargs?: { tools?: unknown }; config?: { tools?: unknown } };
    if (areTooluri(kwargs?.tools) || areTooluri(config?.tools)) return true;
  }
  return "tools" in model && areTooluri(model.tools);
}

// Ca _isChatModelWithBindTools si _simpleBindTools (langchain agents/utils.js:141-176, isBaseChatModel din
// agents/model.js): chat model cu bindTools, direct sau ca `bound` al unui RunnableBinding.
const eChatModelCuBindTools = (x: unknown) =>
  typeof x === "object" &&
  x !== null &&
  "invoke" in x &&
  typeof x.invoke === "function" &&
  "_streamResponseChunks" in x &&
  "bindTools" in x &&
  typeof x.bindTools === "function";

const legabil = (model: object) =>
  eChatModelCuBindTools(model) ||
  (RunnableBinding.isRunnableBinding(model) && eChatModelCuBindTools((model as { bound?: unknown }).bound));

const pretValid = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0;

// langchain verifica modelul abia cand e ales prima data; aici verificam la constructie.
function valideaza(eticheta: "ieftin" | "scump", rol: Rol) {
  if (rol == null) throw new Error(`costGuard: rolul ${eticheta} lipseste; da { model, nume, pret }.`);
  const { model, nume, pret } = rol;
  if (typeof model !== "object" || model === null) {
    throw new Error(`costGuard: ${eticheta}.model lipseste sau nu e un obiect (primit: ${typeof model}).`);
  }
  if (areTooluriLegate(model)) {
    throw new Error(
      `costGuard: ${eticheta}.model are deja tool-uri legate; da instanta nelegata, agentul leaga singur tool-urile.`,
    );
  }
  if (!legabil(model)) {
    throw new Error(
      `costGuard: ${eticheta}.model nu e un chat model cu bindTools (direct sau intr-un RunnableBinding), deci agentul nu ii poate lega tool-urile.`,
    );
  }
  if (typeof nume !== "string" || nume.trim() === "") throw new Error(`costGuard: ${eticheta}.nume lipseste.`);
  if (!pretValid(pret?.intrare) || !pretValid(pret?.iesire)) {
    throw new Error(`costGuard: ${eticheta}.pret trebuie sa fie { intrare, iesire }, numere finite >= 0 ($ / 1M tokeni).`);
  }
}

export function costGuard({ ieftin, scump, verbose = false }: OptiuniCostGuard) {
  valideaza("ieftin", ieftin);
  valideaza("scump", scump);

  return createMiddleware({
    name: "CostGuard",
    wrapModelCall: async (request, handler) => {
      const simpla = esteSimpla(textulIntrebarii(request.messages));
      const rol = simpla ? ieftin : scump;

      const raspuns = await handler({ ...request, model: rol.model });
      // Cu responseFormat, handler-ul intoarce { structuredResponse, messages: [AIMessage, ...] } (AgentNode.js:162, :371-380).
      const mesaj = AIMessage.isInstance(raspuns) ? raspuns : (raspuns as unknown as { messages: AIMessage[] }).messages[0];

      const usage = mesaj.usage_metadata;
      const alegere: Alegere = {
        ruta: simpla ? "SIMPLA" : "COMPLEXA",
        nume: rol.nume,
        tokenIntrare: usage?.input_tokens,
        tokenIesire: usage?.output_tokens,
        cost: usage
          ? (usage.input_tokens * rol.pret.intrare) / 1e6 + (usage.output_tokens * rol.pret.iesire) / 1e6
          : "n/a",
      };
      alegeri.set(mesaj, alegere);
      alegeri.set(raspuns, alegere);

      if (verbose) {
        const detalii = usage
          ? `${usage.input_tokens} in / ${usage.output_tokens} out | cost $${(alegere.cost as number).toFixed(6)}`
          : "fara usage_metadata | cost n/a";
        console.log(`[costGuard] ${alegere.ruta} → ${alegere.nume} | ${detalii}`);
      }
      return raspuns;
    },
  });
}
