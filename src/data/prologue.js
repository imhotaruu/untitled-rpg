import { prologuePassages } from "./prologueScript";

export const prologueTitle = "When the Stars Faltered";
export const chapterOne = { id: "chapter_1_act_1", label: "Chapter 1 · Act 1", title: "A Place to Begin" };
export const chapterOpening = "Morning light reaches the Stonefield house. Your father, Garron, waits outside with a wooden training sword; your mother, Elira, sorts herbs for the village. Once adventurers, they have made a quieter life here. Today, that life opens a little wider for you.";

export const prologueScenes = [
  ...prologuePassages,
  { id: "birth", title: "A New Life", speaker: "Narration", text: "A newborn baby's cry fills the Stonefield home. Elira holds you close. Beside her, Garron reaches out a trembling hand.", creation: true },
  { id: "chapter", speaker: chapterOne.label, title: chapterOne.title, chapter: true, beats: [
    { speaker: "Narration", text: "Years pass in the warmth of the Stonefield home. Your parents' days of adventure become stories told by the hearth. Their lessons take quieter forms: a steady stance, a carefully wrapped herb, a hand offered when you stumble." },
    { speaker: "Narration", text: chapterOpening },
  ] },
];
