export interface Material {
  id: string;
  type: string;
  title: string;
  minutes: number;
  questions: number;
  objective: string;
  includes: string;
  reason: string;
}
export interface Student {
  id: string;
  name: string;
  initials: string;
  responses: number;
  evidence: string;
  suggested: string;
}
export interface Draft {
  id: string;
  selected: string[];
  recipients: string[];
  support: Record<string, string>;
  title: string;
  action: string;
  start: string;
  startTime: string;
  end: string;
  endTime: string;
  requested: string;
  requestedTime: string;
  planned: string;
  plannedTime: string;
  resolution: boolean;
  reviewed: boolean;
  followup: boolean;
}
export interface RecordItem {
  id: string;
  draftId: string;
  action: string;
  title: string;
  createdAt: number;
  snapshot: Draft;
  recipients: string[];
  sentMaterials: string[];
  calendar: {
    id: string;
    materialId: string;
    title: string;
    type: string;
    date: string;
    start: string;
    end: string;
  }[];
  undoUntil: number;
  movesTest: boolean;
}
export const students: Student[];
export const materials: Material[];
export const levels: string[];
export const supportInfo: Record<string, string>;
export function fresh(): Draft;
export function selected(d: Draft): Material[];
export function total(d: Draft): number;
export function assignable(d: Draft): Material[];
export function schedulable(d: Draft): Material[];
export function questionCount(d: Draft): number;
export function dateValid(s: string): boolean;
export function timeValid(s: string): boolean;
export function addMinutes(t: string, n: number): string;
export function conflict(d: Draft): boolean;
export function validate(d: Draft): string;
export function commit(
  d: Draft,
  records: RecordItem[],
  now?: number,
): RecordItem;
export function undo(
  records: RecordItem[],
  id: string,
  now?: number,
): RecordItem[];
export function testDate(records: RecordItem[]): string;
export function applyMaterials(
  d: Draft,
  ids: string[],
  replaceId?: string | null,
): Draft;
export function restore(raw: string): Draft;
