export const roster=['Amelia Reed','Noah Wilson','Sofia Martin'];
export const bank=[
 {id:'lesson',kind:'Lesson',purpose:'Explanation',title:'Visual models for equivalent fractions',minutes:5},
 {id:'station',kind:'Station',purpose:'Practice',title:'Scale numerator and denominator',minutes:8},
 {id:'practice',kind:'Practice set',purpose:'Check understanding',title:'Equivalent fractions · Grade 6',minutes:3},
 {id:'exercise',kind:'Exercise',purpose:'Check understanding',title:'Complete 2/3 = □/12',minutes:1}
];
export const freshDraft=()=>({id:crypto.randomUUID(),selected:['lesson','station','practice'],recipients:[...roster],support:['Visual model + guided example','Standard review sequence','Short evidence check before practice'],start:'2026-10-22',startTime:'10:15',due:'2026-10-26',dueTime:'17:00',planned:'2026-10-22',plannedTime:'10:15',reviewed:false});
export function chosen(draft){return draft.selected.map(id=>bank.find(m=>m.id===id)).filter(Boolean);}
export function minutes(draft){return chosen(draft).reduce((n,m)=>n+m.minutes,0);}
export function eligible(draft){return chosen(draft).filter(m=>m.kind==='Lesson'||m.kind==='Station');}
export function scheduleValid(d){return /^\d{4}-\d{2}-\d{2}$/.test(d.start)&&/^\d{4}-\d{2}-\d{2}$/.test(d.due)&&/^\d{4}-\d{2}-\d{2}$/.test(d.planned)&&/^\d{2}:\d{2}$/.test(d.startTime)&&/^\d{2}:\d{2}$/.test(d.dueTime)&&/^\d{2}:\d{2}$/.test(d.plannedTime)&&`${d.due}T${d.dueTime}`>=`${d.start}T${d.startTime}`;}
export function ready(d){return d.reviewed&&d.selected.length>0&&d.selected.every(id=>bank.some(m=>m.id===id))&&d.recipients.length>0&&d.recipients.every(s=>roster.includes(s))&&scheduleValid(d);}
export function createAssignment(d,assignments,now=Date.now()){
 if(!ready(d))throw Error('Check recipients, materials, schedule and teacher confirmation.');
 const existing=assignments.find(a=>a.id===d.id);if(existing)return existing;
 return {...structuredClone(d),title:'Equivalent fractions review',status:'Not started',createdAt:now,undoUntil:now+30000,calendarItems:eligible(d).map(m=>({...m,id:`${d.id}:${m.id}`,date:d.planned,time:d.plannedTime,assignmentId:d.id}))};
}
export function undoAssignment(assignments,id,now=Date.now()){const a=assignments.find(a=>a.id===id);return a&&now<=a.undoUntil?assignments.filter(a=>a.id!==id):assignments;}
export function restoreDraft(raw){try{const d=JSON.parse(raw);if(!d||!Array.isArray(d.selected)||!Array.isArray(d.recipients)||!Array.isArray(d.support))return freshDraft();return {...freshDraft(),...d,selected:d.selected.filter(id=>bank.some(m=>m.id===id)),recipients:d.recipients.filter(s=>roster.includes(s)),reviewed:false};}catch{return freshDraft();}}
