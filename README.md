# Tadlam

Eine deutschsprachige, lokale Lern-App für (Neo-)Sindarin im LARP. Belegte und Neo-Sindarin-Inhalte werden getrennt gekennzeichnet.

Die verbindliche Produkt- und Umsetzungspriorisierung steht in [docs/PRODUCT.md](docs/PRODUCT.md).

## Starten

```powershell
npm install
npm run dev
```

## Qualität prüfen

```powershell
npm test
npm run build
```

## Übungen redaktionell prüfen

Die lokale Redaktionsansicht unter `http://localhost:5173/review.html` bewertet
Übungen als Vorschaukarte und speichert Entscheidungen versioniert im Repo.
Details stehen in [docs/EXERCISE_REVIEW.md](docs/EXERCISE_REVIEW.md).

## Sprachdaten importieren

Der Eldamo-Import wird nur bei der Entwicklung ausgeführt; die fertige App lädt keine Sprachdaten aus dem Netz.

```powershell
npm run language:import -- --download
```

Das erzeugte, versionierte Offline-Paket liegt unter `src/language/generated/eldamo-lexicon.json`. Details zur Auswahlpolitik und zum weiteren Regelwerk stehen in [docs/LANGUAGE_ENGINE.md](docs/LANGUAGE_ENGINE.md).

Der Produktions-Build erzeugt eine installierbare PWA in `dist/`. Der Build schreibt die erzeugten JavaScript- und CSS-Dateien in die Offline-Zwischenspeicherung ein; nach dem ersten vollständigen Laden ist kein Server oder Konto nötig.

## Prinzipien

- Vue 3, TypeScript und Tailwind CSS
- Keine Anmeldung, Analyse-Tools oder Backend-Anfragen
- Lernstand ausschließlich in `localStorage`, inklusive Export und Import
- Kurze, feste Übungen statt freier, spekulativer Übersetzung
- Deutlicher Hinweis auf den fragmentarischen, sich wandelnden Stand des Sindarin

Die erste Einheit stützt sich bewusst auf gut dokumentierte Formen aus den Moria-Inschriften und vermeidet eine Behauptung, damit sei eine vollständige Alltagssprache abgedeckt.
