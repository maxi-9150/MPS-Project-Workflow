export const materials = [
 {id:'lesson',type:'Lesson',title:'Visual models for equivalent fractions',minutes:5,reason:'Visual models connect equal values to scaling both parts.'},
 {id:'station',type:'Station',title:'Scale numerator and denominator',minutes:4,reason:'Apply the same factor to numerator and denominator.'},
 {id:'practice',type:'Practice set',title:'Equivalent fractions · Grade 6',minutes:6,reason:'Practice applying a shared scale factor; teacher to verify suitability.'},
 {id:'exercise',type:'Exercise',title:'Complete 2/3 = □/12',minutes:1,reason:'A single missing-numerator example for teacher review.'}
];
export const students = ['Amelia Reed','Noah Wilson','Sofia Martin'];
export function duration(ids){return materials.filter(m=>ids.includes(m.id)).reduce((n,m)=>n+m.minutes,0);}
export function validSchedule(start,due){return Boolean(start && due && due>=start);}
export function canSubmit(draft){return draft.selected.length>0 && draft.recipients.length>0 && draft.reviewed && validSchedule(draft.start,draft.due);}
export const initialDraft={selected:['lesson','station','practice'],recipients:[...students],support:['Visual model + guided example','Standard review sequence','Short evidence check before practice'],action:'assignment',start:'2026-10-23',due:'2026-10-30',reviewed:false,note:''};
