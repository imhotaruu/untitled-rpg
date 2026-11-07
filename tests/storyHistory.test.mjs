import assert from "node:assert/strict";
import test from "node:test";
import { getPrependedStoryCount } from "../src/utils/storyHistory.js";

test("one action can prepend multiple story passages", () => {
  assert.equal(getPrependedStoryCount(["earlier", "first"], ["milestone", "discovery", "earlier", "first"]), 2);
});

test("unchanged history cloned by recovery ticks does not move the reader", () => {
  const previous = ["latest", "older"];
  assert.equal(getPrependedStoryCount(previous, [...previous]), 0);
});

test("new passages are detected even when the oldest entries are removed at the cap", () => {
  const previous = Array.from({ length: 50 }, (_, index) => `passage ${index}`);
  assert.equal(getPrependedStoryCount(previous, ["new", ...previous].slice(0, 50)), 1);
  assert.equal(getPrependedStoryCount(previous, ["newest", "new", ...previous].slice(0, 50)), 2);
});

test("repeated narrative text retains its place in the history", () => {
  assert.equal(getPrependedStoryCount(["repeat", "older"], ["repeat", "repeat", "older"]), 1);
  assert.equal(getPrependedStoryCount(["repeat", "older", "first"], ["repeat", "repeat", "older"]), 1);
});

test("loading unrelated history or clearing it resets the reader", () => {
  assert.equal(getPrependedStoryCount(["latest", "older"], ["another save"]), null);
  assert.equal(getPrependedStoryCount(["latest", "older"], []), null);
});

test("empty history and its first passage are handled", () => {
  assert.equal(getPrependedStoryCount([], []), 0);
  assert.equal(getPrependedStoryCount([], ["first"]), 1);
});
