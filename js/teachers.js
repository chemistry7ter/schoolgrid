/*
Purpose: Teachers page — grid rendering with dept/status filters, workload analysis modal,
         add/edit teacher form, teacher detail modal (delegates to schedule.js)
Inputs:  TEACHERS, DEPTS, SUBJECTS, ROOMS from data.js
Outputs: Renders #tchGrid; manages teacher CRUD; opens detail modal
Dependencies: data.js, utils.js, ui.js
*/

import { TEACHERS, DEPTS, SUBJECTS, ROOMS, autosave } from './data.js';
import { $, toast, tN, sN, tById, sById, PAL } from './utils.js';
import { openM, closeM } from './ui.js';

// ── POPULATE DEPT FILTER SELECT ──
export function populateTchFilters() {
  const df = $('tchDeptF');
  if (!df || df.options.length > 1) return;
  DEPTS.forEach(d => df.innerHTML += `<option value="${d.id}">${d.name}</option>`);
}

// ── RENDER TEACHERS GRID ──
export function renderTeachers() {
  const g = $('tchGrid');
  if (!g) return;

  const q   = ($('tchQ')?.value   || '').toLowerCase();
  const df  = +($('tchDeptF')?.value || 0);
  const st  = $('tchSt')?.value   || '';

  const list = TEACHERS.filter(t => {
    if (q  && !t.last.toLowerCase().includes(q) && !t.first.toLowerCase().includes(q)) return false;
    if (df && t.deptId !== df)         return false;
    if (st === 'absent'  && !t.absent) return false;
    if (st === 'present' &&  t.absent) return false;
    return true;
  });

  const ts = $('tchSub');
  if (ts) ts.textContent = `${list.length} педагогів · 2025–2026`;

  g.innerHTML = list.map(t => {
    const dept = DEPTS.find(d => d.id === t.deptId);
    const hard = ROOMS.filter(r => r.hardTeachers.includes(t.id));
    const soft = ROOMS.filter(r => r.softTeachers.includes(t.id));
    const pct  = Math.min(Math.round(t.hours / 36 * 100), 100);
    const bc   = t.hours > t.maxH ? 'var(--err)' : t.hours < 10 ? 'var(--warn)' : 'var(--acc)';

    return `
      <div class="tcard" onclick="App.showTD(${t.id})">
        <div class="tch">
          <div class="tca" style="background:${t.color}22;color:${t.color}">${t.last[0]}${t.first[0]}</div>
          <div style="flex:1;min-width:0">
            <div class="tcn">${t.last} ${t.first}</div>
            <div class="tcs">${dept ? dept.name : '—'}</div>
          </div>
          ${t.absent
            ? '<span class="tag td" style="font-size:9px">відс.</span>'
            : '<span style="width:7px;height:7px;border-radius:50%;background:var(--ok);display:inline-block;flex-shrink:0"></span>'}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:10px">
          ${t.subjects.slice(0, 3).map(sid => {
            const s = sById(sid);
            return s ? `<span style="font-size:9.5px;padding:2px 5px;border-radius:4px;background:${s.color}18;color:${s.color};font-weight:700">${s.name}</span>` : '';
          }).join('')}
        </div>
        <div class="tcst">
          <div class="tstat"><div class="tsv" style="color:${bc}">${t.hours}</div><div class="tsl">год/тиж</div></div>
          <div class="tstat"><div class="tsv">${hard.length}</div><div class="tsl">жорст.</div></div>
          <div class="tstat"><div class="tsv">${soft.length}</div><div class="tsl">м'яких</div></div>
        </div>
        <div class="lbar"><div class="lbarfill" style="width:${pct}%;background:${bc}"></div></div>
      </div>`;
  }).join('') || '<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-magnifying-glass"></i>Нічого не знайдено</div>';
}

// ── WORKLOAD MODAL ──
export function showWorkloadModal() {
  const over  = TEACHERS.filter(t => t.hours > t.maxH);
  const under = TEACHERS.filter(t => t.hours < 10);
  const norm  = TEACHERS.filter(t => t.hours >= 10 && t.hours <= t.maxH);

  $('detTitle').textContent = 'Аналіз навантаження';
  $('detBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-bottom:14px">
      <div class="sc" style="background:var(--errbg)">
        <div class="sl">Перевантажені</div><div class="sv" style="color:var(--err)">${over.length}</div>
      </div>
      <div class="sc" style="background:var(--okbg)">
        <div class="sl">В нормі</div><div class="sv" style="color:var(--ok)">${norm.length}</div>
      </div>
      <div class="sc" style="background:var(--warnbg)">
        <div class="sl">Мало годин</div><div class="sv" style="color:var(--warn)">${under.length}</div>
      </div>
    </div>
    <div style="max-height:280px;overflow-y:auto">
      ${[
        ...over.map(t  => `<div style="padding:7px 10px;border-bottom:1px solid var(--border);font-size:12.5px;display:flex;justify-content:space-between"><span>⚠ ${tN(t)}</span><span class="tag td">${t.hours}/${t.maxH}</span></div>`),
        ...under.map(t => `<div style="padding:7px 10px;border-bottom:1px solid var(--border);font-size:12.5px;display:flex;justify-content:space-between"><span>ℹ ${tN(t)}</span><span class="tag tw">${t.hours} год</span></div>`),
      ].join('') || '<div style="text-align:center;padding:20px;color:var(--ok)">✅ Порушень не виявлено</div>'}
    </div>`;
  $('detFoot').innerHTML = `<button class="bp" onclick="App.closeM('detail')">Закрити</button>`;
  openM('detail');
}

// ── ADD TEACHER FORM STATE ──
let tchSubjs    = [];
let tchUnavailDays = [];

export function initAddTeacherForm() {
  // Populate dept select
  const td = $('tchDept');
  if (td && td.options.length < 2) {
    DEPTS.forEach(d => td.innerHTML += `<option value="${d.id}">${d.name}</option>`);
  }
  // Populate subject add select
  const ta = $('tchSubjA');
  if (ta && ta.options.length < 2) {
    SUBJECTS.forEach(s => ta.innerHTML += `<option value="${s.id}">${s.name}</option>`);
  }
  tchSubjs       = [];
  tchUnavailDays = [];
  _renderTchSubjChips();
}

export function addTchSubj() {
  const v = +$('tchSubjA')?.value;
  if (v && !tchSubjs.includes(v)) {
    tchSubjs.push(v);
    _renderTchSubjChips();
  }
  if ($('tchSubjA')) $('tchSubjA').value = '';
}

function _renderTchSubjChips() {
  const el = $('tchSubjC'); if (!el) return;
  el.innerHTML = tchSubjs.map((sid, i) => {
    const s = sById(sid);
    return s ? `<span class="chip active" style="background:${s.color}22;color:${s.color}"
                  onclick="App.removeTchSubj(${i})">${s.name} ×</span>` : '';
  }).join('');
}

export function removeTchSubj(i) {
  tchSubjs.splice(i, 1);
  _renderTchSubjChips();
}

export function toggleUD(d, el) {
  const i = tchUnavailDays.indexOf(d);
  if (i >= 0) tchUnavailDays.splice(i, 1);
  else         tchUnavailDays.push(d);
  el.classList.toggle('active', tchUnavailDays.includes(d));
}

export function saveTeacher() {
  const last  = $('tchLast')?.value.trim();
  const first = $('tchFirst')?.value.trim();
  if (!last || !first) return toast('Введіть ПІБ', 'err');

  TEACHERS.push({
    id:      TEACHERS.length,
    last,
    first,
    deptId:  +$('tchDept')?.value  || 1,
    subjects: [...tchSubjs],
    hours:   +$('tchH')?.value     || 18,
    maxH:    +$('tchMH')?.value    || 24,
    unavail: [...tchUnavailDays],
    absent:  false,
    color:   PAL[TEACHERS.length % PAL.length],
  });

  autosave();
  closeM('addTeacher');
  renderTeachers();
  toast(`${last} ${first} додано`, 'ok');
}
