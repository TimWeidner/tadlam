import type { Lesson } from "../domain";
import { vocabularyExercises, type StudyLexeme } from "./exercise-factories";

const lesson = (
  id: string,
  unit: number,
  title: string,
  subtitle: string,
  icon: string,
  phase: Lesson["phase"],
  words: StudyLexeme[],
  scene: string,
  reviewWords: StudyLexeme[] = [],
): Lesson => ({
  id,
  unit,
  title,
  subtitle,
  icon,
  phase,
  lexemeIds: [...words, ...reviewWords].map((word) => word.id),
  exercises: vocabularyExercises(id, words, scene, reviewWords),
});

const unitSixKin: StudyLexeme[] = [
  { id: "eldamo:1791197021", surface: "adar", gloss: "Vater", mode: "productive" },
  { id: "eldamo:921714735", surface: "emel", gloss: "Mutter", mode: "productive" },
  { id: "eldamo:3973339289", surface: "hanar", gloss: "Bruder", mode: "recognition" },
  { id: "eldamo:2587504773", surface: "nethel", gloss: "Schwester", mode: "recognition" },
];
const unitSixHome: StudyLexeme[] = [
  { id: "eldamo:2438171517", surface: "adaneth", gloss: "sterbliche Frau", mode: "recognition" },
  { id: "eldamo:1220983633", surface: "nos(s)", gloss: "Familie, Sippe", mode: "recognition" },
  { id: "eldamo:1926942351", surface: "gwaith", gloss: "Volk, Leute", mode: "productive" },
  { id: "eldamo:1964807933", surface: "bâr", gloss: "Haus, Heim", mode: "productive" },
];
const unitSixCraft: StudyLexeme[] = [
  { id: "eldamo:3720376219", surface: "curu", gloss: "Handwerk, Kunst", mode: "productive" },
  { id: "eldamo:620689743", surface: "tavn", gloss: "handgefertigter Gegenstand", mode: "recognition" },
  { id: "eldamo:1539713025", surface: "ost", gloss: "Burg, Festung", mode: "productive" },
  { id: "eldamo:658710813", surface: "aran", gloss: "König, Herrscher", mode: "recognition" },
];

const unitSevenMake: StudyLexeme[] = [
  { id: "eldamo:3736354243", surface: "car-", gloss: "machen, tun", mode: "productive" },
  { id: "eldamo:1410009759", surface: "heb-", gloss: "bewahren, halten", mode: "recognition" },
  { id: "eldamo:322881567", surface: "feria-", gloss: "vorbereiten", mode: "recognition" },
  { id: "eldamo:1939403845", surface: "dar-", gloss: "anhalten, stoppen", mode: "recognition" },
];
const unitSevenMeet: StudyLexeme[] = [
  { id: "eldamo:235290361", surface: "elia-", gloss: "helfen", mode: "productive" },
  { id: "eldamo:801110253", surface: "natha-", gloss: "retten, Hilfe bringen", mode: "recognition" },
  { id: "eldamo:1275067921", surface: "govan-", gloss: "sich treffen", mode: "productive" },
  { id: "eldamo:3618727045", surface: "cova-", gloss: "zusammenkommen", mode: "recognition" },
];
const unitSevenSpeak: StudyLexeme[] = [
  { id: "eldamo:3251788527", surface: "ephed-", gloss: "aussprechen, sagen", mode: "recognition" },
  { id: "eldamo:2376237379", surface: "can-", gloss: "rufen", mode: "productive" },
  { id: "eldamo:2230295347", surface: "tiria-", gloss: "schauen, beobachten", mode: "recognition" },
  { id: "eldamo:37799167", surface: "penna-", gloss: "herabkommen, fallen", mode: "recognition" },
];

const unitEightLinks: StudyLexeme[] = [
  { id: "eldamo:2814200763", surface: "a", gloss: "und", mode: "productive" },
  { id: "eldamo:2091206437", surface: "ach", gloss: "aber", mode: "recognition" },
  { id: "eldamo:3586600781", surface: "ir", gloss: "wenn, während", mode: "recognition" },
  { id: "eldamo:917698495", surface: "sui", gloss: "wie, als", mode: "recognition" },
];
const unitEightPlace: StudyLexeme[] = [
  { id: "eldamo:1925514569", surface: "hí", gloss: "jetzt", mode: "productive" },
  { id: "eldamo:1094080739", surface: "ui", gloss: "jemals, immer", mode: "recognition" },
  { id: "eldamo:3098131039", surface: "sí", gloss: "hier", mode: "productive" },
  { id: "eldamo:3402128255", surface: "ned", gloss: "zuerst", mode: "recognition" },
];
const unitEightParts: StudyLexeme[] = [
  { id: "eldamo:1739892921", surface: "ad-", gloss: "wieder-, zurück-", mode: "recognition" },
  { id: "eldamo:2908123947", surface: "-dil", gloss: "Freund, Liebhaber (Suffix)", mode: "recognition" },
  { id: "eldamo:193193059", surface: "-iel", gloss: "Tochter, weibliches Suffix", mode: "recognition" },
  { id: "eldamo:2447472675", surface: "-we", gloss: "Person, Wesen (Suffix)", mode: "recognition" },
];

const neoSource = "Neo-Sindarin · kuratierte Brücke";
const neo = (id: string, surface: string, gloss: string): StudyLexeme => ({
  id, surface, gloss, mode: "recognition", status: "neo", source: neoSource,
});
const unitNineAddress: StudyLexeme[] = [
  neo("eldamo:3035605195", "im", "ich"),
  neo("eldamo:1581961535", "le", "du, Sie (höflich)"),
  neo("eldamo:2068694825", "nin", "mich, mir"),
  neo("eldamo:2084114697", "cin", "du (vertraut)"),
];
const unitNineTogether: StudyLexeme[] = [
  neo("eldamo:2466285747", "pen", "uns (einschließlich angesprochener Person)"),
  neo("eldamo:1491673253", "pe", "wir (einschließlich angesprochener Person)"),
  neo("eldamo:1540837111", "gwîn", "unser (einschließlich angesprochener Person)"),
  neo("eldamo:6498811", "gu", "mit"),
];
const unitNineCourtesies: StudyLexeme[] = [
  neo("eldamo:2772556329", "anna-", "danken"),
  neo("eldamo:112067013", "nathla-", "willkommen heißen"),
  neo("eldamo:819370179", "listo", "bitte"),
  neo("eldamo:3651362727", "mabed-", "fragen"),
];

const unitTenTime: StudyLexeme[] = [
  neo("eldamo:1628059847", "erlu", "einmal"),
  neo("eldamo:1340416251", "órui", "täglich"),
  neo("eldamo:212280491", "abor", "morgen"),
  neo("eldamo:1895902345", "orvedui", "gestern"),
];
const unitTenDay: StudyLexeme[] = [
  neo("eldamo:1930810753", "amor", "Morgen, früher Tag"),
  neo("eldamo:2034302123", "nedhor", "Mittag"),
  neo("eldamo:1074570979", "avnedhor", "Nachmittag"),
  neo("eldamo:1155906013", "oreth", "Stunde"),
];
const unitTenFlow: StudyLexeme[] = [
  neo("eldamo:1614275633", "luig", "Minute, Moment"),
  neo("eldamo:3602656099", "rong", "bald"),
  neo("eldamo:3188922503", "allu", "nie"),
  neo("eldamo:242022079", "tell", "letzte, final"),
];

const unitFiveReview: StudyLexeme[] = [
  { id: "eldamo:3570217533", surface: "râd", gloss: "Weg, Pfad", mode: "productive" },
  { id: "eldamo:2353825653", surface: "iant", gloss: "Brücke", mode: "productive" },
  { id: "eldamo:1696525921", surface: "duin", gloss: "großer Fluss", mode: "productive" },
  { id: "eldamo:2107077031", surface: "amon", gloss: "Hügel", mode: "productive" },
];
const unitSixReview = [unitSixKin[0], unitSixHome[3], unitSixCraft[0], unitSixCraft[2]];
const unitSevenReview = [unitSevenMake[0], unitSevenMeet[0], unitSevenMeet[2], unitSevenSpeak[1]];
const unitEightReview = [unitEightLinks[0], unitEightPlace[0], unitEightPlace[2], unitEightParts[0]];
const unitNineReview = [unitNineAddress[0], unitNineAddress[1], unitNineCourtesies[0], unitNineCourtesies[2]];

export const unitsSixToTenLessons: Lesson[] = [
  lesson("u6-kin", 6, "Familie am Feuer", "Neue Wörter · Zugehörigkeit", "✦", "new", unitSixKin, "am Lagerfeuer"),
  lesson("u6-home", 6, "Haus und Sippe", "Neue Wörter · Zuhause", "◎", "new", unitSixHome, "im Lager"),
  lesson("u6-review", 6, "Den Weg erinnern", "Wiederholung · Unit 5", "↻", "review", unitFiveReview, "auf der Karte"),
  lesson("u6-craft", 6, "Handwerk und Schutz", "Wörter · Zugehörigkeit", "❋", "grammar", unitSixCraft, "bei der Werkbank"),
  lesson("u6-ramp", 6, "Bei Haus und Feuer", "Anwenden · Abschlussrunde", "◆", "ramp", [...unitSixKin, ...unitSixHome, ...unitSixCraft], "im Lager", unitFiveReview),
  lesson("u7-make", 7, "Etwas vorbereiten", "Neue Wörter · Handlungen", "✦", "new", unitSevenMake, "vor der Wache"),
  lesson("u7-meet", 7, "Hilfe und Begegnung", "Neue Wörter · Handlungen", "◎", "new", unitSevenMeet, "am Weg"),
  lesson("u7-review", 7, "Haus und Feuer erinnern", "Wiederholung · Unit 6", "↻", "review", unitSixReview, "im Lager"),
  lesson("u7-speak", 7, "Rufen und sehen", "Wörter · kuratierte Verben", "❋", "grammar", unitSevenSpeak, "an der Wache"),
  lesson("u7-ramp", 7, "Was geschieht?", "Anwenden · Abschlussrunde", "◆", "ramp", [...unitSevenMake, ...unitSevenMeet, ...unitSevenSpeak], "in der Spielsituation", unitSixReview),
  lesson("u8-links", 8, "Wörter verbinden", "Neue Wörter · Verknüpfen", "✦", "new", unitEightLinks, "beim Erzählen"),
  lesson("u8-place", 8, "Hier und jetzt", "Neue Wörter · Zeit und Ort", "◎", "new", unitEightPlace, "am Treffpunkt"),
  lesson("u8-review", 8, "Handlungen erinnern", "Wiederholung · Unit 7", "↻", "review", unitSevenReview, "bei der Wache"),
  lesson("u8-parts", 8, "Wortbausteine erkennen", "Grammatik · Bausteine", "❋", "grammar", unitEightParts, "in der Schreibstube"),
  lesson("u8-ramp", 8, "Kleine Verbindungen", "Anwenden · Abschlussrunde", "◆", "ramp", [...unitEightLinks, ...unitEightPlace, ...unitEightParts], "in einer Erzählung", unitSevenReview),
  lesson("u9-address", 9, "Anrede verstehen", "Neo-Brücke · Personen", "✦", "new", unitNineAddress, "bei einer Begrüßung"),
  lesson("u9-together", 9, "Zusammen unterwegs", "Neo-Brücke · Gruppe", "◎", "new", unitNineTogether, "in der Gruppe"),
  lesson("u9-review", 9, "Verbindungen erinnern", "Wiederholung · Unit 8", "↻", "review", unitEightReview, "beim Erzählen"),
  lesson("u9-courtesies", 9, "Bitten und danken", "Neo-Brücke · Höflichkeit", "❋", "grammar", unitNineCourtesies, "im Lager"),
  lesson("u9-ramp", 9, "Mit anderen sprechen", "Neo-Brücke · Abschlussrunde", "◆", "ramp", [...unitNineAddress, ...unitNineTogether, ...unitNineCourtesies], "in einer Begegnung", unitEightReview),
  lesson("u10-time", 10, "Wann ist es?", "Neo-Brücke · Zeit", "✦", "new", unitTenTime, "auf der Reise"),
  lesson("u10-day", 10, "Der Lauf des Tages", "Neo-Brücke · Tageszeit", "◎", "new", unitTenDay, "im Tageslauf"),
  lesson("u10-review", 10, "Anreden erinnern", "Wiederholung · Unit 9", "↻", "review", unitNineReview, "in der Gruppe"),
  lesson("u10-flow", 10, "Zeitpunkte erkennen", "Neo-Brücke · Zeitwörter", "❋", "grammar", unitTenFlow, "beim Aufbruch"),
  lesson("u10-ramp", 10, "Zeit und Person", "Neo-Brücke · Abschlussrunde", "◆", "ramp", [...unitTenTime, ...unitTenDay, ...unitTenFlow], "in einer Reiseszene", unitNineReview),
];
