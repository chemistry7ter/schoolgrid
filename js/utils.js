/*
Purpose: Pure utility / helper functions shared across all modules
Inputs:  Imported by every other JS module
Outputs: DOM helper $(), esc(), toast(), showTip(), hideTip(), delay()
Dependencies: none
*/

// ── DOM shortcut ──
export const $ = id => document.getElementById(id);

// ── Escape single quotes for inline HTML attributes ──
export const esc = s => String(s).replace(/'/g, "\\'");

// ── Async delay (used by generator) ──
export const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Toast notification ──
export function toast(msg, type = 'ok') {
  const t = $('toast');
  if (!t) return;
  const colors = { ok: '#16a34a', warn: '#d97706', err: '#dc2626', acc: '#3b5bdb' };
  t.textContent = msg;
  t.style.background = colors[type] || colors.ok;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 3000);
}

// ── Tooltip ──
const tipEl = () => $('tip');
export function showTip(e, html) {
  const t = tipEl(); if (!t) return;
  t.innerHTML = html;
  t.style.display = 'block';
  t.style.left = (e.clientX + 12) + 'px';
  t.style.top  = (e.clientY - 8)  + 'px';
}
export function hideTip() {
  const t = tipEl(); if (t) t.style.display = 'none';
}
window.showTip = showTip;
window.hideTip = hideTip;

// ── Data lookup shortcuts ──
// These are populated lazily via setLookups() after data.js loads
let _T = [], _C = [], _S = [], _R = [], _D = [], _BELLS = [];

export function setLookups({ TEACHERS, CLASSES, SUBJECTS, ROOMS, DEPTS, BELLS }) {
  _T = TEACHERS; _C = CLASSES; _S = SUBJECTS;
  _R = ROOMS;    _D = DEPTS;   _BELLS = BELLS;
}

export const tById  = id => _T.find(t => t.id === id);
export const cById  = id => _C.find(c => c.id === id);
export const sById  = id => _S.find(s => s.id === id);
export const rById  = id => _R.find(r => r.id === id);
export const dById  = id => _D.find(d => d.id === id);
export const bellAt = n  => _BELLS[n];

export const tN  = t => t ? t.last + ' ' + t.first : '—';
export const sN  = id => { const s = sById(id); return s ? s.name : '—'; };
export const cN  = c => c ? c.parallel + c.letter : '—';
export const rN  = id => { const r = rById(id); return r ? r.num : '—'; };

// ── Find best room for a teacher+subject ──
export function findBestRoom(subjId, tchId, occupied = new Set(), minCap = 0) {
  const isOk = r => !occupied.has(r.id) && r.cap >= minCap;

  const hard = _R.find(r => r.hardTeachers.includes(tchId) && isOk(r));
  if (hard) return hard.id;

  const subj = _R.find(r => r.subjects.includes(subjId) && isOk(r));
  if (subj) return subj.id;

  const soft = _R.find(r => r.softTeachers.includes(tchId) && isOk(r));
  if (soft) return soft.id;

  // If no preferred room is free, try any free room with enough capacity
  const any = _R.find(isOk);
  return any ? any.id : null;
}

// ── Get all schedule entries for a given day ──
export function getDay(SCHED, day) {
  if (!SCHED[day]) return [];
  const res = [];
  Object.entries(SCHED[day]).forEach(([slot, entries]) => {
    (entries || []).forEach(e => res.push({ ...e, slot: +slot }));
  });
  return res;
}

// ── Palette ──
export const PAL = [
  '#3b5bdb','#7c3aed','#0f766e','#d97706',
  '#dc2626','#0ea5e9','#16a34a','#db2877','#854d0e'
];
