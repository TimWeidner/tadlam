# Tadlam – Produktentscheidung

**Tadlam** ist eine mobile, offlinefähige Lern-App für LARP-Spieler:innen, die (Neo-)Sindarin im Spiel und für kleine Alltagssituationen verwenden möchten. Sie ist kein reines Tolkien-Nachschlagewerk und kein akademischer Sprachkurs.

## Leitplanken

- Die App mischt Tolkien-Sindarin und Neo-Sindarin, kennzeichnet Neo-Inhalte jedoch mit einem kleinen, unaufdringlichen Label.
- Detailansichten im Wortschatz und in Grammatik-Erklärungen zeigen Belegstatus, Varianten und Quellen. Wo möglich, haben späte Tolkien-Quellen Vorrang; ansonsten wird eine aktuelle, konsistente Neo-Sindarin-Konvention verwendet.
- Der Kurs startet mit nutzbarem Grundwortschatz, Begrüßungen und kurzen Dialogen. Tolkien-Namen und Trivia sind optionale Atmosphäre, nicht Lernvoraussetzung.
- Aussprache wird von Anfang an unter Wörtern und Sätzen angezeigt, einschließlich einer betonten Silbe. Audio kommt später hinzu.
- Tengwar ist ein späteres, separates Modul.
- Alle Lern- und Nutzerdaten bleiben lokal. Updates können online bezogen werden, müssen aber mit vorhandenen Fortschrittsdaten kompatibel bleiben.

## Lernloop

1. Eine kurze Lektion führt wenige Wörter oder eine Form ein.
2. Jede Lektion umfasst **genau 15 Übungen**: neue Inhalte, Wiedererkennen, Anwenden und gezielte Festigung.
3. Falsche Karten wandern ans Ende der Lektion und erscheinen anschließend im Wiederholungsmodus.
4. Bei mindestens 80 % wird die Lektion bestanden; XP und Streak zählen, Fehler bestrafen nicht.
5. Fällige Wiederholungen werden lokal geplant und auf dem Lernpfad sichtbar gemacht.

## Aufbau einer Einheit

Jede Einheit folgt einer bewusst ansteigenden Schleife statt einer Reihe gleichartiger Lektionen. Sie hat **keine feste Lektionenzahl**: Inhalt und Lernstand bestimmen, ob eine Unit beispielsweise vier, sechs oder acht Knoten braucht.

- **Neue Wörter:** Ein oder mehrere kleine Blöcke mit wenigen neuen Formen, Aussprache und Bedeutung.
- **Anwenden:** Dieselben Wörter mit weniger Hilfen tippen, ordnen oder ergänzen.
- **Wiederholen:** Nur wenn es bereits genügend bekannte Formen oder persönliche Fehlerkarten gibt, um eine echte Mischübung zu rechtfertigen.
- **Grammatik:** Nur wenn ein neues Muster den aktuellen Wortschatz sinnvoll erweitert; nie als Platzhalterlektion.
- **Ramp-up:** Eine kurze, gemischte Abschlussrunde, sobald genug Material für einen kleinen Spielmoment vorhanden ist.

Der Content-Compiler plant daher abwechslungsreiche Knoten nach Ziel, Neuheitsgrad, bekannten Wörtern und Fehlerprofil – nicht nach einer starren Schablone.

Neue spielbare Sätze entstehen in einer KI-gestützten, aber redaktionell kontrollierten Pipeline. Nur geprüfte Satz- und Aufgabenpools werden offline ausgeliefert; freie KI-Antworten entstehen nie im Lernclient. Der verbindliche Ablauf steht in [UNIT_AUTHORING_PIPELINE.md](./UNIT_AUTHORING_PIPELINE.md).

Der Lernpfad zeigt diese Schritte als geschwungene Einzelknoten. Die nächste sinnvolle Lektion wird automatisch vertikal ins Blickfeld gerückt.

### Wortschatzbudget

Eine Einheit führt **10 bis 30 neue Grundformen** ein. Für den ersten, besonders dialogorientierten Kurs peilt Tadlam meist 12–18 an: genug Material für spürbaren Fortschritt, ohne die Wiederholungen zu verdrängen. Pro Lektion werden höchstens **acht neue Grundformen** eingeführt; darüber teilt der Compiler sie auf zwei Wortschatzlektionen auf. Die restlichen Aufgaben der jeweiligen 15er-Runde festigen diese Formen im Kontext.

Feste Redewendungen und Satzbeispiele ergänzen dieses Budget, zählen aber nicht als zusätzliche Lexeme. Das Wörterbuch zeigt Verben in der Grundform; flektierte Formen wie Imperative werden als Grammatik und in der jeweiligen Satzherleitung vermittelt.

### Übungsformen für die erste Ausbaustufe

- Multiple Choice
- Wörter anordnen
- Lückentexte
- Zuordnungspaare mit drei Versuchen; bereits richtige Paare bleiben liegen
- Tippen einzelner Wörter innerhalb geführter Sätze

Später: Hörverständnis mit lokalen Audiodateien, Textentschlüsselung als Abschlussübung und längere Schreibaufgaben.

## Gestaltung

- Mobile first; Desktop bleibt voll nutzbar.
- Gemütlich und leicht spielerisch: Wald, Pergament, handschriftliche Akzente.
- Kartenförmiger vertikaler Lernpfad als Hauptnavigation.
- Dark Mode.

## Priorisierte Umsetzung

### Umgesetzt (MVP 0.2)

1. **Kursdaten für LARP-Alltag:** Begrüßen, sich vorstellen, Höflichkeit, Richtung/Ort, einfache Spielhandlungen. Jede Karte enthält Status, Aussprache und eine Erklärung.
2. **Neuer Übungsbaukasten:** Multiple Choice, Lückentext, Wortreihenfolge, Zuordnung und geführtes Tippen.
3. **Echte Lernlogik:** 80-%-Abschluss, Fehlerkarten am Lektionende und ein lokaler Wiederholungsbereich. Herzen werden entfernt.
4. **Mobiler Kartenpfad:** Vertikale Karte statt gleichförmiger Kachelansicht; dazu XP, Streak und Übungs-Tagesziel.
5. **Detailhilfe:** "Warum?" zeigt Übersetzung, Aussprache, Grammatikhinweis, Status und Quelle.
6. **Update-Sicherheit:** Fortschrittsstände der ersten Kursstruktur werden in die neue Kursstruktur migriert.

### Danach (MVP 0.3)

1. Dark Mode.
2. Lokales, durchsuchbares Voll-Lexikon mit Formen, Varianten und Quellen.
3. Abschluss-"Ramp-up" je Einheit: kurzer, geführter Dialog oder Text.
4. Robuste Fortschrittsmigration für App-Updates sowie Import/Export-Kompatibilität.

### Später

- Lokale Aussprache-Audios und Hörverständnis
- Längere Texte entschlüsseln
- Freiere Schreibaufgaben
- Tengwar
- Eigene Notizen, gespeicherte Wörter und Satzbaukasten

## Bewusst nicht im Produkt

- Herzen, Energie oder andere Straf- und Wartezeiten
- Ranglisten, soziale Vergleichsmechaniken und Werbung
- Unbelegte Antworten als eindeutig korrekt ausgeben
- Serverkonto oder Cloud-Zwang
