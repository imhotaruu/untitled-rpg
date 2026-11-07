import assert from "node:assert/strict";
import test from "node:test";
import { advanceStoryCursor, initialStoryCursor, splitStoryCharacters, getStoryCharacterDelay } from "../src/utils/storyTyping.js";

test("click reveals a partial line before advancing and finishes only after the final line", () => {
  const partial = { ...initialStoryCursor, shown: 3 };
  const revealed = advanceStoryCursor(partial, 12, 2);
  assert.deepEqual(revealed, { line: 0, shown: 12, finished: false });
  const next = advanceStoryCursor(revealed, 12, 2);
  assert.deepEqual(next, { line: 1, shown: 0, finished: false });
  const finalLine = advanceStoryCursor(next, 8, 2);
  assert.equal(finalLine.finished, false);
  const finished = advanceStoryCursor(finalLine, 8, 2);
  assert.equal(finished.finished, true);
  assert.equal(advanceStoryCursor(finished, 8, 2), finished);
});

test("Unicode graphemes reveal intact, including accented letters and joined emoji", () => {
  assert.deepEqual(splitStoryCharacters("Aé…"), ["A", "é", "…"]);
  assert.deepEqual(splitStoryCharacters("e\u0301🌟👩‍👧"), ["e\u0301", "🌟", "👩‍👧"]);
});

test("punctuation adds readable pauses without changing the manuscript", () => {
  assert.ok(getStoryCharacterDelay(".") > getStoryCharacterDelay(","));
  assert.ok(getStoryCharacterDelay(",") > getStoryCharacterDelay("a"));
  const text = "Astraea: ‘Hello… little one.’";
  assert.equal(splitStoryCharacters(text).join(""), text);
});

test("instant text uses the same manual advance path and empty lines cannot trap the reader", () => {
  const instant = { ...initialStoryCursor, shown: 40 };
  assert.equal(advanceStoryCursor(instant, 40, 1).finished, true);
  assert.deepEqual(advanceStoryCursor(initialStoryCursor, 0, 2), { line: 1, shown: 0, finished: false });
});

test("text speeds scale both letters and punctuation, with safe defaults", () => {
  for (const character of ["a", ",", "—", ".", "…"]) {
    const normal = getStoryCharacterDelay(character);
    assert.equal(getStoryCharacterDelay(character, "slow"), normal * 2);
    assert.equal(getStoryCharacterDelay(character, "fast"), normal / 2);
    assert.equal(getStoryCharacterDelay(character, "instant"), 0);
    assert.equal(getStoryCharacterDelay(character, "invalid"), normal);
  }
});

test("successive inputs need no elapsed time to reveal and advance every line", () => {
  const lengths = [8, 32, 2];
  let cursor = initialStoryCursor;
  const visited = [];
  for (let click = 0; click < 6; click++) {
    const before = cursor;
    cursor = advanceStoryCursor(cursor, lengths[cursor.line], lengths.length);
    if (cursor.shown > before.shown) visited.push(cursor.line);
  }
  assert.deepEqual(visited, [0, 1, 2]);
  assert.equal(cursor.finished, true);
  assert.equal(advanceStoryCursor(cursor, 2, lengths.length), cursor);
});
