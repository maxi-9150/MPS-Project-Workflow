import React, { useEffect, useRef, useState } from "react";
import { Button, Icon, Modal, Sidebar } from "./ui";
import {
  students,
  materials,
  levels,
  supportInfo,
  fresh,
  selected,
  total,
  assignable,
  schedulable,
  questionCount,
  conflict,
  validate,
  commit,
  undo,
  testDate,
  applyMaterials,
  restore,
  addMinutes,
} from "./hi-model.mjs";
import type { Draft, RecordItem, Material } from "./hi-model.mjs";
const read = (k: string) => {
  try {
    return localStorage.getItem(k) || "";
  } catch {
    return "";
  }
};
const date = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const names = (ids: string[]) =>
  ids
    .map((id) => students.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(", ");
const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("");
const recommendations = [
  {
    id: "fractions",
    title: "Finding equivalent fractions",
    source: "Fractions checkpoint",
    day: "12 Oct",
    count: 3,
    people: ["Amelia Reed", "Noah Wilson", "Sofia Martin"],
    error: "Changes only one part of the fraction",
    coverage: "8 attempted items · 3 students",
    evidence: "Repeated evidence",
  },
  {
    id: "decimals",
    title: "Decimal place value",
    source: "Decimals checkpoint",
    day: "13 Oct",
    count: 2,
    people: ["Leo Kim", "Olivia Brown"],
    error: "Treats longer decimals as larger",
    coverage: "6 attempted items · 2 students",
    evidence: "Repeated evidence",
  },
  {
    id: "percentages",
    title: "Percentages",
    source: "Percentages entry check",
    day: "14 Oct",
    count: 2,
    people: ["Emma Jones", "Mateo Torres"],
    error: "Not yet clear",
    coverage: "2 attempted items · 2 students",
    evidence: "Insufficient evidence",
  },
];
function Badge({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"hibadge " + tone}>{children}</span>;
}
function Avatars({ people }: { people: string[] }) {
  return (
    <span className="avatars">
      {people.map((n) => (
        <span key={n} title={n}>
          {initials(n)}
        </span>
      ))}
    </span>
  );
}
function Evidence({ person = "amelia" }: { person?: string }) {
  const rows =
    person === "amelia"
      ? [
          [
            "Q3",
            "Complete 2/3 = ?/12",
            "Answered 2/12 · expected 8/12",
            "Incorrect",
          ],
          [
            "Q5",
            "Write 3/5 with numerator 6",
            "Answered 6/5 · expected 6/10",
            "Incorrect",
          ],
          ["Q7", "Choose a fraction equal to 1/2", "Answered 2/4", "Correct"],
        ]
      : person === "noah"
        ? [
            [
              "Q2",
              "Complete 1/4 = ?/8",
              "Answered 1/8 · expected 2/8",
              "Incorrect",
            ],
            [
              "Q3",
              "Complete 2/3 = ?/12",
              "Answered 2/12 · expected 8/12",
              "Incorrect",
            ],
            ["Q7", "Choose a fraction equal to 1/2", "Answered 2/4", "Correct"],
          ]
        : [
            [
              "Q3",
              "Complete 2/3 = ?/12",
              "Answered 2/12 · expected 8/12",
              "Incorrect",
            ],
          ];
  return (
    <div className="inlineevidence">
      <small>Fractions checkpoint · 12 Oct · items related to this group</small>
      {rows.map((r) => (
        <div className="evidencerow" key={r[0]}>
          <strong>{r[0]}</strong>
          <div>
            {r[1]}
            <small>{r[2]}</small>
          </div>
          <Badge tone={r[3] === "Correct" ? "green" : "orange"}>{r[3]}</Badge>
        </div>
      ))}
      <p className="muted">
        {person === "sofia"
          ? "Only one related response is available. Check again before inferring a shared error."
          : "Evidence describes the responses, not a diagnosis or lasting mastery."}
      </p>
    </div>
  );
}
export default function HighFiApp() {
  const [page, setPage] = useState("overview");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() =>
    restore(read("mps-hi-v3-draft")),
  );
  const [records, setRecords] = useState<RecordItem[]>(() => {
    try {
      const r = JSON.parse(read("mps-hi-v3-records"));
      return Array.isArray(r)
        ? r.filter(
            (x) =>
              x &&
              x.snapshot &&
              Array.isArray(x.calendar) &&
              Array.isArray(x.sentMaterials),
          )
        : [];
    } catch {
      return [];
    }
  });
  const [recId, setRecId] = useState("fractions");
  const [expanded, setExpanded] = useState("");
  const [knowledge, setKnowledge] = useState(false);
  const [grade, setGrade] = useState("All");
  const [source, setSource] = useState("All");
  const [evidence, setEvidence] = useState("All");
  const [zoom, setZoom] = useState(100);
  const [modal, setModal] = useState("");
  const [info, setInfo] = useState("");
  const [preview, setPreview] = useState<Material | null>(null);
  const [tempStudents, setTempStudents] = useState<string[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportEdit, setSupportEdit] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState("");
  const [tick, setTick] = useState(Date.now());
  const [query, setQuery] = useState("Finding equivalent fractions");
  const [libType, setLibType] = useState("All types");
  const [libLevel, setLibLevel] = useState("All levels");
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [proposed, setProposed] = useState<string[]>([]);
  const [libReview, setLibReview] = useState(false);
  const [libLoading, setLibLoading] = useState(false);
  const [scenario, setScenario] = useState("normal");
  const [testPanel, setTestPanel] = useState(false);
  const [supportFailure, setSupportFailure] = useState(false);
  const [submitMode, setSubmitMode] = useState("normal");
  const [undoFailure, setUndoFailure] = useState(false);
  const [calendarView] = useState("Week");
  const submitting = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => {
      clearInterval(t);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);
  const active =
    records.find((r) => r.id === current) || records[records.length - 1];
  const rec = recommendations.find((r) => r.id === recId)!;
  const go = (p: string, s = 0) => {
    if (busy) return;
    setPage(p);
    setStep(s);
    setMessage("");
    setExpanded("");
    window.scrollTo(0, 0);
  };
  const edit = (patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...patch, reviewed: false }));
  const inform = (text: string) => {
    setInfo(text);
    setModal("info");
  };
  const persist = (r: RecordItem[]) => {
    setRecords(r);
    try {
      localStorage.setItem("mps-hi-v3-records", JSON.stringify(r));
    } catch {
      setMessage("Saved in this tab only. Browser storage is unavailable.");
    }
  };
  const save = () => {
    try {
      localStorage.setItem("mps-hi-v3-draft", JSON.stringify(draft));
      setMessage(
        "Draft saved · " +
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
      );
    } catch {
      setMessage(
        "Draft could not be saved. Your choices are retained in this tab.",
      );
    }
  };
  const begin = () => {
    if (recId !== "fractions") {
      inform(
        recId === "percentages"
          ? "Not enough evidence yet. Add a short check before creating a shared review."
          : "This walkthrough demonstrates the equivalent-fractions review. Decimal evidence is available for inspection.",
      );
      return;
    }
    if (records.some((r) => r.draftId === draft.id)) {
      setDraft(fresh());
      setSupportOpen(false);
    }
    go("draft");
  };
  const editStudents = () => {
    setTempStudents([...draft.recipients]);
    setModal("students");
  };
  const library = (id: string | null = null) => {
    setReplaceId(id);
    setPicks([]);
    setLibReview(false);
    setQuery("Finding equivalent fractions");
    setScenario("normal");
    setLibLoading(true);
    go("library");
    timeout.current = setTimeout(() => setLibLoading(false), 350);
  };
  const sourceCandidates = replaceId
    ? materials.filter((m) => m.id === "walls" || m.id === replaceId)
    : materials.filter((m) => m.id !== "walls");
  const results = sourceCandidates.filter(
    (m) =>
      (libType === "All types" || m.type === libType) &&
      (query.toLowerCase().includes("finding equivalent fractions") ||
        m.title.toLowerCase().includes(query.toLowerCase())),
  );
  const reviewPicks = () => {
    try {
      const d = applyMaterials(draft, picks, replaceId);
      setProposed(d.selected);
      setLibReview(true);
      setMessage("");
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const apply = () => {
    if (scenario === "applyfail") {
      setMessage(
        "Could not apply materials. Your draft is unchanged. Retry or return to search.",
      );
      return;
    }
    if (scenario === "stale") {
      setMessage(
        "A selected material is no longer available. Remove it or search again.",
      );
      return;
    }
    edit({ selected: proposed });
    go("draft");
    setMessage(
      replaceId
        ? "Replacement applied. Students and support are unchanged."
        : "Materials added. Students and support are unchanged.",
    );
  };
  const openSupport = () => {
    setSupportEdit({ ...draft.support });
    setSupportOpen(true);
  };
  const saveSupport = () => {
    if (supportFailure) {
      setMessage(
        "Support could not be saved. Your saved choices are unchanged. Retry or cancel.",
      );
      return;
    }
    edit({ support: { ...supportEdit } });
    setMessage("Support saved. It stays in the teacher review draft.");
  };
  const submit = () => {
    const error = validate(draft);
    if (error || !draft.reviewed) {
      setMessage(error || "Check the confirmation box before continuing.");
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setMessage("");
    setPage("submitting");
    timeout.current = setTimeout(() => {
      if (submitMode === "fail") {
        setPage("submitfailed");
      } else {
        const r = commit(draft, records);
        persist(records.some((x) => x.id === r.id) ? records : [...records, r]);
        setCurrent(r.id);
        setPage(submitMode === "ambiguous" ? "submitfailed" : "success");
      }
      submitting.current = false;
      setBusy(false);
      window.scrollTo(0, 0);
    }, 550);
  };
  const recover = () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setPage("checking");
    timeout.current = setTimeout(() => {
      const found = records.find((r) => r.id === `${draft.id}:${draft.action}`);
      if (found) {
        setCurrent(found.id);
        setPage("success");
        setMessage("Previous submission recovered. No duplicate was created.");
      } else {
        setPage("confirm");
        setMessage(
          "No previous submission found. Your draft is intact; you can confirm again.",
        );
      }
      submitting.current = false;
      setBusy(false);
    }, 500);
  };
  const undoPlan = () => {
    if (!active) return;
    if (undoFailure) {
      setMessage(
        "Undo failed. All linked items remain unchanged. Retry within the original window.",
      );
      return;
    }
    try {
      persist(undo(records, active.id));
      setMessage(
        "Undo complete. Linked items removed; the planned test is restored.",
      );
      setPage("calendar");
      setCurrent("");
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const nav = (s: string) => {
    if (busy) return;
    if (s === "Groups") go("overview");
    else if (s === "Calendar") go("calendar");
    else if (s === "Assigned tests") go("assigned");
    else
      inform(
        `${s} belongs to the existing school portal and is outside this teacher-review walkthrough.`,
      );
  };
  const inGroup = page !== "calendar";
  const isDraft = [
    "draft",
    "library",
    "schedule",
    "conflict",
    "confirm",
  ].includes(page);
  const stage =
    page === "schedule" || page === "conflict"
      ? 3
      : page === "confirm"
        ? 4
        : step;
  function Summary() {
    return (
      <div className="hisummary">
        <h2>Review summary</h2>
        <small>Students</small>
        <div className="row">
          <Avatars
            people={draft.recipients.map(
              (id) => students.find((s) => s.id === id)!.name,
            )}
          />
          <strong>{draft.recipients.length}</strong>
          <Button onClick={editStudents}>Edit</Button>
        </div>
        <small>Learning goal</small>
        <p>Finding equivalent fractions</p>
        <small>Based on</small>
        <p>
          Fractions checkpoint
          <br />
          <small>12 Oct</small>
        </p>
        <div className="rule" />
        <div className="row">
          <small>Total time</small>
          <strong>{total(draft)} min</strong>
        </div>
        <small>Assigned test</small>
        <p>
          {questionCount(draft)} exercises · estimated{" "}
          {assignable(draft).reduce((n, m) => n + m.minutes, 0)} min
        </p>
        <small>Nothing is sent until you confirm.</small>
      </div>
    );
  }
  function MaterialRow({
    m,
    controls = false,
  }: {
    m: Material;
    controls?: boolean;
  }) {
    return (
      <div className="himaterial">
        <div className="grow">
          <Badge tone={m.questions ? "blue" : "plain"}>{m.type}</Badge>
          <h3>{m.title}</h3>
          <small>
            {m.minutes} min ·{" "}
            {m.questions
              ? `${m.questions} questions · Included in assigned test`
              : "Teacher resource · not sent"}
          </small>
        </div>
        <div className="actions">
          <Button onClick={() => setPreview(m)}>Preview</Button>
          {controls && (
            <>
              <Button onClick={() => library(m.id)}>Replace</Button>
              <Button
                onClick={() =>
                  edit({ selected: draft.selected.filter((id) => id !== m.id) })
                }
              >
                Remove
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
  function SupportSummary() {
    return (
      <article className="hicard">
        <div className="row">
          <h2>Optional support</h2>
          <Button onClick={() => go("draft", 1)}>Edit</Button>
        </div>
        {Object.keys(draft.support).length ? (
          draft.recipients.map((id) => (
            <div className="tableline" key={id}>
              <span>{students.find((s) => s.id === id)!.name}</span>
              <span>{draft.support[id] || "Shared version"}</span>
            </div>
          ))
        ) : (
          <>
            <Badge>Not added</Badge>
            <p>One version for all students</p>
          </>
        )}
        <small>
          Saved support stays in the teacher draft. Every recipient receives the
          same assigned test exercises.
        </small>
      </article>
    );
  }
  function Sequence() {
    return (
      <article className="hicard">
        <div className="row">
          <h2>
            Review draft · {draft.selected.length} materials · {total(draft)}{" "}
            min
          </h2>
          <Button onClick={() => go("draft")}>Edit materials</Button>
        </div>
        {selected(draft).map((m) => (
          <React.Fragment key={m.id}>{MaterialRow({ m })}</React.Fragment>
        ))}
        <p className="blue">
          Assigned test · {questionCount(draft)} exercises · estimated{" "}
          {assignable(draft).reduce((n, m) => n + m.minutes, 0)} min
        </p>
        <small>
          Assigned test (Assign now): practice sets only. Lesson and Station:
          Teacher resource · not sent · Available for class planning.
        </small>
      </article>
    );
  }
  const next = () => {
    if (!draft.selected.length) {
      setMessage("Add at least one material before continuing.");
      return;
    }
    if (!draft.recipients.length) {
      setMessage("Select at least one student.");
      return;
    }
    go("draft", step + 1);
  };
  return (
    <div
      className="shell hi"
      style={{ "--user-scale": zoom / 100 } as React.CSSProperties}
    >
      <Sidebar
        active={
          page === "calendar"
            ? "Calendar"
            : ["assigned", "progress", "followup"].includes(page)
              ? "Assigned tests"
              : "Groups"
        }
        onNavigate={nav}
        zoom={zoom}
        setZoom={setZoom}
      />
      <main inert={busy}>
        {inGroup && (
          <>
            <header className="hiheader">
              <button className="textlink" onClick={() => go("overview")}>
                ← Back
              </button>
              <div>
                <strong>Group</strong>
                <p>6A　Class 6A</p>
              </div>
              <Button
                primary
                onClick={() => {
                  edit({ action: "assignment" });
                  go("draft");
                }}
              >
                ＋ Assign test
              </Button>
            </header>
            <div className="groupcard">
              <span className="avatar">6A</span>
              <strong>Class 6A</strong>
              <div className="actions">
                <Button
                  onClick={() =>
                    inform(
                      "Class 6A · 24 students · Mathematics. Group editing belongs to the existing portal.",
                    )
                  }
                >
                  Edit group
                </Button>
                <Button
                  onClick={() =>
                    inform(
                      "Access Code is managed by the school portal. No live class code is included in this sample.",
                    )
                  }
                >
                  Access Code ↗
                </Button>
              </div>
            </div>
            <div className="tabs hitabs">
              {[
                ["Overview", "24 students"],
                ["Tests", "Assigned tests"],
                ["Recommended review", "3 suggested groups"],
                [
                  "Curriculum plan",
                  records.some((r) => r.action === "plan")
                    ? "Lesson planned"
                    : "No lesson planned",
                ],
              ].map(([a, b]) => (
                <button
                  key={a}
                  className={a === "Recommended review" ? "selected" : ""}
                  onClick={() =>
                    a === "Tests"
                      ? go("assigned")
                      : a === "Curriculum plan"
                        ? go("calendar")
                        : a === "Recommended review"
                          ? go("overview")
                          : inform(
                              "Class overview is part of the existing portal.",
                            )
                  }
                >
                  <strong>{a}</strong>
                  <small>{b}</small>
                </button>
              ))}
            </div>
          </>
        )}
        <div className="hipanel">
          {message && (
            <div
              className={
                /failed|could not|unavailable|expired|Choose|Select|Add at least|End must|overlap/i.test(
                  message,
                )
                  ? "banner warn"
                  : "banner"
              }
              role="status"
            >
              {message}
            </div>
          )}
          {isDraft && (
            <>
              <button
                className="textlink backlabel"
                onClick={() =>
                  page === "library"
                    ? go("draft")
                    : page === "schedule" || page === "conflict"
                      ? go("draft", 3)
                      : page === "confirm"
                        ? go("draft", 3)
                        : step
                          ? go("draft", step - 1)
                          : go("detail")
                }
              >
                ←{" "}
                {page === "library"
                  ? "Assemble material"
                  : page === "schedule" ||
                      page === "conflict" ||
                      page === "confirm"
                    ? "Choose action"
                    : [
                        "Finding equivalent fractions",
                        "Assemble material",
                        "Differentiate",
                        "Review draft",
                      ][step]}
              </button>
              <div className="histages" aria-label="Review steps">
                {[
                  "Assemble material",
                  "Differentiate",
                  "Review draft",
                  "Choose action",
                  "Confirm",
                ].map((s, i) => (
                  <span
                    key={s}
                    className={stage === i ? "active" : i < stage ? "done" : ""}
                  >
                    <b>{i < stage ? "✓" : i + 1}</b>
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
          {page === "overview" && (
            <>
              <div className="segmented">
                <button
                  className={knowledge ? "selected" : ""}
                  onClick={() => setKnowledge(true)}
                >
                  Class knowledge gaps
                </button>
                <button
                  className={!knowledge ? "selected" : ""}
                  onClick={() => setKnowledge(false)}
                >
                  Suggested groups · 3
                </button>
              </div>
              <h1>
                {knowledge ? "Recommended review" : "Suggested review groups"}
              </h1>
              {knowledge ? (
                <article className="hicard">
                  <div className="tableline head">
                    <span>Lesson station</span>
                    <span>Class</span>
                    <span>Revised students</span>
                  </div>
                  {[
                    ...recommendations.map((r) => r.title),
                    "Comparing fractions",
                    "Adding unlike fractions",
                    "Ratios and rates",
                  ].map((t, i) => (
                    <button
                      className="tableline gaprow"
                      key={t}
                      onClick={() => {
                        setRecId(recommendations[i]?.id || "fractions");
                        go("detail");
                      }}
                    >
                      <strong>{t}</strong>
                      <span>6 cl.</span>
                      <span>0/{[3, 2, 2, 4, 5, 3][i]}</span>
                    </button>
                  ))}
                </article>
              ) : (
                <>
                  <div className="infostrip">
                    <Icon name="imgIcon" />3 suggested groups · 7 of 24 students{" "}
                    <small>
                      Suggestions only — nothing is assigned until you review
                      and confirm.
                    </small>
                  </div>
                  <div className="hifilters">
                    <label className="sr-only" htmlFor="grade">
                      Grade
                    </label>
                    <select
                      id="grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    >
                      <option value="All">Grade: All</option>
                      <option value="6">Grade: 6</option>
                    </select>
                    <label className="sr-only" htmlFor="source">
                      Source test
                    </label>
                    <select
                      id="source"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    >
                      <option value="All">Source test: All</option>
                      {recommendations.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.source}
                        </option>
                      ))}
                    </select>
                    <label className="sr-only" htmlFor="evidence">
                      Evidence status
                    </label>
                    <select
                      id="evidence"
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                    >
                      <option value="All">Evidence status: All</option>
                      <option>Repeated evidence</option>
                      <option>Insufficient evidence</option>
                    </select>
                    <button
                      className="textlink"
                      onClick={() => {
                        setGrade("All");
                        setSource("All");
                        setEvidence("All");
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  {recommendations
                    .filter(
                      (r) =>
                        (source === "All" || source === r.id) &&
                        (evidence === "All" || evidence === r.evidence),
                    )
                    .map((r) => (
                      <article className="suggestion" key={r.id}>
                        <div>
                          <h3>{r.title}</h3>
                          <small>
                            {r.source} · {r.day} · Grade 6
                          </small>
                        </div>
                        <div className="row">
                          <Avatars people={r.people} />
                          <span>{r.count} students</span>
                        </div>
                        <div>
                          <div className="actions">
                            {r.id !== "percentages" && (
                              <Badge tone="orange">Needs review</Badge>
                            )}
                            <Badge
                              tone={r.id === "percentages" ? "plain" : "green"}
                            >
                              {r.evidence}
                            </Badge>
                          </div>
                          <small>
                            {r.id === "percentages"
                              ? "Only 1 related item per student — check again"
                              : "Same error on related items"}
                          </small>
                        </div>
                        <div className="actions">
                          <button
                            className="textlink"
                            onClick={() =>
                              setExpanded(expanded === r.id ? "" : r.id)
                            }
                          >
                            {expanded === r.id
                              ? "Hide evidence"
                              : "View evidence"}
                          </button>
                          <Button
                            primary={r.id === "fractions"}
                            onClick={() => {
                              setRecId(r.id);
                              go("detail");
                            }}
                          >
                            View group
                          </Button>
                        </div>
                        {expanded === r.id && (
                          <div className="suggestionevidence">
                            <p>
                              {r.coverage} · {r.error}
                            </p>
                            <small>
                              {r.evidence === "Insufficient evidence"
                                ? "Check again before choosing a shared review."
                                : "Review the individual responses before choosing support."}
                            </small>
                          </div>
                        )}
                      </article>
                    ))}
                </>
              )}
            </>
          )}
          {page === "detail" && (
            <>
              <button
                className="textlink backlabel"
                onClick={() => go("overview")}
              >
                ← Suggested groups
              </button>
              <h1>{rec.title}</h1>
              <div className="actions" aria-label="Recommendation status">
                <Badge>Suggested group</Badge>
                <Badge tone={rec.id === "percentages" ? "plain" : "orange"}>
                  {rec.id === "percentages"
                    ? "Insufficient evidence"
                    : "Needs review"}
                </Badge>
                {rec.id !== "percentages" && (
                  <Badge tone="green">Repeated evidence</Badge>
                )}
              </div>
              <div className="facts">
                <div>
                  <small>Shared error</small>
                  <p>{rec.error}</p>
                </div>
                <div>
                  <small>Source</small>
                  <p>
                    {rec.source} · {rec.day}
                  </p>
                </div>
                <div>
                  <small>Evidence</small>
                  <p>{rec.coverage}</p>
                </div>
              </div>
              {rec.id === "percentages" && (
                <div className="banner warn">
                  <strong>Not enough evidence yet</strong>
                  <p>
                    Add a short check for these students before creating a
                    review.
                  </p>
                </div>
              )}
              <article className="hicard">
                <div className="row">
                  <h2>
                    Students ·{" "}
                    {rec.id === "fractions"
                      ? draft.recipients.length
                      : rec.count}
                  </h2>
                  {rec.id === "fractions" && (
                    <Button onClick={editStudents}>Edit students</Button>
                  )}
                </div>
                <div className="tablewrap">
                  <div className="studenttable">
                    <div className="tableline head">
                      <span>Student</span>
                      <span>Evidence</span>
                      <span>Last activity</span>
                      <span />
                    </div>
                    {(rec.id === "fractions"
                      ? draft.recipients.map(
                          (id) => students.find((s) => s.id === id)!,
                        )
                      : rec.people.map((name, i) => ({
                          id: rec.id + i,
                          name,
                          initials: initials(name),
                          responses: rec.id === "percentages" ? 1 : 3,
                          evidence: rec.evidence,
                          suggested: "",
                        }))
                    ).map((s) => (
                      <React.Fragment key={s.id}>
                        <div className="tableline">
                          <div className="row start">
                            <span className="avatar">{s.initials}</span>
                            <span>
                              {s.name}
                              <small>{s.responses} responses</small>
                            </span>
                          </div>
                          <Badge
                            tone={
                              s.evidence === "Repeated evidence"
                                ? "green"
                                : "plain"
                            }
                          >
                            {s.evidence}
                          </Badge>
                          <span>{rec.day}</span>
                          {rec.id === "fractions" && (
                            <button
                              className="textlink"
                              onClick={() =>
                                setExpanded(expanded === s.id ? "" : s.id)
                              }
                            >
                              {expanded === s.id
                                ? "Hide evidence"
                                : "Show evidence"}
                            </button>
                          )}
                        </div>
                        {expanded === s.id && <Evidence person={s.id} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </article>
              <footer>
                <Button
                  onClick={() =>
                    inform(
                      "The students share related response patterns. Suggestions are starting points; evidence coverage varies. Sofia has only one related response, so no achievement level is inferred.",
                    )
                  }
                >
                  Why these students?
                </Button>
                <Button
                  primary
                  disabled={
                    rec.id === "percentages" ||
                    (rec.id === "fractions" && !draft.recipients.length)
                  }
                  onClick={begin}
                >
                  Create review
                </Button>
              </footer>
            </>
          )}
          {page === "draft" && (
            <>
              <div className="row">
                <h1>
                  {
                    [
                      "Assemble material",
                      "Differentiate",
                      "Review draft",
                      "Choose action",
                    ][step]
                  }
                </h1>
                <Badge>{step === 1 ? "Optional" : "Draft"}</Badge>
              </div>
              {step === 0 && (
                <div className="materiallayout">
                  <section>
                    <article className="hicard">
                      <div className="row">
                        <h2>
                          Review draft{" "}
                          <small>
                            {draft.selected.length} materials · {total(draft)}{" "}
                            min
                          </small>
                        </h2>
                        <Button onClick={() => library()}>
                          Add from library
                        </Button>
                      </div>
                      {selected(draft).map((m) => (
                        <React.Fragment key={m.id}>
                          {MaterialRow({ m, controls: true })}
                        </React.Fragment>
                      ))}
                      {!draft.selected.length && (
                        <p>Add material from the library to continue.</p>
                      )}
                    </article>
                  </section>
                  {Summary()}
                </div>
              )}
              {step === 1 && (
                <>
                  <p className="muted">
                    Optional — you can continue without changes. By default all
                    students get one shared version.
                  </p>
                  {!supportOpen ? (
                    <article className="hicard">
                      <div className="row">
                        <h2>Support</h2>
                        <Badge>Default</Badge>
                      </div>
                      <p>
                        One shared version · {draft.recipients.length} students
                        · same {draft.selected.length} materials ·{" "}
                        {total(draft)} min
                      </p>
                      <Button onClick={openSupport}>
                        Adjust support by level
                      </Button>
                    </article>
                  ) : (
                    <article className="hicard">
                      <div className="row">
                        <h2>Support by achievement level</h2>
                        <Badge>
                          {JSON.stringify(draft.support) ===
                          JSON.stringify(supportEdit)
                            ? "Saved"
                            : "Not saved"}
                        </Badge>
                      </div>
                      <div className="tablewrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Suggested from evidence</th>
                              <th>Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {draft.recipients.map((id) => {
                              const s = students.find((s) => s.id === id)!;
                              return (
                                <tr key={id}>
                                  <td>
                                    {s.name}
                                    <small>{s.responses} responses</small>
                                  </td>
                                  <td>
                                    {s.suggested
                                      ? `${s.suggested} · same error on related items`
                                      : "Insufficient evidence · no level suggested"}
                                  </td>
                                  <td>
                                    <select
                                      aria-label={`Support level for ${s.name}`}
                                      value={supportEdit[id] || ""}
                                      onChange={(e) =>
                                        setSupportEdit((p) => ({
                                          ...p,
                                          [id]: e.target.value,
                                        }))
                                      }
                                    >
                                      <option value="">Not set</option>
                                      {levels.map((l) => (
                                        <option key={l}>{l}</option>
                                      ))}
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <h3>What differs by level</h3>
                      {levels.map((l) => (
                        <div className="tableline supportmap" key={l}>
                          <strong>{l}</strong>
                          <span>{supportInfo[l]}</span>
                          <span>
                            {l === "Threshold"
                              ? total(draft) + 3
                              : l === "Higher"
                                ? "—"
                                : total(draft)}
                            {l !== "Higher" ? " min" : ""}
                          </span>
                        </div>
                      ))}
                      <div className="actions">
                        <Button
                          onClick={() => {
                            setSupportEdit({ ...draft.support });
                            setSupportOpen(false);
                            setMessage("Unsaved changes discarded.");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={saveSupport}>Save support</Button>
                      </div>
                    </article>
                  )}
                  <p className="muted">
                    Threshold, Satisfactory, Basic and Higher are for your
                    planning only. Students see neutral labels (Version A, B, C
                    or D). Support-to-exercise mapping requires product
                    confirmation.
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <p>
                    {draft.title} · {draft.recipients.length} students ·{" "}
                    {draft.selected.length} materials · {total(draft)} min
                  </p>
                  <article className="hicard">
                    <div className="row">
                      <h2>Students · {draft.recipients.length}</h2>
                      <Button onClick={editStudents}>Edit</Button>
                    </div>
                    <Avatars
                      people={draft.recipients.map(
                        (id) => students.find((s) => s.id === id)!.name,
                      )}
                    />
                    <p>{names(draft.recipients)}</p>
                    <small>
                      Learning goal: Finding equivalent fractions · from
                      Fractions checkpoint, 12 Oct
                    </small>
                  </article>
                  {Sequence()}
                  {SupportSummary()}
                </>
              )}
              {step === 3 && (
                <>
                  <p>
                    {draft.title} · {draft.recipients.length} students ·{" "}
                    {draft.selected.length} materials · {total(draft)} min
                  </p>
                  <h2>Where should this review go?</h2>
                  {[
                    [
                      "assignment",
                      "Assign now",
                      "Create an Assigned test from the selected exercises for the chosen students.",
                      "Selected students · Assignable exercises only · Destination: Assigned tests",
                    ],
                    [
                      "plan",
                      "Add to class plan",
                      "Add the lesson and station to Class 6A’s Curriculum plan for the whole class. No student assignments are created.",
                      "Class 6A · Whole class · 24 students · Mathematics timetable",
                    ],
                  ].map(([v, t, desc, meta]) => (
                    <label
                      key={v}
                      className={
                        "hiaction " + (draft.action === v ? "chosen" : "")
                      }
                    >
                      <input
                        type="radio"
                        name="destination"
                        checked={draft.action === v}
                        onChange={() => edit({ action: v })}
                      />
                      <div>
                        <h2>{t}</h2>
                        <p>{desc}</p>
                        <small>{meta}</small>
                      </div>
                      <Badge>
                        {v === "plan" ? "Whole class" : "Selected students"}
                      </Badge>
                    </label>
                  ))}
                  <p className="muted">
                    Both options start from this same review draft. Nothing is
                    sent or scheduled until you confirm.
                  </p>
                </>
              )}
              <footer>
                <Button
                  onClick={() => (step ? go("draft", step - 1) : go("detail"))}
                >
                  Back
                </Button>
                <div className="actions">
                  {step === 0 && <Button onClick={save}>Save draft</Button>}
                  {step === 1 && (
                    <Button
                      onClick={() => {
                        setSupportEdit({ ...draft.support });
                        setSupportOpen(false);
                        go("draft", 2);
                      }}
                    >
                      Skip differentiation
                    </Button>
                  )}
                  <Button
                    primary
                    disabled={
                      !draft.selected.length || !draft.recipients.length
                    }
                    onClick={() => {
                      if (
                        step === 1 &&
                        supportOpen &&
                        JSON.stringify(draft.support) !==
                          JSON.stringify(supportEdit)
                      ) {
                        setModal("unsaved");
                        return;
                      }
                      if (step === 3) {
                        edit({ reviewed: false });
                        go(draft.action === "plan" ? "schedule" : "confirm", 4);
                      } else next();
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </footer>
            </>
          )}
          {page === "library" && (
            <>
              <div className="row">
                <h1>
                  {libReview
                    ? replaceId
                      ? "Review replacement"
                      : "Review selection"
                    : replaceId
                      ? "Replacement options"
                      : "Add material"}
                </h1>
                <Badge>Library search</Badge>
              </div>
              <p className="muted">
                Only the Materials section changes. Students, evidence and
                support stay as they are.
              </p>
              {!libReview ? (
                <>
                  <div className="libraryfilters">
                    <label>
                      Learning need
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <label>
                      Grade
                      <select>
                        <option>6</option>
                      </select>
                    </label>
                    <label>
                      Content type
                      <select
                        value={libType}
                        onChange={(e) => setLibType(e.target.value)}
                      >
                        {[
                          "All types",
                          "Lesson",
                          "Station",
                          "Practice set",
                          "Exercise set",
                        ].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Achievement levels
                      <select
                        value={libLevel}
                        onChange={(e) => setLibLevel(e.target.value)}
                      >
                        <option>All levels</option>
                        {levels.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </label>
                    <Button
                      primary
                      onClick={() => {
                        setLibLoading(true);
                        timeout.current = setTimeout(
                          () => setLibLoading(false),
                          350,
                        );
                      }}
                    >
                      Search
                    </Button>
                  </div>
                  <div className="row">
                    <small>
                      Already in draft: {draft.selected.length} materials ·{" "}
                      {total(draft)} min
                    </small>
                    <button
                      className="textlink"
                      onClick={() => {
                        setQuery("");
                        setLibType("All types");
                        setLibLevel("All levels");
                        setScenario("normal");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                  {libLoading ? (
                    <div className="blankstate" role="status">
                      Searching the resource library…
                    </div>
                  ) : scenario === "unavailable" ? (
                    <div className="blankstate">
                      <h2>Source unavailable</h2>
                      <p>
                        Could not load the resource library. Your draft has not
                        changed.
                      </p>
                      <Button onClick={() => setScenario("normal")}>
                        Retry
                      </Button>
                    </div>
                  ) : scenario === "empty" || !results.length ? (
                    <div className="blankstate">
                      <h2>No matching content</h2>
                      <p>
                        Try a different learning need or clear filters. Your
                        current materials stay in the draft.
                      </p>
                      <Button
                        onClick={() => {
                          setQuery("");
                          setLibType("All types");
                          setScenario("normal");
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <>
                      {scenario === "partial" && (
                        <div className="banner warn">
                          Partial results. Some library sources are unavailable;
                          available items can still be reviewed.
                        </div>
                      )}
                      {scenario === "restricted" && (
                        <div className="banner warn">
                          Some content is permission restricted. Restricted
                          items cannot be selected.
                        </div>
                      )}
                      <p className="muted">
                        {results.length} results · page 1 of 1
                      </p>
                      {results
                        .slice(0, scenario === "partial" ? 3 : undefined)
                        .map((m, i) => {
                          const inDraft = draft.selected.includes(m.id);
                          const restricted = scenario === "restricted" && i > 2;
                          return (
                            <article className="libraryresult" key={m.id}>
                              <input
                                type={replaceId ? "radio" : "checkbox"}
                                name="material-pick"
                                aria-label={`Select ${m.title}`}
                                checked={picks.includes(m.id)}
                                disabled={inDraft || restricted}
                                onChange={() =>
                                  setPicks((p) =>
                                    replaceId
                                      ? [m.id]
                                      : p.includes(m.id)
                                        ? p.filter((id) => id !== m.id)
                                        : [...p, m.id],
                                  )
                                }
                              />
                              <div className="grow">
                                <Badge>{m.type}</Badge>
                                <h3>{m.title}</h3>
                                <small>
                                  Grade 6 · {libLevel} · {m.minutes} min ·
                                  Resource library
                                </small>
                              </div>
                              {inDraft ? (
                                <Badge>In draft</Badge>
                              ) : restricted ? (
                                <Badge>Restricted</Badge>
                              ) : null}
                              <Button onClick={() => setPreview(m)}>
                                Preview
                              </Button>
                            </article>
                          );
                        })}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="banner">
                    <strong>Only Materials will change</strong>
                    <p>
                      Students ({draft.recipients.length}), evidence and saved
                      support stay exactly as they are.
                    </p>
                  </div>
                  {proposed.map((id, i) => {
                    const m = materials.find((m) => m.id === id)!;
                    return (
                      <article className="libraryresult" key={id}>
                        <span className="number">{i + 1}</span>
                        <div className="grow">
                          <Badge>{m.type}</Badge>
                          <h3>{m.title}</h3>
                          <small>{m.minutes} min · Resource library</small>
                        </div>
                        {!draft.selected.includes(id) && (
                          <Badge tone="blue">
                            {replaceId ? "Replacement" : "New"}
                          </Badge>
                        )}
                        <Button
                          disabled={i === 0}
                          onClick={() =>
                            setProposed((p) => {
                              const a = [...p];
                              [a[i - 1], a[i]] = [a[i], a[i - 1]];
                              return a;
                            })
                          }
                        >
                          Move up
                        </Button>
                        <Button
                          disabled={i === proposed.length - 1}
                          onClick={() =>
                            setProposed((p) => {
                              const a = [...p];
                              [a[i + 1], a[i]] = [a[i], a[i + 1]];
                              return a;
                            })
                          }
                        >
                          Move down
                        </Button>
                        {!draft.selected.includes(id) && (
                          <Button
                            onClick={() =>
                              setProposed((p) => p.filter((x) => x !== id))
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </article>
                    );
                  })}
                  <p>
                    {replaceId
                      ? "1 replacement · same position"
                      : `${proposed.filter((id) => !draft.selected.includes(id)).length} new materials · no duplicates`}
                  </p>
                </>
              )}
              <footer>
                <Button
                  onClick={() => {
                    if (libReview) setLibReview(false);
                    else go("draft");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  primary
                  disabled={
                    libLoading ||
                    (!libReview && !picks.length) ||
                    (libReview && !proposed.length)
                  }
                  onClick={libReview ? apply : reviewPicks}
                >
                  {libReview
                    ? replaceId
                      ? "Replace in review plan"
                      : "Add selected materials to review plan"
                    : `Review selection (${picks.length})`}
                </Button>
              </footer>
            </>
          )}
          {(page === "schedule" || page === "conflict") && (
            <>
              <div className="row">
                <h1>
                  {page === "conflict"
                    ? "Review conflict"
                    : "Schedule in Curriculum plan"}
                </h1>
                <Badge>Draft</Badge>
              </div>
              <p>
                {draft.title} · Class 6A · Whole class · 24 students ·
                Mathematics timetable
              </p>
              <article className="hicard">
                <h2>
                  Items to schedule · {schedulable(draft).length} items ·{" "}
                  {schedulable(draft).reduce((n, m) => n + m.minutes, 0)} min
                </h2>
                {schedulable(draft).map((m) => (
                  <React.Fragment key={m.id}>
                    {MaterialRow({ m })}
                  </React.Fragment>
                ))}
                {!schedulable(draft).length && (
                  <div className="banner warn">
                    No schedulable content. Add a Lesson or Station before
                    continuing.
                  </div>
                )}
                <p className="muted">
                  Practice sets are not scheduled. They stay in the review draft
                  for Assign now.
                </p>
              </article>
              {scenario === "access" ? (
                <div className="banner warn">
                  <h2>Calendar access unavailable</h2>
                  <p>
                    Your review draft is retained. Retry access or return to
                    choose action.
                  </p>
                  <Button onClick={() => setScenario("normal")}>Retry</Button>
                </div>
              ) : page === "schedule" ? (
                <>
                  <article className="hicard">
                    <h2>Date and time</h2>
                    <div className="libraryfilters">
                      <label>
                        Date
                        <input
                          type="date"
                          value={draft.planned}
                          onChange={(e) =>
                            edit({
                              planned: e.target.value,
                              requested: e.target.value,
                              resolution: false,
                            })
                          }
                        />
                      </label>
                      <label>
                        Start time
                        <input
                          type="time"
                          value={draft.plannedTime}
                          onChange={(e) =>
                            edit({
                              plannedTime: e.target.value,
                              requestedTime: e.target.value,
                              resolution: false,
                            })
                          }
                        />
                      </label>
                      <div>
                        <small>Duration</small>
                        <p>
                          {schedulable(draft).reduce(
                            (n, m) => n + m.minutes,
                            0,
                          )}{" "}
                          min
                        </p>
                      </div>
                    </div>
                  </article>
                  <article className="hicard">
                    <h2>Timetable · {date(draft.planned)}</h2>
                    <div className="timetableitem">
                      <strong>Protau</strong>
                      <span>21 Oct · 09:00–10:00</span>
                    </div>
                    <div className="timetableitem blue">
                      <strong>{draft.title}</strong>
                      <span>
                        Requested · {date(draft.planned)} · {draft.plannedTime}
                      </span>
                    </div>
                    {conflict(draft) && (
                      <div className="banner warn">
                        The requested time overlaps Protau. You can review a
                        suggested date next.
                      </div>
                    )}
                  </article>
                </>
              ) : (
                <>
                  <div className="banner warn">
                    <h2>21 Oct · 09:20 overlaps an existing Protau event</h2>
                    <p>
                      Move the new items to 22 Oct · 10:15. The existing Protau
                      event stays in place. Nothing moves until final
                      confirmation.
                    </p>
                    <label className="checkline">
                      <input
                        type="checkbox"
                        checked={draft.resolution}
                        onChange={(e) => edit({ resolution: e.target.checked })}
                      />
                      Accept this proposed resolution
                    </label>
                  </div>
                  <article className="hicard">
                    <h2>Recalculation preview</h2>
                    <div className="facts">
                      <div>
                        <small>Affected item</small>
                        <p>Fractions test · planned test</p>
                      </div>
                      <div>
                        <small>Current date</small>
                        <p>22 Oct · 09:00</p>
                      </div>
                      <div>
                        <small>Resolved date</small>
                        <p>26 Oct · 09:00</p>
                      </div>
                    </div>
                    <p>
                      The planned test moves only after final confirmation. It
                      has not been assigned to students.
                    </p>
                    <Button
                      onClick={() => {
                        edit({ resolution: false });
                        go("schedule", 3);
                      }}
                    >
                      Choose another date
                    </Button>
                  </article>
                </>
              )}
              <footer>
                <Button onClick={() => go("draft", 3)}>Back</Button>
                <Button
                  primary
                  disabled={
                    !schedulable(draft).length ||
                    scenario === "access" ||
                    (page === "conflict" && !draft.resolution)
                  }
                  onClick={() => {
                    if (page === "schedule" && conflict(draft)) {
                      go("conflict", 3);
                      return;
                    }
                    if (page === "conflict") {
                      edit({ planned: "2026-10-22", plannedTime: "10:15" });
                      go("confirm", 4);
                      return;
                    }
                    const err = validate(draft);
                    if (err) {
                      setMessage(err);
                      return;
                    }
                    go("confirm", 4);
                  }}
                >
                  Continue
                </Button>
              </footer>
            </>
          )}
          {page === "confirm" && (
            <>
              <h1>
                {draft.action === "plan"
                  ? "Confirm class plan"
                  : "Confirm assigned test"}
              </h1>
              <div className="banner">
                <strong>
                  {draft.action === "plan"
                    ? "Whole-class timetable action"
                    : "Students receive one Assigned test"}
                </strong>
                <p>
                  {draft.action === "plan"
                    ? "The lesson and station are added to the whole-class Curriculum plan and Calendar. No student assignments are created. Student-specific support stays in the draft."
                    : "Every recipient gets the same selected exercises. Lesson and Station stay in your review draft as teacher resources · not sent."}
                </p>
              </div>
              {draft.action === "assignment" ? (
                <>
                  <article className="hicard">
                    <div className="row">
                      <h2>Recipients · {draft.recipients.length}</h2>
                      <Button onClick={editStudents}>Edit recipients</Button>
                    </div>
                    <div className="tablewrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Evidence</th>
                            <th>Saved support</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draft.recipients.map((id) => {
                            const s = students.find((s) => s.id === id)!;
                            return (
                              <tr key={id}>
                                <td>{s.name}</td>
                                <td>
                                  {s.evidence}
                                  {id === "sofia" ? " · 1 response" : ""}
                                </td>
                                <td>{draft.support[id] || "Shared version"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </article>
                  {Sequence()}
                  {SupportSummary()}
                  <article className="hicard">
                    <h2>Assigned test</h2>
                    <label>
                      Title
                      <input
                        value={draft.title}
                        onChange={(e) => edit({ title: e.target.value })}
                      />
                    </label>
                    <div className="facts">
                      <div>
                        <small>Template</small>
                        <p>
                          This review’s practice sets · template name not
                          confirmed
                        </p>
                      </div>
                      <div>
                        <small>Test type</small>
                        <p>Homework</p>
                      </div>
                    </div>
                    <div className="libraryfilters">
                      {[
                        ["Start date", "start", "date"],
                        ["Start time", "startTime", "time"],
                        ["End date", "end", "date"],
                        ["End time", "endTime", "time"],
                      ].map(([l, k, t]) => (
                        <label key={k}>
                          {l}
                          <input
                            type={t}
                            value={draft[k as keyof Draft] as string}
                            onChange={(e) => edit({ [k]: e.target.value })}
                          />
                        </label>
                      ))}
                    </div>
                    <small>
                      Example schedule — confirm current Assigned tests field
                      behavior.
                    </small>
                  </article>
                </>
              ) : (
                <>
                  <article className="hicard">
                    <h2>Class · whole class</h2>
                    <p>Class 6A · 24 students · Mathematics timetable</p>
                    {schedulable(draft).map((m) => (
                      <React.Fragment key={m.id}>
                        {MaterialRow({ m })}
                      </React.Fragment>
                    ))}
                    <p>
                      One timetable slot ·{" "}
                      {schedulable(draft).reduce((n, m) => n + m.minutes, 0)}{" "}
                      min (Lesson, then Station)
                    </p>
                    <small>
                      Practice sets stay in the review draft and are not
                      scheduled.
                    </small>
                  </article>
                  <article className="hicard">
                    <div className="row">
                      <h2>Schedule</h2>
                      <Button onClick={() => go("schedule", 3)}>
                        Edit schedule
                      </Button>
                    </div>
                    <p>
                      Requested: {date(draft.requested)} · {draft.requestedTime}
                    </p>
                    <p>
                      Date and slot: {date(draft.planned)} · {draft.plannedTime}
                      –
                      {addMinutes(
                        draft.plannedTime,
                        schedulable(draft).reduce((n, m) => n + m.minutes, 0),
                      )}
                    </p>
                    {draft.resolution && (
                      <div className="banner warn">
                        <strong>Recalculation</strong>
                        <p>
                          Fractions test: 22 Oct 09:00 → 26 Oct 09:00. Moves
                          only after confirmation. Undo restores the original
                          date.
                        </p>
                      </div>
                    )}
                  </article>
                </>
              )}
              <article className="hicard">
                <div className="row">
                  <h2>Destination</h2>
                  <Button onClick={() => go("draft", 3)}>
                    Edit destination
                  </Button>
                </div>
                <p>
                  {draft.action === "plan"
                    ? "Class 6A Curriculum plan + Calendar · whole class"
                    : "Assigned tests · selected students"}
                </p>
                {draft.action === "assignment" && (
                  <small>
                    Student entry point · Pending product verification
                  </small>
                )}
              </article>
              {validate(draft) && (
                <p role="alert" className="banner warn">
                  {validate(draft)}
                </p>
              )}
              <label className="checkline confirmation">
                <input
                  type="checkbox"
                  checked={draft.reviewed}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, reviewed: e.target.checked }))
                  }
                />
                {draft.action === "plan"
                  ? "I’ve checked the class, lesson, slot and planned test date"
                  : "I’ve checked who receives the exercises and when they open"}
              </label>
              <footer>
                <Button onClick={() => go("draft", 3)}>Back to edit</Button>
                <Button
                  primary
                  disabled={!!validate(draft) || !draft.reviewed}
                  onClick={submit}
                >
                  {draft.action === "plan"
                    ? "Confirm and add to curriculum plan"
                    : "Confirm and assign"}
                </Button>
              </footer>
            </>
          )}
          {(page === "submitting" || page === "checking") && (
            <div className="blankstate" role="status">
              <h1>
                {page === "checking"
                  ? "Checking previous submission"
                  : "Submitting…"}
              </h1>
              <p>Your draft is retained. Please wait.</p>
            </div>
          )}
          {page === "submitfailed" && (
            <div className="blankstate">
              <h1>Submission interrupted</h1>
              <p>
                We could not confirm the result. Your draft is retained. Check
                the previous submission before retrying so nothing is
                duplicated.
              </p>
              <div className="actions">
                <Button onClick={() => go("confirm", 4)}>Back to draft</Button>
                <Button primary onClick={recover}>
                  Check previous submission
                </Button>
              </div>
            </div>
          )}
          {page === "success" && active && (
            <>
              <h1>
                {active.action === "plan"
                  ? "Planned and synced"
                  : "Assigned test created"}
              </h1>
              <p>
                {active.title} · {active.snapshot.selected.length} review-draft
                materials · {total(active.snapshot)} min
              </p>
              {active.action === "plan" ? (
                <>
                  <div className="banner">
                    <strong>Added to Curriculum plan and Calendar</strong>
                    <p>
                      Class 6A · Whole class · 24 students ·{" "}
                      {active.calendar.length} linked items
                    </p>
                  </div>
                  <article className="hicard">
                    {active.calendar.map((e) => (
                      <div className="timetableitem" key={e.id}>
                        <strong>{e.title}</strong>
                        <span>
                          {date(e.date)} · {e.start}–{e.end}
                        </span>
                      </div>
                    ))}
                    {active.movesTest && (
                      <p>
                        Fractions test moved to 26 Oct · 09:00 after your
                        confirmation.
                      </p>
                    )}
                  </article>
                  <p>
                    Practice sets remain in the review draft. No student
                    assignment was created.
                  </p>
                  {UndoControls()}
                </>
              ) : (
                <>
                  <div className="banner">
                    The selected students received one local sample Assigned
                    test. Lesson and Station are not sent.
                  </div>
                  <article className="hicard">
                    <h2>Recipients</h2>
                    <p>{names(active.recipients)}</p>
                    <h2>Assigned test · same exercises for every recipient</h2>
                    <p>
                      {questionCount(active.snapshot)} exercises ·{" "}
                      {active.sentMaterials
                        .map((id) => materials.find((m) => m.id === id)!.title)
                        .join(", ")}
                    </p>
                    <h2>Availability</h2>
                    <p>
                      {date(active.snapshot.start)} {active.snapshot.startTime}{" "}
                      → {date(active.snapshot.end)} {active.snapshot.endTime}
                    </p>
                    <small>
                      Saved support stays in the teacher draft. Student entry
                      point is pending product verification.
                    </small>
                  </article>
                </>
              )}
              <footer>
                <Button onClick={() => go("overview")}>Back to group</Button>
                <Button
                  primary
                  onClick={() =>
                    go(active.action === "plan" ? "calendar" : "assigned")
                  }
                >
                  {active.action === "plan"
                    ? "Open Calendar"
                    : "Open in Assigned tests"}
                </Button>
              </footer>
            </>
          )}
          {page === "assigned" && (
            <>
              <h1>Assigned tests</h1>
              <p className="muted">
                Review tracked after assigning · Sample data stored in this
                browser
              </p>
              {records
                .filter((r) => r.action === "assignment")
                .map((r) => (
                  <article className="hicard" key={r.id}>
                    <div className="row">
                      <h2>{r.title}</h2>
                      <Badge tone="blue">Not started</Badge>
                    </div>
                    <p>
                      {r.recipients.length} students ·{" "}
                      {questionCount(r.snapshot)} exercises · {r.snapshot.start}
                      –{r.snapshot.end}
                    </p>
                    <Button
                      primary
                      onClick={() => {
                        setCurrent(r.id);
                        go("progress");
                      }}
                    >
                      View progress &amp; evidence
                    </Button>
                  </article>
                ))}
              {!records.some((r) => r.action === "assignment") && (
                <div className="blankstate">
                  <h2>No assigned review yet</h2>
                  <Button onClick={() => go("overview")}>
                    Back to suggested groups
                  </Button>
                </div>
              )}
            </>
          )}
          {page === "progress" && (
            <>
              <div className="banner">
                Sample progress from 15 Oct, one day after assigning. These
                responses are illustrative, not live student activity.
              </div>
              <div className="row">
                <h1>Assigned test progress</h1>
                <Badge tone="blue">In progress</Badge>
              </div>
              <p>Equivalent fractions review · from Assigned tests</p>
              <p>Completion: 1 completed · 1 in progress · 1 not started</p>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Progress</th>
                      <th>Completion</th>
                      <th>Evidence since review</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .slice(0, 3)
                      .filter(
                        (s) =>
                          !active || active.snapshot.recipients.includes(s.id),
                      )
                      .map((s, i) => (
                        <tr key={s.id}>
                          <td>
                            {s.name}
                            <small>
                              {i === 2
                                ? "Not opened yet"
                                : "Last active 15 Oct"}
                            </small>
                          </td>
                          <td>
                            {
                              [
                                "All exercises answered",
                                "Some exercises answered",
                                "No exercises answered",
                              ][i]
                            }
                          </td>
                          <td>
                            <Badge>
                              {["Completed", "In progress", "Not started"][i]}
                            </Badge>
                          </td>
                          <td>
                            <Badge tone={i === 0 ? "green" : "plain"}>
                              {i === 0 ? "Secure" : "Insufficient evidence"}
                            </Badge>
                            <small>
                              {
                                [
                                  "Correct on 3 of 3 review items",
                                  "1 correct item so far",
                                  "No new responses yet",
                                ][i]
                              }
                            </small>
                          </td>
                          <td>
                            <Button
                              onClick={() => {
                                setExpanded(s.id);
                                setModal("followevidence");
                              }}
                            >
                              View evidence
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <p className="muted">
                Evidence labels describe the latest responses only, not mastery.
                A later check is needed to confirm that understanding holds.
              </p>
              <Button onClick={() => go("assigned")}>
                Back to Assigned tests
              </Button>
            </>
          )}
          {page === "followup" && (
            <>
              <button className="textlink" onClick={() => go("progress")}>
                ← Equivalent fractions review
              </button>
              <h1>Plan follow-up · Noah Wilson</h1>
              <Badge>Insufficient evidence</Badge>
              <p>
                Suggested from the review evidence (15 Oct). Nothing is sent
                until the follow-up draft is reviewed and confirmed.
              </p>
              <article className="hicard">
                <h2>Evidence summary</h2>
                <p>
                  Fractions checkpoint, 12 Oct: incorrect (2/3 = 4/8) · Review
                  practice, 15 Oct: 1 correct item so far (2/3 = 6/9)
                </p>
                <h2>Suggested recipients · 2 students</h2>
                <p>Noah Wilson · Insufficient evidence</p>
                <p>Sofia Martin · No new evidence yet</p>
                <small>
                  Both students may benefit from a short follow-up check before
                  the next lesson.
                </small>
              </article>
              <article className="hicard">
                <h2>Recommended materials · 2 items · 11 min</h2>
                {materials
                  .filter((m) => ["station", "practice"].includes(m.id))
                  .map((m) => (
                    <React.Fragment key={m.id}>
                      {MaterialRow({ m })}
                    </React.Fragment>
                  ))}
              </article>
              <footer>
                <Button onClick={() => go("progress")}>Back to progress</Button>
                <Button
                  primary
                  onClick={() => {
                    setDraft({
                      ...fresh(),
                      recipients: ["noah", "sofia"],
                      selected: ["station", "practice"],
                      followup: true,
                    });
                    setSupportOpen(false);
                    go("draft");
                  }}
                >
                  Create follow-up draft
                </Button>
              </footer>
            </>
          )}
          {page === "calendar" && (
            <>
              <h1>Calendar</h1>
              <p>
                Class 6A · Whole class · 24 students · Mathematics timetable ·
                Mon 19 Oct – Sun 1 Nov
              </p>
              <small>
                Planned from the Finding equivalent fractions recommendation.
              </small>
              <div className="row">
                <div className="segmented">
                  {["Month", "Week", "Day"].map((v) => (
                    <button
                      className={calendarView === v ? "selected" : ""}
                      key={v}
                      onClick={() =>
                        v === "Week"
                          ? undefined
                          : inform(
                              `${v} view is a design reference only. Use Week to inspect linked schedule items.`,
                            )
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="actions">
                  <Button onClick={() => go("draft", 2)}>Review draft</Button>
                  <Button onClick={() => go("overview")}>Back to group</Button>
                </div>
              </div>
              {active?.action === "plan" && UndoControls()}
              <div className="calendarwrap">
                <div
                  className="hicalendar"
                  style={{
                    gridTemplateColumns: "190px repeat(14,minmax(66px,1fr))",
                  }}
                >
                  <div className="calhead">
                    {calendarView === "Month"
                      ? "October 2026"
                      : "19 Oct – 1 Nov"}
                  </div>
                  {Array.from({ length: 14 }, (_, i) => (
                    <div className="calhead" key={i}>
                      <small>
                        {
                          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                            i % 7
                          ]
                        }
                      </small>
                      <p>{i === 13 ? 1 : 19 + i}</p>
                    </div>
                  ))}
                  {[
                    {
                      title: "Lessons",
                      events: records
                        .flatMap((r) => r.calendar)
                        .filter((e) => e.type === "Lesson"),
                    },
                    {
                      title: "Stations",
                      events: records
                        .flatMap((r) => r.calendar)
                        .filter((e) => e.type === "Station"),
                    },
                    {
                      title: "Protau",
                      events: [
                        {
                          id: "protau",
                          title: "Protau",
                          date: "2026-10-21",
                          start: "09:00",
                          end: "10:00",
                        },
                      ],
                    },
                    {
                      title: "Planned tests",
                      events: [
                        {
                          id: "test",
                          title: "Fractions test",
                          date: testDate(records),
                          start: "09:00",
                          end: "09:45",
                        },
                      ],
                    },
                  ].map((row) => (
                    <React.Fragment key={row.title}>
                      <div className="calhead">
                        <strong>{row.title}</strong>
                        <small>Class 6A · Mathematics</small>
                      </div>
                      {Array.from({ length: 14 }, (_, i) => {
                        const day = new Date("2026-10-19T12:00:00Z");
                        day.setUTCDate(day.getUTCDate() + i);
                        const d = day.toISOString().slice(0, 10);
                        return (
                          <div className="calcell" key={i}>
                            {row.events
                              .filter((e) => e.date === d)
                              .map((e) => (
                                <button
                                  className={
                                    "calevent " +
                                    (row.title === "Planned tests"
                                      ? "testevent"
                                      : "")
                                  }
                                  key={e.id}
                                  onClick={() =>
                                    inform(
                                      `${e.title} · ${date(e.date)} · ${e.start}–${e.end}. ${e.id === "test" ? "Planned timetable test, not assigned to students." : ""}`,
                                    )
                                  }
                                >
                                  {e.title}
                                  <small>{e.start}</small>
                                </button>
                              ))}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <p className="muted">
                Undo removes the linked Lesson and Station and restores any
                moved planned test. Assigned tests are separate.
              </p>
            </>
          )}
        </div>
        <details
          className="testpanel"
          open={testPanel}
          onToggle={(e) => setTestPanel(e.currentTarget.open)}
        >
          <summary>Prototype test scenarios</summary>
          <p>
            Sample data only. These controls exercise failure and recovery
            states without changing a live school system.
          </p>
          <div className="libraryfilters">
            <label>
              Library / Calendar scenario
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              >
                {[
                  ["normal", "Normal"],
                  ["empty", "No matching content"],
                  ["unavailable", "Source unavailable"],
                  ["partial", "Partial results"],
                  ["restricted", "Permission restricted"],
                  ["stale", "Stale selection"],
                  ["applyfail", "Apply failed"],
                  ["access", "Calendar access unavailable"],
                ].map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Submission
              <select
                value={submitMode}
                onChange={(e) => setSubmitMode(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="fail">Fail before saving</option>
                <option value="ambiguous">Save, then lose confirmation</option>
              </select>
            </label>
            <label className="checkline">
              <input
                type="checkbox"
                checked={supportFailure}
                onChange={(e) => setSupportFailure(e.target.checked)}
              />
              Fail support save
            </label>
            <label className="checkline">
              <input
                type="checkbox"
                checked={undoFailure}
                onChange={(e) => setUndoFailure(e.target.checked)}
              />
              Fail Undo
            </label>
          </div>
        </details>
      </main>
      {busy && (
        <div className="pending" role="status">
          {page === "checking"
            ? "Checking previous submission…"
            : "Submitting…"}
        </div>
      )}
      {modal === "info" && (
        <Modal title="Information" onClose={() => setModal("")}>
          <p>{info}</p>
          <Button primary onClick={() => setModal("")}>
            Close
          </Button>
        </Modal>
      )}
      {modal === "students" && (
        <Modal title="Edit students" onClose={() => setModal("")}>
          <p>
            Choose the students for this review. Changes apply only when you
            save.
          </p>
          {students.map((s) => (
            <label className="checkline pickstudent" key={s.id}>
              <input
                type="checkbox"
                checked={tempStudents.includes(s.id)}
                onChange={() =>
                  setTempStudents((p) =>
                    p.includes(s.id)
                      ? p.filter((id) => id !== s.id)
                      : [...p, s.id],
                  )
                }
              />
              <span className="avatar">{s.initials}</span>
              <span>
                {s.name}
                <small>
                  {s.responses} related responses · {s.evidence}
                </small>
              </span>
            </label>
          ))}
          <p>{tempStudents.length} selected</p>
          <footer>
            <Button onClick={() => setModal("")}>Cancel</Button>
            <Button
              primary
              disabled={!tempStudents.length}
              onClick={() => {
                edit({ recipients: tempStudents });
                setModal("");
              }}
            >
              Save students
            </Button>
          </footer>
        </Modal>
      )}
      {modal === "unsaved" && (
        <Modal
          title="Support changes are not saved"
          onClose={() => setModal("")}
        >
          <p>
            Save the adjustments, or continue using the previously saved
            support.
          </p>
          <div className="actions">
            <Button onClick={() => setModal("")}>Keep editing</Button>
            <Button
              onClick={() => {
                setSupportEdit({ ...draft.support });
                setModal("");
                go("draft", 2);
              }}
            >
              Continue without changes
            </Button>
            <Button
              primary
              onClick={() => {
                if (supportFailure) {
                  setMessage(
                    "Support could not be saved. Saved choices are unchanged.",
                  );
                  setModal("");
                  return;
                }
                edit({ support: supportEdit });
                setModal("");
                go("draft", 2);
              }}
            >
              Save and continue
            </Button>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal title={preview.title} onClose={() => setPreview(null)}>
          <p>
            {preview.type} · {preview.minutes} min · Grade 6 · Resource library
          </p>
          <article className="hicard">
            <h3>Objective</h3>
            <p>{preview.objective}</p>
            <h3>Includes</h3>
            <p>{preview.includes}</p>
            <h3>Why suggested</h3>
            <p>{preview.reason}</p>
          </article>
          <Button primary onClick={() => setPreview(null)}>
            Close
          </Button>
        </Modal>
      )}
      {modal === "followevidence" && (
        <Modal
          title={`${students.find((s) => s.id === expanded)?.name} · Evidence`}
          onClose={() => setModal("")}
        >
          <p>
            Equivalent fractions review compared with the Fractions checkpoint
          </p>
          <div className="beforeafter">
            <article>
              <h3>Before · 12 Oct</h3>
              <p>{expanded === "noah" ? "2/3 = 4/8" : "2/3 = 2/12"}</p>
              <Badge tone="orange">Incorrect</Badge>
            </article>
            <article>
              <h3>After · 15 Oct</h3>
              <p>
                {expanded === "amelia"
                  ? "2/3 = 8/12"
                  : expanded === "noah"
                    ? "2/3 = 6/9"
                    : "No response yet"}
              </p>
              <Badge tone={expanded === "amelia" ? "green" : "plain"}>
                {expanded === "sofia" ? "Not started" : "Correct"}
              </Badge>
            </article>
          </div>
          <p>
            {expanded === "amelia"
              ? "Correct on all 3 review items. This is not mastery — a later check confirms whether it holds."
              : expanded === "noah"
                ? "One correct independent item is not enough to confirm understanding. Check again after the remaining material."
                : "No new responses yet. No follow-up action is suggested until new evidence is available."}
          </p>
          <footer>
            <Button onClick={() => setModal("")}>Back to progress</Button>
            {expanded === "noah" && (
              <Button
                primary
                onClick={() => {
                  setModal("");
                  go("followup");
                }}
              >
                Plan follow-up
              </Button>
            )}
          </footer>
        </Modal>
      )}
    </div>
  );
  function UndoControls() {
    if (!active || active.action !== "plan") return null;
    const seconds = Math.max(0, Math.ceil((active.undoUntil - tick) / 1000));
    return (
      <div className="banner row">
        <div>
          <strong>Added to Curriculum plan and Calendar</strong>
          <p>
            {active.calendar.length} linked items ·{" "}
            {seconds
              ? `${seconds}s remaining in original Undo window`
              : "Undo window expired"}
          </p>
        </div>
        <Button disabled={!seconds} onClick={undoPlan}>
          Undo
        </Button>
      </div>
    );
  }
}
