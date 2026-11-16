export interface Material {id:string;kind:string;purpose:string;title:string;minutes:number}
export interface Draft {id:string;selected:string[];recipients:string[];support:string[];start:string;startTime:string;due:string;dueTime:string;planned:string;plannedTime:string;reviewed:boolean}
export interface CalendarItem extends Material {date:string;time:string;assignmentId:string}
export interface Assignment extends Draft {title:string;status:string;createdAt:number;undoUntil:number;calendarItems:CalendarItem[]}
export const roster:string[];
export const bank:Material[];
export function freshDraft():Draft;
export function chosen(draft:Draft):Material[];
export function minutes(draft:Draft):number;
export function eligible(draft:Draft):Material[];
export function scheduleValid(draft:Draft):boolean;
export function ready(draft:Draft):boolean;
export function createAssignment(draft:Draft,assignments:Assignment[],now?:number):Assignment;
export function undoAssignment(assignments:Assignment[],id:string,now?:number):Assignment[];
export function restoreDraft(raw:string):Draft;
