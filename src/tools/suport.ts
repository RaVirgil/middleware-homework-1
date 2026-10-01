// src/tools/suport.ts
//
// Tool-urile agentului de suport. Datele sunt FALSE, in memorie.

import { tool } from "@langchain/core/tools";
import { z } from "zod";

// «Baza de date» de clienti. Email-uri diferite, pe domenii diferite, ca sa se
// vada in consola ca masca pastreaza domeniul.
const CLIENTI: Record<
  string,
  { nume: string; email: string; plan: "free" | "pro" | "enterprise"; ultimele4CifreCard: string }
> = {
  "cl-101": {
    nume: "Ana Radu",
    email: "ana.radu@example.com",
    plan: "pro",
    ultimele4CifreCard: "4242",
  },
  "cl-102": {
    nume: "Mihai Stan",
    email: "mihai.stan@firma.ro",
    plan: "free",
    ultimele4CifreCard: "1881",
  },
  "cl-103": {
    nume: "Elena Dobre",
    email: "elena.dobre@corp.io",
    plan: "enterprise",
    ultimele4CifreCard: "0005",
  },
};

export const cautaClientSuport = tool(
  async ({ idClient }: { idClient: string }) => {
    const c = CLIENTI[idClient.toLowerCase().trim()];
    if (!c) {
      return (
        `Nu exista clientul '${idClient}'. ` +
        `ID-uri valide: ${Object.keys(CLIENTI).join(", ")}.`
      );
    }
    // Cardul iese deja doar cu ultimele 4 cifre: tool-ul nu scoate PII in clar.
    return (
      `Client: ${c.nume} | email: ${c.email} | plan: ${c.plan} | ` +
      `card: **** **** **** ${c.ultimele4CifreCard}`
    );
  },
  {
    name: "cautaClientSuport",
    description:
      "Cauta datele unui client dupa ID. Intoarce nume, email, plan si ultimele 4 cifre ale cardului. " +
      "Exemplu intrare: { idClient: 'cl-101' }. " +
      "Exemplu iesire: 'Client: Ana Radu | email: ... | plan: pro | card: **** **** **** 4242'.",
    schema: z.object({
      idClient: z
        .string()
        .describe("ID-ul clientului, format 'cl-NNN'. Ex: 'cl-101'."),
    }),
  },
);

/** Tichetele escaladate efectiv. Se verifica din afara conversatiei. */
export const tichetEscaladate: string[] = [];

export const escaladeazaTicket = tool(
  async ({ idTicket, motiv }: { idTicket: string; motiv: string }) => {
    // EFECTUL IREVERSIBIL. Intr-un sistem real aici ai deschide un caz la un om.
    tichetEscaladate.push(`${idTicket}: escaladat catre om (${motiv})`);
    return `Tichetul ${idTicket} a fost escaladat catre om. Motiv: ${motiv}.`;
  },
  {
    name: "escaladeazaTicket",
    description:
      "ESCALADEAZA EFECTIV un tichet catre un om. Actiune ireversibila. " +
      "Cheam-o doar daca problema e prea complicata sau clientul e nemultumit. " +
      "Exemplu intrare: { idTicket: 'T-1', motiv: 'client nemultumit' }. " +
      "Exemplu iesire: 'Tichetul T-1 a fost escaladat catre om. Motiv: client nemultumit.'.",
    schema: z.object({
      idTicket: z.string().describe("ID-ul tichetului. Ex: 'T-1'."),
      motiv: z.string().describe("De ce se escaladeaza. Ex: 'client nemultumit'."),
    }),
  },
);
