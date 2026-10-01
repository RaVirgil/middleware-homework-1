// src/raspunsuri.ts
//
// Raspunsurile la checklist. Fiecare linie din `dovezi` trebuie sa apara
// exact in consola capturata, altfel genereaza-output.ts se opreste.

export type Punct = {
  intrebare: string;
  script?: string;
  raspuns: string;
  dovezi: string[];
};

export const PUNCTE: Punct[] = [
  {
    intrebare:
      "Cand cautaClientSuport returneaza emailul, ce apare EFECTIV in ToolMessage-ul din istoric?",
    script: "checklist1",
    raspuns:
      "Emailul apare mascat in ToolMessage-ul din istoric: prima litera, apoi ***@ si domeniul. " +
      "Cardul nu e atins de middleware, pentru ca tool-ul intoarce deja doar ultimele 4 cifre.",
    dovezi: [
      "[tool] Client: Ana Radu | email: a***@example.com | plan: pro | card: **** **** **** 4242",
    ],
  },
  {
    intrebare:
      "Script cu FakeToolCallingModel care cere 4 tool call-uri la rand. Ce se intampla la al 4-lea?",
    script: "checklist2",
    raspuns:
      "Primele 3 apeluri se executa. Al 4-lea e blocat in afterModel, inainte sa ruleze tool-ul: " +
      "toolCallLimitMiddleware adauga un ToolMessage de eroare si un mesaj AI final, iar invoke() " +
      "se intoarce normal, fara exceptie.",
    dovezi: [
      "[tool] Tool call limit exceeded. Do not make additional tool calls.",
      "[ai] Tool call limit reached: run limit exceeded (4/3 calls).",
      "invoke() s-a intors normal, fara exceptie.",
    ],
  },
  {
    intrebare:
      'Daca cerinta reala e "clientul sa nu sune de 10 ori pentru aceeasi problema, in ORICATE ' +
      'conversatii separate", runLimit sau threadLimit?',
    raspuns:
      "Niciunul: runLimit numara apelurile de tool dintr-o singura rulare si se reseteaza la finalul " +
      "ei, iar threadLimit numara pe tot thread-ul, dar ambele contoare sunt stare a grafului salvata " +
      "per thread_id, fara store (node_modules/langchain/dist/agents/middleware/toolCallLimit.js:117-120, " +
      ":275-276, :360), deci o conversatie noua porneste de la zero (in consola, fir-B are " +
      "threadToolCallCount=1 dupa primul apel). Cerinta reala numara contactele CLIENTULUI despre " +
      "aceeasi problema peste conversatii, deci cere stare persistenta in afara thread-ului (un store " +
      "sau o tabela cheiata pe idClient + problema), nu un contor de tool call-uri. Am implementat cu " +
      "runLimit, care e suficient pentru cerinta 2 a managementului doar in interiorul unei singure " +
      "ture: runToolCallCount revine la {} dupa fiecare rulare, deci nu limiteaza nimic intre turele " +
      "aceleiasi conversatii si nici intre conversatii.",
    dovezi: [
      "[ai] Tool call limit reached: run limit exceeded (4/3 calls).",
      'dupa resume: 6 mesaje | tichete escaladate: 1 | runToolCallCount={} threadToolCallCount={"__all__":2}',
      'dupa invoke: 10 mesaje | intrerupere: escaladeazaTicket {"idTicket":"T-1","motiv":"client nemultumit"} | tichete escaladate: 1 | runToolCallCount={"__all__":1} threadToolCallCount={"__all__":3}',
      'dupa invoke: 4 mesaje | intrerupere: escaladeazaTicket {"idTicket":"T-1","motiv":"client nemultumit"} | tichete escaladate: 2 | runToolCallCount={"__all__":1} threadToolCallCount={"__all__":1}',
    ],
  },
  {
    intrebare: "(HITL) Rulati agentul FARA checkpointer, intentionat. Ce eroare exacta?",
    script: "checklist4",
    raspuns:
      "GraphValueError cu lc_error_code MISSING_CHECKPOINTER si mesajul exact " +
      "\"No checkpointer set\\n\\nTroubleshooting URL: " +
      "https://docs.langchain.com/oss/javascript/langgraph/MISSING_CHECKPOINTER/\". " +
      "Apare cand HITL cere aprobare pentru escaladeazaTicket (interrupt() nu are unde salva starea), " +
      "in afterModel, inainte de nodul de tool-uri, deci tichetul nu s-a escaladat.",
    dovezi: [
      "Eroare: GraphValueError",
      "lc_error_code: MISSING_CHECKPOINTER",
      "message: No checkpointer set",
      "Troubleshooting URL: https://docs.langchain.com/oss/javascript/langgraph/MISSING_CHECKPOINTER/",
      "Tichete escaladate: 0",
    ],
  },
  {
    intrebare:
      "(HITL) Rulati de doua ori acelasi flux, cu ACELASI thread_id o data si cu thread_id DIFERIT " +
      "a doua oara, dupa ce ati aprobat prima escaladare. Ce diferenta observati?",
    script: "checklist5",
    raspuns:
      "Acelasi thread_id (fir-A, rularea 2): agentul vede conversatia anterioara (10 mesaje dupa " +
      "invoke, nu 4, iar istoricul incepe cu mesajele din rularea 1), dar cere din nou aprobare, " +
      "pentru ca aprobarea tine de un singur interrupt, nu de tichet; dupa approve, tool-ul " +
      "ireversibil se executa din nou si T-1 apare a doua oara in array. thread_id diferit (fir-B): " +
      "istoric curat (4 mesaje, ca la rularea 1), contorul de thread porneste de la zero, o noua " +
      "cerere de aprobare, iar array-ul creste la 3, pentru ca traieste in afara conversatiei. " +
      "Checkpointer-ul si thread_id-ul delimiteaza memoria conversatiei, nu efectele; un tool " +
      "ireversibil are nevoie de idempotenta proprie.",
    dovezi: [
      'dupa invoke: 10 mesaje | intrerupere: escaladeazaTicket {"idTicket":"T-1","motiv":"client nemultumit"} | tichete escaladate: 1 | runToolCallCount={"__all__":1} threadToolCallCount={"__all__":3}',
      'dupa resume: 12 mesaje | tichete escaladate: 2 | runToolCallCount={} threadToolCallCount={"__all__":4}',
      'dupa invoke: 4 mesaje | intrerupere: escaladeazaTicket {"idTicket":"T-1","motiv":"client nemultumit"} | tichete escaladate: 2 | runToolCallCount={"__all__":1} threadToolCallCount={"__all__":1}',
      'dupa resume: 6 mesaje | tichete escaladate: 3 | runToolCallCount={} threadToolCallCount={"__all__":2}',
      "Tichete escaladate (3):",
    ],
  },
];
