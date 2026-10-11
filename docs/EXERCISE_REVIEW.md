# Übungsredaktion

Die Redaktionsansicht ist ein reines Entwicklungswerkzeug. Sie zeigt jede Übung
als Lernkarte, bevor neue Inhalte in den veröffentlichten Kurs übernommen werden.
Sie ist bewusst nicht Bestandteil des Produktions-Builds und damit weder in der
PWA noch auf GitHub Pages sichtbar.

## Benutzen

```powershell
npm run dev
```

Danach im selben lokalen Server `http://localhost:5173/review.html` öffnen.

Für jeden Kandidaten gibt es drei Entscheidungen:

- **Akzeptieren**: Die Übung ist für den Kurs freigegeben.
- **Überarbeiten**: Die Übung ist prinzipiell brauchbar, benötigt aber eine
  konkrete Änderung. Eine kurze Notiz ist verpflichtend.
- **Ablehnen**: Der Kandidat soll nicht verwendet werden. Auch hier ist eine
  Notiz verpflichtend.

Die Tags machen wiederkehrende Ursachen maschinenlesbar; die Notiz ergänzt den
konkreten redaktionellen Kontext. Beides wird direkt und versioniert in
`language/exercise-review-feedback.json` gespeichert. Eine Bewertung derselben
Übung aktualisiert den bestehenden Eintrag.

## Redaktioneller Ablauf

1. Kandidaten einer neuen Unit in der lokalen Ansicht prüfen.
2. Vor dem Einbau nur akzeptierte Kandidaten übernehmen.
3. Vor der nächsten Generierung die abgelehnten und zu überarbeitenden Einträge
   als Feedback-Pool lesen. Häufige Tags sind verbindliche Constraints für die
   nächste Kandidatenrunde.
4. Mit `npm run review:report` die aktuelle Verteilung prüfen.

Die Datei ist bewusst ein Datensatz im Repository, damit Entscheidungen bei
späteren Kurs- und Generatoränderungen nachvollziehbar bleiben. Sie enthält
keine Lernenden- oder Nutzungsdaten.
