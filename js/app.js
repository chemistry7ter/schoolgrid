/*
Purpose: Main application entry point — imports all modules, wires page handlers,
         exposes global App namespace for inline HTML onclick handlers,
         initialises localStorage, renders initial state
Inputs:  All other JS modules; DOM ready
Outputs: window.App global object; initial page render
Dependencies: All modules in js/
*/

import {
  TEACHERS, CLASSES, ROOMS, SUBJECTS, DEPTS, CURRICULUM,
  SCHED, SETTINGS, ABSENCES, SUBLOG, BELLS, DAYS,
  autosave, loadAll, saveAll, resetAll,
} from './data.js';

import {
  $, toast, showTip, hideTip, setLookups, tById, cById, sById,
  tN, sN, cN, rN, getDay, findBestRoom, PAL,
} from './utils.js';

import {
  buildNav, nav, registerPage,
  openM, closeM, initModalDismiss,
  renderBells, renderBellSet, renderDashDate,
  openSidebar, closeSidebar,
  toggleNotif, closeNotif, toggleDark,
  initKeyboard, initNotifDismiss, updateConflictBadge,
} from './ui.js';

import {
  renderMain, renderClassSched, initCPick, populateSchedFilters,
  switchDay, switchCDay, setView,
  quickAdd, applyQL, showLD, showTD,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  showTipW, hideTipW, getCurDay, setCurDay,
} from './schedule.js';

import {
  renderGenerator, startGeneration, validateOnly, runChecks,
  HARD_CONSTRAINTS, SOFT_CONSTRAINTS, toggleHard, toggleSoft,
} from './generator.js';

import { renderConflicts, fixCf, autoFixConflicts, renderMCal, getCriticalCount } from './conflicts.js';
import { renderAnalytics } from './analytics.js';
import {
  renderTeachers, populateTchFilters, showWorkloadModal,
  initAddTeacherForm, addTchSubj, removeTchSubj, toggleUD, saveTeacher,
} from './teachers.js';
import {
  renderSubsPage, populateSubSearch,
  openFSFor, doFindSub, selFS, confirmFoundSub,
  saveAbsence, runSubSearch, showPrintOrder,
} from './substitutions.js';

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
let dashDay = 0;

function renderDashStats() {
  const el = $('dashStats'); if (!el) return;
  const absent = TEACHERS.filter(t => t.absent).length;
  const hs = Object.keys(SCHED).length > 0;
  el.innerHTML = `
    <div class="sc"><div class="sl">Вчителів</div><div class="sv">${TEACHERS.length}</div>
      <div class="ss" style="color:var(--err)">${absent} відсутніх</div></div>
    <div class="sc"><div class="sl">Класів</div><div class="sv">${CLASSES.length}</div>
      <div class="ss">${[...new Set(CLASSES.map(c => c.parallel))].length} паралелей</div></div>
    <div class="sc"><div class="sl">Кабінетів</div><div class="sv">${ROOMS.length}</div></div>
    <div class="sc"><div class="sl">Предметів</div><div class="sv">${SUBJECTS.length}</div></div>
    <div class="sc"><div class="sl">Кафедр</div><div class="sv">${DEPTS.length}</div></div>
    <div class="sc"><div class="sl">Розклад</div>
      <div class="sv" style="font-size:14px;color:${hs ? 'var(--ok)' : 'var(--warn)'}">${hs ? '✓ Є' : '⚠ Немає'}</div>
      <div class="ss">${hs ? 'Згенеровано' : 'Генеруйте'}</div></div>`;
}

function renderDashDayBtns() {
  const el = $('dashDayBtns'); if (!el) return;
  el.innerHTML = DAYS.map((d, i) => `
    <button class="bs" style="font-size:11px;padding:3px 8px;${i === dashDay ? 'background:var(--accl);color:var(--acc);border-color:var(--acc)' : ''}"
      onclick="App.dashDS(${i},this)">${d.slice(0, 2)}</button>`).join('');
}

function dashDS(d, btn) {
  dashDay = d;
  document.querySelectorAll('#dashDayBtns button').forEach(b => {
    b.style.background = ''; b.style.color = ''; b.style.borderColor = '';
  });
  btn.style.background = 'var(--accl)';
  btn.style.color      = 'var(--acc)';
  btn.style.borderColor = 'var(--acc)';
  renderDashTable();
}

function renderDashTable() {
  renderDashStats();
  renderDashDayBtns();
  const th = $('dashThead'), tb = $('dashTbody'); if (!tb) return;
  if (th) th.innerHTML = `<tr><th class="tc">Вчитель</th>${BELLS.map(b => `<th>${b.n}</th>`).join('')}</tr>`;
  const ents = getDay(SCHED, dashDay);
  const tm   = {};
  ents.forEach(e => {
    if (!tm[e.teacherId]) tm[e.teacherId] = Array(BELLS.length).fill(null);
    if (e.slot < BELLS.length) tm[e.teacherId][e.slot] = e;
  });
  const hs = Object.keys(SCHED).length > 0;
  let h = '';
  TEACHERS.slice(0, 22).forEach(t => {
    const row = tm[t.id] || Array(BELLS.length).fill(null);
    h += `<tr><td class="tn" style="border-left:3px solid ${t.color}" onclick="App.showTD(${t.id})">
      ${t.last} ${t.first}
      <div style="font-size:10px;color:var(--muted)">${t.subjects.slice(0,2).map(s => sN(s)).join(', ')}</div>
      ${t.absent ? '<span class="tag td" style="font-size:9px;padding:1px 4px">відс.</span>' : ''}
    </td>`;
    row.forEach((e, l) => {
      if (e) {
        const cls  = cById(e.classId);
        const subj = sById(e.subjectId);
        const col  = subj ? subj.color : 'var(--acc)';
        h += `<td><span class="lc${t.absent ? ' lab' : hs ? ' lgen' : ''}"
          style="background:${col}22;color:${col};border:1px solid ${col}55"
          onclick="App.showLD('${e ? JSON.stringify(e).replace(/'/g,"\\'") : ''}')">
          ${cN(cls)}${e.group ? '<br><span style="font-size:8px">' + e.group + '</span>' : ''}
          <span class="lnum">${l+1}</span></span></td>`;
      } else {
        h += '<td></td>';
      }
    });
    h += '</tr>';
  });
  tb.innerHTML = h || `<tr><td colspan="8" class="empty" style="padding:24px">
    <i class="fa-solid fa-wand-magic-sparkles" style="font-size:24px;display:block;margin-bottom:10px;opacity:.25"></i>
    Розклад ще не згенеровано</td></tr>`;
}

function renderDashAlerts() {
  const el  = $('dashAlerts'); if (!el) return;
  const ab  = TEACHERS.filter(t => t.absent);
  const cnt = $('alertCount'); if (cnt) cnt.textContent = ab.length;
  el.innerHTML = ab.slice(0, 3).map(t => `
    <div class="ai aid">
      <div class="aico"><i class="fa-solid fa-user-slash"></i></div>
      <div class="atx"><strong>${t.last} ${t.first}</strong><span>${t.subjects.map(s => sN(s)).join(', ')}</span></div>
      <button class="bp" style="font-size:10px;padding:3px 8px;flex-shrink:0" onclick="App.nav('subs')">Замінити</button>
    </div>`).join('') || '<div style="padding:12px;text-align:center;color:var(--ok);font-size:13px"><i class="fa-solid fa-check"></i> Всі присутні</div>';
}

function renderDashAbsent() {
  const el = $('dashAbsent'); if (!el) return;
  const ab = TEACHERS.filter(t => t.absent);
  el.innerHTML = ab.map(t => {
    const a = ABSENCES.find(a => a.teacherId === t.id) || { reason: '—' };
    return `
      <div class="avt" style="border-color:var(--errbg)">
        <div class="ava" style="background:${t.color}22;color:${t.color}">${t.last[0]}${t.first[0]}</div>
        <div style="flex:1">
          <div class="avn">${t.last} ${t.first}</div>
          <div class="avs">${t.subjects.map(s => sN(s)).join(', ')} · ${a.reason}</div>
        </div>
        <span class="tag td">Відсутній</span>
      </div>`;
  }).join('') || '<div style="text-align:center;padding:12px;font-size:12.5px;color:var(--ok)"><i class="fa-solid fa-check"></i> Всі присутні</div>';
}

// ─────────────────────────────────────────────
// REFERENCE PAGES (depts, parallels, classes, rooms)
// ─────────────────────────────────────────────

function renderDepts() {
  const rd = $('depts'), rt = $('deptTeachers');
  if (rd) rd.innerHTML = `<div class="swrap"><table class="dt">
    <thead><tr><th>Назва кафедри</th><th>Завідувач</th><th>Вчителів</th><th>Предметів</th><th></th></tr></thead>
    <tbody>${DEPTS.map((d, i) => {
      const head = tById(d.head);
      return `<tr>
        <td><span style="display:inline-flex;align-items:center;gap:7px">
          <span style="width:10px;height:10px;border-radius:50%;background:${d.color};flex-shrink:0"></span>
          <b>${d.name}</b></span></td>
        <td>${head ? tN(head) : '—'}</td>
        <td><span class="tag ti">${TEACHERS.filter(t => t.deptId === d.id).length}</span></td>
        <td><span class="tag tp">${SUBJECTS.filter(s => s.deptId === d.id).length}</span></td>
        <td class="dt-act">
          <button class="icb" onclick="App.editDept(${i})"><i class="fa-solid fa-pencil"></i></button>
          <button class="icb del" onclick="App.delDept(${i})"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`;
    }).join('')}</tbody></table></div>`;

  if (rt) rt.innerHTML = DEPTS.map(d => {
    const dT = TEACHERS.filter(t => t.deptId === d.id);
    return `<div class="card" style="margin-bottom:13px">
      <div class="ch"><span class="ct" style="color:${d.color}">
        <i class="fa-solid fa-building-columns"></i>${d.name}</span>
        <span class="tag" style="background:${d.color}22;color:${d.color}">${dT.length} вчителів</span>
      </div>
      <div class="cb" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">
        ${dT.map(t => `
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:8px">
            <div style="width:30px;height:30px;border-radius:50%;background:${t.color}22;color:${t.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${t.last[0]}${t.first[0]}</div>
            <div><div style="font-size:12.5px;font-weight:600">${tN(t)}</div>
            <div style="font-size:11px;color:var(--muted)">${t.subjects.slice(0,2).map(s => sN(s)).join(', ')}</div></div>
            ${t.absent ? '<span class="tag td" style="font-size:9px;margin-left:auto">відс.</span>' : ''}
          </div>`).join('')}
      </div></div>`;
  }).join('');
}

function showRefTab(showId, btn) {
  btn.closest('.tbar').querySelectorAll('.ti2').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  btn.closest('.page').querySelectorAll('[id]').forEach(el => {
    if (['depts','deptTeachers','roomList','roomBindings','teacherRooms'].includes(el.id)) el.style.display = 'none';
  });
  const t = btn.closest('.page').querySelector('#' + showId);
  if (t) t.style.display = '';
}

function saveDept() {
  const n = $('deptName')?.value.trim(); if (!n) return toast('Введіть назву', 'err');
  DEPTS.push({ id: DEPTS.length + 1, name: n, head: +$('deptHead')?.value || 0, color: $('deptColor')?.value || '#3b5bdb' });
  autosave(); closeM('addDept'); renderDepts(); toast('Кафедру додано', 'ok');
}
function editDept(i) { const d = DEPTS[i]; if ($('deptName')) $('deptName').value = d.name; if ($('deptColor')) $('deptColor').value = d.color; openM('addDept'); }
function delDept(i)  { if (!confirm('Видалити?')) return; DEPTS.splice(i, 1); autosave(); renderDepts(); toast('Видалено', 'warn'); }

// ─ PARALLELS ─
let curParallel = 5, editingP = null;

function renderParallels() {
  const tabs = $('parallelTabs'); if (!tabs) return;
  tabs.innerHTML = '';
  for (let p = 1; p <= 11; p++) {
    const btn = document.createElement('button');
    btn.className = 'ti2' + (p === curParallel ? ' active' : '');
    btn.textContent = `${p} клас`;
    btn.onclick = (pp => function () {
      curParallel = pp;
      document.querySelectorAll('#parallelTabs .ti2').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderParallelContent();
    })(p);
    tabs.appendChild(btn);
  }
  renderParallelContent();
}

function renderParallelContent() {
  const el = $('parallelContent'); if (!el) return;
  const plan   = CURRICULUM[curParallel] || {};
  const cls    = CLASSES.filter(c => c.parallel === curParallel);
  const totalH = Object.values(plan).reduce((a, b) => a + b, 0);
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card">
        <div class="ch">
          <span class="ct"><i class="fa-solid fa-book-open" style="color:var(--acc)"></i>Навч. план — ${curParallel} клас</span>
          <div style="display:flex;gap:6px">
            <span class="tag ti">Σ ${totalH} год/тиж</span>
            <button class="bs" style="font-size:11px;padding:3px 8px" onclick="App.openEditPlan(${curParallel})"><i class="fa-solid fa-pencil"></i>Ред.</button>
          </div>
        </div>
        <div class="swrap" style="border:none;border-radius:0"><table class="dt">
          <thead><tr><th>Предмет</th><th>Кафедра</th><th>Год/тиж</th><th>Поділ</th></tr></thead>
          <tbody>${Object.entries(plan).map(([sid, h]) => {
            const subj = sById(+sid); if (!subj) return '';
            const dept = DEPTS.find(d => d.id === subj.deptId);
            const hasG = cls.some(c => c.groups && c.groups[sid]);
            return `<tr>
              <td><span style="display:inline-flex;align-items:center;gap:5px">
                <span style="width:8px;height:8px;border-radius:50%;background:${subj.color};flex-shrink:0"></span>${subj.name}</span></td>
              <td style="font-size:11px;color:var(--muted)">${dept ? dept.name : ''}</td>
              <td><span class="tag ti">${h}</span></td>
              <td>${hasG ? '<span class="tag ts">Поділ</span>' : '<span style="color:var(--muted);font-size:12px">—</span>'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>
      <div>
        <div class="card" style="margin-bottom:13px">
          <div class="ch"><span class="ct"><i class="fa-solid fa-layer-group" style="color:var(--pur)"></i>Класи ${curParallel} паралелі</span></div>
          <div class="cb" style="display:flex;flex-wrap:wrap;gap:8px">
            ${cls.map(c => `
              <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;min-width:90px;cursor:pointer"
                onmouseenter="this.style.background='var(--accl)'" onmouseleave="this.style.background='var(--bg)'"
                onclick="App.nav('classgroups')">
                <div style="font-family:'Unbounded',sans-serif;font-size:16px;font-weight:700;color:var(--acc)">${cN(c)}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px">${c.count} учнів</div>
                ${Object.keys(c.groups||{}).length ? `<div style="font-size:10px;color:var(--ok);margin-top:3px"><i class="fa-solid fa-object-group"></i> ${Object.keys(c.groups).length} поділ</div>` : ''}
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="ch"><span class="ct"><i class="fa-solid fa-chart-bar" style="color:var(--acc)"></i>По кафедрах</span></div>
          <div class="cb">${DEPTS.map(d => {
            const dh = Object.entries(plan).filter(([sid]) => { const s = sById(+sid); return s && s.deptId === d.id; }).reduce((a, [, h]) => a + h, 0);
            if (!dh) return '';
            return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
              <span style="min-width:130px;font-size:11.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.name}</span>
              <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                <div style="height:100%;border-radius:3px;width:${Math.round(dh/totalH*100)}%;background:${d.color}"></div>
              </div>
              <span style="font-size:12px;font-weight:700;color:${d.color}">${dh}</span>
            </div>`;
          }).join('')}</div>
        </div>
      </div>
    </div>`;
}

function openEditPlan(p) {
  editingP = p;
  $('planMT').textContent = `Навч. план — ${p} клас`;
  const plan = CURRICULUM[p] || {};
  $('planBody').innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
    ${SUBJECTS.map(s => `
      <div style="display:flex;align-items:center;gap:7px;padding:7px;background:var(--bg);border-radius:7px">
        <span style="flex:1;font-size:12.5px">${s.name}</span>
        <input type="number" min="0" max="10" value="${plan[s.id]||0}" id="plan_${s.id}"
          style="width:46px;padding:4px;border:1px solid var(--border);border-radius:6px;font-size:13px;text-align:center">
      </div>`).join('')}
  </div>`;
  openM('editPlan');
}

function savePlan() {
  if (!editingP) return;
  const plan = {};
  SUBJECTS.forEach(s => { const v = +($('plan_' + s.id)?.value || 0); if (v > 0) plan[s.id] = v; });
  CURRICULUM[editingP] = plan;
  autosave(); closeM('editPlan'); renderParallelContent();
  toast(`Навч. план ${editingP} кл. збережено`, 'ok');
}

// ─ CLASSES & GROUPS ─
function renderClassGroups() {
  const el = $('classGroupsList'); if (!el) return;
  const byP = {};
  CLASSES.forEach(c => { if (!byP[c.parallel]) byP[c.parallel] = []; byP[c.parallel].push(c); });
  el.innerHTML = Object.entries(byP).sort((a,b) => +a[0] - +b[0]).map(([p, cls]) => `
    <div class="card" style="margin-bottom:13px">
      <div class="ch"><span class="ct"><i class="fa-solid fa-layer-group"></i>${p} паралель</span><span class="tag ti">${cls.length} кл.</span></div>
      <div class="cb" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(275px,1fr));gap:10px">
        ${cls.map(c => {
          const head = tById(c.teacherId);
          const ge   = Object.entries(c.groups || {});
          return `
            <div style="border:1px solid var(--border);border-radius:10px;padding:12px;background:var(--bg)">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px">
                <div style="font-family:'Unbounded',sans-serif;font-size:17px;font-weight:700;color:var(--acc)">${cN(c)}</div>
                <span class="tag ti">${c.count} учнів</span>
              </div>
              <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">
                <i class="fa-solid fa-person-chalkboard" style="margin-right:4px"></i>Кл. кер.: <b>${head ? tN(head) : '—'}</b>
              </div>
              ${ge.length ? ge.map(([sid, groups]) => {
                const subj = sById(+sid);
                return `<div style="margin-bottom:8px">
                  <div style="font-size:11.5px;font-weight:600;margin-bottom:4px">${subj ? subj.name : '?'}</div>
                  <div style="display:flex;gap:4px;flex-wrap:wrap">
                    ${groups.map((g, gi) => { const gt = tById(g.t); return `<span style="padding:3px 8px;border-radius:5px;font-size:11px;background:${PAL[gi%PAL.length]}22;border:1px solid ${PAL[gi%PAL.length]}44;color:${PAL[gi%PAL.length]}"><b>${g.n}</b> — ${gt ? gt.last : '?'}</span>`; }).join('')}
                  </div></div>`;
              }).join('') : '<div style="font-size:12px;color:var(--muted)">Без поділу</div>'}
              <div style="display:flex;gap:5px;margin-top:10px">
                <button class="bs" style="font-size:11px;padding:3px 8px;flex:1;justify-content:center" onclick="App.openAddGroup(${c.id})"><i class="fa-solid fa-object-group"></i>Поділ</button>
                <button class="icb del" onclick="App.delCls(${c.id})"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

let gCnt = 2;
function setGC(n, el) { gCnt = n; document.querySelectorAll('#m-addGroup .chip').forEach(c => c.classList.remove('active')); el.classList.add('active'); renderGrpD(); }
function openAddGroup(cid) {
  const gc = $('grpCls'); if (gc) { gc.innerHTML = ''; CLASSES.forEach(c => gc.innerHTML += `<option value="${c.id}"${c.id === cid ? ' selected' : ''}>${cN(c)}</option>`); }
  const gs = $('grpSubj'); if (gs) { gs.innerHTML = '<option value="">Оберіть...</option>'; SUBJECTS.forEach(s => gs.innerHTML += `<option value="${s.id}">${s.name}</option>`); gs.onchange = renderGrpD; }
  renderGrpD(); openM('addGroup');
}
function renderGrpD() {
  const el = $('grpD'); if (!el) return;
  const sid = +$('grpSubj')?.value || 0; if (!sid) { el.innerHTML = ''; return; }
  const cid = +$('grpCls')?.value; const cls = CLASSES.find(c => c.id === cid);
  const perG = cls ? Math.ceil(cls.count / gCnt) : 0;
  const tOpts = SUBJECTS.find(s => s.id === sid) ? TEACHERS.filter(t => t.subjects.includes(sid)) : TEACHERS;
  el.innerHTML = '<div style="height:1px;background:var(--border);margin:12px 0"></div><div class="stit">Групи та вчителі</div>' +
    Array.from({ length: gCnt }, (_, i) => `
      <div style="background:var(--bg);border-radius:8px;padding:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-weight:700;color:${PAL[i % PAL.length]}">Група ${i+1}</span>
          <input class="fi" style="flex:1;padding:4px 8px;font-size:12px" placeholder="Назва" id="gn_${i}" value="Гр.${i+1}">
          <div style="width:70px">
            <label style="font-size:9px;color:var(--muted);display:block">Учнів</label>
            <input type="number" class="fi" style="padding:4px 8px;font-size:12px" id="gc_${i}" value="${perG}">
          </div>
        </div>
        <div class="fg" style="margin-bottom:0"><label class="fl">Вчитель</label>
          <select class="fi" id="gt_${i}"><option value="">Оберіть...</option>
            ${tOpts.map(t => `<option value="${t.id}">${tN(t)}</option>`).join('')}
          </select>
        </div>
      </div>`).join('');
}
function saveGroup() {
  const cid = +$('grpCls').value, sid = +$('grpSubj').value;
  if (!cid || !sid) return toast('Оберіть клас та предмет', 'err');
  const cls = CLASSES.find(c => c.id === cid); if (!cls) return;
  const groups = Array.from({ length: gCnt }, (_, i) => ({
    n: $('gn_' + i)?.value || `Гр.${i+1}`,
    t: +$('gt_' + i)?.value || 0,
    count: +$('gc_' + i)?.value || 0
  }));
  if (!cls.groups) cls.groups = {};
  cls.groups[sid] = groups;
  autosave(); closeM('addGroup'); renderClassGroups();
  toast(`Поділ на ${gCnt} групи збережено`, 'ok');
}
function delCls(id) { if (!confirm('Видалити клас?')) return; const i = CLASSES.findIndex(c => c.id === id); if (i >= 0) { CLASSES.splice(i, 1); autosave(); renderClassGroups(); toast('Видалено', 'warn'); } }
function saveClass() {
  const p = +$('clsP').value, letter = ($('clsL').value || '').trim().toUpperCase();
  if (!letter) return toast('Введіть літеру', 'err');
  CLASSES.push({ id: CLASSES.length + 1, parallel: p, letter, teacherId: +$('clsT')?.value || 0, count: +$('clsCnt')?.value || 28, roomId: +$('clsR')?.value || null, groups: {} });
  autosave(); closeM('addClass'); renderClassGroups(); toast(`Клас ${p}${letter} додано`, 'ok');
}

// ─ ROOMS ─
const RTYPES = { classroom:'Звичайний', lab:'Лабораторія', gym:'Спортзал', computer:'Комп\'ютерний', workshop:'Майстерня', art:'Актова зала' };
const RICONS = { classroom:'fa-chalkboard', lab:'fa-flask', gym:'fa-dumbbell', computer:'fa-computer', workshop:'fa-wrench', art:'fa-music' };

function renderRooms() {
  const rl = $('roomList'), rb = $('roomBindings'), rtr = $('teacherRooms');
  if (rl) rl.innerHTML = `<div class="swrap"><table class="dt">
    <thead><tr><th>№</th><th>Назва</th><th>Тип</th><th>Місць</th><th>Предмети</th><th>Жорстко</th><th>М'яко</th><th></th></tr></thead>
    <tbody>${ROOMS.map((r, i) => `<tr>
      <td><b>${r.num}</b></td><td>${r.name}</td>
      <td><span class="tag ti"><i class="fa-solid ${RICONS[r.type]||'fa-door-open'}"></i> ${RTYPES[r.type]||r.type}</span></td>
      <td>${r.cap}</td>
      <td style="font-size:11.5px">${r.subjects.slice(0,3).map(s => sN(s)).join(', ')}</td>
      <td style="font-size:11.5px">${r.hardTeachers.map(t => tById(t)?.last||'?').join(', ')||'—'}</td>
      <td style="font-size:11.5px">${r.softTeachers.slice(0,3).map(t => tById(t)?.last||'?').join(', ').slice(0,28)||'—'}</td>
      <td class="dt-act">
        <button class="icb" onclick="App.editRoom(${i})"><i class="fa-solid fa-pencil"></i></button>
        <button class="icb del" onclick="App.delRoom(${i})"><i class="fa-solid fa-trash"></i></button>
      </td></tr>`).join('')}</tbody></table></div>`;
  if (rb) rb.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">
    ${ROOMS.filter(r => r.subjects.length).map(r => `
      <div class="card"><div class="ch"><span class="ct"><i class="fa-solid ${RICONS[r.type]||'fa-door-open'}"></i>${r.num} ${r.name}</span></div>
        <div class="cb" style="display:flex;flex-wrap:wrap;gap:4px">
          ${r.subjects.map(s => { const subj = sById(s); return subj ? `<span class="chip active" style="background:${subj.color}22;color:${subj.color};border-color:${subj.color}44">${subj.name}</span>` : ''; }).join('')}
        </div></div>`).join('')}</div>`;
  if (rtr) rtr.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">
    ${TEACHERS.map(t => {
      const hard = ROOMS.filter(r => r.hardTeachers.includes(t.id));
      const soft = ROOMS.filter(r => r.softTeachers.includes(t.id));
      if (!hard.length && !soft.length) return '';
      return `<div class="card"><div class="ch"><span class="ct">${tN(t)}</span></div>
        <div class="cb">
          ${hard.length ? `<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--err);margin-bottom:5px">Жорстка</div>${hard.map(r => `<span class="chip active">${r.num} ${r.name}</span>`).join('')}` : ''}
          ${soft.length ? `<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--warn);margin-top:6px;margin-bottom:5px">М'яка</div>${soft.map(r => `<span class="chip">${r.num} ${r.name}</span>`).join('')}` : ''}
        </div></div>`;
    }).join('')}</div>`;
}

let rSubjs = [], rHard = [], rSoft = [], editRI = null;
function prepRM() {
  const rs = $('roomSubjA'), rh = $('roomHardA'), rso = $('roomSoftA');
  if (rs)  rs.innerHTML  = '<option value="">+ Предмет</option>'   + SUBJECTS.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  if (rh)  rh.innerHTML  = '<option value="">+ Жорстка</option>'   + TEACHERS.map(t => `<option value="${t.id}">${tN(t)}</option>`).join('');
  if (rso) rso.innerHTML = '<option value="">+ М\'яка</option>'    + TEACHERS.map(t => `<option value="${t.id}">${tN(t)}</option>`).join('');
}
function renderRC() {
  const rc = $('roomSubjC'), rhc = $('roomHardC'), rsc = $('roomSoftC');
  if (rc)  rc.innerHTML  = rSubjs.map((s, i) => `<span class="chip active" onclick="App.rSubjs.splice(${i},1);App.renderRC()">${sN(s)} ×</span>`).join('');
  if (rhc) rhc.innerHTML = rHard.map((t, i)  => `<span class="chip active" onclick="App.rHard.splice(${i},1);App.renderRC()">${tById(t)?.last||'?'} ×</span>`).join('');
  if (rsc) rsc.innerHTML = rSoft.map((t, i)  => `<span class="chip"        onclick="App.rSoft.splice(${i},1);App.renderRC()">${tById(t)?.last||'?'} ×</span>`).join('');
}
function addRoomSubj() { const v = +$('roomSubjA').value; if (v && !rSubjs.includes(v)) { rSubjs.push(v); renderRC(); } $('roomSubjA').value = ''; }
function addRoomTch(type) { const sel = type === 'hard' ? $('roomHardA') : $('roomSoftA'); const v = +sel.value; const arr = type === 'hard' ? rHard : rSoft; if (v && !arr.includes(v)) { arr.push(v); renderRC(); } sel.value = ''; }
function saveRoom() {
  const num = $('roomNum')?.value.trim(); if (!num) return toast('Введіть номер', 'err');
  const room = { id: editRI !== null ? ROOMS[editRI].id : ROOMS.length + 1, num, name: $('roomName')?.value.trim(), cap: +$('roomCap')?.value||30, type: $('roomType')?.value||'classroom', subjects: [...rSubjs], hardTeachers: [...rHard], softTeachers: [...rSoft], note: $('roomNote')?.value||'' };
  if (editRI !== null) ROOMS[editRI] = room; else ROOMS.push(room);
  autosave(); closeM('addRoom'); renderRooms(); toast(editRI !== null ? 'Кабінет оновлено' : 'Кабінет додано', 'ok'); editRI = null;
}
function editRoom(i) { const r = ROOMS[i]; editRI = i; $('roomMT').textContent = 'Редагувати кабінет'; if ($('roomNum')) $('roomNum').value = r.num; if ($('roomName')) $('roomName').value = r.name; if ($('roomCap')) $('roomCap').value = r.cap; if ($('roomType')) $('roomType').value = r.type; if ($('roomNote')) $('roomNote').value = r.note||''; rSubjs = [...r.subjects]; rHard = [...r.hardTeachers]; rSoft = [...r.softTeachers]; prepRM(); renderRC(); openM('addRoom'); }
function delRoom(i) { if (!confirm('Видалити?')) return; ROOMS.splice(i, 1); autosave(); renderRooms(); toast('Видалено', 'warn'); }

// ─ SETTINGS ─
function saveSettings() {
  SETTINGS.schoolName = $('sName')?.value || SETTINGS.schoolName;
  SETTINGS.maxLessons = +$('sMax')?.value || 12;
  SETTINGS.norm       = +$('sNorm')?.value || 18;
  autosave(); toast('Налаштування збережено', 'ok');
}

// ─ POPULATE ALL FORM SELECTS ─
function populateAll() {
  const dh = $('deptHead'); if (dh) dh.innerHTML = '<option value="">Оберіть...</option>' + TEACHERS.map(t => `<option value="${t.id}">${tN(t)}</option>`).join('');
  const ct = $('clsT');     if (ct) ct.innerHTML = '<option value="">Оберіть...</option>' + TEACHERS.map(t => `<option value="${t.id}">${tN(t)}</option>`).join('');
  const cr = $('clsR');     if (cr) cr.innerHTML = '<option value="">Немає</option>'       + ROOMS.map(r    => `<option value="${r.id}">${r.num} ${r.name}</option>`).join('');
  prepRM();
  initAddTeacherForm();
}

// ─────────────────────────────────────────────
// REGISTER PAGE HANDLERS
// ─────────────────────────────────────────────
registerPage('dashboard',   () => { renderDashTable(); renderBells(); renderDashAlerts(); renderDashAbsent(); });
registerPage('schedule',    () => { renderMain(getCurDay()); initCPick(); populateSchedFilters(); });
registerPage('subs',        () => { renderSubsPage(); populateSubSearch(); });
registerPage('generator',   () => renderGenerator());
registerPage('teachers',    () => { renderTeachers(); populateTchFilters(); });
registerPage('departments', () => renderDepts());
registerPage('parallels',   () => renderParallels());
registerPage('classgroups', () => renderClassGroups());
registerPage('rooms',       () => renderRooms());
registerPage('analytics',   () => renderAnalytics());
registerPage('conflicts',   () => { renderConflicts(); renderMCal(); });
registerPage('settings',    () => renderBellSet());

// ─────────────────────────────────────────────
// GLOBAL App NAMESPACE (for inline onclick handlers)
// ─────────────────────────────────────────────
window.App = {
  // navigation
  nav, openM, closeM, openSidebar, closeSidebar, toggleNotif, toggleDark,
  // schedule state (needed by inline oninput handlers)
  getCurDay, setCurDay,
  renderMain,
  renderClassSched,
  // dashboard
  dashDS,
  // schedule
  switchDay, switchCDay, setView, quickAdd, applyQL, showLD, showTD,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  showTipW, hideTipW,
  // generator
  startGeneration, validateOnly, toggleHard, toggleSoft,
  // conflicts
  renderConflicts, fixCf, autoFixConflicts,
  // substitutions
  openFSFor, doFindSub, selFS, confirmFoundSub, saveAbsence, runSubSearch, showPrintOrder,
  // teachers
  showWorkloadModal, addTchSubj, removeTchSubj, toggleUD, saveTeacher,
  renderTeachers,
  populateTchFilters,
  // rooms
  addRoomSubj, addRoomTch, saveRoom, editRoom, delRoom, renderRC,
  rSubjs, rHard, rSoft,
  // depts
  editDept, delDept, saveDept,
  // parallels
  openEditPlan, savePlan,
  get curParallel() { return curParallel; },
  // classes
  openAddGroup, setGC, renderGrpD, saveGroup, delCls, saveClass,
  // settings
  saveSettings,
  // misc ref tabs
  showRefTab,
  // toast (used in inline onclick)
  toast,
  // data refs (for room chip onclick removal)
  DEPTS,
  get rSubjs() { return rSubjs; },
  get rHard()  { return rHard;  },
  get rSoft()  { return rSoft;  },
};

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
function init() {
  // 1. Load persisted data
  loadAll();

  // 2. Wire lookup helpers
  setLookups({ TEACHERS, CLASSES, SUBJECTS, ROOMS, DEPTS, BELLS });

  // 3. Build nav
  buildNav();

  // 4. Populate form selects
  populateAll();

  // 5. Init modals dismiss, keyboard, notif
  initModalDismiss();
  initKeyboard(getCurDay, setCurDay, renderMain);
  initNotifDismiss();

  // 6. Render initial dashboard
  renderDashTable();
  renderBells();
  renderDashAlerts();
  renderDashAbsent();
  renderDashDate();

  // 7. Set default dates for absence form
  const today = new Date().toISOString().split('T')[0];
  const af = $('abFrom'), at = $('abTo');
  if (af) af.value = today;
  if (at) at.value = today;

  // 8. Update conflict badge
  updateConflictBadge(getCriticalCount());
}

init();
