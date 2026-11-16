import { DateControl, TimeControl } from "./DateTime";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
          <span>{r[1]}</span>
          <small>{r[2]}</small>
          <Badge tone={r[3] === "Correct" ? "green" : "orange"}>{r[3]}</Badge>
        </div>
      ))}
      <p className="muted">
        {person === "sofia"
          ? "Only one related response is available. Check again before inferring a shared error."
          : "Pattern: scales only the numerator or only the denominator in 2 of 3 items."}
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
  const [assignedQuery, setAssignedQuery] = useState("");
  const [archive, setArchive] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
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

  useLayoutEffect(() => {
    document.querySelector(".panelbody")?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [page, step, libReview]);
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
    setStudentQuery("");
    setModal("students");
  };
  const library = (id: string | null = null) => {
    setReplaceId(id);
    setLibType(id ? materials.find((m) => m.id === id)!.type : "All types");
    setPicks([]);
    setLibReview(false);
    setQuery("equivalent fractions");
    setScenario("normal");
    setLibLoading(true);
    go("library");
    timeout.current = setTimeout(() => setLibLoading(false), 350);
  };
  const sourceCandidates = replaceId
    ? materials.filter(
        (m) =>
          m.id === replaceId ||
          (m.type === materials.find((x) => x.id === replaceId)?.type &&
            !draft.selected.includes(m.id)),
      )
    : materials.filter((m) => !["walls", "area"].includes(m.id));
  const results = sourceCandidates.filter(
    (m) =>
      (libType === "All types" || m.type === libType) &&
      (query.toLowerCase().includes("equivalent fractions") ||
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
    setSupportEdit(
      Object.keys(draft.support).length
        ? { ...draft.support }
        : Object.fromEntries(
            draft.recipients
              .filter((id) => !!students.find((s) => s.id === id)?.suggested)
              .map((id) => [id, students.find((s) => s.id === id)!.suggested]),
          ),
    );
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
  const inGroup = !["calendar", "assigned"].includes(page);
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
      <div className="hisummary exactsummary">
        <h2>Review summary</h2>
        <section className="summaryblock summarystudents">
          <small>Students</small>
          <div className="summaryvalue">
            <Avatars
              people={draft.recipients.map(
                (id) => students.find((s) => s.id === id)!.name,
              )}
            />
            <span>{draft.recipients.length}</span>
          </div>
          <Button onClick={editStudents}>Edit</Button>
        </section>
        <section className="summaryblock">
          <small>Learning goal</small>
          <p>Finding equivalent fractions</p>
        </section>
        <section className="summaryblock">
          <small>Based on</small>
          <p>
            Fractions checkpoint<small>12 Oct</small>
          </p>
        </section>
        <section className="summaryblock">
          <div className="row">
            <small>Total time</small>
            <span>{total(draft)} min</span>
          </div>
        </section>
        <section className="summaryassigned">
          <small>Assigned test</small>
          <p>
            {questionCount(draft)} exercises · estimated{" "}
            {assignable(draft).reduce((n, m) => n + m.minutes, 0)} min
          </p>
        </section>
        <section className="summaryblock">
          <small>Nothing is sent until you confirm.</small>
        </section>
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
        <div className="materialtype">
          <Badge>{m.type}</Badge>
        </div>
        <div className="grow">
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
              {m.questions > 0 && (
                <Button
                  onClick={() =>
                    edit({
                      selected: draft.selected.filter((id) => id !== m.id),
                    })
                  }
                >
                  Remove
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  function SupportSummary() {
    return (
      <article className="hicard supportsummary">
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
      <article className="hicard sequencecard">
        <div className="row">
          <h2>
            Review draft · {draft.selected.length} materials · {total(draft)}{" "}
            min
          </h2>
          <Button onClick={() => go("draft")}>Edit materials</Button>
        </div>
        {CompactMaterials(selected(draft))}
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
  function CompactMaterials(items: Material[]) {
    return (
      <div className="compactmaterials">
        {items.map((m) => (
          <div className="compactmaterial" key={m.id}>
            <div>
              <Badge>{m.type}</Badge>
            </div>
            <span>{m.title}</span>
            <small>{m.minutes} min</small>
          </div>
        ))}
      </div>
    );
  }
  function Recipients() {
    return (
      <section className="confirmsection">
        <div className="row">
          <h2>Recipients · {draft.recipients.length}</h2>
          <Button onClick={editStudents}>Edit recipients</Button>
        </div>
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
              const st = students.find((s) => s.id === id)!;
              return (
                <tr key={id}>
                  <td>{st.name}</td>
                  <td>
                    {st.evidence}
                    {id === "sofia" ? " · 1 response" : ""}
                  </td>
                  <td>{draft.support[id] || "Shared version"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    );
  }
  function Destination() {
    return (
      <section className="confirmsection">
        <div className="row">
          <h2>Destination</h2>
          <Button onClick={() => go("draft", 3)}>Edit destination</Button>
        </div>
        <p>
          {draft.action === "plan"
            ? "Class 6A Curriculum plan + Calendar · whole class"
            : "Assigned tests · selected students"}
        </p>
        {draft.action === "assignment" && (
          <small>Student entry point · Pending product verification</small>
        )}
      </section>
    );
  }
  function SnapshotSummary(d: Draft) {
    return (
      <div className="snapshotgrid">
        <div>
          <small>Recipients</small>
          <p>
            {d.recipients.length} students · {names(d.recipients)}
          </p>
        </div>
        <div>
          <small>Assigned test · same exercises for every recipient</small>
          <p>
            {questionCount(d)} exercises · estimated{" "}
            {assignable(d).reduce((n, m) => n + m.minutes, 0)} min
            <br />
            {assignable(d)
              .map((m) => m.title)
              .join(", ")}
          </p>
        </div>
        <div>
          <small>Availability</small>
          <p>
            Start {date(d.start)}, {d.startTime} → End {date(d.end)},{" "}
            {d.endTime}
          </p>
          <small>
            Example schedule — confirm current Assigned tests field behavior.
          </small>
        </div>
        <div>
          <small>Saved support · stays in the review draft</small>
          <p>
            {Object.keys(d.support).length
              ? "Teacher support saved"
              : "One shared version for all recipients"}
          </p>
        </div>
        <div>
          <small>Teacher resource · not sent</small>
          <p>
            {schedulable(d).map((m) => (
              <React.Fragment key={m.id}>
                {m.type} · {m.title}
                <br />
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>
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
      data-page={page}
      data-step={step}
      data-action={draft.action}
      data-scenario={scenario}
      data-library-review={libReview}
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
                  <Icon name="imgIconPencil" />
                  Edit group
                </Button>
                <Button
                  onClick={() =>
                    inform(
                      "Access Code is managed by the school portal. No live class code is included in this sample.",
                    )
                  }
                >
                  <Icon name="imgIconQrCode" />
                  Access Code
                  <Icon name="imgIconExternalLink" size={14} />
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
          <div className="panelbody" key={`${page}:${step}`}>
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
                  <Icon name="imgIconArrowLeft" />
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
                <div className="flowtitle">
                  <h1>
                    {page === "draft"
                      ? [
                          "Assemble material",
                          "Differentiate",
                          "Review draft",
                          "Choose action",
                        ][step]
                      : page === "library"
                        ? libReview
                          ? replaceId
                            ? "Review replacement"
                            : "Review selection"
                          : replaceId
                            ? "Replacement options"
                            : "Add material"
                        : page === "confirm"
                          ? draft.action === "plan"
                            ? "Confirm class plan"
                            : "Confirm assigned test"
                          : page === "conflict"
                            ? "Review conflict"
                            : scenario === "access"
                              ? "Calendar access unavailable"
                              : !schedulable(draft).length
                                ? "No schedulable content"
                                : "Schedule in Curriculum plan"}
                  </h1>
                  {page !== "confirm" && (
                    <Badge>
                      {page === "library"
                        ? "Library search"
                        : step === 1 && page === "draft"
                          ? "Optional"
                          : "Draft"}
                    </Badge>
                  )}
                </div>
                {page !== "confirm" && (
                  <p className="flowsubtitle">
                    {page === "library"
                      ? "Only the Materials section changes. Students, evidence and support stay as they are."
                      : page === "draft" && step === 0
                        ? "Draft saved · 10:42"
                        : page === "draft" && step === 1
                          ? "Optional — you can continue without changes. By default all students get one shared version."
                          : page === "schedule" || page === "conflict"
                            ? `${draft.title} · Class 6A · Whole class · 24 students · Mathematics timetable · ${schedulable(draft).length} items to schedule · ${schedulable(draft).reduce((n, m) => n + m.minutes, 0)} min`
                            : `${draft.title} · ${draft.recipients.length} students · ${draft.selected.length} materials · ${total(draft)} min`}
                  </p>
                )}
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
                      className={
                        stage === i ? "active" : i < stage ? "done" : ""
                      }
                    >
                      <b>
                        {i < stage ? (
                          <Icon name="imgIconCheck" size={14} />
                        ) : (
                          i + 1
                        )}
                      </b>
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}
            {message &&
              page !== "calendar" &&
              page !== "success" &&
              !(page === "library" && libReview) &&
              !(page === "draft" && step === 1 && supportOpen) && (
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
                      <Icon name="imgIcon" />3 suggested groups · 7 of 24
                      students{" "}
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
                                tone={
                                  r.id === "percentages" ? "plain" : "green"
                                }
                              >
                                {r.evidence}
                              </Badge>
                            </div>
                            <small>
                              {r.id === "percentages"
                                ? "Only 1 related item per student — check again"
                                : r.id === "fractions"
                                  ? "Same error on 2 of 3 related items"
                                  : "Same error repeated by both students"}
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
                              <div className="facts">
                                <div>
                                  <small>Shared error</small>
                                  <p>{r.error}</p>
                                </div>
                                <div>
                                  <small>Source</small>
                                  <p>
                                    {r.source} · {r.day}
                                  </p>
                                </div>
                                <div>
                                  <small>Evidence</small>
                                  <p>{r.coverage}</p>
                                </div>
                              </div>
                              <small>
                                Evidence labels describe this assessment only,
                                not overall mastery.
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
                  <Icon name="imgIconArrowLeft" />
                  Suggested groups
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
                <article className="hicard detailstudents">
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
                                <small>
                                  {s.responses}{" "}
                                  {s.responses === 1 ? "response" : "responses"}
                                </small>
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
                                className="outline"
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
                <details className="whyaccordion">
                  <summary>Why these students?</summary>
                  <p>
                    The students share related response patterns. Suggestions
                    are starting points; evidence coverage varies. Sofia has
                    only one related response, so no achievement level is
                    inferred.
                  </p>
                </details>
                <footer>
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
                    {!supportOpen ? (
                      <article className="hicard supportcollapsed">
                        <div className="row">
                          <div>
                            <h2>Support</h2>
                            <p>
                              One shared version · {draft.recipients.length}{" "}
                              students · same {draft.selected.length} materials
                              · {total(draft)} min
                            </p>
                          </div>
                          <div className="actions">
                            <Badge tone="solidblue">
                              {Object.keys(draft.support).length
                                ? "Saved support"
                                : "Default"}
                            </Badge>
                            <Button onClick={openSupport}>
                              Adjust support by level
                            </Button>
                          </div>
                        </div>
                        <small>
                          Threshold, Satisfactory, Basic and Higher are for your
                          planning only. Students see neutral labels (Version A,
                          B, C or D).
                        </small>
                      </article>
                    ) : (
                      <article className="hicard supporteditor">
                        <div className="row">
                          <h2>Support by achievement level</h2>
                          <Badge>
                            {JSON.stringify(draft.support) ===
                            JSON.stringify(supportEdit)
                              ? "Saved"
                              : "Not saved"}
                          </Badge>
                        </div>
                        {message.startsWith("Support could") && (
                          <>
                            <div className="banner error supporterror">
                              <strong>Support changes couldn’t be saved</strong>
                              <p>
                                Your saved support is unchanged. Your edits are
                                kept so you can retry.
                              </p>
                            </div>
                            <div className="actions supporterroractions">
                              <Button onClick={saveSupport}>Retry save</Button>
                              <Button
                                onClick={() => {
                                  setSupportEdit({ ...draft.support });
                                  setSupportOpen(false);
                                  setMessage("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </>
                        )}
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
                                      <small>
                                        {s.responses}{" "}
                                        {s.responses === 1
                                          ? "response"
                                          : "responses"}
                                      </small>
                                    </td>
                                    <td>
                                      {s.suggested
                                        ? `${s.suggested} · same error on 2 of 3 items`
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
                      </article>
                    )}
                    {supportOpen && (
                      <p className="muted supportnote">
                        Threshold, Satisfactory, Basic and Higher are for your
                        planning only. Students see neutral labels (Version A,
                        B, C or D). Support-to-exercise mapping requires product
                        confirmation.
                      </p>
                    )}
                  </>
                )}
                {step === 2 && (
                  <div className="reviewdetails">
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
                  </div>
                )}
                {step === 3 && (
                  <>
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
                  {step > 0 && (
                    <Button
                      onClick={() => go("draft", step === 2 ? 0 : step - 1)}
                    >
                      {step === 2 ? "Back to edit" : "Back"}
                    </Button>
                  )}
                  <div className="actions">
                    {step === 0 && <Button onClick={save}>Save draft</Button>}
                    {step === 1 && supportOpen && (
                      <>
                        <Button
                          onClick={() => {
                            setSupportEdit({ ...draft.support });
                            setSupportOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        {!message.startsWith("Support could") && (
                          <Button onClick={saveSupport}>Save support</Button>
                        )}
                      </>
                    )}
                    {step === 1 && !supportOpen && (
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
                          go(
                            draft.action === "plan" ? "schedule" : "confirm",
                            4,
                          );
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
                {!libReview ? (
                  <>
                    {replaceId && (
                      <div className="banner replacementcontext">
                        <strong>Replace one material</strong>
                        <p>
                          {materials.find((m) => m.id === replaceId)?.title} ·
                          Students, evidence and support stay as they are.
                        </p>
                      </div>
                    )}
                    <div className="librarycontext">
                      {[
                        ["Learning need", "Finding equivalent fractions"],
                        ["Grade", "6"],
                        ["Skill", "Equivalent fractions"],
                        ["Achievement levels", libLevel],
                        [
                          "Already in draft",
                          `${draft.selected.length} materials · ${total(draft)} min`,
                        ],
                        ["Returns to", "Assemble material"],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <small>{l}</small>
                          <p>{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="librarysearch">
                      <div className="searchrow">
                        <input
                          aria-label="Search materials"
                          placeholder="Search materials"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button
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
                      {[
                        "empty",
                        "unavailable",
                        "partial",
                        "restricted",
                      ].includes(scenario) ? (
                        <>
                          <div className="legacyfilters">
                            <select aria-label="Topic">
                              <option>Topic: Fractions</option>
                            </select>
                            <select aria-label="Skill">
                              <option>Skill: Equivalent fractions</option>
                            </select>
                            <select aria-label="Grade">
                              <option>Grade: 6</option>
                            </select>
                            <select
                              aria-label="Achievement levels"
                              value={libLevel}
                              onChange={(e) => setLibLevel(e.target.value)}
                            >
                              {["All levels", ...levels].map((l) => (
                                <option key={l} value={l}>
                                  Level: {l}
                                </option>
                              ))}
                            </select>
                            <select
                              aria-label="Content type"
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
                                <option key={t} value={t}>
                                  Type: {t}
                                </option>
                              ))}
                            </select>
                            <select aria-label="Source">
                              <option>Source: All sources</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="searchfilters">
                            <select aria-label="Topic">
                              <option>Topic: Fractions</option>
                            </select>
                            <select aria-label="Grade">
                              <option>Grade: 6</option>
                            </select>
                            <select
                              aria-label="Content type"
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
                                <option key={t} value={t}>
                                  Type: {t}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="searchfilters">
                            <small>More filters</small>
                            <select aria-label="Skill">
                              <option>Skill: Equivalent fractions</option>
                            </select>
                            <select
                              aria-label="Achievement levels"
                              value={libLevel}
                              onChange={(e) => setLibLevel(e.target.value)}
                            >
                              {["All levels", ...levels].map((l) => (
                                <option value={l} key={l}>
                                  Level: {l}
                                </option>
                              ))}
                            </select>
                            <select aria-label="Source">
                              <option>Source: All sources</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="row resultcount">
                      <small>
                        {scenario === "empty" ? 0 : results.length} results ·
                        page 1 of 1
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
                        <h2>Search is unavailable</h2>
                        <p>
                          BBright library didn’t respond. Your query, filters
                          and selection are kept. Your draft is unchanged.
                        </p>
                        <Button onClick={() => setScenario("normal")}>
                          Retry
                        </Button>
                      </div>
                    ) : scenario === "empty" || !results.length ? (
                      <div className="blankstate">
                        <h2>No matching material</h2>
                        <p>
                          Nothing in the library matches these filters. Your
                          draft is unchanged.
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
                            Partial results. Some library sources are
                            unavailable; available items can still be reviewed.
                          </div>
                        )}
                        {scenario === "restricted" && (
                          <div className="banner warn">
                            Some content is permission restricted. Restricted
                            items cannot be selected.
                          </div>
                        )}
                        <div className="librarylist">
                          {results
                            .slice(0, scenario === "partial" ? 3 : undefined)
                            .map((m, i) => {
                              const inDraft = draft.selected.includes(m.id);
                              const restricted =
                                scenario === "restricted" && i > 2;
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
                                  <div className="materialtype">
                                    <Badge>{m.type}</Badge>
                                  </div>
                                  <div className="grow">
                                    <h3>{m.title}</h3>
                                    <small>
                                      Grade 6 · {libLevel} · {m.minutes} min ·
                                      Resource library
                                    </small>
                                  </div>
                                  {inDraft ? (
                                    <Badge>
                                      {replaceId === m.id
                                        ? "Being replaced"
                                        : "In draft"}
                                    </Badge>
                                  ) : restricted ? (
                                    <Badge>Restricted</Badge>
                                  ) : null}
                                  <Button onClick={() => setPreview(m)}>
                                    Preview
                                  </Button>
                                </article>
                              );
                            })}
                        </div>
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
                    {message && (
                      <div className="banner warn" role="alert">
                        <strong>
                          {scenario === "stale"
                            ? "One selected material needs attention"
                            : "Could not apply materials"}
                        </strong>
                        <p>{message}</p>
                      </div>
                    )}
                    <div className="librarylist ordered">
                      {proposed.map((id, i) => {
                        const m = materials.find((m) => m.id === id)!;
                        const staleItem =
                          scenario === "stale" && !draft.selected.includes(id);
                        return (
                          <article className="libraryresult" key={id}>
                            <span className="number">{i + 1}</span>
                            <div className="materialtype">
                              <Badge>{m.type}</Badge>
                            </div>
                            <div className="grow">
                              <h3>{m.title}</h3>
                              <small>
                                {staleItem
                                  ? "Changed by BBright on 16 Oct · no longer available in this version"
                                  : `${m.minutes} min · Resource library`}
                              </small>
                            </div>
                            {!draft.selected.includes(id) && (
                              <Badge tone="blue">
                                {staleItem
                                  ? "No longer available"
                                  : replaceId
                                    ? "Replacement"
                                    : "New"}
                              </Badge>
                            )}
                            {staleItem ? (
                              <>
                                <Button
                                  onClick={() => {
                                    setScenario("normal");
                                    setMessage("");
                                  }}
                                >
                                  Refresh
                                </Button>
                                <Button onClick={() => setLibReview(false)}>
                                  Replace
                                </Button>
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
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
                    </div>
                    <p>
                      {replaceId
                        ? "1 replacement · same position"
                        : `${proposed.filter((id) => !draft.selected.includes(id)).length} new materials · no duplicates`}
                    </p>
                  </>
                )}
                <footer>
                  {!libReview && (
                    <small className="selectioncount">
                      {picks.length} selected
                    </small>
                  )}
                  <Button
                    onClick={() => {
                      if (libReview) setLibReview(false);
                      else go("draft");
                    }}
                  >
                    Cancel
                  </Button>
                  {libReview && scenario === "applyfail" && message && (
                    <Button onClick={() => setLibReview(false)}>
                      Back to selection
                    </Button>
                  )}
                  <Button
                    primary
                    disabled={
                      libLoading ||
                      (!libReview && !picks.length) ||
                      (libReview &&
                        (!proposed.length ||
                          (scenario === "stale" &&
                            proposed.some(
                              (id) => !draft.selected.includes(id),
                            ))))
                    }
                    onClick={libReview ? apply : reviewPicks}
                  >
                    {libReview && scenario === "applyfail" && message
                      ? "Retry apply"
                      : libReview
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
                {scenario === "access" ? (
                  <>
                    <div className="banner schedulealert">
                      <h2>
                        <Icon name="imgIconCircleAlert" />
                        We can’t read the current Calendar and timetable
                      </h2>
                      <p>
                        Conflicts can’t be checked reliably, so scheduling can’t
                        continue.
                      </p>
                    </div>
                    <article className="hicard schedulestatus">
                      <div className="fieldrows">
                        {[
                          ["Conflict check", "Not available"],
                          ["Draft", "Still saved"],
                          ["Written or moved", "Nothing"],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <small>{l}</small>
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </>
                ) : !schedulable(draft).length ? (
                  <>
                    <div className="banner schedulealert">
                      <h2>
                        <Icon name="imgIconCircleAlert" />
                        This draft has no Lesson or Station to add to Curriculum
                        plan
                      </h2>
                      <p>
                        The current materials can still be sent with Assign now.
                      </p>
                    </div>
                    <article className="hicard schedulestatus">
                      <div className="fieldrows">
                        <div>
                          <small>In this draft</small>
                          <span>
                            {selected(draft)
                              .map((m) => `${m.type} · ${m.title}`)
                              .join(", ")}
                          </span>
                        </div>
                        <div>
                          <small>Schedulable items</small>
                          <span>None</span>
                        </div>
                        <div>
                          <small>Calendar action</small>
                          <span>Can’t continue</span>
                        </div>
                      </div>
                    </article>
                  </>
                ) : page === "schedule" ? (
                  <div className="schedulelayout">
                    <article className="hicard">
                      <h2>
                        Items to schedule · {schedulable(draft).length} items ·{" "}
                        {schedulable(draft).reduce((n, m) => n + m.minutes, 0)}{" "}
                        min
                      </h2>
                      {CompactMaterials(schedulable(draft))}
                      <small>
                        Not scheduled in this action · available if the teacher
                        later chooses Assign now
                      </small>
                      {CompactMaterials(assignable(draft))}
                      <div className="rule" />
                      <h2>Date and time</h2>
                      <div className="schedulefields">
                        <label>
                          Date
                          <DateControl
                            value={draft.planned}
                            onChange={(value) =>
                              edit({
                                planned: value,
                                requested: value,
                                resolution: false,
                              })
                            }
                          />
                        </label>
                        <label>
                          Start time
                          <TimeControl
                            value={draft.plannedTime}
                            onChange={(value) =>
                              edit({
                                plannedTime: value,
                                requestedTime: value,
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
                    <article className="hicard timetablerail">
                      <h2>
                        Timetable · {date(draft.planned).replace(" 2026", "")}
                      </h2>
                      {draft.planned === "2026-10-21" && (
                        <div className="timetableitem">
                          <strong>Protau</strong>
                          <small>21 Oct · 09:00–10:00</small>
                          <Badge>Protau</Badge>
                        </div>
                      )}
                      <div className="timetableitem blue">
                        <strong>{draft.title}</strong>
                        <small>
                          Requested · {date(draft.planned).replace(" 2026", "")}{" "}
                          · {draft.plannedTime} ·{" "}
                          {schedulable(draft).reduce(
                            (n, m) => n + m.minutes,
                            0,
                          )}{" "}
                          min
                        </small>
                        <div className="actions">
                          <Badge>Lesson</Badge>
                          <Badge tone={conflict(draft) ? "orange" : "blue"}>
                            {conflict(draft) ? "Conflict" : "Planned"}
                          </Badge>
                        </div>
                      </div>
                      <small>
                        {conflict(draft)
                          ? "The requested time overlaps Protau. You can review a suggested date next."
                          : `No existing events on ${date(draft.planned)}. Fractions test stays on 22 Oct · 09:00.`}
                      </small>
                    </article>
                  </div>
                ) : (
                  <div className="conflictlayout">
                    <article className="hicard">
                      <div className="row">
                        <h2>Time conflict</h2>
                        <Badge tone="orange">Needs review</Badge>
                      </div>
                      <div className="comparison">
                        <div>
                          <small>Already in Calendar</small>
                          <div className="timetableitem">
                            <strong>Protau</strong>
                            <small>21 Oct · 09:00–10:00</small>
                            <Badge>Protau</Badge>
                          </div>
                        </div>
                        <div>
                          <small>Draft</small>
                          <div className="timetableitem">
                            <strong>{draft.title}</strong>
                            <small>21 Oct · 09:20 · 13 min</small>
                            <div className="actions">
                              <Badge>Lesson</Badge>
                              <Badge tone="orange">Conflict</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="rule" />
                      <label className="checkline resolution">
                        <input
                          type="checkbox"
                          checked={draft.resolution}
                          onChange={(e) =>
                            edit({ resolution: e.target.checked })
                          }
                        />
                        <span>
                          Move new items to 22 Oct · 10:15
                          <small>
                            Existing Protau stays in place. Nothing moves until
                            final confirmation.
                          </small>
                        </span>
                      </label>
                    </article>
                    <article className="hicard">
                      <h2>Recalculation preview</h2>
                      <div className="fieldrows">
                        <div>
                          <small>Affected item</small>
                          <span>Fractions test</span>
                        </div>
                        <div>
                          <small>Current date</small>
                          <span>22 Oct · 09:00</span>
                        </div>
                        <div>
                          <small>Resolved date</small>
                          <span>26 Oct · 09:00</span>
                        </div>
                        <div>
                          <small>Impact</small>
                          <span>
                            Planned test only · not assigned to students
                          </span>
                        </div>
                      </div>
                      <small>
                        The planned test moves only after final confirmation.
                      </small>
                      <Button
                        onClick={() => {
                          edit({ resolution: false });
                          go("schedule", 3);
                        }}
                      >
                        Choose another date
                      </Button>
                    </article>
                  </div>
                )}
                {scenario === "access" ? (
                  <footer>
                    <Button onClick={() => go("draft", 3)}>
                      Back to choose action
                    </Button>
                    <Button primary onClick={() => setScenario("normal")}>
                      Try again
                    </Button>
                  </footer>
                ) : !schedulable(draft).length ? (
                  <footer>
                    <Button onClick={() => go("draft")}>Edit materials</Button>
                    <Button
                      primary
                      onClick={() => {
                        edit({ action: "assignment" });
                        go("confirm", 4);
                      }}
                    >
                      Choose Assign now
                    </Button>
                  </footer>
                ) : (
                  <>
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
                            edit({
                              planned: "2026-10-22",
                              plannedTime: "10:15",
                            });
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
              </>
            )}
            {page === "confirm" && (
              <>
                <div className="banner confirmcallout">
                  <strong>
                    <span className="infomark" aria-hidden="true">
                      ⓘ
                    </span>
                    {draft.action === "plan"
                      ? "Whole-class timetable action"
                      : "Students receive one Assigned test"}
                  </strong>
                  <p>
                    {draft.action === "plan"
                      ? "The lesson and station are added to the whole-class Curriculum plan and Calendar. No student assignments are created. Student-specific support stays in the draft."
                      : "The recipients below get the same Assigned test exercises in BBright. Lesson and Station stay in your review draft as teacher resources · not sent."}
                  </p>
                </div>
                <div className="confirmlayout">
                  <article className="hicard">
                    {draft.action === "assignment" ? (
                      Recipients()
                    ) : (
                      <section className="confirmsection">
                        <h2>Class · whole class</h2>
                        <p>Class 6A · 24 students · Mathematics timetable</p>
                      </section>
                    )}
                    <section className="confirmsection">
                      <div className="row">
                        <h2>
                          {draft.action === "plan"
                            ? "Items to schedule"
                            : `Review draft · ${draft.selected.length} materials · ${total(draft)} min`}
                        </h2>
                        <Button onClick={() => go("draft")}>
                          Edit materials
                        </Button>
                      </div>
                      {draft.action === "assignment" && (
                        <p>
                          Assigned test · {questionCount(draft)} exercises ·
                          estimated{" "}
                          {assignable(draft).reduce((n, m) => n + m.minutes, 0)}{" "}
                          min
                        </p>
                      )}
                      {CompactMaterials(
                        draft.action === "plan"
                          ? schedulable(draft)
                          : selected(draft),
                      )}
                      <small>
                        {draft.action === "plan"
                          ? "Practice sets stay in the review draft and are not scheduled."
                          : "Assigned test (Assign now): practice sets only. Lesson and Station: Teacher resource · not sent · Available for class planning."}
                      </small>
                    </section>
                    {draft.action === "assignment" && (
                      <section className="confirmsection">
                        <div className="row">
                          <h2>Optional support</h2>
                          <Button onClick={() => go("draft", 1)}>
                            Edit support
                          </Button>
                        </div>
                        <p>
                          {Object.keys(draft.support).length
                            ? names(
                                draft.recipients.filter(
                                  (id) => !!draft.support[id],
                                ),
                              )
                            : "One shared version for all students"}
                        </p>
                        <small>
                          Saved support stays in the teacher review draft.
                        </small>
                      </section>
                    )}
                    {Destination()}
                  </article>
                  <article className="hicard confirmrail">
                    {draft.action === "assignment" ? (
                      <>
                        <h2>Assigned test</h2>
                        <div className="fieldrows">
                          <label>
                            Title
                            <textarea
                              rows={2}
                              aria-label="Assigned test title"
                              value={draft.title}
                              onChange={(e) => edit({ title: e.target.value })}
                            />
                          </label>
                          <div>
                            <small>Template</small>
                            <span>
                              This review’s practice sets · template name not
                              confirmed
                            </span>
                          </div>
                          <div>
                            <small>Test type</small>
                            <span>Homework</span>
                          </div>
                          {(
                            [
                              ["Start date", "start", "date"],
                              ["Start time", "startTime", "time"],
                              ["End date", "end", "date"],
                              ["End time", "endTime", "time"],
                            ] as const
                          ).map(([label, key, type]) => (
                            <label key={key}>
                              {label}
                              {type === "date" ? (
                                <DateControl
                                  label={`Choose ${label.toLowerCase()}`}
                                  value={draft[key]}
                                  onChange={(value) => edit({ [key]: value })}
                                />
                              ) : (
                                <TimeControl
                                  label={`Choose ${label.toLowerCase()}`}
                                  value={draft[key]}
                                  onChange={(value) => edit({ [key]: value })}
                                />
                              )}
                            </label>
                          ))}
                        </div>
                        <small>
                          Example schedule — confirm current Assigned tests
                          field behavior.
                        </small>
                      </>
                    ) : (
                      <>
                        <div className="row">
                          <h2>Schedule</h2>
                          <Button onClick={() => go("schedule", 3)}>
                            Edit schedule
                          </Button>
                        </div>
                        <div className="fieldrows">
                          <div>
                            <small>Preferred</small>
                            <span>
                              {date(draft.requested)} · {draft.requestedTime}
                            </span>
                          </div>
                          <div>
                            <small>Resolved</small>
                            <span>
                              {date(draft.planned)} · {draft.plannedTime}
                            </span>
                          </div>
                          {schedulable(draft).map((m, i) => (
                            <div key={m.id}>
                              <small>{m.type} ends</small>
                              <span>
                                {addMinutes(
                                  draft.plannedTime,
                                  schedulable(draft)
                                    .slice(0, i + 1)
                                    .reduce((n, x) => n + x.minutes, 0),
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        {draft.resolution && (
                          <section className="confirmsection recalculation">
                            <h2>Recalculation</h2>
                            <p>
                              Fractions test
                              <br />
                              22 Oct 09:00 → 26 Oct 09:00
                            </p>
                            <small>
                              Moves only after confirmation. Undo restores the
                              original date. The planned test is not assigned to
                              students.
                            </small>
                          </section>
                        )}
                      </>
                    )}
                  </article>
                </div>
                {validate(draft) && (
                  <p role="alert" className="banner warn">
                    {validate(draft)}
                  </p>
                )}
                <footer>
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
            {["submitting", "checking", "submitfailed", "success"].includes(
              page,
            ) && (
              <>
                <article className="hicard statuscard">
                  <div className="statusheading">
                    <span
                      className={
                        "statusglyph " +
                        (page === "submitfailed"
                          ? "failure"
                          : page === "success"
                            ? "complete"
                            : "loading")
                      }
                    >
                      {page === "success"
                        ? "✓"
                        : page === "submitfailed"
                          ? "!"
                          : "◌"}
                    </span>
                    <h1>
                      {page === "success"
                        ? active?.action === "plan"
                          ? "Added to Curriculum plan and Calendar"
                          : "Assigned test created"
                        : page === "checking"
                          ? "Checking previous submission"
                          : page === "submitfailed"
                            ? draft.action === "plan"
                              ? "Could not add to curriculum plan"
                              : "Assigned test could not be created"
                            : "Submitting"}
                    </h1>
                  </div>
                  <p>
                    {draft.title} · {draft.recipients.length} students ·{" "}
                    {draft.selected.length} review-draft materials ·{" "}
                    {total(draft)} min
                  </p>
                  <p>
                    {page === "submitfailed"
                      ? "We couldn’t finish creating the record. Your recipients, exercises and dates are kept. Retry first checks for your earlier attempt, so you end up with one record — never two."
                      : page === "submitting"
                        ? "Creating the confirmed action. Keep this page open; your draft is retained."
                        : page === "checking"
                          ? "Checking your earlier attempt before retrying. Your draft is retained."
                          : active?.action === "plan"
                            ? "Added to Curriculum plan and Calendar. No student assignment was created."
                            : "The selected students received one Assigned test with the exercises below. Lesson and Station stay in your review draft · not sent."}
                  </p>
                  {draft.action === "assignment" &&
                    page !== "submitting" &&
                    SnapshotSummary(
                      active?.action === "assignment" && page === "success"
                        ? active.snapshot
                        : draft,
                    )}
                  {draft.action === "plan" && page === "success" && active && (
                    <>
                      <div className="statusplan">
                        {active.calendar.map((e) => (
                          <div key={e.id}>
                            <small>{e.type}</small>
                            <p>
                              {e.title}
                              <br />
                              {date(e.date)} · {e.start}–{e.end}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="rule" />
                      <div className="snapshotgrid">
                        <div>
                          <small>Destination</small>
                          <p>Class 6A Curriculum plan + Calendar</p>
                        </div>
                        <div>
                          <small>Planned test</small>
                          <p>
                            {active.movesTest
                              ? "Fractions test → 26 Oct · 09:00"
                              : "Fractions test stays on 22 Oct · 09:00"}
                          </p>
                        </div>
                      </div>
                      {UndoControls()}
                    </>
                  )}
                  {draft.action === "assignment" && page !== "submitfailed" && (
                    <>
                      <div className="rule" />
                      <div className="statusmeta">
                        <div>
                          <small>Teacher destination</small>
                          <p>Assigned tests</p>
                        </div>
                        <div>
                          <small>Student destination</small>
                          <p>
                            Student entry point · Pending product verification
                          </p>
                        </div>
                        <div>
                          <small>Track it</small>
                          <p>Assigned tests → Equivalent fractions review</p>
                        </div>
                      </div>
                    </>
                  )}
                </article>
                {page === "submitfailed" ? (
                  <footer>
                    <Button onClick={() => go("confirm", 4)}>
                      Back to confirmation
                    </Button>
                    <Button primary onClick={recover}>
                      Retry safely
                    </Button>
                  </footer>
                ) : page === "success" && active ? (
                  <footer>
                    <Button onClick={() => go("overview")}>
                      Back to group
                    </Button>
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
                ) : null}
              </>
            )}
            {page === "assigned" && (
              <>
                <header className="assignedheader">
                  <h1>Assigned tests</h1>
                </header>
                <div className="segmented">
                  <button
                    className={!archive ? "selected" : ""}
                    onClick={() => setArchive(false)}
                  >
                    Assigned tests{" "}
                    <Badge tone="green">
                      +{records.filter((r) => r.action === "assignment").length}
                    </Badge>
                  </button>
                  <button
                    className={archive ? "selected" : ""}
                    onClick={() => setArchive(true)}
                  >
                    Archive
                  </button>
                </div>
                <div className="row assignedfilters">
                  <h2>Assigned tests</h2>
                  <div className="actions">
                    <select aria-label="Assigned test groups">
                      <option>All groups</option>
                      <option>6A</option>
                    </select>
                    <select aria-label="Assigned test status">
                      <option>All tests</option>
                      <option>In progress</option>
                    </select>
                    <input
                      aria-label="Search assigned tests"
                      placeholder="Search"
                      value={assignedQuery}
                      onChange={(e) => setAssignedQuery(e.target.value)}
                    />
                    <Button primary onClick={() => go("draft")}>
                      Assign new test
                    </Button>
                  </div>
                </div>
                <div className="tablewrap assignedtable">
                  <table>
                    <thead>
                      <tr>
                        {[
                          "Name",
                          "Details",
                          "Status",
                          "Completion deadline",
                          "Average score",
                          "Solved the test",
                          "Actions",
                        ].map((t) => (
                          <th key={t}>{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {!archive &&
                        records
                          .filter(
                            (r) =>
                              r.action === "assignment" &&
                              r.title
                                .toLowerCase()
                                .includes(assignedQuery.toLowerCase()),
                          )
                          .map((r) => (
                            <tr key={r.id}>
                              <td>
                                <strong>{r.title}</strong>
                                <Badge tone="blue">New</Badge>
                                <small>
                                  {r.recipients.length} students · Opens{" "}
                                  {date(r.snapshot.start).replace(" 2026", "")},{" "}
                                  {r.snapshot.startTime} → closes{" "}
                                  {date(r.snapshot.end).replace(" 2026", "")},{" "}
                                  {r.snapshot.endTime} · From Recommended review
                                  › Finding equivalent fractions
                                </small>
                              </td>
                              <td>6A</td>
                              <td>
                                <Badge tone="blue">In progress</Badge>
                              </td>
                              <td>
                                {date(r.snapshot.end).replace(" 2026", "")},{" "}
                                {r.snapshot.endTime}
                              </td>
                              <td>—</td>
                              <td>0/{r.recipients.length}</td>
                              <td>
                                <Button
                                  onClick={() => {
                                    setCurrent(r.id);
                                    go("progress");
                                  }}
                                >
                                  Check
                                </Button>
                              </td>
                            </tr>
                          ))}
                      {!archive &&
                        ["Comparing fractions", "Decimal place value"]
                          .filter((t) =>
                            t
                              .toLowerCase()
                              .includes(assignedQuery.toLowerCase()),
                          )
                          .map((t, i) => (
                            <tr key={t}>
                              <td>{t}</td>
                              <td>6A</td>
                              <td>
                                <Badge>Awaiting review</Badge>
                              </td>
                              <td>Ended</td>
                              <td>{i === 0 ? "64%" : "71%"}</td>
                              <td>{i === 0 ? "4/4" : "2/2"}</td>
                              <td>
                                <Button
                                  onClick={() =>
                                    inform(
                                      "This is a reference record from the existing portal. Use the newly created fractions review to inspect progress in this prototype.",
                                    )
                                  }
                                >
                                  Check
                                </Button>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                  {archive && (
                    <p className="blankstate">
                      No archived tests in this prototype.
                    </p>
                  )}
                </div>
                <p className="muted">
                  Prototype state: created review records are saved in this
                  browser. The other rows are example records. Check opens
                  Assigned test progress.
                </p>
                <footer>
                  <Button onClick={() => go("overview")}>Back to group</Button>
                </footer>
              </>
            )}
            {page === "progress" && (
              <>
                <div className="banner progressnotice">
                  <strong>Review tracked after assigning</strong>
                  <p>
                    Sample progress from 15 Oct, one day after assigning. These
                    responses are illustrative, not live student activity.
                  </p>
                </div>
                <div className="flowtitle">
                  <h1>Assigned test progress</h1>
                  <Badge tone="blue">In progress</Badge>
                </div>
                <p>Equivalent fractions review · from Assigned tests</p>
                <p>Completion: 1 completed · 1 in progress · 1 not started</p>
                <div className="tablewrap progresstable">
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
                            !active ||
                            active.snapshot.recipients.includes(s.id),
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
                  Evidence labels describe the latest responses only, not
                  mastery. A later check is needed to confirm that understanding
                  holds.
                </p>
                <Button onClick={() => go("assigned")}>
                  Back to Assigned tests
                </Button>
              </>
            )}
            {page === "followup" && (
              <>
                <button
                  className="textlink backlabel"
                  onClick={() => go("progress")}
                >
                  <Icon name="imgIconArrowLeft" />
                  Equivalent fractions review
                </button>
                <div className="flowtitle">
                  <h1>Plan follow-up · Noah Wilson</h1>
                  <Badge>Insufficient evidence</Badge>
                </div>
                <p className="flowsubtitle">
                  Suggested from the review evidence (15 Oct). Nothing is sent
                  until the follow-up draft is reviewed and confirmed.
                </p>
                <article className="hicard followupcard">
                  <div className="followupfacts">
                    <div>
                      <small>Student</small>
                      <p>Noah Wilson</p>
                    </div>
                    <div>
                      <small>Learning goal</small>
                      <p>Finding equivalent fractions</p>
                    </div>
                  </div>
                  <div className="rule" />
                  <small>Evidence summary</small>
                  <p>
                    Fractions checkpoint, 12 Oct: incorrect (2/3 = 4/8) · Review
                    practice, 15 Oct: 1 correct item so far (2/3 = 6/9)
                  </p>
                  <div className="row">
                    <h2>Suggested recipients · 2 students</h2>
                    <Badge>Suggested for teacher review</Badge>
                  </div>
                  <div className="row">
                    <span>Noah Wilson</span>
                    <Badge>Insufficient evidence</Badge>
                  </div>
                  <div className="row">
                    <span>Sofia Martin</span>
                    <Badge>No new evidence yet</Badge>
                  </div>
                  <small>
                    Both students may benefit from a short follow-up check
                    before the next lesson.
                  </small>
                  <div className="rule" />
                  <h2>Recommended materials · 2 items · 11 min</h2>
                  {CompactMaterials(
                    materials.filter((m) =>
                      ["station", "practice"].includes(m.id),
                    ),
                  )}
                </article>
                <footer>
                  <Button onClick={() => go("progress")}>
                    Back to progress
                  </Button>
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
                <div className="calendarheading">
                  <div>
                    <h1>Calendar</h1>
                    <p>
                      Class 6A · Whole class · 24 students · Mathematics
                      timetable ·<br />
                      Mon 19 Oct – Sun 1 Nov
                    </p>
                    <small>
                      Planned from the Finding equivalent fractions
                      recommendation.
                    </small>
                  </div>
                  <div className="actions">
                    <div className="segmented">
                      {["Month", "Day", "14 days · proposed"].map((v) => (
                        <button
                          key={v}
                          className={v.startsWith("14") ? "selected" : ""}
                          onClick={() =>
                            !v.startsWith("14") &&
                            inform(
                              `${v} view is a design reference only. Use the 14-day view to inspect linked schedule items.`,
                            )
                          }
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <Button onClick={() => go("draft", 2)}>Review draft</Button>
                    <Button onClick={() => go("overview")}>
                      Back to group
                    </Button>
                  </div>
                </div>
                {active?.action === "plan"
                  ? UndoControls()
                  : message && (
                      <div className="banner row linkedstatus">
                        <Icon name="imgIconCalendarDays" />
                        <div>
                          <strong>
                            {message.startsWith("Undo complete")
                              ? "Undo complete"
                              : message}
                          </strong>
                          <p>
                            Linked items removed; the planned test is restored.
                          </p>
                        </div>
                      </div>
                    )}
                <div className="timelinewrap">
                  <div className="timeline">
                    <div className="timelinedays">
                      <div />
                      {Array.from({ length: 14 }, (_, i) => (
                        <div className={i === 3 ? "current" : ""} key={i}>
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
                    </div>
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
                      <div
                        className={
                          "timelinelane " +
                          (row.events.some(
                            (e) => e.id !== "test" && e.id !== "protau",
                          )
                            ? "linked"
                            : "")
                        }
                        key={row.title}
                      >
                        <div className="lanelabel">
                          <strong>{row.title}</strong>
                          <small>
                            {row.title === "Planned tests"
                              ? "Fractions test · planned test · not assigned to students"
                              : row.title === "Protau"
                                ? "Class 6A"
                                : "Class 6A · Mathematics"}
                          </small>
                        </div>
                        {Array.from({ length: 14 }, (_, i) => {
                          const d = new Date("2026-10-19T12:00:00Z");
                          d.setUTCDate(d.getUTCDate() + i);
                          return (
                            <div className="daycell" key={i}>
                              {row.events
                                .filter(
                                  (e) =>
                                    e.date === d.toISOString().slice(0, 10),
                                )
                                .map((e) => (
                                  <button
                                    className={
                                      "timelineevent " +
                                      (e.id === "test"
                                        ? "plannedtest"
                                        : e.id === "protau"
                                          ? ""
                                          : "linked")
                                    }
                                    key={e.id}
                                    onClick={() =>
                                      inform(
                                        `${e.title} · ${date(e.date)} · ${e.start}–${e.end}. ${e.id === "test" ? "Planned timetable test, not assigned to students." : ""}`,
                                      )
                                    }
                                  >
                                    {row.title === "Lessons"
                                      ? "Lesson"
                                      : row.title === "Stations"
                                        ? "Station"
                                        : e.id === "test"
                                          ? "Test"
                                          : "Protau"}
                                    <small>{e.start}</small>
                                  </button>
                                ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <details
          className="testpanel"
          hidden={!new URLSearchParams(window.location.search).has("testing")}
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
      <div className="sr-only" role="status" aria-live="polite">
        {busy
          ? page === "checking"
            ? "Checking previous submission"
            : "Submitting"
          : ""}
      </div>
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
            The suggestion includes 3 students. Add or remove students before
            creating the review.
          </p>
          <input
            aria-label="Search students in Class 6A"
            placeholder="Search students in Class 6A"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
          />
          <div className="studentoptions">
            {students
              .filter((s) =>
                s.name.toLowerCase().includes(studentQuery.toLowerCase()),
              )
              .map((s) => (
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
                      {s.id === "liam"
                        ? "Not in a suggested group"
                        : s.id === "olivia"
                          ? "Suggested for Decimal place value"
                          : s.id === "sofia"
                            ? "Same error on 1 item · limited evidence"
                            : "Same error on 2 items"}
                    </small>
                  </span>
                  {["amelia", "noah", "sofia"].includes(s.id) && (
                    <Badge>Suggested</Badge>
                  )}
                </label>
              ))}
          </div>
          <footer>
            <small>{tempStudents.length} selected</small>
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
          <div className="previewarea">
            <Icon name="lucide-file-text" size={24} />
            <small>
              {preview.type === "Lesson"
                ? "Lesson preview · 4 screens"
                : preview.type === "Station"
                  ? "Station preview · 6 steps"
                  : `${preview.questions} questions · instant feedback`}
            </small>
          </div>
          <div className="previewdetails">
            <div>
              <small>Objective</small>
              <span>{preview.objective}</span>
            </div>
            <div>
              <small>Includes</small>
              <span>{preview.includes}</span>
            </div>
            <div>
              <small>Why suggested</small>
              <span>{preview.reason}</span>
            </div>
          </div>
          <footer>
            {page === "library" &&
            !libReview &&
            !draft.selected.includes(preview.id) ? (
              <Button
                primary
                onClick={() => {
                  setPicks((p) =>
                    replaceId
                      ? [preview.id]
                      : Array.from(new Set([...p, preview.id])),
                  );
                  setPreview(null);
                }}
              >
                Add to selection
              </Button>
            ) : (
              <Button primary onClick={() => setPreview(null)}>
                Close
              </Button>
            )}
          </footer>
        </Modal>
      )}
      {modal === "followevidence" && (
        <Modal
          title={`${students.find((s) => s.id === expanded)?.name} · Evidence`}
          onClose={() => setModal("")}
        >
          <p>
            {expanded === "sofia"
              ? "Equivalent fractions review · not opened yet"
              : "Equivalent fractions review compared with the Fractions checkpoint"}
          </p>
          <div className="beforeafter">
            <article>
              <h3>Before · Fractions checkpoint, 12 Oct</h3>
              <p>{expanded === "noah" ? "2/3 = 4/8" : "2/3 = 2/12"}</p>
              <Badge tone="orange">Incorrect</Badge>
            </article>
            <article>
              <h3>After · Review practice, 15 Oct</h3>
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
          <h3 className="followevidencelabel">
            {expanded === "amelia"
              ? "Secure on the latest review items"
              : expanded === "noah"
                ? "Insufficient evidence"
                : "Needs review · no new evidence"}
          </h3>
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
    const seconds = Math.max(
      0,
      Math.min(30, Math.ceil((active.undoUntil - tick) / 1000)),
    );
    return (
      <div className="banner row linkedstatus">
        <Icon name="imgIconCalendarDays" />
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
          <Icon name="imgIconUndo2" />
          Undo
        </Button>
      </div>
    );
  }
}
