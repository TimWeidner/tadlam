import type { Lesson } from "../domain";
import { pairExercises, vocabularyExercises, type FormPair, type StudyLexeme } from "./exercise-factories";

const lesson = (id: string, unit: number, title: string, subtitle: string, icon: string, phase: Lesson["phase"], words: StudyLexeme[], scene: string, reviewWords: StudyLexeme[] = []): Lesson => ({ id, unit, title, subtitle, icon, phase, lexemeIds: [...words, ...reviewWords].map((word) => word.id), exercises: vocabularyExercises(id, words, scene, reviewWords) });

const unitTwoPeople: StudyLexeme[] = [
  { id: "eldamo:753238821", surface: "Adan", gloss: "Mensch (Volk)", mode: "recognition" },
  { id: "eldamo:3444049341", surface: "hîr", gloss: "Herr, Gebieter", mode: "productive" },
  { id: "eldamo:2862812157", surface: "hiril", gloss: "Herrin, Dame", mode: "productive" },
  { id: "eldamo:492190783", surface: "sadron", gloss: "treuer Gefährte", mode: "recognition" },
  { id: "eldamo:1681096947", surface: "tir-", gloss: "wachen, bewachen", mode: "recognition" },
];
const unitTwoGear: StudyLexeme[] = [
  { id: "eldamo:677121227", surface: "coll", gloss: "Umhang", mode: "productive" },
  { id: "eldamo:3519182345", surface: "megil", gloss: "Schwert", mode: "productive" },
  { id: "eldamo:224267161", surface: "thand", gloss: "Schild", mode: "productive" },
  { id: "eldamo:2183766783", surface: "cû", gloss: "Bogen", mode: "recognition" },
  { id: "eldamo:3875004085", surface: "roch", gloss: "Pferd", mode: "productive" },
  { id: "eldamo:2242483507", surface: "mâb", gloss: "Hand", mode: "recognition" },
];
const unitTwoStores: StudyLexeme[] = [
  { id: "eldamo:3687268913", surface: "nen", gloss: "Wasser", mode: "productive" },
  { id: "eldamo:1283740149", surface: "bas", gloss: "Brot", mode: "productive" },
  { id: "eldamo:2594874609", surface: "calen", gloss: "grün, frisch", mode: "productive" },
  { id: "eldamo:3202359171", surface: "beleg", gloss: "groß, mächtig", mode: "productive" },
];
const unitOneReview: StudyLexeme[] = [
  { id: "eldamo:3420722951", surface: "mae", gloss: "gut, wohl", mode: "recognition" },
  { id: "eldamo:2964964287", surface: "mellon", gloss: "Freund", mode: "productive" },
  { id: "eldamo:3606114301", surface: "annon", gloss: "(großes) Tor", mode: "productive" },
  { id: "eldamo:809570117", surface: "taur", gloss: "Wald", mode: "productive" },
  { id: "eldamo:2544797639", surface: "echad", gloss: "Lager", mode: "productive" },
  { id: "eldamo:3001223523", surface: "naur", gloss: "Feuer", mode: "productive" },
];

const unitThreeNature: StudyLexeme[] = [
  { id: "eldamo:1324303307", surface: "i", gloss: "der, die, das (Artikel)", mode: "recognition" },
  { id: "eldamo:3005081253", surface: "galadh", gloss: "Baum", mode: "recognition" },
  { id: "eldamo:3362852287", surface: "lass", gloss: "Blatt", mode: "recognition" },
  { id: "eldamo:3061781529", surface: "orn", gloss: "hoher Baum", mode: "recognition" },
  { id: "eldamo:524936671", surface: "hîth", gloss: "Nebel", mode: "productive" },
];
const unitThreeGround: StudyLexeme[] = [
  { id: "eldamo:742218303", surface: "sîr", gloss: "Fluss, Bach", mode: "productive" },
  { id: "eldamo:1057523367", surface: "sarn", gloss: "kleiner Stein", mode: "productive" },
  { id: "eldamo:195870091", surface: "parth", gloss: "Wiese", mode: "recognition" },
  { id: "eldamo:1460112939", surface: "tawar", gloss: "Waldland", mode: "recognition" },
  { id: "eldamo:3118136801", surface: "thind", gloss: "grau", mode: "recognition" },
];
const unitThreeForms: StudyLexeme[] = [
  { id: "eldamo:509187197", surface: "morn", gloss: "dunkel, schwarz", mode: "productive" },
  { id: "eldamo:1480623705", surface: "baran", gloss: "braun, goldbraun", mode: "recognition" },
  { id: "eldamo:184000497", surface: "peth", gloss: "Wort", mode: "productive" },
  { id: "eldamo:3702347683", surface: "paur", gloss: "Faust", mode: "recognition" },
];
const unitTwoReview: StudyLexeme[] = [
  unitTwoPeople[1],
  unitTwoPeople[2],
  unitTwoGear[0],
  unitTwoGear[1],
  unitTwoStores[0],
  unitTwoStores[1],
];
const unitThreeReview: StudyLexeme[] = [
  unitThreeNature[1],
  unitThreeNature[4],
  unitThreeGround[0],
  unitThreeGround[1],
  unitThreeForms[0],
  unitThreeForms[2],
];

const unitFourPairs: FormPair[] = [
  { id: "annon", lexemeId: "eldamo:3606114301", singular: "annon", plural: "ennyn", gloss: "Tor/Tore" }, { id: "adan", lexemeId: "eldamo:753238821", singular: "Adan", plural: "Edain", gloss: "Mensch/Menschen" },
  { id: "aran", lexemeId: "eldamo:658710813", singular: "aran", plural: "erain", gloss: "König/Könige" }, { id: "barad", lexemeId: "eldamo:2375289541", singular: "barad", plural: "beraid", gloss: "Turm/Türme" },
  { id: "amon", lexemeId: "eldamo:2107077031", singular: "amon", plural: "emyn", gloss: "Hügel/Hügel" }, { id: "edhel", lexemeId: "eldamo:311394245", singular: "Edhel", plural: "Edhil", gloss: "Elf/Elben" },
  { id: "orch", lexemeId: "eldamo:86383055", singular: "orch", plural: "yrch", gloss: "Ork/Orks" }, { id: "naug", lexemeId: "eldamo:1009966641", singular: "naug", plural: "noeg", gloss: "Zwerg/Zwerge" },
  { id: "galadh", lexemeId: "eldamo:3005081253", singular: "galadh", plural: "gelaidh", gloss: "Baum/Bäume" }, { id: "hen", lexemeId: "eldamo:1512724021", singular: "hên", plural: "hîn", gloss: "Kind/Kinder" },
  { id: "narn", lexemeId: "eldamo:1452341695", singular: "narn", plural: "nern", gloss: "Erzählung/Erzählungen" }, { id: "rath", lexemeId: "eldamo:1667426933", singular: "rath", plural: "raith", gloss: "Pfad/Pfade" },
  { id: "certh", lexemeId: "eldamo:285722173", singular: "certh", plural: "cirth", gloss: "Rune/Runen" }, { id: "tal", lexemeId: "eldamo:2760610079", singular: "tâl", plural: "tail", gloss: "Fuß/Füße" },
];
const unitFourReview: StudyLexeme[] = [
  { id: unitFourPairs[0].lexemeId, surface: "ennyn", gloss: "Tore", mode: "productive" },
  { id: unitFourPairs[2].lexemeId, surface: "erain", gloss: "Könige", mode: "productive" },
  { id: unitFourPairs[3].lexemeId, surface: "beraid", gloss: "Türme", mode: "productive" },
  { id: unitFourPairs[6].lexemeId, surface: "yrch", gloss: "Orks", mode: "recognition" },
  { id: unitFourPairs[8].lexemeId, surface: "gelaidh", gloss: "Bäume", mode: "productive" },
  { id: unitFourPairs[11].lexemeId, surface: "raith", gloss: "Pfade", mode: "productive" },
];

const unitFivePlace: StudyLexeme[] = [
  { id: "eldamo:2583985695", surface: "mi", gloss: "in", mode: "recognition" }, { id: "eldamo:3149142565", surface: "na", gloss: "zu, auf … zu", mode: "recognition" },
  { id: "eldamo:2407603967", surface: "o", gloss: "von, aus", mode: "recognition" }, { id: "eldamo:3815044181", surface: "nu", gloss: "unter", mode: "recognition" },
  { id: "eldamo:1223027571", surface: "thar", gloss: "über, quer durch", mode: "recognition" }, { id: "eldamo:667014213", surface: "an", gloss: "zu, für", mode: "recognition" },
];
const unitFiveWay: StudyLexeme[] = [
  { id: "eldamo:3570217533", surface: "râd", gloss: "Weg, Pfad", mode: "productive" }, { id: "eldamo:2353825653", surface: "iant", gloss: "Brücke", mode: "productive" },
  { id: "eldamo:1696525921", surface: "duin", gloss: "großer Fluss", mode: "productive" }, { id: "eldamo:2107077031", surface: "amon", gloss: "Hügel", mode: "productive" },
  { id: "eldamo:348549421", surface: "forod", gloss: "Norden", mode: "recognition" }, { id: "eldamo:614934925", surface: "harad", gloss: "Süden", mode: "recognition" },
  { id: "eldamo:1864027637", surface: "annûn", gloss: "Westen", mode: "recognition" }, { id: "eldamo:2972186711", surface: "rhûn", gloss: "Osten", mode: "recognition" },
];
const unitFiveAction: StudyLexeme[] = [
  { id: "eldamo:800667727", surface: "men-", gloss: "gehen", mode: "recognition" }, { id: "eldamo:1272131327", surface: "anna-", gloss: "geben", mode: "recognition" },
  { id: "eldamo:3923493535", surface: "lasta-", gloss: "hören, lauschen", mode: "recognition" }, { id: "eldamo:184000497", surface: "peth", gloss: "Wort", mode: "recognition" },
  { id: "eldamo:3923493535:frame", surface: "Lasto beth", gloss: "Höre auf das Wort", mode: "productive" },
];

const pairLesson = (id: string, title: string, pairs: FormPair[], reviewPairs: FormPair[] = []): Lesson => ({ id, unit: 4, title, subtitle: "Einzahl · Mehrzahl", icon: "◌", phase: "grammar", lexemeIds: [...pairs, ...reviewPairs].map((pair) => pair.lexemeId), exercises: pairExercises(id, pairs, "Vor dem Tor", reviewPairs) });

export const unitsTwoToFiveLessons: Lesson[] = [
  lesson("u2-people", 2, "Menschen am Feuer", "Neue Wörter · Rollen", "✦", "new", unitTwoPeople, "am Lagerfeuer"),
  lesson("u2-gear", 2, "Ausrüstung wählen", "Neue Wörter · Gepäck", "◎", "new", unitTwoGear, "bei der Wache"),
  lesson("u2-review", 2, "Am Feuer erinnern", "Wiederholung · Unit 1", "↻", "review", unitOneReview, "am Lagerfeuer"),
  lesson("u2-stores", 2, "Vorräte im Lager", "Neue Wörter · Versorgung", "⌁", "new", unitTwoStores, "beim Packen"),
  lesson("u2-ramp", 2, "Wache und Gepäck", "Anwenden · Abschlussrunde", "◆", "ramp", [...unitTwoPeople, ...unitTwoGear, ...unitTwoStores], "in einer Lagerszene", unitOneReview),
  lesson("u3-nature", 3, "Zwischen den Bäumen", "Neue Wörter · Wald", "✦", "new", unitThreeNature, "im Wald"),
  lesson("u3-ground", 3, "Wasser und Weg", "Neue Wörter · Gelände", "◎", "new", unitThreeGround, "am Waldrand"),
  lesson("u3-review", 3, "Packliste wiederholen", "Wiederholung · Unit 2", "↻", "review", unitTwoReview, "im Lager"),
  lesson("u3-forms", 3, "Spuren im Nebel", "Wörter · feste Formen", "❋", "grammar", unitThreeForms, "auf dem Waldpfad"),
  lesson("u3-ramp", 3, "Waldpfad", "Anwenden · Abschlussrunde", "◆", "ramp", [...unitThreeNature, ...unitThreeGround, ...unitThreeForms], "im Wald", unitTwoReview),
  pairLesson("u4-gates", "Ein Tor, viele Tore", unitFourPairs.slice(0, 4)),
  pairLesson("u4-arrivals", "Wer kommt zum Tor?", unitFourPairs.slice(4, 8)),
  lesson("u4-review", 4, "Waldpfad wiederholen", "Wiederholung · Unit 3", "↻", "review", unitThreeReview, "im Wald"),
  pairLesson("u4-signs", "Zeichen draußen", unitFourPairs.slice(8, 12)),
  pairLesson("u4-ramp", "Einzelne und mehrere", unitFourPairs, [unitFourPairs[0], unitFourPairs[1], unitFourPairs[8]]),
  lesson("u5-place", 5, "Richtung erkennen", "Neue Wörter · Präpositionen", "✦", "new", unitFivePlace, "auf der Karte"),
  lesson("u5-way", 5, "Über Wege und Brücken", "Neue Wörter · Orientierung", "◎", "new", unitFiveWay, "unterwegs"),
  lesson("u5-review", 5, "Torformen wiederholen", "Wiederholung · Unit 4", "↻", "review", unitFourReview, "vor dem Tor"),
  lesson("u5-action", 5, "Auf ein Wort hören", "Feste Form · Objekt", "❋", "grammar", unitFiveAction, "an der Wache"),
  lesson("u5-ramp", 5, "Den Weg finden", "Anwenden · Abschlussrunde", "◆", "ramp", [...unitFivePlace, ...unitFiveWay, ...unitFiveAction], "auf dem Weg", [unitOneReview[0], unitThreeGround[0], unitThreeNature[1]]),
];
