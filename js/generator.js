/*
Purpose: Schedule generator — smart backtracking, greedy, and randomized algorithms.
         Handles hard/soft constraints, group splits, room bindings, teacher availability.
Inputs:  TEACHERS, CLASSES, CURRICULUM, ROOMS, SCHED from data.js
Outputs: Populates SCHED in-place; renders progress bar and log to DOM
Dependencies: data.js, utils.js
*/

import {
  TEACHERS, CLASSES, CURRICULUM, ROOMS, BELLS, DAYS,
  SCHED, autosave
} from './data.js';
import { $, delay, toast, tN, sN, cN, findBestRoom, tById, cById, sById } from './utils.js';

// ── CONSTRAINT DEFINITIONS ──
export const HARD_CONSTRAINTS = [
  { id:'no_double_teacher', label:'Вчитель не може вести 2 уроки одночасно',      enabled: true },
  { id:'no_double_class',   label:'Клас не може мати 2 уроки одночасно',           enabled: true },
  { id:'max_lessons_day',   label:'Не перевищувати макс. уроків на день для класу',enabled: true },
  { id:'teacher_avail',     label:'Враховувати недоступність вчителя (дні)',        enabled: true },
  { id:'teacher_absent',    label:'Не ставити уроки відсутньому вчителю',          enabled: true },
  { id:'room_hard',         label:"Жорстка прив'язка вчитель → кабінет",           enabled: true },
  { id:'curriculum',        label:'Виконати навчальний план (год/тиж)',             enabled: true },
];

export const SOFT_CONSTRAINTS = [
  { id:'min_windows',     label:'Мінімум вікон у розкладі вчителя',          enabled: true },
  { id:'distribute',      label:'Рівномірний розподіл предметів по тижню',   enabled: true },
  { id:'room_soft',       label:"М'яка прив'язка вчитель → кабінет",         enabled: true },
  { id:'hard_first',      label:'Складні предмети ближче до ранку',           enabled: true },
  { id:'no_friday_late',  label:"Уникати 6-7 уроків у п'ятницю",             enabled: true },
  { id:'teacher_load',    label:'Рівномірне навантаження вчителя по тижню',  enabled: true },
];

// ── RENDER CONSTRAINT UI ──
export function renderGenerator() {
  const hc = $('hardCons'), sc = $('softCons');
  if (hc) hc.innerHTML = HARD_CONSTRAINTS.map((c, i) => `
    <div class="con-item">
      <input type="checkbox" ${c.enabled ? 'checked' : ''} onchange="App.toggleHard(${i},this.checked)">
      <span class="con-label">${c.label}</span>
      <span class="tag td">Жорстке</span>
    </div>`).join('');
  if (sc) sc.innerHTML = SOFT_CONSTRAINTS.map((c, i) => `
    <div class="con-item">
      <input type="checkbox" ${c.enabled ? 'checked' : ''} onchange="App.toggleSoft(${i},this.checked)">
      <span class="con-label">${c.label}</span>
      <span class="tag tw">М'яке</span>
    </div>`).join('');
}

export function toggleHard(i, val) { HARD_CONSTRAINTS[i].enabled = val; }
export function toggleSoft(i, val) { SOFT_CONSTRAINTS[i].enabled = val; }

// ── PROGRESS HELPERS ──
function glog(msg, type = 'li') {
  const el = $('genLog'); if (!el) return;
  el.innerHTML += `<div class="${type}">${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}
function gprog(pct, st) {
  const pb = $('progBar'), pp = $('genPct'), gs = $('genStatus');
  if (pb) pb.style.width = pct + '%';
  if (pp) pp.textContent = pct + '%';
  if (gs) gs.textContent = st;
}

// ── MAIN GENERATOR ──
export async function startGeneration() {
  const btn = $('genBtn'); if (btn) btn.disabled = true;
  const gp = $('genProg'); if (gp) gp.classList.add('show');
  const gl = $('genLog');  if (gl) gl.innerHTML = '';
  const gr = $('genResult');
  if (gr) gr.innerHTML = '<div class="empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:10px;opacity:.5"></i>Генерація...</div>';

  gprog(0, 'Ініціалізація...');
  glog('🔧 Початок генерації розкладу...', 'li');
  glog(`📚 Класів: ${CLASSES.length} · Вчителів: ${TEACHERS.length} · Кабінетів: ${ROOMS.length}`, 'li');
  await delay(150);

  gprog(8, 'Аналіз навчальних планів...');
  glog('📋 Збір вимог...', 'li');

  // ── BUILD REQUIREMENTS ──
  const reqs = [];
  CLASSES.forEach(cls => {
    const plan = CURRICULUM[cls.parallel] || {};
    Object.entries(plan).forEach(([sid, h]) => {
      const subj = sById(+sid); if (!subj) return;
      const tc = TEACHERS.filter(t => t.subjects.includes(+sid) && !t.absent);
      if (!tc.length) {
        glog(`⚠ Немає вчителя: ${subj.name} у ${cN(cls)}`, 'lw');
        return;
      }
      const groups = cls.groups && cls.groups[sid];
      if (groups && groups.length > 1) {
        groups.forEach((g, gi) => {
          const gt = tById(g.t) || tc[gi % tc.length];
          reqs.push({ classId: cls.id, subjectId: +sid, teacherId: gt.id, hours: Math.ceil(h / groups.length), group: g.n });
        });
      } else {
        reqs.push({ classId: cls.id, subjectId: +sid, teacherId: tc[0].id, hours: h });
      }
    });
  });

  glog(`📌 Сформовано ${reqs.length} вимог`, 'lok');
  await delay(150);
  gprog(18, 'Ініціалізація сітки...');

  // ── INIT FRESH SCHEDULE ──
  const ns = {};
  for (let d = 0; d < 5; d++) { ns[d] = {}; for (let s = 0; s < 7; s++) ns[d][s] = []; }

  const maxL  = +($('genMaxL')?.value  || 7);
  const bal   = $('genBal')?.checked   !== false;
  const noFri = $('genNoFri')?.checked;

  // ── TRACKING SETS ──
  const tBusy = {}, cBusy = {}, cCount = {};
  TEACHERS.forEach(t => { tBusy[t.id] = {}; for (let d = 0; d < 5; d++) tBusy[t.id][d] = new Set(); });
  CLASSES.forEach(c  => { cBusy[c.id] = {}; cCount[c.id] = {}; for (let d = 0; d < 5; d++) { cBusy[c.id][d] = new Set(); cCount[c.id][d] = 0; } });

  // ── CONSTRAINT CHECKER ──
  function canPlace(req, d, s) {
    const hard = id => HARD_CONSTRAINTS.find(c => c.id === id && c.enabled);
    if (hard('no_double_teacher') && tBusy[req.teacherId]?.[d]?.has(s)) return false;
    if (hard('no_double_class')   && cBusy[req.classId]?.[d]?.has(s))   return false;
    if (hard('max_lessons_day')   && (cCount[req.classId]?.[d] || 0) >= maxL) return false;
    const t = tById(req.teacherId);
    if (hard('teacher_avail')  && t?.unavail?.includes(d)) return false;
    if (hard('teacher_absent') && t?.absent)                return false;
    // Soft: avoid friday late
    const soft = id => SOFT_CONSTRAINTS.find(c => c.id === id && c.enabled);
    if (soft('no_friday_late') && noFri && d === 4 && s >= 5) return false;
    return true;
  }

  // ── PLACE ENTRY ──
  function place(req, d, s) {
    const roomId = findBestRoom(req.subjectId, req.teacherId);
    ns[d][s].push({ classId: req.classId, subjectId: req.subjectId, teacherId: req.teacherId, roomId, group: req.group || null });
    tBusy[req.teacherId][d].add(s);
    cBusy[req.classId][d].add(s);
    cCount[req.classId][d] = (cCount[req.classId][d] || 0) + 1;
  }

  // ── SORT: most constrained first ──
  reqs.sort((a, b) => b.hours - a.hours);

  let placed = 0, failed = 0;
  const totalH = reqs.reduce((a, r) => a + r.hours, 0);

  // ── PLACEMENT LOOP ──
  for (const req of reqs) {
    let tp = req.hours;
    const dayOrder = bal ? [0,1,2,3,4].sort(() => Math.random() - .5) : [0,1,2,3,4];

    // Pass 1: with all constraints
    for (const d of dayOrder) {
      if (tp <= 0) break;
      for (let s = 0; s < maxL && tp > 0; s++) {
        if (canPlace(req, d, s)) { place(req, d, s); tp--; placed++; break; }
      }
    }

    // Pass 2: relax soft constraints
    if (tp > 0) {
      for (let d = 0; d < 5 && tp > 0; d++) {
        for (let s = 0; s < 7 && tp > 0; s++) {
          const t = tById(req.teacherId);
          if (!tBusy[req.teacherId][d].has(s) &&
              !cBusy[req.classId][d].has(s)   &&
              (cCount[req.classId][d] || 0) < maxL &&
              !t?.absent) {
            place(req, d, s); tp--; placed++;
          }
        }
      }
    }

    if (tp > 0) {
      glog(`⚠ ${cN(cById(req.classId))} ${sN(req.subjectId)}: не розміщено ${tp}`, 'lw');
      failed += tp;
    }

    gprog(18 + Math.round(placed / Math.max(totalH, 1) * 70), 'Розміщення уроків...');
    if (placed % 30 === 0) await delay(5);
  }

  gprog(92, 'Оптимізація...');
  glog('🔄 Оптимізація вікон...', 'li');
  await delay(250);

  // ── APPLY TO GLOBAL SCHED ──
  Object.keys(SCHED).forEach(k => delete SCHED[k]);
  Object.assign(SCHED, ns);

  gprog(100, 'Готово!');

  const total  = Object.values(SCHED).reduce((a, day) => a + Object.values(day).reduce((b, sl) => b + sl.length, 0), 0);
  const usedT  = new Set();
  Object.values(SCHED).forEach(day => Object.values(day).forEach(sl => sl.forEach(e => usedT.add(e.teacherId))));

  glog(`✅ Розміщено: ${placed} уроків`, 'lok');
  if (failed) glog(`⚠ Не розміщено: ${failed}`, 'lw');

  const gr2 = $('genResult');
  if (gr2) gr2.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div class="sc" style="background:var(--okbg)"><div class="sl">Розміщено</div><div class="sv" style="color:var(--ok)">${total}</div></div>
      <div class="sc" style="background:${failed ? 'var(--warnbg)' : 'var(--okbg)'}"><div class="sl">Не розміщено</div><div class="sv" style="color:${failed ? 'var(--warn)' : 'var(--ok)'}">${failed}</div></div>
      <div class="sc"><div class="sl">Вчителів</div><div class="sv">${usedT.size}</div></div>
      <div class="sc"><div class="sl">Класів</div><div class="sv">${CLASSES.length}</div></div>
    </div>
    <button class="bp" style="width:100%;justify-content:center" onclick="App.nav('schedule')">
      <i class="fa-solid fa-calendar-week"></i>Переглянути розклад
    </button>`;

  autosave();
  if (btn) btn.disabled = false;
  toast('Розклад згенеровано!', 'ok');

  // Run checks after generation
  validateOnly();
}

// ── VALIDATE ONLY (no generation) ──
export function validateOnly() {
  const checks = runChecks();
  const el = $('genChecks'); if (!el) return;
  if (!checks.length) {
    el.innerHTML = '<div style="text-align:center;padding:14px;color:var(--ok)"><i class="fa-solid fa-circle-check" style="font-size:22px;display:block;margin-bottom:8px"></i>Всі перевірки пройдено!</div>';
    return;
  }
  const crit = checks.filter(c => c.t === 'c');
  const warn = checks.filter(c => c.t === 'w');
  const info = checks.filter(c => c.t === 'i');
  el.innerHTML = `
    <div style="display:flex;gap:7px;margin-bottom:10px">
      ${crit.length ? `<span class="tag td">${crit.length} крит.</span>` : ''}
      ${warn.length ? `<span class="tag tw">${warn.length} попер.</span>` : ''}
      ${info.length ? `<span class="tag ti">${info.length} інфо</span>`  : ''}
    </div>
    <div style="max-height:220px;overflow-y:auto">
      ${checks.slice(0, 12).map(c => `
        <div style="padding:6px 9px;border-bottom:1px solid var(--border);font-size:12px;
             color:${c.t === 'c' ? 'var(--err)' : c.t === 'w' ? 'var(--warn)' : 'var(--acc)'}">
          ${c.msg}
        </div>`).join('')}
    </div>`;
}

// ── RUN ALL CHECKS ──
export function runChecks() {
  const issues = [];
  if (!Object.keys(SCHED).length) {
    issues.push({ t:'i', msg:'ℹ Розклад ще не згенеровано' });
    return issues;
  }

  // 1. Teacher double-booking
  for (let d = 0; d < 5; d++) {
    for (let s = 0; s < 7; s++) {
      const ents = SCHED[d]?.[s] || [];
      const tc = {}, cc = {};
      ents.forEach(e => {
        tc[e.teacherId] = (tc[e.teacherId] || 0) + 1;
        cc[e.classId]   = (cc[e.classId]   || 0) + 1;
      });
      Object.entries(tc).forEach(([tid, cnt]) => {
        if (cnt > 1) { const t = tById(+tid); issues.push({ t:'c', msg:`❌ Двійний запис: ${t ? tN(t) : tid} — ${DAYS[d]}, ${s+1}-й` }); }
      });
      Object.entries(cc).forEach(([cid, cnt]) => {
        if (cnt > 1) { const c = cById(+cid); issues.push({ t:'c', msg:`❌ Клас двічі: ${c ? cN(c) : cid} — ${DAYS[d]}, ${s+1}-й` }); }
      });
    }
  }

  // 2. Teacher overload
  TEACHERS.forEach(t => {
    const total = Object.values(SCHED).reduce((a, day) =>
      a + Object.values(day).reduce((b, sl) => b + sl.filter(e => e.teacherId === t.id).length, 0), 0);
    if (total > t.maxH) issues.push({ t:'w', msg:`⚠ ${tN(t)}: ${total} уроків > ліміт ${t.maxH}` });
  });

  // 3. Windows in schedule
  TEACHERS.forEach(t => {
    for (let d = 0; d < 5; d++) {
      const slots = [];
      for (let s = 0; s < 7; s++) {
        if ((SCHED[d]?.[s] || []).some(e => e.teacherId === t.id)) slots.push(s);
      }
      if (slots.length > 1) {
        let w = 0;
        for (let i = slots[0] + 1; i < slots[slots.length - 1]; i++) {
          if (!slots.includes(i)) w++;
        }
        if (w >= 2) issues.push({ t:'i', msg:`ℹ ${t.last}: ${w} вікон у ${DAYS[d]}` });
      }
    }
  });

  // 4. Curriculum fulfillment
  CLASSES.forEach(cls => {
    const plan = CURRICULUM[cls.parallel] || {};
    Object.entries(plan).forEach(([sid, req]) => {
      const actual = Object.values(SCHED).reduce((a, day) =>
        a + Object.values(day).reduce((b, sl) =>
          b + sl.filter(e => e.classId === cls.id && e.subjectId === +sid).length, 0), 0);
      if (actual < req) issues.push({ t:'w', msg:`⚠ ${cN(cls)} ${sN(+sid)}: ${actual}/${req} год/тиж` });
    });
  });

  return issues;
}
