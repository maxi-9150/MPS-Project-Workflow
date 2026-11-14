import test from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  selected,
  total,
  assignable,
  schedulable,
  questionCount,
  validate,
  commit,
  undo,
  testDate,
  applyMaterials,
  restore,
  conflict,
  dateValid,
  timeValid,
  addMinutes,
} from "../src/hi-model.mjs";
const reviewed = (patch = {}) => ({ ...fresh(), reviewed: true, ...patch });
const plan = (patch = {}) =>
  reviewed({
    action: "plan",
    planned: "2026-10-22",
    plannedTime: "10:15",
    resolution: true,
    ...patch,
  });
test("default draft is 16 minutes but the assigned test is only 3 questions / 3 minutes", () => {
  const d = fresh();
  assert.equal(total(d), 16);
  assert.equal(questionCount(d), 3);
  assert.deepEqual(
    assignable(d).map((m) => m.id),
    ["practice"],
  );
  assert.deepEqual(
    schedulable(d).map((m) => m.id),
    ["lesson", "station"],
  );
});
test("assignment never creates Calendar records and sends identical exercise material to every recipient", () => {
  const d = reviewed({ support: { amelia: "Threshold", sofia: "Basic" } });
  const r = commit(d, [], 1000);
  assert.deepEqual(r.sentMaterials, ["practice"]);
  assert.deepEqual(r.recipients, d.recipients);
  assert.deepEqual(r.calendar, []);
  assert.equal(r.movesTest, false);
  assert.deepEqual(r.snapshot.support, d.support);
});
test("class plan has no student assignment and sequences Lesson then Station", () => {
  const r = commit(plan(), [], 1000);
  assert.deepEqual(r.recipients, []);
  assert.deepEqual(r.sentMaterials, []);
  assert.deepEqual(
    r.calendar.map((e) => [e.materialId, e.start, e.end]),
    [
      ["lesson", "10:15", "10:20"],
      ["station", "10:20", "10:28"],
    ],
  );
  assert.equal(r.undoUntil, 31000);
});
test("conflict blocks confirmation until resolved, and recalculation is committed atomically", () => {
  const d = reviewed({ action: "plan" });
  assert.equal(conflict(d), true);
  assert.match(validate(d), /overlaps/);
  assert.throws(() => commit(d, []));
  assert.equal(testDate([]), "2026-10-22");
  const r = commit(plan(), [], 1000);
  assert.equal(testDate([r]), "2026-10-26");
  assert.equal(testDate(undo([r], r.id, 1500)), "2026-10-22");
});
test("safe alternative schedule does not move the planned test", () => {
  const r = commit(plan({ planned: "2026-10-27", resolution: false }), []);
  assert.equal(r.movesTest, false);
  assert.equal(testDate([r]), "2026-10-22");
});
test("Undo removes only its linked plan and leaves another assignment untouched", () => {
  const a = commit(reviewed(), [], 500);
  const p = commit(plan(), [a], 1000);
  assert.deepEqual(undo([a, p], p.id, 31000), [a]);
  assert.throws(() => undo([a, p], p.id, 31001), /expired/);
  assert.throws(() => undo([a], a.id, 1000));
});
test("retrying an ambiguous successful write recovers the existing record without mutation or duplication", () => {
  const d = reviewed();
  const r = commit(d, [], 1000);
  assert.equal(commit(d, [r], 2000), r);
  assert.equal(r.createdAt, 1000);
});
test("the same draft may produce independent assignment and plan branches", () => {
  const d = reviewed();
  const a = commit(d, [], 1000);
  const p = commit(
    {
      ...d,
      action: "plan",
      planned: "2026-10-22",
      plannedTime: "10:15",
      resolution: true,
    },
    [a],
    2000,
  );
  assert.notEqual(a.id, p.id);
  assert.equal(a.draftId, p.draftId);
});
test("library add is transactional, deduplicated and preserves recipients and support", () => {
  const d = reviewed({ support: { amelia: "Basic" } });
  const next = applyMaterials(d, ["numberline", "numberline"]);
  assert.equal(total(next), 22);
  assert.equal(questionCount(next), 7);
  assert.equal(next.selected.length, 4);
  assert.deepEqual(d.selected, ["lesson", "station", "practice"]);
  assert.deepEqual(next.support, d.support);
  assert.deepEqual(next.recipients, d.recipients);
  assert.equal(next.reviewed, false);
});
test("replacement stays in position; unavailable / duplicate replacements are rejected", () => {
  const d = fresh();
  const next = applyMaterials(d, ["walls"], "station");
  assert.deepEqual(next.selected, ["lesson", "walls", "practice"]);
  assert.equal(total(next), 16);
  assert.throws(() => applyMaterials(d, ["lesson"], "station"), /already/);
  assert.throws(() => applyMaterials(d, ["bogus"]), /unavailable/);
  assert.throws(() => applyMaterials(d, ["walls"], "gone"), /no longer/);
});
test("missing material, recipient, title, assignable content or confirmation cannot create a test", () => {
  for (const patch of [
    { selected: [] },
    { recipients: [] },
    { title: " " },
    { selected: ["lesson"] },
    { reviewed: false },
    { selected: ["bogus"] },
    { selected: ["practice", "practice"] },
    { recipients: ["unknown"] },
  ])
    assert.throws(() => commit(reviewed(patch), []));
});
test("practice-only material cannot become a class plan", () => {
  assert.match(validate(plan({ selected: ["practice"] })), /No schedulable/);
});
test("calendar dates, times and midnight overflow are validated", () => {
  assert.equal(dateValid("2026-02-30"), false);
  assert.equal(dateValid("2026-10-22"), true);
  assert.equal(timeValid("24:00"), false);
  assert.equal(timeValid("09:20"), true);
  assert.equal(addMinutes("10:15", 13), "10:28");
  assert.match(validate(plan({ plannedTime: "23:55" })), /valid date/);
  assert.match(
    validate(reviewed({ end: "2026-10-14", endTime: "15:00" })),
    /End must/,
  );
});
test("restoration clears consent, filters unknown values and does not alter the original saved data", () => {
  const d = reviewed({
    selected: ["lesson", "lesson", "bogus"],
    recipients: ["amelia", "bogus"],
  });
  const s = JSON.stringify(d);
  const r = restore(s);
  assert.equal(r.reviewed, false);
  assert.deepEqual(r.selected, ["lesson"]);
  assert.deepEqual(r.recipients, ["amelia"]);
  assert.equal(JSON.parse(s).reviewed, true);
  assert.equal(restore("broken").selected.length, 3);
});
test("snapshots remain independent from edits to the live review", () => {
  const d = reviewed();
  const r = commit(d, []);
  d.selected.push("numberline");
  d.recipients.pop();
  assert.equal(r.snapshot.selected.length, 3);
  assert.equal(r.recipients.length, 3);
});
