import React, { useEffect, useRef, useState } from "react";
import { Icon, Modal } from "./ui";
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, [open, close]);
  return ref;
}
export function DateControl({
  value,
  onChange,
  label = "Choose schedule date",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(
    () => new Date((value || "2026-10-21") + "T12:00:00"),
  );
  const ref = useDismiss(open, () => setOpen(false));
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (start.getDay() + 6) % 7;
  return (
    <div className="datecontrol" ref={ref}>
      <button
        type="button"
        className="datetrigger datebutton"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name="imgIconCalendarDays" />
        <span>
          {new Date(value + "T12:00:00")
            .toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })
            .replace(",", "")}
        </span>
      </button>
      {open && (
        <Modal title={label} onClose={() => setOpen(false)}>
        <div className="datepicker">
          <div className="monthnav">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              ‹
            </button>
            <strong>
              {month.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              ›
            </button>
          </div>
          <div className="dategrid">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <small key={d}>{d}</small>
            ))}
            {Array.from({ length: 42 }, (_, i) => {
              const d = new Date(
                month.getFullYear(),
                month.getMonth(),
                i - offset + 1,
                12,
              );
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              return (
                <button
                  type="button"
                  key={iso}
                  className={
                    (value === iso ? "picked " : "") +
                    (d.getMonth() !== month.getMonth() ? "outside" : "")
                  }
                  aria-label={iso}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
        </Modal>
      )}
    </div>
  );
}
export function TimeControl({
  value,
  onChange,
  label = "Choose schedule start time",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div className="datecontrol" ref={ref}>
      <button
        type="button"
        className="datetrigger"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {value}
        <span>⌄</span>
      </button>
      {open && (
        <Modal title={label} onClose={() => setOpen(false)}>
        <div className="timemenu">
          {["09:20", "09:30", "10:00", "10:15", "10:30", "11:00", "11:30"].map(
            (t) => (
              <button
                type="button"
                className={value === t ? "picked" : ""}
                key={t}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
              >
                {t}
                <span aria-hidden="true">{value === t ? "✓" : ""}</span>
              </button>
            ),
          )}
          <label>
            Other time
            <input
              type="time"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </label>
        </div>
        </Modal>
      )}
    </div>
  );
}
