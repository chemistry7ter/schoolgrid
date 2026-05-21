/*
Purpose: Schedule page — teacher/week/class grid rendering, drag-and-drop lesson moves,
         quick-add empty slot, lesson detail modal, class schedule view
Inputs:  SCHED, TEACHERS, CLASSES, SUBJECTS, ROOMS, BELLS from data.js
Outputs: Renders #mHead/#mBody tables, handles drag events, updates SCHED in place
Dependencies: data.js, utils.js, ui.js
*/

import { SCHED, TEACHERS, CLASSES, SUBJECTS, ROOMS, BELLS, DAYS } from './data.js';
import { $, esc, toast, showTip, hideTip, tById, cById, sById, rById, tN, sN, cN, rN, getDay, findBestRoom } from './utils.js';
import { openM, closeM } from './ui.js';
import { autosave } from './data.js';

// ── STATE ──
let curDay = 5;         // default: week view
let curCDay = 0;
let dragSrc = null;

export const getCurDay  = () => curDay;
export const setCurDay  = d  => { curDay = d; };

// ── INIT CLASS PICKER ──
export function initCPick() {
  const sel = $('cpick');
  if (!sel || sel.options.length > 1) return;
  CLASSES.forEach(c => sel.appendChild(new Option(cN(c), c.id)));
  CLASSES.forEach(c => {
    Object.entries(c.groups || {}).forEach(([sid, gs]) => {
      gs.forEach((g, gi) => {
        sel.appendChild(new Option(`${cN(c)} ${g.n} (${sN(+sid)})`, `${c.id}_${sid}_${gi}`));
      });
    });
  });
}

// ── POPULATE SCHEDULE FILTERS ──
export function populateSchedFilters() {
  const sf = $('subjF'), cf = $('classF');
  if (sf && sf.options.length < 2) SUBJECTS.forEach(s => sf.innerHTML += `<option value="${s.id}">${s.name}</option>`);
  if (cf && cf.options.length < 2) CLASSES.forEach(c => cf.innerHTML += `<option value="${c.id}">${cN(c)}</option>`);
}

// ── SWITCH DAY TAB ──
export function switchDay(d, btn) {
  curDay = d;
  document.querySelectorAll('#dayTabs .ti2').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMain(d);
}

// ── SET VIEW (teachers / classes) ──
export function setView(v) {
  const vT = $('vswT'), vC = $('vswC'), tv = $('tvw'), cv = $('cvw');
  if (vT) vT.classList.toggle('active', v === 't');
  if (vC) vC.classList.toggle('active', v === 'c');
  if (tv) tv.style.display = v === 't' ? '' : 'none';
  if (cv) cv.style.display = v === 'c' ? '' : 'none';
  if (v === 't') renderMain(curDay);
  else { initCPick(); renderClassSched(); }
}

// ── MAIN TABLE (teachers × slots) ──
export function renderMain(dayIdx) {
  const thead = $('mHead'), tbody = $('mBody');
  if (!thead || !tbody) return;

  const q   = ($('schedQ')?.value || '').toLowerCase();
  const sf  = +($('subjF')?.value  || 0);
  const cfv = +($('classF')?.value || 0);
  const week = dayIdx === 5;
  const hs   = Object.keys(SCHED).length > 0;

  if (!week) {
    _renderDayView(thead, tbody, dayIdx, q, sf, cfv, hs);
  } else {
    _renderWeekView(thead, tbody, q, sf, hs);
  }
}

function _renderDayView(thead, tbody, dayIdx, q, sf, cfv, hs) {
  $('mHead').closest('table').classList.remove('week-view');
  const ents = getDay(SCHED, dayIdx);
  const tm = {};
  ents.forEach(e => {
    if (!tm[e.teacherId]) tm[e.teacherId] = Array(BELLS.length).fill(null);
    if (e.slot < BELLS.length) tm[e.teacherId][e.slot] = e;
  });

  thead.innerHTML = `<tr><th class="tc">Вчитель / Предмет</th>${
    BELLS.map((b, i) => `<th class="${i === 5 ? 'shift-sep' : ''}" title="${b.s}–${b.e}">${b.n}<br><span style="font-weight:400;font-size:9px">${b.s}</span></th>`).join('')
  }</tr>`;

  const list = TEACHERS.filter(t => {
    if (q && !t.last.toLowerCase().includes(q) && !t.first.toLowerCase().includes(q)) return false;
    if (sf && !t.subjects.includes(sf)) return false;
    if (cfv && !ents.find(e => e.classId === cfv && e.teacherId === t.id)) return false;
    return true;
  });

  let h = '';
  list.forEach(t => {
    const row = tm[t.id] || Array(BELLS.length).fill(null);
    h += `<tr><td class="tn" style="border-left:3px solid ${t.color}" onclick="App.showTD(${t.id})">
      <div>${t.last} ${t.first}</div>
      <div style="font-size:10px;color:var(--muted)">${t.subjects.slice(0,2).map(s => sN(s)).join(', ')}</div>
      ${t.absent ? '<span class="tag td" style="font-size:9px;padding:1px 4px">відсутній</span>' : ''}
    </td>`;
    row.forEach((e, l) => {
      h += _cellHTML(e, t, l, dayIdx, hs);
    });
    h += '</tr>';
  });

  tbody.innerHTML = h || '<tr><td colspan="8" class="empty" style="padding:20px">Нічого не знайдено</td></tr>';
}

function _renderWeekView(thead, tbody, q, sf, hs) {
  $('mHead').closest('table').classList.add('week-view');
  thead.innerHTML = `<tr><th class="tc">Вчитель</th>${
    DAYS.map(d => `<th colspan="${BELLS.length}" class="day-sep">${d}</th>`).join('')
  }</tr><tr><th class="tc"></th>${
    DAYS.map(() => BELLS.map((b, i) => `<th class="${i === 5 ? 'shift-sep' : ''}">${b.n}</th>`).join('')).join('')
  }</tr>`;

  const list = TEACHERS.filter(t => {
    if (q && !t.last.toLowerCase().includes(q) && !t.first.toLowerCase().includes(q)) return false;
    if (sf && !t.subjects.includes(sf)) return false;
    return true;
  });

  let h = '';
  list.slice(0, 40).forEach(t => {
    h += `<tr><td class="tn" style="border-left:3px solid ${t.color}" onclick="App.showTD(${t.id})">
      ${t.last} ${t.first}
      <div style="font-size:10px;color:var(--muted)">${t.subjects.slice(0,2).map(s => sN(s)).join(', ')}</div>
      ${t.absent ? '<span class="tag td" style="font-size:9px;padding:1px 3px;margin-top:2px">відс.</span>' : ''}
    </td>`;
    for (let d = 0; d < 5; d++) {
      const ents = getDay(SCHED, d);
      const tm = {};
      ents.forEach(e => {
        if (!tm[e.teacherId]) tm[e.teacherId] = Array(BELLS.length).fill(null);
        if (e.slot < BELLS.length) tm[e.teacherId][e.slot] = e;
      });
      for (let l = 0; l < BELLS.length; l++) {
        const e   = tm[t.id]?.[l];
        const clsN = (l === BELLS.length - 1) ? 'day-sep' : (l === 5 ? 'shift-sep' : '');
        if (e) {
          const cls  = cById(e.classId);
          const subj = sById(e.subjectId);
          const col  = subj ? subj.color : 'var(--acc)';
          const room = rN(e.roomId);
          const tip  = `${t.last} · ${cN(cls)} ${e.group || ''}`;
          h += `<td class="droptarget ${clsN}" data-tch="${t.id}" data-day="${d}" data-slot="${l}"
            ondragover="App.onDragOver(event)" ondragleave="App.onDragLeave(event)" ondrop="App.onDrop(event,${t.id},${d},${l})"
            onmouseenter="showTip(event,'${esc(tip)}')" onmouseleave="hideTip()">
            <span class="lc${t.absent ? ' lab' : hs ? ' lgen' : e.group ? ' lgrp' : ''}"
              style="background:${col}22;color:${col};border:1px solid ${col}55;cursor:grab"
              draggable="true"
              ondragstart="App.onDragStart(event,${t.id},${d},${l})"
              ondragend="App.onDragEnd(event)"
              onclick="App.showLD('${esc(JSON.stringify(e))}')"
            >
              <span class="lgroup">${e.group || ''}</span>
              ${cN(cls)}
              <span class="lroom">${room}</span>
            </span></td>`;
        } else {
          h += `<td class="droptarget ${clsN}" data-tch="${t.id}" data-day="${d}" data-slot="${l}"
            ondragover="App.onDragOver(event)" ondragleave="App.onDragLeave(event)" ondrop="App.onDrop(event,${t.id},${d},${l})"
            onclick="App.quickAdd(${t.id},${d},${l})" title="+"></td>`;
        }
      }
    }
    h += '</tr>';
  });
  tbody.innerHTML = h;
}

function _cellHTML(e, t, l, dayIdx, hs) {
  let clsName = (l === 5) ? 'shift-sep' : '';
  if (l >= 6) clsName += ' s2-bg';
  if (e) {
    const cls  = cById(e.classId);
    const subj = sById(e.subjectId);
    const col  = subj ? subj.color : 'var(--acc)';
    const room = rN(e.roomId);
    const tip  = `${t.last} · ${cN(cls)} ${e.group || ''}`;
    return `<td class="droptarget ${clsName}" data-tch="${t.id}" data-day="${dayIdx}" data-slot="${l}"
      ondragover="App.onDragOver(event)" ondragleave="App.onDragLeave(event)" ondrop="App.onDrop(event,${t.id},${dayIdx},${l})"
      onmouseenter="showTip(event,'${esc(tip)}')" onmouseleave="hideTip()">
      <span class="lc${t.absent ? ' lab' : hs ? ' lgen' : e.group ? ' lgrp' : ''}"
        style="background:${col}22;color:${col};border:1px solid ${col}55;cursor:grab"
        draggable="true"
        ondragstart="App.onDragStart(event,${t.id},${dayIdx},${l})"
        ondragend="App.onDragEnd(event)"
        onclick="App.showLD('${esc(JSON.stringify(e))}')"
      >
        <span class="lgroup">${e.group || ''}</span>
        ${cN(cls)}
        <span class="lroom">${room}</span>
        <span class="lnum">${l+1}</span>
      </span></td>`;
  } else {
    return `<td class="droptarget ${clsName}" data-tch="${t.id}" data-day="${dayIdx}" data-slot="${l}"
      ondragover="App.onDragOver(event)" ondragleave="App.onDragLeave(event)" ondrop="App.onDrop(event,${t.id},${dayIdx},${l})"
      onclick="App.quickAdd(${t.id},${dayIdx},${l})" style="cursor:cell" title="+ додати"></td>`;
  }
}

// ── DRAG AND DROP ──
export function onDragStart(event, tchId, day, slot) {
  dragSrc = { tchId, day, slot };
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', JSON.stringify({ tchId, day, slot }));
  setTimeout(() => event.target.style.opacity = '0.4', 0);
}
export function onDragEnd(event) {
  event.target.style.opacity = '';
  document.querySelectorAll('.droptarget.drag-over').forEach(el => {
    el.classList.remove('drag-over');
    el.style.background = '';
    el.style.outline    = '';
  });
  dragSrc = null;
}
export function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const td = event.currentTarget;
  td.classList.add('drag-over');
  td.style.background   = 'var(--accl)';
  td.style.outline      = '2px dashed var(--acc)';
  td.style.outlineOffset = '-2px';
}
export function onDragLeave(event) {
  const td = event.currentTarget;
  td.classList.remove('drag-over');
  td.style.background = '';
  td.style.outline    = '';
}
export function onDrop(event, toTch, toDay, toSlot) {
  event.preventDefault();
  const td = event.currentTarget;
  td.classList.remove('drag-over');
  td.style.background = '';
  td.style.outline    = '';
  if (!dragSrc) return;

  const { tchId: fromTch, day: fromDay, slot: fromSlot } = dragSrc;
  if (fromTch === toTch && fromDay === toDay && fromSlot === toSlot) return;

  const srcEntries = SCHED[fromDay]?.[fromSlot] || [];
  const srcIdx     = srcEntries.findIndex(e => e.teacherId === fromTch);
  if (srcIdx === -1) return;
  const srcEntry = { ...srcEntries[srcIdx] };

  const dstEntries = SCHED[toDay]?.[toSlot] || [];
  const dstIdx     = dstEntries.findIndex(e => e.teacherId === toTch);

  // Ensure slots exist
  if (!SCHED[fromDay]) SCHED[fromDay] = {};
  if (!SCHED[fromDay][fromSlot]) SCHED[fromDay][fromSlot] = [];
  if (!SCHED[toDay])   SCHED[toDay]   = {};
  if (!SCHED[toDay][toSlot]) SCHED[toDay][toSlot] = [];

  const isSame = fromTch === toTch;

  if (isSame) {
    const dstEntry = dstIdx >= 0 ? { ...dstEntries[dstIdx] } : null;
    SCHED[fromDay][fromSlot] = SCHED[fromDay][fromSlot].filter(e => e.teacherId !== fromTch);
    SCHED[toDay][toSlot]     = SCHED[toDay][toSlot].filter(e => e.teacherId !== toTch);
    SCHED[toDay][toSlot].push({ ...srcEntry });
    if (dstEntry) {
      SCHED[fromDay][fromSlot].push({ ...dstEntry });
      toast(`↔ Уроки поміняно: ${fromSlot+1}-й ↔ ${toSlot+1}-й`, 'ok');
    } else {
      toast(`Урок переміщено: ${DAYS[fromDay] || ''} ${fromSlot+1} → ${DAYS[toDay] || ''} ${toSlot+1}`, 'ok');
    }
  } else {
    const dstEntry = dstIdx >= 0 ? { ...dstEntries[dstIdx] } : null;
    SCHED[fromDay][fromSlot] = SCHED[fromDay][fromSlot].filter(e => e.teacherId !== fromTch);
    SCHED[toDay][toSlot]     = SCHED[toDay][toSlot].filter(e => e.teacherId !== toTch);
    const newRoom  = findBestRoom(srcEntry.subjectId, toTch);
    SCHED[toDay][toSlot].push({ ...srcEntry, teacherId: toTch, roomId: newRoom });
    if (dstEntry) {
      const swapRoom = findBestRoom(dstEntry.subjectId, fromTch);
      SCHED[fromDay][fromSlot].push({ ...dstEntry, teacherId: fromTch, roomId: swapRoom });
      const tF = tById(fromTch), tT = tById(toTch);
      toast(`↔ Поміняно: ${tF ? tF.last : '?'} ↔ ${tT ? tT.last : '?'}`, 'ok');
    } else {
      const tT = tById(toTch);
      toast(`Урок передано ${tT ? tT.last : '?'} · ${DAYS[toDay] || ''} ${toSlot+1}-й`, 'ok');
    }
  }

  dragSrc = null;
  autosave();
  renderMain(curDay);
}

// ── QUICK ADD (click empty cell) ──
export function quickAdd(tchId, day, slot) {
  const t = tById(tchId); if (!t) return;
  const clsList  = CLASSES.filter(c => c.parallel >= 3);
  const subjList = SUBJECTS.filter(s => t.subjects.includes(s.id));
  $('detTitle').textContent = `Додати урок — ${t.last} ${t.first}`;
  $('detBody').innerHTML = `
    <div style="background:var(--bg);padding:10px;border-radius:8px;margin-bottom:14px;font-size:12.5px">
      <b>${t.last} ${t.first}</b> · ${DAYS[day]} · ${slot+1}-й урок · ${BELLS[slot]?.s}–${BELLS[slot]?.e}
    </div>
    <div class="fg"><label class="fl">Клас</label><select class="fi" id="qaC">${clsList.map(c => `<option value="${c.id}">${cN(c)}</option>`).join('')}</select></div>
    <div class="fg"><label class="fl">Предмет</label><select class="fi" id="qaS">${subjList.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
    <div class="fg"><label class="fl">Кабінет</label><select class="fi" id="qaR"><option value="">Авто</option>${ROOMS.map(r => `<option value="${r.id}">${r.num} ${r.name}</option>`).join('')}</select></div>`;
  $('detFoot').innerHTML = `
    <button class="bs" onclick="App.closeM('detail')">Скасувати</button>
    <button class="bp" onclick="App.applyQL(${tchId},${day},${slot})"><i class="fa-solid fa-plus"></i>Додати</button>`;
  openM('detail');
}

export function applyQL(tchId, day, slot) {
  const classId   = +$('qaC').value;
  const subjectId = +$('qaS').value;
  const roomId    = +$('qaR').value || null;
  if (!SCHED[day])         SCHED[day] = {};
  if (!SCHED[day][slot])   SCHED[day][slot] = [];
  SCHED[day][slot] = SCHED[day][slot].filter(e => e.teacherId !== tchId && e.classId !== classId);
  SCHED[day][slot].push({ classId, subjectId, teacherId: tchId, roomId });
  closeM('detail');
  autosave();
  renderMain(curDay);
  toast(`Урок додано: ${DAYS[day]}, ${slot+1}-й`, 'ok');
}

// ── LESSON DETAIL MODAL ──
export function showLD(ej) {
  let e;
  try { e = typeof ej === 'string' ? JSON.parse(ej.replace(/'/g, '"')) : ej; }
  catch { return; }
  const subj = sById(e.subjectId), tch = tById(e.teacherId);
  const cls  = cById(e.classId),  room = rById(e.roomId);
  const b    = BELLS[e.slot] || { s:'', e:'' };
  $('detTitle').textContent = `${subj ? subj.name : '—'} · ${cN(cls)}`;
  $('detBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div><div style="font-size:10.5px;color:var(--muted);font-weight:600;margin-bottom:2px">ВЧИТЕЛЬ</div>
           <div style="font-size:13px;font-weight:600">${tch ? tN(tch) : '—'}${tch?.absent ? '<span class="tag td" style="margin-left:5px;font-size:10px">відс.</span>' : ''}</div></div>
      <div><div style="font-size:10.5px;color:var(--muted);font-weight:600;margin-bottom:2px">КЛАС</div>
           <div style="font-size:13px;font-weight:600">${cN(cls)}${e.group ? ' (' + e.group + ')' : ''}</div></div>
      <div><div style="font-size:10.5px;color:var(--muted);font-weight:600;margin-bottom:2px">УРОК</div>
           <div style="font-size:13px;font-weight:600">${e.slot+1}-й · ${b.s}–${b.e}</div></div>
      <div><div style="font-size:10.5px;color:var(--muted);font-weight:600;margin-bottom:2px">КАБІНЕТ</div>
           <div style="font-size:13px;font-weight:600">${room ? room.num + ' ' + room.name : '—'}</div></div>
    </div>`;
  $('detFoot').innerHTML = `
    <button class="bs" onclick="App.closeM('detail')">Закрити</button>
    <button class="bs"><i class="fa-solid fa-pencil"></i>Ред.</button>
    <button class="bp" onclick="App.closeM('detail');App.openM('findSub')"><i class="fa-solid fa-arrows-rotate"></i>Замінити</button>`;
  openM('detail');
}

// ── TEACHER DETAIL MODAL ──
export function showTD(id) {
  const t = tById(id); if (!t) return;
  const dept = (window.App?.DEPTS || []).find(d => d.id === t.deptId);
  $('detTitle').textContent = tN(t);
  $('detBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:13px;margin-bottom:16px">
      <div style="width:46px;height:46px;border-radius:50%;background:${t.color}22;color:${t.color};display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;flex-shrink:0">${t.last[0]}${t.first[0]}</div>
      <div>
        <div style="font-size:15px;font-weight:700">${tN(t)}</div>
        <div style="font-size:12.5px;color:var(--muted)">${dept ? dept.name : '—'} · ${t.hours} год/тиж</div>
        ${t.absent ? '<span class="tag td" style="margin-top:4px">Відсутній</span>' : '<span class="tag ts" style="margin-top:4px">Присутній</span>'}
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
      ${t.subjects.map(sid => { const s = sById(sid); return s ? `<span class="chip active" style="background:${s.color}22;color:${s.color};border-color:${s.color}44">${s.name}</span>` : ''; }).join('')}
    </div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);letter-spacing:.5px;margin-bottom:9px">Розклад на тиждень</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
      ${DAYS.map((d, di) => {
        const ents = getDay(SCHED, di).filter(e => e.teacherId === id);
        return `<div style="background:var(--bg);border-radius:8px;padding:7px">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:4px">${d.slice(0,2)}</div>
          ${ents.slice(0, BELLS.length).map(e => { const cls = cById(e.classId); const subj = sById(e.subjectId); const col = subj ? subj.color : 'var(--acc)'; return `<div style="font-size:9px;padding:2px 4px;border-radius:3px;margin-bottom:2px;background:${col}18;color:${col};font-weight:700">${cN(cls)}</div>`; }).join('')}
        </div>`;
      }).join('')}
    </div>`;
  $('detFoot').innerHTML = `
    <button class="bs" onclick="App.closeM('detail')">Закрити</button>
    <button class="bp" onclick="App.closeM('detail');App.nav('subs')"><i class="fa-solid fa-arrows-rotate"></i>Заміна</button>`;
  openM('detail');
}

// ── CLASS SCHEDULE VIEW ──
export function switchCDay(d, btn) {
  curCDay = d;
  document.querySelectorAll('#cDayTabs .ti2').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderClassSched();
}

export function renderClassSched() {
  const val  = $('cpick')?.value;
  const cont = $('clsCont');
  if (!cont) return;
  if (!val) { cont.innerHTML = '<div class="empty"><i class="fa-solid fa-door-open"></i>Оберіть клас</div>'; return; }

  const isG = val.includes('_');
  let cls, sF;
  if (isG) { const [cid, sid] = val.split('_').map(Number); cls = cById(cid); sF = sid; }
  else cls = cById(+val);
  if (!cls) { cont.innerHTML = '<div class="empty">Клас не знайдено</div>'; return; }

  const week = curCDay === 5;
  const gD   = d => getDay(SCHED, d).filter(e => e.classId === cls.id && (!isG || e.subjectId === sF));

  cont.innerHTML = week ? _classWeekHTML(cls, gD, isG, sF) : _classDayHTML(cls, gD(curCDay));
}

function _classDayHTML(cls, data) {
  const sm = {};
  data.forEach(e => sm[e.slot] = e);
  let h = `<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr>
    <th style="background:var(--bg);padding:8px;border-bottom:2px solid var(--border);text-align:center;width:34px">№</th>
    <th style="background:var(--bg);padding:8px;border-bottom:2px solid var(--border);text-align:left">Час</th>
    <th style="background:var(--bg);padding:8px;border-bottom:2px solid var(--border)">Предмет</th>
    <th style="background:var(--bg);padding:8px;border-bottom:2px solid var(--border)">Вчитель</th>
    <th style="background:var(--bg);padding:8px;border-bottom:2px solid var(--border)">Каб.</th>
  </tr></thead><tbody>`;
  BELLS.forEach((b, l) => {
    const e = sm[l]; const subj = e ? sById(e.subjectId) : null; const tch = e ? tById(e.teacherId) : null;
    const col = subj ? subj.color : 'var(--acc)';
    h += `<tr style="border-bottom:1px solid var(--border)">
      <td style="text-align:center;font-weight:700;color:var(--muted);background:var(--bg);padding:7px">${l+1}</td>
      <td style="padding:7px;font-size:11px;color:var(--muted);white-space:nowrap">${b.s}–${b.e}</td>
      <td style="padding:7px">${subj ? `<span style="display:inline-block;padding:3px 8px;border-radius:6px;font-weight:600;font-size:12px;background:${col}18;color:${col};border-left:3px solid ${col}">${subj.name}${e.group ? ' (' + e.group + ')' : ''}</span>` : '<span style="color:var(--border)">—</span>'}</td>
      <td style="padding:7px;font-size:12.5px">${tch ? tch.last + ' ' + tch.first : ''}</td>
      <td style="padding:7px;font-size:12px;color:var(--muted)">${e ? rN(e.roomId) : ''}</td>
    </tr>`;
  });
  return h + '</tbody></table>';
}

function _classWeekHTML(cls, gD, isG, sF) {
  let h = `<table style="width:100%;border-collapse:collapse;font-size:11.5px"><thead><tr>
    <th style="background:var(--bg);padding:7px;border-bottom:2px solid var(--border);width:30px">№</th>
    <th style="background:var(--bg);padding:7px;border-bottom:2px solid var(--border);width:70px">Час</th>
    ${DAYS.map(d => `<th style="background:var(--bg);padding:7px;border-bottom:2px solid var(--border)">${d}</th>`).join('')}
  </tr></thead><tbody>`;
  BELLS.forEach((b, l) => {
    h += `<tr style="border-bottom:1px solid var(--border)">
      <td style="text-align:center;font-weight:700;color:var(--muted);background:var(--bg);padding:5px">${l+1}</td>
      <td style="padding:5px;font-size:10px;color:var(--muted);white-space:nowrap">${b.s}–${b.e}</td>`;
    for (let d = 0; d < 5; d++) {
      const e = getDay(SCHED, d).find(e => e.classId === cls.id && e.slot === l && (!isG || e.subjectId === sF));
      const subj = e ? sById(e.subjectId) : null; const tch = e ? tById(e.teacherId) : null;
      const col  = subj ? subj.color : 'var(--acc)';
      h += `<td style="padding:4px;min-width:90px">${e
        ? `<div style="padding:3px 5px;border-radius:5px;background:${col}18;border-left:3px solid ${col};cursor:pointer" onclick="App.showLD('${esc(JSON.stringify(e))}')">
            <div style="font-weight:700;font-size:11px;color:${col}">${subj ? subj.name : ''}</div>
            <div style="font-size:10px;color:var(--muted)">${tch ? tch.last : ''}</div>
          </div>` : ''}</td>`;
    }
    h += '</tr>';
  });
  return h + '</tbody></table>';
}

