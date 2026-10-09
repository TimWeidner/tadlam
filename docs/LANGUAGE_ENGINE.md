# Sprach-Engine für Tadlam

**Status:** Entwurf 1.0  
**Ziel:** Eine vollständig offline nutzbare Engine für kuratiertes (Neo-)Sindarin: Wortschatz, Flexion, Mutation, Satzbau, Validierung und kontrollierte Satzgenerierung.

## Leitlinien

- Tadlam lehrt spielbares, verständliches Sindarin für LARP – keine scheinbare wissenschaftliche Endgültigkeit.
- Belegtes, spätes Tolkien-Sindarin hat Vorrang. Neo-Sindarin ist eine klar gekennzeichnete, notwendige Ergänzung.
- Jede Form muss nachvollziehbar sein: Quelle, Qualitätsstufe, angewandte Regeln und gegebenenfalls Unsicherheit.
- Die App arbeitet nach Installation komplett offline. Sprachdaten werden als versionierte Pakete ausgeliefert.
- Das Regelwerk ist unabhängig vom Interface testbar und darf keine fachliche Logik in Vue-Komponenten verstecken.

## Datenherkunft und Lizenz

Die primäre lexikalische Quelle ist [Eldamo](https://www.eldamo.org/), insbesondere dessen [XML-Datenmodell](https://mail.eldamo.org/general/eldamo-schema.html) und Neo-Sindarin-Wortschatz. Eldamo stellt Rohdaten unter CC BY 4.0 bereit.

Eldamo ist für Tadlam eine **Quellen- und Kandidatendatenbank**, nicht automatisch die letzte Instanz für lernbare Formen:

- Die Neo-Sindarin-Liste ist ausdrücklich Beta.
- `!` kennzeichnet fan-erfundene oder fan-bildende Formen.
- `^` kennzeichnet frühe oder möglicherweise verworfene Formen.
- `†` kennzeichnet archaische oder poetische Formen.
- Mehrdeutige und einander widersprechende historische Formen dürfen nicht stillschweigend als gleichwertige Alltagssprache erscheinen.

Die App zeigt für jedes verwendete Wort eine Quellenreferenz. Ein About-/Credits-Bereich nennt Eldamo, die verwendete Datenversion und die CC-BY-Attribution.

## Architektur

```text
Eldamo XML + Tadlam-Overrides
             │
             ▼
       Import & Kuratierung
             │
             ▼
   versioniertes Sprachpaket
             │
  ┌──────────┼───────────┐
  ▼          ▼           ▼
Lexikon  Morphologie   Syntax
  └──────────┼───────────┘
             ▼
 Analyse · Validierung · Generation
             ▼
Wörterbuch · Übungen · Erklärungen
```

Die Import-Pipeline läuft bei der Entwicklung oder beim Erstellen eines Datenupdates. Niemals lädt oder parst die veröffentlichte App Eldamo zur Laufzeit.

## Sprachpaket

Ein Paket enthält Daten, Regeln und Quellen in einer kompatibel versionierten Einheit.

```ts
type LanguagePack = {
  engineVersion: string;
  dataVersion: string; // z. B. eldamo-0.8.13
  rulesVersion: string; // z. B. neo-sindarin-1.0
  lexemes: Lexeme[];
  rules: RulePack[];
  sources: SourceRecord[];
};
```

`engineVersion` verhindert, dass eine App ein Regelpaket lädt, das sie noch nicht interpretieren kann. Fortschritt referenziert stabile Lemma- und Regel-IDs; dadurch bleiben abgeschlossene Übungen nachvollziehbar, wenn ein späteres Paket eine bevorzugte Form ändert.

## Lexikon

```ts
type Confidence =
  "late-attested" | "attested" | "neo" | "early" | "archaic" | "uncertain";

type Lexeme = {
  id: string; // stabile Tadlam-ID, nicht die Schreibweise
  externalIds: string[]; // z. B. Eldamo page-id
  lemma: string;
  stem?: string;
  partOfSpeech: PartOfSpeech[];
  glosses: Gloss[];
  language: "sindarin" | "neo-sindarin";
  confidence: Confidence;
  markers: Marker[]; // fan, early, archaic, disputed, uncertain
  pronunciation?: Pronunciation;
  morphology: MorphologyProfile;
  irregularForms?: InflectedForm[];
  sources: SourceReference[];
};
```

Der Import bewahrt Rohattribute wie Form, Stamm, Wortart, Gloss, Sprachcode, Markierungen und Referenzen. Ein separater Tadlam-Override ergänzt fehlende Flexionsklasse, bevorzugte Schreibung, Aussprache, LARP-Eignung und editorische Entscheidungen.

Der sichtbare Wortschatz zeigt Verben grundsätzlich als Grundform (z. B. `ped-`, `minna-`), nicht als gerade in einer Übung verwendete Form. Kursdaten dürfen weiterhin Oberflächenformen wie `Pedo` oder `minno` referenzieren; deren Bildung wird in der Grammatikansicht und in der „Warum?“-Spur erklärt.

`language/tadlam-overrides.json` enthält nur bewusst kuratierte Ergänzungen. Ein Override darf nie eine Eldamo-Form stillschweigend überschreiben: zusätzliche Formen erhalten eine Tadlam-ID, Quellenreferenz, Qualitätsmarker und eine editorische Notiz.

Die derzeitige Formel `Hannon le` ist ein solcher Eintrag: Sie bleibt für LARP als freigegebene, filmgeprägte Neo-Sindarin-Formel verfügbar, trägt aber die Marker `fan`, `disputed` und `legacy-film` und muss im Produkt als Neo erscheinen.

### Auswahlpolitik

Die Generierung wählt standardmäßig in dieser Reihenfolge:

1. spätes, belegtes Sindarin;
2. sonst belegtes Sindarin;
3. kuratiertes Neo-Sindarin;
4. frühe, archaische, unsichere oder fan-bildende Formen nur nach ausdrücklicher Freigabe und mit Label.

Ein Lexem kann im Wörterbuch sichtbar sein, aber für Übungen oder Satzgenerierung gesperrt bleiben.

### Curriculum-Spur

Jedes Lexem im erzeugten Sprachpaket besitzt ein `curriculum`-Feld. Es zeigt entweder die geplanten Einsätze oder bewusst den Status `unassigned`.

```ts
type CurriculumUse = {
  unit: number;
  lessonId: string;
  role: "introduced" | "practised" | "reviewed";
  surface?: string; // die in der Lektion verwendete Form
};
```

Die Redaktion pflegt diese Zuordnung in `language/curriculum-map.json`. Nicht auflösbare Kursformen stehen als `curriculumGaps` mit Unit, Lektion und Begründung im Sprachpaket. Damit kann die Kursplanung gezielt prüfen, welche Wörter noch eingeführt werden müssen, welche Wörter zu früh auftauchen und welche Formen noch eine Quellenentscheidung benötigen.

`src/language/curriculum.ts` validiert die Zuordnung gegen die echten Kurslektionen. Der Befehl `npm run language:report` fasst nach einem Import pro Unit eingeführte, geübte und wiederholte Formen sowie offene Lücken zusammen.

## Morphologie und Mutation

Die Morphologie ist eine deklarative Regelmaschine. Regeln werden nach Priorität verarbeitet; explizite unregelmäßige Formen haben immer Vorrang.

```text
Lemma + Merkmale
→ unregelmäßige Form oder Flexionsregel
→ Stamm-/Lautwechsel
→ kontextabhängige Mutation
→ sichtbare Form
```

Kernfunktionen:

```ts
inflect(lexemeId, features): InflectionResult
analyze(surfaceForm): AnalysisCandidate[]
applyMutation(kind, form): SurfaceForm
explainDerivation(result): DerivationStep[]
```

`features` enthalten nur tatsächlich modellierte Merkmale, etwa Numerus, Person, Tempus, Modus, Nominalklasse und Mutationstyp. Eine Regel kann Bedingungen, Ausnahmen, Priorität und einen erklärenden Text tragen.

### Unregelmäßigkeiten

Unregelmäßige Formen sind Daten, nicht Sonderlogik im Code:

```ts
type InflectedForm = {
  features: FeatureSet;
  form: string;
  source: SourceReference;
  note?: string;
};
```

So lassen sich abweichende Stämme, Plurale, Vergangenheitsformen und konkurrierende, aber kuratierte Varianten zuverlässig verarbeiten.

### Implementierte Morphologie-MVP

Die erste Engine in `src/language/morphology.ts` modelliert nur Formen, die sie erklären kann:

- `minna- → minno` über die kuratierte Klasse `a-stem-imperative-o`;
- `ped- → pedo` über die kuratierte Klasse `bare-stem-imperative-o`;
- feste Formeln wie `Mae govannen` und `Hannon le` als nicht frei flektierbare Einträge.

`inflect()` erzeugt eine Form mit einer Regelspur; `analyze()` ordnet eine sichtbare Form wieder Lemma und Regel zu. Mutationen, Plural- und Tempusregeln werden erst ergänzt, wenn sie für die betreffende Flexionsklasse kuratiert und getestet sind.

### Implementierte Mutations-MVP

`src/language/mutation.ts` modelliert die Mutation getrennt von Flexion und Satzbau. Die erste freigegebene Regel ist die weiche Mutation `mellon → vellon` im Kontext `direct-object`. Sie ist absichtlich nicht als allgemeines Ersetzen von `m` nach `v` implementiert: Nur ausdrücklich kuratierte Lexeme und Kontexte dürfen eine Form erzeugen.

Der Kontext `vocative` löst die Regel nicht aus. Damit bleibt die belegte Anrede in `pedo mellon a minno` unverändert, während die Engine für einen direkten Objektkontext die mutierte Form erklären kann. `analyzeMutation()` führt die sichtbare Form wieder auf Lemma, Kontext und Quelle zurück.

## Syntax

Sätze entstehen und werden geprüft als kleine Syntaxbäume mit Merkmalen.

```ts
type Sentence = {
  subject?: NounPhrase;
  predicate: VerbPhrase;
  objects?: NounPhrase[];
  modifiers?: Phrase[];
};
```

Syntaxregeln beschreiben Valenz und Vereinbarkeit: beispielsweise erwartete Ergänzungen eines Verbs, zulässige Wortstellung oder auslösende Umgebungen für Mutationen. Sie arbeiten über Merkmale statt über hart codierte Textvorlagen.

### Implementierte Syntax-MVP

`src/language/syntax.ts` setzt die ersten drei kuratierten Frames um. Die Engine generiert sie aus Lexem-IDs, Flexion und Mutation statt aus einer unprüfbaren Textzeichenkette:

- `Mae govannen.` als feste Begrüßungsformel;
- `Pedo, mellon, a minno.` als belegte Anrede mit zwei Imperativen; die Anrede `mellon` bleibt dabei ausdrücklich unmutiert;
- `Lasto beth.` als kompakte Übung für Imperativ plus direktes Objekt. Der Frame leitet `lasto` aus `lasta-` ab und verwendet die belegte weiche Mutation `peth → beth`.

`generateSentence(frame)` liefert Satz, verwendete Lexeme, Quellen und vollständige Regelspur. `validateSentence(frame, input)` prüft nur gegen den jeweils aktiven Kursframe, akzeptiert aber harmlose Unterschiede in Großschreibung und Satzzeichen. Freie, noch nicht analysierbare Sindarin-Sätze werden damit nicht pauschal als falsch deklariert.

## Validierung

Die Validierung ist absichtlich dreistufig:

```ts
type Validation =
  | { status: "valid"; derivation: DerivationStep[] }
  | { status: "review"; reasons: ValidationNote[] }
  | { status: "invalid"; errors: ValidationError[] };
```

- **valid:** Form und Satz passen eindeutig zum aktiven Regelpaket.
- **review:** Die Form ist möglich oder mehrdeutig, aber die Datenlage oder Analyse reicht nicht für ein eindeutiges Urteil.
- **invalid:** Eine konkrete, erklärbare Regel wurde verletzt.

Die Engine behauptet nie, eine nicht erkannte Neo-Sindarin-Form sei zwingend falsch. Sie erklärt stattdessen, welche Form die aktive Tadlam-Konvention erwartet und warum.

### Implementierte Validierungs-MVP

`src/language/validation.ts` validiert getippte Antworten gegen einen ausgewählten Kursframe und gibt immer genau einen von drei Zuständen zurück:

- `valid`: Die Form entspricht dem Frame; die vollständige Herleitungs- und Quellspur steht für „Warum?“ bereit.
- `invalid`: Die Engine kann eine konkrete Regelverletzung benennen, etwa fehlende Mutation (`peth` statt `beth`), fehlenden Imperativ oder eine Mutation im falschen Kontext.
- `review`: Mindestens eine Form ist dem kuratierten Regelpaket unbekannt. Das ist eine Einladung zur redaktionellen Prüfung, kein Urteil über die grammatische Unmöglichkeit der Eingabe.

Die Validierung ist absichtlich framegebunden. Sie ist damit sofort für Lückentexte, Wortanordnung und kurze Schreibaufgaben nutzbar, ohne bereits einen unzuverlässigen allgemeinen Sindarin-Parser vorzutäuschen.

## Satzgenerator

Der Generator erzeugt keine freien, unkontrollierten Sätze. Er beginnt mit einer LARP-Absicht und realisiert einen geprüften Syntaxbaum.

```text
Kommunikationsabsicht
→ semantischer Frame
→ kuratierte Lexemwahl
→ Syntaxbaum
→ Flexion und Mutation
→ Satz, Aussprache, Quellen- und Regelspur
```

Beispiele für Frames: begrüßen, danken, nach dem Weg fragen, Richtung weisen, eine Wache ansprechen oder am Lager ankommen. Jeder generierte Satz trägt seine verwendeten Lemmata und Regeln mit; dadurch kann Tadlam Übungen, Hinweise und „Warum?“-Erklärungen aus demselben Modell erzeugen.

### Implementierter Aufgabengenerator-MVP

`src/language/exercise-generator.ts` erzeugt aus einem freigegebenen Satzframe deterministisch Multiple Choice, Wortanordnung, Lückentext und kurze Tippaufgaben. Jede erzeugte Aufgabe enthält den Frame, verwendete Lexeme, Regel-IDs und Quellenreferenzen (`engine`-Kontext). Sie kann deshalb direkt über dieselbe Syntax-Validierung bewertet werden.

Der Generator erfindet keine Formen. Distraktoren sind bewusst begrenzt und eine Aufgabe erscheint nur in Kurslektionen, deren deklarierte Lexeme den zugehörigen Frame bereits abdecken. Derzeit ergänzt er die beiden Tor-Lektionen um je zwei Aufgaben zum Frame `Pedo, mellon, a minno.`.

Fehler speichern lokale `practiceSignals` pro Lexem und Regel. Bei künftigen Generierungsaufrufen sortieren mehrmals fehlerhafte Frames nach vorn; korrekte Lösungen bauen die Gewichtung wieder schrittweise ab. Die Signale verbleiben im lokalen Fortschritt und verlassen das Gerät nie.

## Import-Pipeline

1. Eine fest gepinnte Eldamo-XML-Version laden und Prüfsumme speichern.
2. XML in ein verlustarmes internes Rohformat umwandeln.
3. Nur relevante Sprachvarianten und Wortarten in den Kandidatenbestand übernehmen.
4. Markierungen und Quellbezüge normalisieren.
5. Tadlam-Overrides und Freigaben anwenden.
6. Sprachpaket, Suchindex und Quellenverzeichnis erzeugen.
7. Paket gegen Golden-Tests und Schema validieren.

Der Import erzeugt einen maschinenlesbaren Änderungsbericht: neue Lemmata, entfernte Lemmata, geänderte Formen, geänderte Qualitätsstufen und Konflikte, die eine redaktionelle Entscheidung benötigen.

### Aktueller Pipeline-Stand

Die erste Import-Pipeline ist implementiert. Sie lädt oder liest die Eldamo-XML, importiert ausschließlich die Sprachcodes `s` (Sindarin) und `ns` (Neo-Sindarin), bewahrt Eldamo-`page-id`, Wortart, Gloss, Stamm, Markierungen und gefundene Quellenreferenzen und schreibt ein versioniertes JSON-Paket nach `src/language/generated/eldamo-lexicon.json`.

```powershell
# Offizielles Eldamo-Paket laden und importieren
npm run language:import -- --download

# Bereits geladene XML-Datei importieren
npm run language:import -- --input C:\Pfad\zu\eldamo-data.xml

# Nur die Import-Pipeline testen
npm run test:language
```

Die aktuelle Pipeline erzeugt Kandidaten, aber keine automatische redaktionelle Freigabe. Insbesondere Wörter mit Eldamo-Markierungen für fan-bildende, frühe/vermutlich verworfene, archaische oder unsichere Formen werden nicht als Übungskandidaten freigegeben.

## Qualitätssicherung

- **Golden-Tests:** bekannte Formen, Mutationen und vollständige Beispielsätze.
- **Regressionstests:** jede korrigierte Form bleibt als Testfall erhalten.
- **Roundtrip-Tests:** generierte Form → Analyse enthält das ursprüngliche Lemma und die Merkmale.
- **Quellentests:** jedes lernbare Lemma besitzt mindestens eine Quellenreferenz und eine Qualitätsstufe.
- **Generator-Tests:** alle generierten Aufgaben sind durch die eigene Validierung `valid`.
- **Migrations-Tests:** ein neues Sprachpaket erhält bestehende Lernstände oder markiert bewusst aufgelöste Lemmata.

## Umsetzungsreihenfolge

1. `language-core`: Datentypen, Paketformat, Versionierung und Test-Harness.
2. `eldamo-import`: reproduzierbarer XML-Import, Rohdatenspeicher und Quellen-Credits.
3. `lexicon-curation`: Neo-Sindarin-Auswahlpolitik, Tadlam-Overrides und erster LARP-Kernwortschatz.
4. `morphology`: Flexion, Mutationen, unregelmäßige Formen und Herleitungs-Erklärungen.
5. `syntax`: Frames und kleine Satzbäume für Unit 1–2.
6. `validation`: Eingabeanalyse mit `valid` / `review` / `invalid`.
7. `generation`: variierbare, aber vollständig prüfbare Übungen.

## Erste Abgrenzung

Die erste Version modelliert nur das, was sie tatsächlich sicher anwenden und erklären kann. Sie startet mit einem kuratierten Kern für Begrüßung, Lager, Weg und Tor. Vollständige freie Übersetzung, jede historische Variante oder ein allgemeiner Parser für alle denkbaren Sindarin-Sätze sind spätere Ausbaustufen.
