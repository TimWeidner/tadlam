# Redaktionspipeline für Units und Aufgabenpools

Tadlam wird als **redaktionell kuratierter Kurs** gebaut. KI-Agenten beschleunigen Recherche, Varianten und Qualitätsprüfung, sind aber keine Quelle sprachlicher Wahrheit. Der Lernclient bleibt vollständig offline: Er erhält ausschließlich geprüfte, versionierte Unit- und Aufgabenpakete.

## Grundregeln

- Jede Unit führt 10–30 neue **Grundformen** ein; pro Wortschatzlektion höchstens acht.
- Jede veröffentlichte Lektion hat genau 15 Übungen.
- In normalen Lektionen stehen die neue Unit-Vokabeln und/oder die neue Unit-Grammatik im Mittelpunkt. Vorwissen darf den Kontext tragen, aber nicht die Lernaufgabe verdrängen.
- Reine Refresh-Lektionen dürfen ausschließlich frühere Inhalte mischen. Sie werden nur erzeugt, wenn genug Vorwissen oder echte Fehlersignale vorhanden sind.
- Jeder Satz und jede Antwort trägt einen Status: `attested` oder `neo`. KI-Vorschläge sind bis zur Freigabe `candidate` und kommen niemals in die App.
- Der Client erzeugt keine freien neuen Sindarin-Sätze. Variation erfolgt ausschließlich aus dem lokal gelieferten, geprüften Pool und freigegebenen Satzframes.

## Ablauf pro Unit

### 1. Redaktionsbriefing

Die Redaktion legt in `language/course-plans/unit-XX.json` fest:

- kommunikatives LARP-Ziel;
- 10–30 neue Grundformen mit stabilen Eldamo-IDs;
- neue Grammatikkomponenten aus der Roadmap;
- bereits bekannte Lexeme und Regeln, die als Kontext zulässig sind;
- gewünschte Szenen, etwa Ankunft, Wache, Ausrüstung oder Wegbeschreibung.

Der **Curriculum-Agent** prüft Budget, Reihenfolge und Abdeckung: Jedes neue Lexem muss eine nachvollziehbare Einführungslektion erhalten, und eine Regel darf erst verwendet werden, wenn ihre Voraussetzungen freigegeben sind.

### 2. Quellen- und Formenprüfung

Der **Quellen-Agent** arbeitet nur mit der importierten Eldamo-Paketversion, kuratierten Overrides und den dokumentierten Regelquellen. Er liefert pro Lemma:

- Belegstatus und Quellenreferenz;
- Grundform, erlaubte Oberflächenformen und Aussprache;
- unsichere Varianten oder Konflikte;
- freigegebene Morphologie- und Mutationsregeln.

Unklare oder widersprüchliche Formen bleiben Erkennungswortschatz oder werden zurückgestellt. Für produktive Neo-Sindarin-Sätze müssen die verwendete Konvention und ein `neo`-Label hinterlegt sein.

### 3. Szenen und Satzkandidaten

Der **Szenen-Agent** erstellt zunächst deutsche, spielbare Intentionen, nicht sofort freie Sindarin-Prosa: zum Beispiel „Begrüße die Wache“, „Bitte eine Person einzutreten“ oder „Beschreibe den grünen Umhang“.

Der **Satz-Agent** erhält dafür eine harte Eingabegrenze:

- erlaubte Lexem-IDs: neue Unit-Wörter plus ausdrücklich erlaubtes Vorwissen;
- erlaubte Formen und Syntaxframes;
- Zielstatus `attested` oder `neo`;
- gewünschte neue Fokus-Lexeme und -Regeln.

Er liefert Kandidaten mit deutscher Bedeutung, Sindarin-Oberfläche, verwendeten IDs, abgeleiteten Formen und einer kurzen Begründung. Ein Kandidat ist nur zulässig, wenn in normalen Lektionen mindestens ein neues Unit-Lexem oder eine neue Unit-Regel enthalten ist. Für eine gute Verteilung wird pro Szene eine größere Auswahl erzeugt, beispielsweise 20–40 Kandidaten.

### 4. Automatische Validierung

Der **Validierungs-Agent** prüft jeden Kandidaten maschinell gegen die Language Engine:

1. Jede Tokenoberfläche lässt sich auf ein erlaubtes Lexem oder eine explizit zugelassene feste Formel zurückführen.
2. Jede flektierte Form stammt aus einer freigegebenen Morphologie-Regel oder einer kuratierten Ausnahme.
3. Mutation, Syntaxframe und Wortreihenfolge bestehen die lokale Satzvalidierung.
4. Die Kandidatengruppe enthält mindestens einen Fokusbezug zur Unit; Ausnahme: `review`.
5. Status, Quellen und Neo-Kennzeichnung sind vollständig.
6. Keine Antwort verlangt Wörter oder Regeln, die erst später im Kurs eingeführt werden.

Fehlgeschlagene Kandidaten werden verworfen, nicht stillschweigend korrigiert. Das Prüfergebnis bleibt als Redaktionsbericht erhalten.

### 5. Aufgabenpool gestalten

Der **Aufgaben-Agent** baut aus den bestätigten Sätzen und Lexemen einen Pool mit mehreren Übungsformen:

- Bedeutung erkennen und auswählen;
- Wörter oder Satzteile anordnen;
- Lücken mit einer bereits freigegebenen Form füllen;
- geführtes Tippen;
- Zuordnungen;
- Grammatik-Kontrastpaare, etwa Grundform gegen Imperativ oder Mutation gegen Grundform.

Für jeden Lektionstyp entstehen mindestens 15 geeignete, eindeutige Aufgaben. Die konkrete Lektion zieht daraus **genau 15** verschiedene Aufgaben. Eine Aufgabe speichert mindestens:

```ts
type AuthoredExercise = {
  id: string
  unit: number
  lessonId: string
  kind: "choice" | "order" | "cloze" | "type" | "match"
  prompt: string
  answer: string
  accepted: string[]
  focusLexemeIds: string[]
  contextLexemeIds: string[]
  focusRuleIds: string[]
  status: "attested" | "neo"
  sourceRefIds: string[]
  sentenceId?: string
}
```

`focusLexemeIds` und `focusRuleIds` müssen in einer normalen Lektion mindestens eines der neuen Unit-Elemente enthalten. `contextLexemeIds` dokumentiert bewusst verwendetes Vorwissen. So kann die App später Fehler sinnvoll auf Wort oder Regel zurückführen.

### 6. Pädagogische Qualitätsprüfung

Der **Lernfluss-Agent** prüft die fertige Knotenfolge und den Aufgabenpool:

- neue Formen erscheinen vor ihrer ersten produktiven Abfrage;
- die ersten Aufgaben sind stärker geführt, danach sinkt die Hilfe;
- eine Lektion wiederholt nicht dieselbe Interaktion fünfzehnmal;
- mindestens drei passende Übungsformen erscheinen pro 15er-Runde, soweit der Inhalt dies erlaubt;
- die Abschlussaufgabe verwendet mehrere sichere Bestandteile in einem kleinen LARP-Moment;
- Refresh-Aufgaben priorisieren lokale Fehlersignale, decken aber weiterhin ältere Wörter gemischt ab.

### 7. Redaktionelle Freigabe und Veröffentlichung

Die **Chefredaktion** entscheidet anhand der vier Berichte. Erst dann werden Kandidaten zu `approved`, versioniert und in das Offline-Paket übernommen. Der Release-Check führt aus:

- Kursplan- und Lexikon-Tests;
- Morphologie-, Syntax- und Antwortvalidierung;
- Vollständigkeit aller Metadaten;
- Prüfung auf unbekannte oder zu früh verwendete Lexeme;
- Build und Offline-Regression.

## Agentenübersicht

| Agent | Auftrag | Liefert | Darf nicht |
| --- | --- | --- | --- |
| Curriculum-Agent | Lernziel, Reihenfolge, Abdeckung | Unit-Briefing, Lektionstypen, Fokusmatrix | Formen oder Quellen erfinden |
| Quellen-Agent | Belege und erlaubte Formen | Quellen- und Formenbericht | unsichere Formen produktiv freigeben |
| Szenen-Agent | Spielbare deutsche Situationen | Intentions- und Szenenliste | Sindarin ohne erlaubtes Inventar erzeugen |
| Satz-Agent | Varianten innerhalb harter Grenzen | Satzkandidaten mit Metadaten | eigene Lexeme oder Regeln hinzufügen |
| Validierungs-Agent | formale Engine-Prüfung | Pass/Fail-Bericht je Kandidat | fehlende Daten stillschweigend reparieren |
| Aufgaben-Agent | Aufgabenvarianten bauen | lokaler Aufgabenpool | unbestätigte Sätze veröffentlichen |
| Lernfluss-Agent | Abwechslung und Schwierigkeit | didaktischer Prüfbericht | Sprachstatus überschreiben |
| Chefredaktion | finale Entscheidung | freigegebenes Paket | Quellen-/Validierungswarnungen ignorieren |

## Übergabeformat und Versionierung

Eine Unit wird als drei versionierte Dateien veröffentlicht:

1. `unit-XX.json` – Lernziel, Lexeme, Grammatik und Knotenplan.
2. `unit-XX-sentences.json` – geprüfte Satz- und Szenenpool-Einträge.
3. `unit-XX-exercises.json` – Aufgabenpool mit Fokus- und Kontextmetadaten.

Jeder Eintrag erhält eine Paketversion und seine Abhängigkeiten auf Lexikon- sowie Regelversion. Dadurch kann ein Update alte Lernstände weiter lesen und neue Varianten ergänzen, ohne bestehende Antworten umzudeuten.

## Auswahl im Produkt

Beim Start einer Lektion wählt der Offline-Client nur aus freigegebenen Pool-Einträgen:

- zuerst Aufgaben mit dem aktuellen Unit-Fokus;
- danach sichere Kontextvarianten mit früheren Wörtern;
- bei einem individuellen Fehlersignal eine passende, freigegebene Wiederholung;
- keine freie Satzgenerierung und keine Netzwerkanfrage.

So entsteht Variation aus vielen geprüften Möglichkeiten, nicht aus unkontrollierten Antworten.
