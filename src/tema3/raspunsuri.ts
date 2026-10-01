// src/tema3/raspunsuri.ts
//
// Raspunsurile temei 3. Fiecare linie din `dovezi` trebuie sa apara exact in
// consola scriptului propriu, altfel genereaza-output.ts se opreste.

import type { Punct } from "../raspunsuri.js";

export const PUNCTE_TEMA3: Punct[] = [
  {
    intrebare:
      "Reparati cost-guard.ts ca sa mearga cu 2 modele, de ex. un haiku ieftin si un gpt scump, in functie " +
      "de intrebare: intrebarea simpla ajunge la modelul ieftin, cea complexa la cel scump?",
    script: "t3:rutare",
    raspuns:
      "Da. Onest: haiku ieftin + gpt scump mergea si la curs, dar doar prin env (LLM_PROVIDER=openai, " +
      "OPENAI_MODEL, LLM_PROVIDER_IEFTIN=anthropic, ANTHROPIC_MODEL) si cu ambele chei prezente la import. " +
      "Defectul de baza e ca modelul se alege dupa PROVIDER, nu dupa model: createModel nu primeste nume de " +
      "model (agenticai-lab9middleware/src/lib/llm.ts:126-128), fiecare provider are o singura variabila de " +
      "model (llm.ts:215, :241), iar la provideri egali se refoloseste aceeasi instanta " +
      "(src/middlew/middleware/cost-guard.ts:97-101). Deci haiku + sonnet sau gpt-4o-mini + gpt-5 nu se pot " +
      "exprima, desi comentariul din fisier vinde exact \"haiku vs sonnet ~3x\". Tot de aici vine si crash-ul " +
      "lenes la o greseala de tipar (punctul 4). Reparatia (src/tema3/cost-guard.ts): costGuard primeste doua " +
      "INSTANTE, { ieftin: { model, nume, pret }, scump: { model, nume, pret }, verbose? }, fara citiri din " +
      "env si fara constructie de provideri. Constructia trece la apelant, care stie deja providerul, modelul " +
      "si cheile; garda devine agnostica fata de provider (merg si doua modele de la acelasi provider), se " +
      "testeaza cu fake-uri si isi poate valida modelele la constructie. Acelasi tipar ca " +
      "modelFallbackMiddleware din langchain, care primeste instante " +
      "(node_modules/langchain/dist/agents/middleware/modelFallback.js:51). Scriptul foloseste doua fakeModel; " +
      "instanta scumpa e si modelul agentului, deci exista un singur client scump (la curs, demo5-custom.ts:36 " +
      "si cost-guard.ts:96 construiau doi), iar daca scoti garda agentul ramane pe modelul scump. " +
      "Logul e opt-in (verbose, implicit false) si numeste modelul, nu providerul. " +
      "Cu modele reale (nefacut aici, doar text): instalezi @langchain/anthropic si @langchain/openai, setezi " +
      "ANTHROPIC_API_KEY si OPENAI_API_KEY, construiesti un ChatAnthropic cu model claude-haiku-4-5 si un " +
      "ChatOpenAI cu model gpt-x, le dai lui costGuard cu numele si preturile lor pe 1M tokeni, dai instanta " +
      "scumpa si ca model in createAgent si pui costGuard inaintea audit-ului in middleware. Doua instante " +
      "ChatAnthropic (haiku si sonnet) merg la fel. Nu lega tool-uri pe ele: le leaga agentul.",
    dovezi: [
      "[costGuard] SIMPLA → claude-haiku-4-5 | 100 in / 20 out | cost $0.000200",
      "apeluri: ieftin=1 scump=0",
      "intrebare: Explică-mi diferența dintre camera standard și cea superioară",
      "[costGuard] COMPLEXA → gpt-x | 100 in / 20 out | cost $0.001800",
      "apeluri: ieftin=0 scump=1",
    ],
  },
  {
    intrebare:
      "Dupa un tool call, ultimul mesaj din tura 2 e un ToolMessage. Se ruteaza tura 2 tot dupa intrebarea omului?",
    script: "t3:tura2",
    raspuns:
      "Da. Garda cauta inapoi ultimul HumanMessage (HumanMessage.isInstance, ca llmToolSelector din langchain) " +
      "si clasifica doar textul lui, deci ambele ture merg la acelasi model. In A, intrebarea simpla are un " +
      "rezultat de tool de 150 de caractere: dupa ultimul mesaj ar fi mers la scump in tura 2; ruleaza de doua " +
      "ori pe ieftin. In B, intrebarea complexa are rezultatul \"da\" (2 caractere): dupa ultimul mesaj ar fi " +
      "mers la ieftin; ruleaza de doua ori pe scump. Testul musca, verificat manual si nu in aceasta consola: " +
      "cu rutarea mutata temporar pe ultimul mesaj, " +
      "tests/tema3/tura2.test.ts pica pe numarul de apeluri in ambele directii. Mesajele de aici n-au " +
      "usage_metadata, deci costul apare n/a, nu $0.",
    dovezi: [
      "[costGuard] SIMPLA → claude-haiku-4-5 | fara usage_metadata | cost n/a",
      "mesaje: human > ai > tool > ai | rezultat tool: 150 caractere",
      "apeluri: ieftin=2 scump=0",
      "[costGuard] COMPLEXA → gpt-x | fara usage_metadata | cost n/a",
      "mesaje: human > ai > tool > ai | rezultat tool: 2 caractere",
      "apeluri: ieftin=0 scump=2",
    ],
  },
  {
    intrebare:
      "Euristica: intrebarile cu diacritice, flexiuni si forme de feminin ajung la modelul scump, iar cuvintele " +
      "care doar incep la fel (compartiment, cearceafuri) raman la cel ieftin?",
    script: "t3:euristica",
    raspuns:
      "Da. Regexul cursului (cost-guard.ts:40-41) nu are limite de cuvant si presupune text fara diacritice: " +
      "rateaza \"explică\", \"explici\", \"Ce recomanzi?\", formele de feminin si plural (\"cea mai bună\", " +
      "\"cele mai bune\") si \"dece\", iar \"compar\" si \"de ce\" prind \"compartiment\" si \"de cearceafuri\". " +
      "\"compară\", \"recomandă\", \"analizează\", \"planifică\" mergeau, pentru ca radacinile se opresc " +
      "inainte de diacritica. tema3 normalizeaza textul (NFD, fara semne diacritice, litere mici; ş/ţ cu " +
      "sedila si ș/ț cu virgula ajung la fel), foloseste limite de cuvant si lookahead-uri unde o radacina e " +
      "prefixul altui cuvant (compar fara \"compartiment\", explic fara \"explicit\"), acopera recoman[dz] si " +
      "cel/cea/cei/cele mai bun/ieftin si scoate \"dezavantaj\", redundant cu \"avantaj\". Pragul de 120 de " +
      "caractere ramane, masurat pe textul normalizat, ca formele NFC si NFD ale aceleiasi intrebari sa mearga " +
      "la fel. Abatere deliberata de la curs: textul gol sau doar spatii (si orice mesaj fara " +
      "HumanMessage) merge la SCUMP; la curs mergea la ieftin. Garda e o optimizare de cost, deci coboara " +
      "modelul doar cand are dovada ca intrebarea e simpla, iar \"nimic de clasificat\" nu e dovada; un " +
      "mesaj doar cu imagine cade tot aici, si pentru imagini modelul scump e alegerea potrivita. In demo5 " +
      "cazul nu apare (mereu exista un mesaj de la om), deci impactul pe cost e zero. Continutul multimodal " +
      "e acoperit de tests/tema3/euristica.test.ts: conteaza doar partile text, unite cu spatiu (ca " +
      "BaseMessage.text, care le lipeste fara separator), deci text scurt + imagine e SIMPLA, text + imagine + " +
      "\"explica-mi ce vezi\" e COMPLEXA, iar doar imagine e scump; la curs JSON.stringify adauga ~27 de caractere de " +
      "schelet si trimitea orice imagine base64 la scump.",
    dovezi: [
      "explică                                  | COMPLEXA | COMPLEXA | SIMPLA  <- curs gresit",
      "Explică-mi diferența                     | COMPLEXA | COMPLEXA | SIMPLA  <- curs gresit",
      "Ce recomanzi?                            | COMPLEXA | COMPLEXA | SIMPLA  <- curs gresit",
      "cele mai bune hoteluri                   | COMPLEXA | COMPLEXA | SIMPLA  <- curs gresit",
      '""                                       | COMPLEXA | COMPLEXA | SIMPLA  <- curs gresit',
      "Vreau un compartiment de tren            | SIMPLA   | SIMPLA   | COMPLEXA  <- curs gresit",
      "Am nevoie de cearceafuri                 | SIMPLA   | SIMPLA   | COMPLEXA  <- curs gresit",
      "tema3 corect: 23/23",
      "curs corect: 12/23",
    ],
  },
  {
    intrebare:
      "O configuratie gresita (model lipsa, obiect care nu e chat model, model cu tool-uri deja legate) e " +
      "prinsa la pornire sau abia la prima intrebare?",
    script: "t3:configurare",
    raspuns:
      "La pornire: costGuard(...) arunca o eroare care numeste rolul si problema, inainte de createAgent si de " +
      "orice invoke. langchain verifica modelul injectat abia cand e ales prima data " +
      "(node_modules/langchain/dist/agents/nodes/AgentNode.js:143 si :515), iar createAgent valideaza doar " +
      "modelul propriu, deci fara verificarea din garda un model ieftin stricat ar crapa tot lenes. Verificarile " +
      "replica validateLLMHasNoBoundTools (agents/utils.js:183-212, neexportata) si ruleaza inaintea celei de " +
      "bindTools, ca mesajul sa fie precis; aceasta accepta, ca langchain (agents/utils.js:141-176), un chat " +
      "model direct sau invelit intr-un RunnableBinding fara tool-uri (ex. .withConfig({ tags })). La curs, din investigatie si nu din aceasta consola (cursul cere un " +
      "provider real): LLM_PROVIDER_IEFTIN e convertit fara validare (cost-guard.ts:91-93), createModel nu are " +
      "default:, deci \"antropic\", \"Anthropic\" sau \"\" dau un model undefined; constructia reuseste, iar " +
      "abia prima intrebare SIMPLA arunca TypeError: Cannot read properties of undefined (reading 'middle') " +
      "(AgentNode.js:143 -> utils.js:192). Intrebarile complexe merg mai departe, asa ca greseala poate trece " +
      "neobservata.",
    dovezi: [
      "costGuard(...) a aruncat: costGuard: ieftin.model lipseste sau nu e un obiect (primit: undefined).",
      "costGuard(...) a aruncat: costGuard: ieftin.model nu e un chat model cu bindTools (direct sau intr-un RunnableBinding), deci agentul nu ii poate lega tool-urile.",
      "costGuard(...) a aruncat: costGuard: ieftin.model are deja tool-uri legate; da instanta nelegata, agentul leaga singur tool-urile.",
      "createAgent apelat: nu",
      "ok",
      "createAgent apelat: da",
    ],
  },
  {
    intrebare:
      "Costul e atribuit modelului folosit efectiv? In ce ordine pun costGuard si auditul in middleware?",
    script: "t3:cost",
    raspuns:
      "Da, daca garda e inaintea auditului. Cu aceiasi tokeni (100 in / 20 out) si preturi de exemplu, " +
      "intrebarea simpla costa $0.000200 pe claude-haiku-4-5, iar cea complexa $0.001800 pe gpt-x; costul se " +
      "calculeaza din usage_metadata si pretul modelului ALES, iar fara usage_metadata e n/a, niciodata 0. " +
      "Primul din middleware: [...] e cel mai din afara (node_modules/langchain/dist/agents/nodes/AgentNode.js:196-205). " +
      "Un audit din afara garzii vede request.model = modelul agentului, nu cel ales: sonda pusa inainte, ca " +
      "auditLogger in demo5-custom.ts:41-56, citeste gpt-x pe intrebarea simpla. Cauza reala la curs e " +
      "fallback-ul numeDinRequest(request) adaugat in commitul 2123658 (audit.ts:111-115, :74-77): cand " +
      "response_metadata nu are numele modelului, un apel ieftin e numit si taxat ca modelul scump. Nu " +
      "getActiveModelName: e cod mort, nu e apelat nicaieri (llm.ts:84). Regula: costGuard INAINTEA " +
      "auditului; la fel orice middleware care citeste sau inlocuieste request.model: llmToolSelectorMiddleware " +
      "fara model propriu foloseste request.model (llmToolSelector.js:156), iar un modelFallbackMiddleware pus " +
      "inaintea garzii ar fi anulat, pentru ca garda inlocuieste din nou modelul la reincercare (dedus din " +
      "modelFallback.js:36-55, nerulat). Daca auditul trebuie sa ramana in afara, garda isi expune alegerea " +
      "pe AIMessage-ul intors (alegereaPentru): sonda din afara citeste acolo claude-haiku-4-5. Prefixele din " +
      "cost.ts:91-106 (gpt-5-mini taxat ca gpt-5) sunt in afara temei: aici preturile sunt parametri, nu un " +
      "tabel. NEVERIFICAT (fara pachete de provider instalate): daca ChatAnthropic/ChatOpenAI pun " +
      "response_metadata.model_name si usage_metadata; garda nu depinde de primul, iar fara al doilea costul " +
      "apare n/a.",
    dovezi: [
      "[sonda] request.model = claude-haiku-4-5",
      "[costGuard] SIMPLA → claude-haiku-4-5 | 100 in / 20 out | cost $0.000200",
      "[sonda] request.model = gpt-x",
      "[costGuard] COMPLEXA → gpt-x | 100 in / 20 out | cost $0.001800",
      "[sonda] request.model = gpt-x | alegerea costGuard pe raspuns = claude-haiku-4-5",
    ],
  },
];
