import test from 'node:test';
import assert from 'node:assert/strict';
import {initialDraft,duration,validSchedule,canSubmit} from '../src/domain.mjs';
test('selected material time is recalculated from actual selection',()=>{assert.equal(duration(initialDraft.selected),15);assert.equal(duration(['lesson','exercise']),6);assert.equal(duration([]),0);});
test('invalid or missing schedule cannot submit',()=>{assert.equal(validSchedule('2026-10-30','2026-10-23'),false);assert.equal(validSchedule('',''),false);assert.equal(canSubmit({...initialDraft,reviewed:true,due:'2026-10-01'}),false);});
test('teacher confirmation, recipients and materials are all required',()=>{assert.equal(canSubmit(initialDraft),false);assert.equal(canSubmit({...initialDraft,reviewed:true}),true);assert.equal(canSubmit({...initialDraft,reviewed:true,recipients:[]}),false);assert.equal(canSubmit({...initialDraft,reviewed:true,selected:[]}),false);});
