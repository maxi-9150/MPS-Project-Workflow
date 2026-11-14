export const students = [
  {
    id: "amelia",
    name: "Amelia Reed",
    initials: "AR",
    responses: 3,
    evidence: "Repeated evidence",
    suggested: "Basic",
  },
  {
    id: "noah",
    name: "Noah Wilson",
    initials: "NW",
    responses: 4,
    evidence: "Repeated evidence",
    suggested: "Satisfactory",
  },
  {
    id: "sofia",
    name: "Sofia Martin",
    initials: "SM",
    responses: 1,
    evidence: "Insufficient evidence",
    suggested: "",
  },
  {
    id: "liam",
    name: "Liam Carter",
    initials: "LC",
    responses: 0,
    evidence: "Insufficient evidence",
    suggested: "",
  },
];
export const materials = [
  {
    id: "lesson",
    type: "Lesson",
    title: "Visual models for equivalent fractions",
    minutes: 5,
    questions: 0,
    objective: "Recognise equivalent fractions with area models",
    includes: "Short explanation · 1 worked example · 3 questions",
    reason: "Shows scaling numerator and denominator together",
  },
  {
    id: "station",
    type: "Station",
    title: "Scale numerator and denominator",
    minutes: 8,
    questions: 0,
    objective: "Multiply numerator and denominator by the same number",
    includes: "Guided steps · 4 practice items",
    reason: "Targets the shared error directly",
  },
  {
    id: "practice",
    type: "Practice set",
    title: "Equivalent fractions · 3 questions",
    minutes: 3,
    questions: 3,
    objective: "Check equivalent fractions independently",
    includes: "3 auto-marked questions",
    reason: "Short independent check after the lesson",
  },
  {
    id: "numberline",
    type: "Practice set",
    title: "Equivalent fractions on a number line",
    minutes: 6,
    questions: 4,
    objective: "Place equivalent fractions on a number line",
    includes: "4 auto-marked questions · answer key for teachers only",
    reason: "Available · last updated 2 Oct",
  },
  {
    id: "simplify",
    type: "Lesson",
    title: "Simplifying fractions step by step",
    minutes: 7,
    questions: 0,
    objective: "Simplify numerator and denominator together",
    includes: "Explanation and worked examples",
    reason: "Reinforces equivalent values",
  },
  {
    id: "strips",
    type: "Exercise set",
    title: "Fraction strips: find the missing numerator",
    minutes: 4,
    questions: 4,
    objective: "Find missing numerators using fraction strips",
    includes: "4 exercises with fraction strips",
    reason: "Connects models and symbolic fractions",
  },
  {
    id: "walls",
    type: "Station",
    title: "Fraction walls: build equal fractions",
    minutes: 8,
    questions: 0,
    objective: "Build equivalent fractions with fraction walls",
    includes: "Fraction wall activity · guided examples",
    reason: "Alternative to the selected scaling station",
  },
];
export const levels = ["Threshold", "Satisfactory", "Basic", "Higher"];
export const supportInfo = {
  Threshold: "Version A · + 1 worked example and 2 guided items",
  Satisfactory: "Version B · + 2 hint cards on the shared materials",
  Basic: "Version C · shared materials, no changes",
  Higher: "Version D · teacher verification required",
};
export function fresh() {
  return {
    id: crypto.randomUUID(),
    selected: ["lesson", "station", "practice"],
    recipients: ["amelia", "noah", "sofia"],
    support: {},
    title: "Equivalent fractions review",
    action: "assignment",
    start: "2026-10-14",
    startTime: "16:00",
    end: "2026-10-21",
    endTime: "23:59",
    requested: "2026-10-21",
    requestedTime: "09:20",
    planned: "2026-10-21",
    plannedTime: "09:20",
    resolution: false,
    reviewed: false,
    followup: false,
  };
}
export function selected(d) {
  return d.selected
    .map((id) => materials.find((m) => m.id === id))
    .filter(Boolean);
}
export function total(d) {
  return selected(d).reduce((n, m) => n + m.minutes, 0);
}
export function assignable(d) {
  return selected(d).filter((m) => m.questions > 0);
}
export function schedulable(d) {
  return selected(d).filter((m) => m.type === "Lesson" || m.type === "Station");
}
export function questionCount(d) {
  return assignable(d).reduce((n, m) => n + m.questions, 0);
}
export function dateValid(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00Z");
  return Number.isFinite(d.valueOf()) && d.toISOString().slice(0, 10) === s;
}
export function timeValid(t) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}
export function addMinutes(t, n) {
  const [h, m] = t.split(":").map(Number);
  const v = h * 60 + m + n;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}
export function conflict(d) {
  const end = addMinutes(
    d.plannedTime,
    schedulable(d).reduce((n, m) => n + m.minutes, 0),
  );
  return d.planned === "2026-10-21" && d.plannedTime < "10:00" && end > "09:00";
}
export function validate(d) {
  if (
    !d.selected.length ||
    new Set(d.selected).size !== d.selected.length ||
    d.selected.some((id) => !materials.some((m) => m.id === id))
  )
    return "Choose at least one available material, without duplicates.";
  if (d.action === "assignment") {
    if (
      !d.recipients.length ||
      new Set(d.recipients).size !== d.recipients.length ||
      d.recipients.some((id) => !students.some((s) => s.id === id))
    )
      return "Choose at least one valid student.";
    if (!assignable(d).length)
      return "Add a practice set or exercise set before assigning.";
    if (!d.title.trim()) return "Enter an assigned test title.";
    if (
      !dateValid(d.start) ||
      !dateValid(d.end) ||
      !timeValid(d.startTime) ||
      !timeValid(d.endTime) ||
      `${d.end}T${d.endTime}` <= `${d.start}T${d.startTime}`
    )
      return "End must be after the start date and time.";
  } else {
    if (!schedulable(d).length)
      return "No schedulable content. Add a Lesson or Station.";
    if (
      !dateValid(d.planned) ||
      !timeValid(d.plannedTime) ||
      addMinutes(
        d.plannedTime,
        schedulable(d).reduce((n, m) => n + m.minutes, 0),
      ) > "23:59"
    )
      return "Choose a valid date and time with enough time left in the day.";
    if (conflict(d))
      return "The requested time overlaps Protau. Resolve the conflict first.";
  }
  return "";
}
export function commit(d, records, now = Date.now()) {
  const old = records.find((r) => r.id === `${d.id}:${d.action}`);
  if (old) return old;
  const error = validate(d);
  if (error || !d.reviewed)
    throw Error(error || "Review and confirm the details first.");
  const base = {
    id: `${d.id}:${d.action}`,
    draftId: d.id,
    action: d.action,
    title: d.title,
    createdAt: now,
    snapshot: structuredClone(d),
  };
  if (d.action === "assignment")
    return {
      ...base,
      recipients: [...d.recipients],
      sentMaterials: assignable(d).map((m) => m.id),
      calendar: [],
      undoUntil: 0,
      movesTest: false,
    };
  let t = d.plannedTime;
  return {
    ...base,
    recipients: [],
    sentMaterials: [],
    calendar: schedulable(d).map((m) => {
      const event = {
        id: `${base.id}:${m.id}`,
        materialId: m.id,
        title: m.title,
        type: m.type,
        date: d.planned,
        start: t,
        end: addMinutes(t, m.minutes),
      };
      t = event.end;
      return event;
    }),
    undoUntil: now + 30000,
    movesTest:
      d.resolution && d.planned === "2026-10-22" && d.plannedTime === "10:15",
  };
}
export function undo(records, id, now = Date.now()) {
  const r = records.find((r) => r.id === id);
  if (!r || r.action !== "plan" || now > r.undoUntil)
    throw Error("The original 30-second Undo window has expired.");
  return records.filter((x) => x.id !== id);
}
export function testDate(records) {
  return records.some((r) => r.movesTest) ? "2026-10-26" : "2026-10-22";
}
export function applyMaterials(d, ids, replaceId = null) {
  if (ids.some((id) => !materials.some((m) => m.id === id)))
    throw Error("A selected material is unavailable.");
  let next = [...d.selected];
  if (replaceId) {
    if (ids.length !== 1) throw Error("Choose one replacement.");
    if (!next.includes(replaceId))
      throw Error("The original material is no longer in the draft.");
    if (next.includes(ids[0]) && ids[0] !== replaceId)
      throw Error("That material is already in the draft.");
    next[next.indexOf(replaceId)] = ids[0];
  } else next = [...new Set([...next, ...ids])];
  return { ...d, selected: next, reviewed: false };
}
export function restore(raw) {
  try {
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.selected) || !Array.isArray(d.recipients))
      return fresh();
    return {
      ...fresh(),
      ...d,
      selected: [
        ...new Set(
          d.selected.filter((id) => materials.some((m) => m.id === id)),
        ),
      ],
      recipients: [
        ...new Set(
          d.recipients.filter((id) => students.some((s) => s.id === id)),
        ),
      ],
      support:
        typeof d.support === "object" && d.support && !Array.isArray(d.support)
          ? d.support
          : {},
      reviewed: false,
    };
  } catch {
    return fresh();
  }
}
