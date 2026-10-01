// src/tema2/anonimizare-pii.ts
//
// anonimizarePii(): un singur hook, wrapToolCall. Inainte de tool, id-urile opace
// cunoscute din argumente devin valorile reale; dupa tool, emailurile si cardurile
// din rezultat devin id-uri opace, acelasi id pentru aceeasi valoare.

import { createMiddleware, detectEmail, ToolInvocationError, type PIIMatch } from "langchain";
import { ToolMessage } from "@langchain/core/messages";

type Tip = "EMAIL" | "CARD";

type HartaFir = {
  valori: Map<string, string>;
  iduri: Map<string, string>;
  contor: Record<Tip, number>;
};

// La nivel de modul (nu in stateSchema): toate instantele middleware-ului o impart, cheiata pe thread_id.
const harti = new Map<string, HartaFir>();

// Invocarile fara thread_id impart toate aceasta harta.
const FIR_IMPLICIT = "__fara_thread_id__";

const ID_OPAC = /\[ID_(?:EMAIL|CARD)_\d+\]/g;

// Format 4-4-4-(3|4), cu spatiu sau cratima; fara Luhn, deci prinde orice numar grupat asa.
const CARD = /\b(?:\d{4}[ -]?){3}\d{3,4}\b/g;

export function resetHarti(): void {
  harti.clear();
}

/** Id-urile opace dintr-un fir, niciodata valorile reale. */
export function iduriDinFir(fir: string): string[] {
  return [...(harti.get(fir)?.valori.keys() ?? [])];
}

export function detecteazaCard(text: string): PIIMatch[] {
  return [...text.matchAll(CARD)].map((m) => ({ text: m[0], start: m.index, end: m.index + m[0].length }));
}

function idPentru(h: HartaFir, tip: Tip, valoare: string): string {
  let id = h.iduri.get(valoare);
  if (!id) {
    id = `[ID_${tip}_${++h.contor[tip]}]`;
    h.iduri.set(valoare, id);
    h.valori.set(id, valoare);
  }
  return id;
}

function anonimizeaza(h: HartaFir, text: string): string {
  for (const [tip, detecteaza] of [
    ["EMAIL", detectEmail],
    ["CARD", detecteazaCard],
  ] as const) {
    for (const m of detecteaza(text)) idPentru(h, tip, m.text);
    // Valorile cunoscute se inlocuiesc si cand sunt lipite de alt text: intai emailurile, apoi cardurile,
    // fiecare grup cel mai lung primul; un email poate contine cifre de card, un card nu contine email.
    const rang = (id: string) => (id.startsWith("[ID_EMAIL_") ? 0 : 1);
    for (const [valoare, id] of [...h.iduri].sort(([a, ia], [b, ib]) => rang(ia) - rang(ib) || b.length - a.length)) {
      text = text.replaceAll(valoare, id);
    }
  }
  return text;
}

export function anonimizarePii() {
  return createMiddleware({
    name: "AnonimizarePii",
    wrapToolCall: async (request, handler) => {
      const fir = request.runtime.configurable?.thread_id ?? FIR_IMPLICIT;

      const valori = harti.get(fir)?.valori;
      const args = Object.fromEntries(
        Object.entries(request.toolCall.args).map(([k, v]) => [
          k,
          typeof v === "string" ? v.replace(ID_OPAC, (id) => valori?.get(id) ?? id) : v,
        ]),
      );

      let rezultat;
      try {
        rezultat = await handler({ ...request, toolCall: { ...request.toolCall, args } });
      } catch (e) {
        // Mesajul erorii de validare contine argumentele dezanonimizate; il mascam ca pe un rezultat.
        if (!ToolInvocationError.isInstance(e)) throw e;
        rezultat = new ToolMessage({
          content: e.message,
          tool_call_id: request.toolCall.id!,
          name: request.toolCall.name,
          status: "error",
        });
      }
      if (!ToolMessage.isInstance(rezultat) || typeof rezultat.content !== "string") return rezultat;

      // Fara await de aici pana la return: apelurile paralele nu pot aloca acelasi id de doua ori.
      let h = harti.get(fir);
      if (!h) {
        h = { valori: new Map(), iduri: new Map(), contor: { EMAIL: 0, CARD: 0 } };
        harti.set(fir, h);
      }
      return new ToolMessage({
        content: anonimizeaza(h, rezultat.content),
        tool_call_id: rezultat.tool_call_id,
        name: rezultat.name,
        id: rezultat.id,
        status: rezultat.status,
        artifact: rezultat.artifact,
      });
    },
  });
}
