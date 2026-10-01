// src/tema2/agentie.ts
//
// Tool-urile temei 2. cautaClient e copiat din curs (tools/agentie.ts) si
// intoarce cardul COMPLET; trimiteEmailConfirmare e doar pentru demo.

import { tool } from "@langchain/core/tools";
import { z } from "zod";

const CLIENTI: Record<
  string,
  { nume: string; email: string; card: string; oras: string }
> = {
  "ionel.popescu": {
    nume: "Ionel Popescu",
    email: "ionel.popescu@example.com",
    card: "4111 1111 1111 1111",
    oras: "Cluj-Napoca",
  },
  "maria.ionescu": {
    nume: "Maria Ionescu",
    email: "maria.ionescu@example.com",
    card: "5500 0000 0000 0004",
    oras: "Iasi",
  },
  "andrei.dumitru": {
    nume: "Andrei Dumitru",
    email: "andrei.dumitru@example.com",
    card: "3400 0000 0000 009",
    oras: "Timisoara",
  },
};

export const cautaClient = tool(
  async ({ idClient }: { idClient: string }) => {
    const c = CLIENTI[idClient.toLowerCase().trim()];
    if (!c) {
      return (
        `Nu exista clientul '${idClient}'. ` +
        `ID-uri valide: ${Object.keys(CLIENTI).join(", ")}.`
      );
    }
    return (
      `Client ${c.nume} | email: ${c.email} | card: ${c.card} | oras: ${c.oras}`
    );
  },
  {
    name: "cautaClient",
    description:
      "Cauta datele unui client dupa ID. Intoarce nume, email, card si oras. " +
      "Foloseste-l inainte de a face o rezervare, ca sa stii pe numele cui e. " +
      "Exemplu intrare: { idClient: 'ionel.popescu' }. " +
      "Exemplu iesire: 'Client Ionel Popescu | email: ... | card: ... | oras: Cluj-Napoca'.",
    schema: z.object({
      idClient: z
        .string()
        .describe(
          "ID-ul clientului, format 'prenume.nume', litere mici. " +
            "Ex: 'ionel.popescu'.",
        ),
    }),
  },
);

/** Emailurile trimise efectiv. Se verifica din afara conversatiei. */
export const emailuriTrimise: { email: string; mesaj: string }[] = [];

export function resetEmailuriTrimise(): void {
  emailuriTrimise.length = 0;
}

export const trimiteEmailConfirmare = tool(
  async ({ email, mesaj }: { email: string; mesaj: string }) => {
    emailuriTrimise.push({ email, mesaj });
    return `Email de confirmare trimis catre ${email}.`;
  },
  {
    name: "trimiteEmailConfirmare",
    description:
      "Trimite un email de confirmare unui client. " +
      "Exemplu intrare: { email: '[ID_EMAIL_1]', mesaj: 'Rezervarea este confirmata.' }. " +
      "Exemplu iesire: 'Email de confirmare trimis catre ...'.",
    schema: z.object({
      email: z.string().describe("Adresa clientului sau id-ul ei opac. Ex: '[ID_EMAIL_1]'."),
      mesaj: z.string().describe("Textul emailului. Ex: 'Rezervarea este confirmata.'."),
    }),
  },
);
