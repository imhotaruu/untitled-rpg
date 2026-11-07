// Count visible characters, not UTF-16 code units, so accented text and emoji
// never appear as half a character during the reveal.
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export function splitStoryCharacters(text) {
  return Array.from(segmenter.segment(text), (part) => part.segment);
}

export function getStoryCharacterDelay(character, speed = "normal") {
  const multiplier = speed === "instant" ? 0 : speed === "slow" ? 2 : speed === "fast" ? 0.5 : 1;
  const delay = /[.!?…]/u.test(character) ? 180 : /[,;:—]/u.test(character) ? 90 : 24;
  return delay * multiplier;
}

export const initialStoryCursor = { line: 0, shown: 0, finished: false };

export function advanceStoryCursor(cursor, lineLength, lineCount) {
  if (cursor.finished) return cursor;
  if (cursor.shown < lineLength) return { ...cursor, shown: lineLength };
  if (cursor.line + 1 < lineCount) return { line: cursor.line + 1, shown: 0, finished: false };
  return { ...cursor, finished: true };
}
