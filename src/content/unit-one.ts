import type { Exercise, Lesson } from "../domain";

const source = "Eldamo · kuratierter Unit-1-Wortschatz";
const gateInscription = "Tolkien · belegte Formel";
const neo = "Neo-Sindarin · Kurskonvention";

const choice = (
  id: string,
  prompt: string,
  choices: string[],
  answer: string,
  _hint: string,
  status: Exercise["status"] = "attested",
  exerciseSource = source,
): Exercise => ({ id, kind: "choice", prompt, choices, answer, status, source: exerciseSource });

const type = (
  id: string,
  prompt: string,
  answer: string,
  _hint: string,
  status: Exercise["status"] = "attested",
  exerciseSource = source,
): Exercise => ({ id, kind: "type", prompt, answer, status, source: exerciseSource });

const cloze = (
  id: string,
  prompt: string,
  choices: string[],
  answer: string,
  _hint: string,
  status: Exercise["status"] = "attested",
  exerciseSource = source,
): Exercise => ({ id, kind: "cloze", prompt, choices, answer, status, source: exerciseSource });

const order = (
  id: string,
  prompt: string,
  tokens: string[],
  answer: string,
  _hint: string,
  status: Exercise["status"] = "attested",
  exerciseSource = source,
): Exercise => ({ id, kind: "order", prompt, tokens, answer, status, source: exerciseSource });

const match = (
  id: string,
  prompt: string,
  pairs: Array<{ left: string; right: string }>,
  _hint: string,
  status: Exercise["status"] = "attested",
  exerciseSource = source,
): Exercise => ({ id, kind: "match", prompt, pairs, answer: "match", status, source: exerciseSource });

/** Four curated 15-question lessons. No session is padded with cloned tasks. */
export const unitOneLessons: Lesson[] = [
  {
    id: "arrival",
    unit: 1,
    title: "Begrüßung am Feuer",
    subtitle: "Neue Wörter · Ankommen",
    icon: "✦",
    phase: "new",
    lexemeIds: ["eldamo:3420722951", "eldamo:2372353107", "eldamo:2964964287", "eldamo:2338511755", "tadlam:hannon-le"],
    exercises: [
      choice("u1a1", "Was bedeutet „Mae govannen“?", ["Sei gegrüßt!", "Tritt ein!", "Wo ist das Tor?"], "Sei gegrüßt!", "Eine feste Begrüßungsformel.", "attested", gateInscription),
      choice("u1a2", "Was bedeutet „mellon“?", ["Freund", "Wald", "Feuer"], "Freund", "Das Wort erscheint an einem berühmten Tor."),
      choice("u1a3", "Welche Grundbedeutung hat „mae“?", ["gut, wohl", "groß", "sprechen"], "gut, wohl", "Es steckt in der Begrüßungsformel."),
      match("u1a4", "Ordne die ersten Wörter zu.", [{ left: "mae", right: "gut, wohl" }, { left: "mellon", right: "Freund" }, { left: "suilad", right: "Gruß" }], "Suilad ist hier ein Wort für einen Gruß, keine freie Begrüßungsregel."),
      cloze("u1a5", "Ergänze die feste Formel: Mae ___.", ["govannen", "mellon", "minno"], "govannen", "Die beiden Wörter bleiben in Unit 1 eine feste Formel.", "attested", gateInscription),
      type("u1a6", "Tippe das Wort für „Freund“.", "mellon", "MEL-lon."),
      choice("u1a7", "Du bekommst Hilfe beim Aufbau des Lagers. Welche Formel passt?", ["Hannon le", "Mae govannen", "mellon"], "Hannon le", "Eine feste Dankformel.", "neo", neo),
      choice("u1a8", "Was drückt „Hannon le“ aus?", ["Danke dir", "Sei gegrüßt", "Sprich!"], "Danke dir", "Eine feste Dankformel.", "neo", neo),
      order("u1a9", "Ordne die Begrüßung.", ["govannen", "Mae"], "Mae govannen", "Beginne mit Mae.", "attested", gateInscription),
      choice("u1a10", "Welches Wort bezeichnet einen Gruß?", ["suilad", "mellon", "mae"], "suilad", "In dieser Unit wird es nur erkannt, nicht frei eingesetzt."),
      cloze("u1a11", "Welche Formel passt zur deutschen Begrüßung? ___", ["Mae govannen", "Hannon le", "Pedo"], "Mae govannen", "Die Formel wird als Ganzes gelernt.", "attested", gateInscription),
      type("u1a12", "Tippe das Wort für „Gruß“.", "suilad", "SUI-lad."),
      choice("u1a13", "Du triffst eine befreundete Person am Feuer. Was passt als Begrüßung?", ["Mae govannen", "Hannon le", "minno"], "Mae govannen", "Die Szene verlangt eine Begrüßung, keinen Dank."),
      match("u1a14", "Ordne die festen Ausdrücke ihren Situationen zu.", [{ left: "Mae govannen", right: "jemanden begrüßen" }, { left: "Hannon le", right: "für Hilfe danken" }], "Beide Ausdrücke werden als feste Einheiten verwendet.", "neo", neo),
      choice("u1a15", "Welches Wort aus dieser Lektion bedeutet „Freund“?", ["mellon", "suilad", "mae"], "mellon", "Dein erster freier Wortabruf."),
    ],
  },
  {
    id: "camp",
    unit: 1,
    title: "Was siehst du im Lager?",
    subtitle: "Neue Wörter · Orte erkennen",
    icon: "◎",
    phase: "new",
    lexemeIds: ["eldamo:2544797639", "eldamo:3001223523", "eldamo:3606114301", "eldamo:809570117", "eldamo:1590244863", "eldamo:2756894593"],
    exercises: [
      choice("u1c1", "Was bedeutet „echad“?", ["Lager", "Wald", "Tür"], "Lager", "Echad bezeichnet hier das Lager als Ort."),
      choice("u1c2", "Was bedeutet „naur“?", ["Feuer", "Wasser", "Freund"], "Feuer", "Ein gutes Wort für das Lagerfeuer."),
      choice("u1c3", "Was bedeutet „annon“?", ["großes Tor", "Schild", "Gruß"], "großes Tor", "Annon bezeichnet ein großes Tor."),
      choice("u1c4", "Was bedeutet „taur“?", ["Wald", "Lager", "Name"], "Wald", "TAUR."),
      match("u1c5", "Ordne Orte und Dinge zu.", [{ left: "echad", right: "Lager" }, { left: "naur", right: "Feuer" }, { left: "annon", right: "großes Tor" }], "Richtige Paare bleiben liegen."),
      type("u1c6", "Tippe das Wort für „Wald“.", "taur", "TAUR."),
      cloze("u1c7", "Das Sindarin-Wort für ein großes Tor ist ___.", ["annon", "naur", "mellon"], "annon", "Es beginnt mit AN-."),
      choice("u1c8", "Du siehst Flammen am Ankunftsort. Welches Wort passt?", ["naur", "taur", "echad"], "naur", "Die Szene hilft dir beim Erinnern."),
      type("u1c9", "Tippe das Wort für „Lager“.", "echad", "E-chad."),
      choice("u1c10", "Welche Grundbedeutung hat der Stamm „cen-“?", ["sehen, wahrnehmen", "kommen", "danken"], "sehen, wahrnehmen", "Der Stamm bleibt in Unit 1 Erkennungswortschatz."),
      choice("u1c11", "Welche Grundbedeutung hat „tol-“?", ["kommen", "sprechen", "öffnen"], "kommen", "Auch dieses Verb wird hier nur erkannt."),
      match("u1c12", "Finde die passenden Bilder im Kopf: Wort und Bedeutung.", [{ left: "taur", right: "Wald" }, { left: "mellon", right: "Freund" }, { left: "naur", right: "Feuer" }], "Ein Wort aus der ersten Lektion ist dabei."),
      cloze("u1c13", "Eine Waldszene verweist auf ___.", ["taur", "annon", "suilad"], "taur", "Kein Satzbau wird hier neu gelernt – nur Wortschatz."),
      type("u1c14", "Tippe das Wort für „Feuer“.", "naur", "NA-ur."),
      choice("u1c15", "Welche drei Dinge passen zu einer Ankunftsszene?", ["echad · naur · annon", "mellon · suilad · tol-", "mae · cen- · minno"], "echad · naur · annon", "Lager, Feuer und Tor sind die neuen Szenenwörter."),
    ],
  },
  {
    id: "gate",
    unit: 1,
    title: "Die Wache spricht",
    subtitle: "Grammatik · feste Imperative",
    icon: "❋",
    phase: "grammar",
    lexemeIds: ["eldamo:599418975", "eldamo:2086508063", "eldamo:3670583905", "eldamo:2964964287"],
    exercises: [
      choice("u1g1", "Was bedeutet „Pedo mellon a minno“?", ["Sage „Freund“ und tritt ein.", "Der Freund bewacht das Tor.", "Der Wald ist groß."], "Sage „Freund“ und tritt ein.", "Lerne den Satz zunächst als feste Übersetzung.", "attested", gateInscription),
      choice("u1g2", "Für „Sage ‚Freund‘ und tritt ein“ bedeutet „pedo“ …", ["sprich, sage!", "tritt ein!", "komm!"], "sprich, sage!", "Die Form gehört zu ped-.", "attested", gateInscription),
      choice("u1g3", "Für „Sage ‚Freund‘ und tritt ein“ bedeutet „minno“ …", ["tritt ein!", "danke!", "sieh!"], "tritt ein!", "Die Form gehört zu minna-.", "attested", gateInscription),
      match("u1g4", "Ordne Stamm und kuratierte Imperativform zu.", [{ left: "ped-", right: "pedo" }, { left: "minna-", right: "minno" }], "Nur diese beiden Imperativbildungen sind in Unit 1 produktiv freigegeben.", "attested", gateInscription),
      order("u1g5", "Ordne: „Sage ‚Freund‘ und tritt ein.“", ["mellon", "minno", "Pedo", "a"], "Pedo mellon a minno", "Die kleine Verbindung a steht zwischen mellon und minno.", "attested", gateInscription),
      cloze("u1g6", "Vervollständige „Sage ‚Freund‘ und tritt ein“: Pedo mellon a ___.", ["minno", "govannen", "taur"], "minno", "Die letzte Aufforderung bedeutet „tritt ein“.", "attested", gateInscription),
      choice("u1g7", "Welche Grundform steckt hinter „pedo“?", ["ped-", "minna-", "tol-"], "ped-", "Die Grundform wird im Wörterbuch mit Bindestrich gezeigt."),
      type("u1g8", "Tippe die kuratierte Form für „Sprich!/Sage!“.", "pedo", "PE-do.", "attested", gateInscription),
      choice("u1g9", "Welche Grundform steckt hinter „minno“?", ["minna-", "ped-", "cen-"], "minna-", "Die Imperativform endet hier auf -o."),
      order("u1g10", "Ordne erneut: „Sage ‚Freund‘ und tritt ein.“", ["a", "Pedo", "minno", "mellon"], "Pedo mellon a minno", "Zuerst kommt die Aufforderung zu sprechen.", "attested", gateInscription),
      choice("u1g11", "Welche Bedeutung hat „Pedo mellon a minno“?", ["Sage „Freund“ und tritt ein.", "Sei gegrüßt, Freund.", "Komm zum Lagerfeuer."], "Sage „Freund“ und tritt ein.", "Lerne die Formel als feste Übersetzung.", "attested", gateInscription),
      type("u1g12", "Tippe die kuratierte Form für „Tritt ein!“.", "minno", "MIN-no.", "attested", gateInscription),
      cloze("u1g13", "Vervollständige „Sage ‚Freund‘ und tritt ein“: ___ mellon a minno.", ["Pedo", "Mae", "Hannon"], "Pedo", "Die erste Form gehört zu ped-.", "attested", gateInscription),
      match("u1g14", "Ordne Formen und Bedeutung zu.", [{ left: "pedo", right: "sprich, sage!" }, { left: "minno", right: "tritt ein!" }, { left: "mellon", right: "Freund" }], "So setzt sich „Sage ‚Freund‘ und tritt ein“ zusammen.", "attested", gateInscription),
      choice("u1g15", "Welches Wort bedeutet in „Pedo mellon a minno“ „Freund“?", ["mellon", "minno", "pedo"], "mellon", "Mellon bedeutet „Freund“.", "attested", gateInscription),
    ],
  },
  {
    id: "ramp",
    unit: 1,
    title: "Tor geöffnet",
    subtitle: "Anwenden · Abschlussrunde",
    icon: "◆",
    phase: "ramp",
    lexemeIds: ["eldamo:209902113", "eldamo:3420722951", "eldamo:2964964287", "eldamo:3606114301", "eldamo:809570117", "eldamo:2338511755", "eldamo:3670583905", "tadlam:hannon-le"],
    exercises: [
      choice("u1r1", "Du triffst am Feuer eine neue Person. Welches Wort kannst du als Gruß erkennen?", ["suilad", "mellon", "taur"], "suilad", "Suilad bezeichnet einen Gruß."),
      choice("u1r2", "Welche Grundbedeutung ist für „edra-“ verzeichnet?", ["sich öffnen", "sehen", "Wald"], "sich öffnen", "Auch dieses Verb bleibt zunächst Erkennungswortschatz."),
      choice("u1r3", "Eine Person kommt am Lager an. Welche Formel passt zuerst?", ["Mae govannen", "Hannon le", "Pedo mellon a minno"], "Mae govannen", "Zuerst begrüßen, dann folgen die anderen Schritte."),
      match("u1r4", "Ordne die Kernwörter der Unit zu.", [{ left: "mellon", right: "Freund" }, { left: "annon", right: "großes Tor" }, { left: "taur", right: "Wald" }], "Diese Wörter sind jetzt für den Abruf freigegeben."),
      cloze("u1r5", "Bei einer Hilfe am Lager passt: ___.", ["Hannon le", "Mae govannen", "Pedo mellon a minno"], "Hannon le", "Eine feste Dankformel.", "neo", neo),
      order("u1r6", "Ordne die Begrüßung.", ["govannen", "Mae"], "Mae govannen", "Eine feste Einheit.", "attested", gateInscription),
      type("u1r7", "Tippe das Wort für „großes Tor“.", "annon", "AN-non."),
      choice("u1r8", "Welche Form ist der Imperativ zu minna-?", ["minno", "minna-", "pedo"], "minno", "Die Form wurde an der Wache geübt."),
      cloze("u1r9", "Ein Weg durch den Wald führt durch den ___.", ["taur", "mellon", "suilad"], "taur", "Hier wird nur Wortschatz abgefragt, kein neuer Satzbau."),
      order("u1r10", "Ordne: „Sage ‚Freund‘ und tritt ein.“", ["minno", "a", "mellon", "Pedo"], "Pedo mellon a minno", "Die bekannte feste Formel.", "attested", gateInscription),
      choice("u1r11", "Welche Formel passt, wenn du jemanden am Lager begrüßt?", ["Mae govannen", "Hannon le", "Pedo mellon a minno"], "Mae govannen", "Begrüße zuerst, bevor du dankst oder eine Aufforderung gibst.", "attested", gateInscription),
      type("u1r12", "Tippe das Wort für „Wald“.", "taur", "TAUR."),
      choice("u1r13", "Welches Wort ergänzt „Sage ‚Freund‘ und tritt ein“: Pedo mellon a ___?", ["minno", "govannen", "annon"], "minno", "Der letzte Baustein bedeutet „tritt ein“.", "attested", gateInscription),
      match("u1r14", "Ordne die Formeln ihren Situationen zu.", [{ left: "Mae govannen", right: "jemanden begrüßen" }, { left: "Hannon le", right: "für Hilfe danken" }], "Wähle die Formel nach der Spielsituation.", "neo", neo),
      choice("u1r15", "Wie heißt „Sage ‚Freund‘ und tritt ein“?", ["Pedo mellon a minno", "Mae govannen", "Hannon le"], "Pedo mellon a minno", "Die Formel wird als feste Einheit wiederholt."),
    ],
  },
];
