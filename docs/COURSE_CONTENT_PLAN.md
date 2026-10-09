# Kursinhalt: Units 1–2

Diese Dateien sind die erste quellgeprüfte Inhaltsplanung für den 12-Unit-Kurs. Sie enthalten **Grundformen**, keine automatisch abgeleiteten Oberflächenformen. `mode: productive` heißt: nach einer passenden Formen-/Syntaxfreigabe darf das Lemma in Aufgaben verwendet werden. `recognition` heißt: Bedeutung, Aussprache und Quellenhinweis dürfen eingeführt werden, ohne dass die Engine schon freie Flexion erzeugt.

Eine Unit hat bewusst keine feste Zahl von Lektionen. Der spätere Compiler erzeugt nur dann einen Wiederholungs-, Grammatik- oder Ramp-up-Knoten, wenn der bisher eingeführte Wortschatz und die Fehlerdaten ihn sinnvoll machen.

## Adaptive Knotenfolge

Der Content-Compiler in [`src/language/content-compiler.ts`](../src/language/content-compiler.ts) plant keine starre „sechs Lektionen pro Unit“-Schablone. Jeder geplante Knoten enthält genau **15 Übungen**. Neue Grundformen werden in Portionen von höchstens acht eingeführt; bei mehr Wörtern entstehen mehrere Wortschatzlektionen. Danach entstehen ausschließlich Knoten, die eine klare Lernfunktion haben:

- **Grammatik**, wenn mindestens vier neue Formen vorhanden sind und die zugehörige Regel produktiv freigegeben ist.
- **Wiederholung**, erst ab vier älteren Wörtern. Lokale Fehlersignale stehen dabei vor den übrigen bekannten Wörtern.
- **Ramp-up**, sobald mindestens acht neue Formen eine kurze, spielbare Anwendung tragen.

Damit hat Unit 1 derzeit vier Knoten (zwei Wortschatzportionen, Grammatik, Ramp-up), aber keine künstliche Wiederholung. Unit 2 kann mit einem echten Wortschatzfundament eine zusätzliche, fehlergewichtete Wiederholung erhalten. Eine Referenzregel wird erklärt, aber erzeugt keinen Pflichtknoten, solange sie nicht sicher produktiv eingesetzt werden kann.

## Unit 1 · Am Lager ankommen

13 neue, belegte Grundformen bilden den Kern: Begrüßung, Lager, Feuer, Tor und Wald sowie die ersten Handlungsverben. Dazu kommen drei feste Satzformeln. `Hannon le` bleibt ausdrücklich eine **Neo-Sindarin-Formel** und leitet keine allgemeine Regel ab. `eneth` und das stark irreguläre `gwae-` wurden nach Quellenprüfung aus Unit 1 zurückgestellt.

| Bereich | Grundformen |
| --- | --- |
| Begrüßung und Personen | `mae`, `suilad`, `mellon` |
| Ort | `echad`, `naur`, `annon`, `taur` |
| Handlung | `ped-`, `minna-`, `tol-`, `cen-`, `elia-`, `edra-` |

Produktiv werden zunächst nur die explizit freigegebenen Imperative `ped- → pedo` und `minna- → minno`; die übrigen Verben bleiben bis zur jeweiligen Formenfreigabe Erkennungswortschatz. Die festen Formeln sind `Mae govannen`, `Hannon le` und die belegte Moria-Zeile `Pedo mellon a minno.`; in Tadlam wird deren Rätsel-Lesart „Sage ‚Freund‘ und tritt ein“ geübt.

## Unit 2 · Menschen & Ausrüstung

15 neue, belegte Grundformen erlauben direkt spielbare Beschreibungen: Rollen, Wache, Kleidung, Ausrüstung, Versorgung und zwei einfache Eigenschaften.

| Bereich | Grundformen |
| --- | --- |
| Rollen | `Adan`, `hîr`, `hiril`, `sadron`, `tir-` |
| Ausrüstung | `coll`¹, `megil`, `thand`, `cû`, `roch`, `mâb` |
| Versorgung und Beschreibung | `nen`, `bas(t)`, `calen`, `beleg` |

Nominalphrasen, Adjektive und Adverbien sind in dieser Unit zunächst **Referenzwissen**: Sie werden als spätere Muster eingeordnet, aber nicht produktiv abgefragt. Die nötigen belegten Oberflächenformen würden bereits Artikel, Mutation oder andere erst später geplante Regeln voraussetzen. Bis ein kleiner, quellengeprüfter Phrasenpool vorliegt, bleibt Unit 2 deshalb bei Wortschatz und kuratierten Eigennamen als Erkennungsstoff.

## Qualitätsregeln

- Die Dateien [unit-01.json](../language/course-plans/unit-01.json) und [unit-02.json](../language/course-plans/unit-02.json) enthalten die stabilen Eldamo-IDs.
- Alle 30 neuen Lemmata sind im importierten Paket als `attested` geführt.
- Jede spätere Oberfläche, Aussprache, Übung und Satzgeneration wird gegen dieselben IDs sowie die Roadmap-Komponenten geprüft.
- Noch nicht freigegebene Flexion bleibt Erkennungswortschatz, nie „frei erratene“ Grammatik.

## Unit 3 · Im Wald

Unit 3 führt 14 neue Grundformen ein: Naturorte, Wetter, Farben sowie `i` als bestimmten Artikel. Für die Lernenden gilt eine ausdrücklich gewählte, klassische **`i` + Singular**-Kurskonvention. Das spätere `e/en`-System wird als Quellenalternative erwähnt, aber niemals gleichzeitig automatisch akzeptiert.

Produktiv sind nur vier einzeln kuratierte Formen: `i beth`, `i aladh`, `i adan` und `i baur`. Sie zeigen Artikelgebrauch und weiche Mutation, ohne daraus eine allgemeine Ableitungsmaschine zu machen. Freie Adjektivgruppen bleiben gesperrt; `Ard-galen` und `Cûl Veleg` können höchstens als Kulturkarten erscheinen.

## Unit 4 · Vor dem Tor

Unit 4 umfasst 12 neue Grundformen und arbeitet zusätzlich mit den bereits bekannten Paaren `annon → ennyn` und `Adan → Edain`. Pluralbildung ist eine **Whitelist aus 14 belegten Paaren**, keine allgemeine Lautregel. So werden etwa `barad → beraid`, `galadh → gelaidh` und `certh → cirth` gezielt gelernt, aber nie aus anderen Wörtern erraten.

Klassenplurale wie `Adanath`, `Edhelrim` oder `orchoth` bleiben reine Bedeutungs- und Kulturkarten. Sie dürfen weder getippt noch aus einem Suffix erzeugt werden.

## Unit 5 · Richtung und Ort

Unit 5 bringt 18 neue Grundformen: Präpositionen, Wege, Landschaft, Himmelsrichtungen und zwei Verbstämme. Präpositionen und indirekte Objekte bleiben zunächst in festen, einzeln kuratierten Chunks; es gibt keine freie Kombination wie `mi taur` oder `an mellon`.

Die erste produktive Objektkonstruktion ist bewusst klein: die geprüfte, belegte Formel `Lasto beth.` mit `lasta- → lasto` und der hinterlegten Mutation `peth → beth`. `men-`, `anna-` und Richtungspräpositionen werden zunächst erkannt, aber nicht frei flektiert oder zusammengebaut.
