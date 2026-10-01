// src/tema2/raspunsuri.ts
//
// Raspunsurile la checklist-ul temei 2. Fiecare linie din `dovezi` trebuie sa
// apara exact in consola scriptului propriu, altfel genereaza-output.ts se opreste.

import type { Punct } from "../raspunsuri.js";

export const PUNCTE_TEMA2: Punct[] = [
  {
    intrebare: "Ce apare EFECTIV in ToolMessage-ul lui cautaClient?",
    script: "t2:checklist12",
    raspuns:
      "Id-uri opace: emailul apare ca [ID_EMAIL_1], iar cardul complet ca [ID_CARD_1]. anonimizarePii " +
      "rescrie ToolMessage-ul in wrapToolCall, dupa handler si inainte sa intre in state, deci nici " +
      "istoricul, nici modelul nu vad valorile reale. Modelul fals isi copiaza intrarea in mesajul AI " +
      "(node_modules/langchain/dist/agents/tests/utils.js:52-62), iar liniile [ai] de dupa cautare contin " +
      "tot [ID_EMAIL_1] si [ID_CARD_1] (prima linie [ai], dinaintea tool-ului, nu are inca niciun id).",
    dovezi: [
      "[tool] Client Ionel Popescu | email: [ID_EMAIL_1] | card: [ID_CARD_1] | oras: Cluj-Napoca",
      "[ai] cauta clientul ionel.popescu si trimite-i confirmarea-cauta clientul ionel.popescu si trimite-i confirmarea-Client Ionel Popescu | email: [ID_EMAIL_1] | card: [ID_CARD_1] | oras: Cluj-Napoca",
    ],
  },
  {
    intrebare:
      "Verificati DIN AFARA conversatiei (array-ul populat de trimiteEmailConfirmare) ce email a primit " +
      "EFECTIV tool-ul.",
    script: "t2:checklist12",
    raspuns:
      "Adresa reala. Modelul a cerut trimiteEmailConfirmare cu email [ID_EMAIL_1], scris de mana in " +
      "tura 2; wrapToolCall a inlocuit id-ul cu valoarea din harta firului inainte de handler, intr-un " +
      "request nou ({ ...request, toolCall: { ...request.toolCall, args } }), fara sa modifice " +
      "tool_calls din mesajul AI. Array-ul emailuriTrimise e populat chiar de tool, deci arata ce a " +
      "primit efectiv. Raspunsul tool-ului contine adresa reala si e mascat la loc, deci ToolMessage-ul " +
      "din istoric arata tot [ID_EMAIL_1].",
    dovezi: [
      'emailuriTrimise (din afara conversatiei): [{"email":"ionel.popescu@example.com","mesaj":"Rezervarea este confirmata."}]',
      "[tool] Email de confirmare trimis catre [ID_EMAIL_1].",
    ],
  },
  {
    intrebare:
      "Daca cereti clientul 'ionel.popescu' de DOUA ori in aceeasi conversatie, primeste acelasi ID opac " +
      "sau doua ID-uri diferite? Ce ati scrie in cod ca sa garantati raspunsul corect?",
    script: "t2:checklist3",
    raspuns:
      "Acelasi id. In fir-A, ambele cautari ale lui ionel.popescu dau aceeasi linie [tool], cu " +
      "[ID_EMAIL_1] si [ID_CARD_1], iar harta firului are doar aceste doua id-uri. Garantia din cod: " +
      "pe fiecare fir tinem si harta inversa valoare -> id; pentru fiecare valoare gasita in rezultat " +
      "cautam intai in ea si alocam un id nou (contorul tipului + 1) doar daca valoarea nu exista, iar " +
      "alocarea scrie ambele directii in acelasi bloc sincron (idPentru, src/tema2/anonimizare-pii.ts:42-50). " +
      "Intre handler si return nu exista niciun await (src/tema2/anonimizare-pii.ts:101), ceea ce conteaza " +
      "la apeluri paralele: fiecare tool call e un Send separat " +
      "(node_modules/langchain/dist/agents/ReactAgent.js:394-397, " +
      "node_modules/langchain/dist/agents/nodes/ToolNode.js:315-317), iar wrapper-ele se intrepatrund " +
      "doar la await, deci doua apeluri nu pot aloca doua id-uri pentru aceeasi valoare. Totul e cheiat " +
      "pe thread_id: in fir-B, maria.ionescu primeste tot [ID_EMAIL_1] / [ID_CARD_1], in harta ei. Din " +
      "investigatie, nu din aceasta consola: la apeluri paralele in acelasi mesaj AI, numerotarea urmeaza " +
      "ordinea in care se termina tool-urile, dar aceeasi valoare tot primeste un singur id.",
    dovezi: [
      "[tool] Client Ionel Popescu | email: [ID_EMAIL_1] | card: [ID_CARD_1] | oras: Cluj-Napoca",
      "id-uri in harta fir-A: [ID_EMAIL_1], [ID_CARD_1]",
      "[tool] Client Maria Ionescu | email: [ID_EMAIL_1] | card: [ID_CARD_1] | oras: Iasi",
      "id-uri in harta fir-B: [ID_EMAIL_1], [ID_CARD_1]",
    ],
  },
  {
    intrebare:
      "Ce se intampla cu harta din memorie daca middleware-ul ruleaza alaturi de humanInTheLoopMiddleware, " +
      "iar procesul moare intre oprirea la aprobare si aprobare? Legati raspunsul de checkpointer si thread_id.",
    script: "t2:checklist4",
    raspuns:
      "humanInTheLoopMiddleware are doar afterModel (node_modules/langchain/dist/agents/middleware/hitl.js:411-416), " +
      "deci se opreste dupa model, inainte sa ruleze vreun tool (emailuri trimise: 0 la intrerupere). " +
      "Checkpointer-ul salveaza starea grafului pe thread_id, inclusiv mesajul AI cu id-ul OPAC in " +
      "tool_calls: cererea de aprobare arata [ID_EMAIL_1], deci nici omul care aproba nu vede adresa. " +
      "Harta NU e in checkpoint: e o variabila de modul si moare cu procesul. " +
      "(1) Cu MemorySaver, procesul mort pierde si checkpoint-ul, si harta. SIMULAT in partea B cu un " +
      "MemorySaver nou in acelasi proces: aprobarea trimisa cu acelasi thread_id nu arunca si nu face " +
      "nimic: 0 mesaje, nicio intrerupere, tool-ul nu ruleaza (emailuri trimise in B: 0). Comportamentul e din consola; ramura exacta din pregel e " +
      "urmarita doar partial: node_modules/@langchain/langgraph/dist/pregel/loop.js:192-204 nu trateaza " +
      "rularea ca resume cand checkpoint-ul nu are versiuni de canal, iar :668 arunca doar cand nu exista " +
      "deloc checkpointer. " +
      "(2) Cu un checkpointer durabil (Postgres, Sqlite), SIMULAT aici cu acelasi MemorySaver si un agent " +
      "nou, nu rulat pe Postgres: intreruperea supravietuieste si resume-ul ruleaza nodul de tool-uri cu " +
      "acelasi thread_id (node_modules/langchain/dist/agents/nodes/ToolNode.js:185-193), dar harta lui " +
      "fir-hitl e goala (2 id-uri inainte, 0 dupa). Dezanonimizarea nu gaseste nimic, iar tool-ul primeste " +
      "textul literal [ID_EMAIL_1], fara nicio eroare (partea A). " +
      "Mai rau: si contorul firului porneste de la zero, deci urmatoarea valoare noua din acelasi fir ar " +
      "primi din nou [ID_EMAIL_1], iar un \"trimite la [ID_EMAIL_1]\" cerut dupa acea alocare ar ajunge la " +
      "ALT client. Asta rezulta din cod (o harta goala aloca de la 1, ca fir-B la checklist 3) si din " +
      "investigatie, nu din consola acestui script. " +
      "Remediu: harta trebuie persistata impreuna cu firul, langa checkpoint (un store cheiat pe thread_id, " +
      "prin runtime.store, sau in starea grafului); id-urile sa nu fie refolosibile (aleatoare sau hash), " +
      "iar un id necunoscut sa opreasca actiunea (fail closed), de exemplu prin validarea formatului " +
      "emailului in tool.",
    dovezi: [
      'dupa invoke: intrerupere: trimiteEmailConfirmare {"email":"[ID_EMAIL_1]","mesaj":"Rezervarea este confirmata."} | emailuri trimise: 0',
      "id-uri in harta fir-hitl: 2",
      "id-uri in harta fir-hitl: 0",
      'emailuriTrimise (din afara conversatiei): [{"email":"[ID_EMAIL_1]","mesaj":"Rezervarea este confirmata."}]',
      "dupa resume: 0 mesaje | intrerupere: nu | emailuri trimise in B: 0",
    ],
  },
];
