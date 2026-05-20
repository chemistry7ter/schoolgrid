/*
Purpose: Substitutions page — render sub cards, search free teachers,
         save absences, confirm substitutions, print order modal
Inputs:  TEACHERS, ABSENCES, SUBLOG, SUBJECTS, CLASSES, SCHED from data.js
Outputs: Renders #subsList, #subStats, #srRes, #fsResults; mutates ABSENCES/SUBLOG
Dependencies: data.js, utils.js, ui.js
*/

import { TEACHERS, ABSENCES, SUBLOG, SUBJECTS, CLASSES, SCHED, autosave } from './data.js';
import { $, toast, tN, sN, cN, tById, sById, cById, getDay } from './utils.js';
import { openM, closeM } from './ui.js';

// ── POPULATE SELECTS ──
export function populateSubSearch() {
  const sr  = $('srSubj');
  const fs  = $('fsTeacher');
  const fa  = $('abTeacher');
  const fsS = $('fsSubj');

  if (sr  && sr.options.length  < 2) SUBJECTS.forEach(s => sr.innerHTML  += `<option value="${s.id}">${s.name}</option>`);
  if (fs  && fs.options.length  < 2) TEACHERS.forEach(t => fs.innerHTML  += `<option value="${t.id}">${tN(t)}</option>`);
  if (fa  && fa.options.length  < 2) TEACHERS.forEach(t => fa.innerHTML  += `<option value="${t.id}">${tN(t)}</option>`);
  if (fsS && fsS.options.length < 2) SUBJECTS.forEach(s => fsS.innerHTML += `<option value="${s.id}">${s.name}</option>`);
}

// ── RENDER SUBS PAGE ──
export function renderSubsPage() {
  const pend = SUBLOG.filter(r => r.status === 'pending').length;
  const conf = SUBLOG.filter(r => r.status === 'confirmed').length;

  [$('subsU'), $('subsP'), $('subsC')].forEach((el, i) => {
    if (el) el.textContent = [pend, 0, conf][i];
  });

  const el = $('subsList');
  if (!el) return;

  const absent = TEACHERS.filter(t => t.absent);

  let html = absent.map(t => {
    const rel = SUBLOG.filter(r => r.absentId === t.id);
    const ab  = ABSENCES.find(a => a.teacherId === t.id) || { reason: '—' };

    return `
      <div class="scard">
        <div class="sch">
          <div>
            <div class="sct">${tN(t)}</div>
            <div style="font-size:12px;color:var(--muted)">${t.subjects.map(s => sN(s)).join(', ')} · ${ab.reason}</div>
          </div>
          ${rel.length
            ? `<span class="tag ts"><i class="fa-solid fa-check"></i>${rel.length} замін</span>`
            : '<span class="tag td">Потрібна заміна</span>'}
        </div>
        ${rel.map(r => {
          const sub  = tById(r.subId);
          const subj = sById(r.subjId);
          const cls  = cById(r.classId);
          return `
            <div style="display:flex;align-items:center;gap:8px;padding:7px;background:var(--bg);border-radius:7px;margin-bottom:5px">
              <i class="fa-solid fa-arrows-rotate" style="color:var(--acc);flex-shrink:0"></i>
              <div style="flex:1;font-size:12.5px">
                <b>${sub ? tN(sub) : '—'}</b> → ${subj ? subj.name : ''} · ${cN(cls)} · ${r.lesson}-й урок
              </div>
              <span class="tag ${r.status === 'confirmed' ? 'ts' : 'tw'}">
                ${r.status === 'confirmed' ? 'Підтверджено' : 'Очікує'}
              </span>
            </div>`;
        }).join('')}
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="bp" style="flex:1;justify-content:center;font-size:12px" onclick="App.openFSFor(${t.id})">
            <i class="fa-solid fa-magnifying-glass"></i>Знайти заміну
          </button>
          <button class="bs" style="font-size:12px">Самостійна</button>
        </div>
      </div>`;
  }).join('');

  if (!html) html = '<div class="empty"><i class="fa-solid fa-circle-check" style="color:var(--ok)"></i>Всі вчителі присутні!</div>';
  el.innerHTML = html;

  _renderSubStats();
}

function _renderSubStats() {
  const ss = $('subStats'); if (!ss) return;
  const ta = {};
  SUBLOG.forEach(r => ta[r.absentId] = (ta[r.absentId] || 0) + 1);
  const sorted = Object.entries(ta).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const mx = sorted[0]?.[1] || 1;
  ss.innerHTML = sorted.map(([tid, cnt]) => {
    const t = tById(+tid);
    return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
        <span style="min-width:90px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t ? t.last : '—'}</span>
        <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
          <div style="height:100%;border-radius:3px;width:${Math.round(cnt / mx * 100)}%;background:var(--err)"></div>
        </div>
        <span style="font-size:12px;font-weight:700;color:var(--err)">${cnt}</span>
      </div>`;
  }).join('') || '<div style="font-size:12px;color:var(--muted);text-align:center">Немає даних</div>';
}

// ── OPEN FIND-SUB FOR SPECIFIC TEACHER ──
export function openFSFor(tid) {
  const t = tById(tid); if (!t) return;
  const fs = $('fsTeacher'); if (fs) fs.value = tid;
  const fsS = $('fsSubj');   if (fsS && t.subjects.length) fsS.value = t.subjects[0];
  openM('findSub');
}

// ── FIND FREE TEACHERS ──
let foundSubId = null;

export function doFindSub() {
  const day    = +($('fsDay')?.value    || 0);
  const slot   = +($('fsLesson')?.value || 1) - 1;
  const subjId = +($('fsSubj')?.value   || 0);

  const busy   = getDay(SCHED, day).filter(e => e.slot === slot).map(e => e.teacherId);
  const absent = TEACHERS.filter(t => t.absent).map(t => t.id);
  const unavail = TEACHERS.filter(t => (t.unavail || []).includes(day)).map(t => t.id);

  let free = TEACHERS.filter(t =>
    !busy.includes(t.id)    &&
    !absent.includes(t.id)  &&
    !unavail.includes(t.id) &&
    (!subjId || t.subjects.includes(subjId))
  );

  free.sort((a, b) => {
    const aH = subjId ? a.subjects.includes(subjId) : false;
    const bH = subjId ? b.subjects.includes(subjId) : false;
    if (aH !== bH) return aH ? -1 : 1;
    return a.hours - b.hours;
  });

  foundSubId = null;
  const fc = $('fsConfirm'); if (fc) fc.style.display = 'none';

  $('fsResults').innerHTML = free.length
    ? `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Знайдено ${free.length} вчителів:</div>` +
      free.slice(0, 6).map(t => `
        <div class="avt" onclick="App.selFS(${t.id},this)">
          <div class="ava" style="background:${t.color}22;color:${t.color}">${t.last[0]}${t.first[0]}</div>
          <div style="flex:1">
            <div class="avn">${tN(t)}</div>
            <div class="avs">${t.subjects.map(s => sN(s)).join(', ')} · ${t.hours} год/тиж</div>
          </div>
          ${subjId && t.subjects.includes(subjId)
            ? '<span class="tag ts">Точний</span>'
            : '<span class="tag tw">Споріднений</span>'}
        </div>`).join('')
    : '<div style="text-align:center;padding:16px;color:var(--err)"><i class="fa-solid fa-circle-xmark" style="font-size:22px;display:block;margin-bottom:6px"></i>Вільних не знайдено</div>';
}

export function selFS(id, el) {
  foundSubId = id;
  document.querySelectorAll('#fsResults .avt').forEach(a => a.classList.remove('sel'));
  el.classList.add('sel');
  const fc = $('fsConfirm'); if (fc) fc.style.display = '';
}

export function confirmFoundSub() {
  if (!foundSubId) return;
  const t = tById(foundSubId);
  SUBLOG.push({
    date:     new Date().toISOString().split('T')[0],
    absentId: +($('fsTeacher')?.value || 0),
    subId:    foundSubId,
    subjId:   +($('fsSubj')?.value    || 0),
    classId:  CLASSES[0]?.id || 1,
    lesson:   +($('fsLesson')?.value  || 1),
    status:   'confirmed',
  });
  autosave();
  closeM('findSub');

  // re-render subs page if visible
  if ($('page-subs')?.classList.contains('active')) renderSubsPage();
  toast(`${t ? tN(t) : '—'} призначений замінником`, 'ok');
}

// ── SAVE ABSENCE ──
export function saveAbsence() {
  const tid  = +($('abTeacher')?.value || 0);
  const from = $('abFrom')?.value;
  const to   = $('abTo')?.value;
  if (!tid || !from || !to) return toast('Заповніть всі поля', 'err');

  const t = tById(tid); if (!t) return;
  t.absent = true;
  ABSENCES.push({ teacherId: tid, from, to, reason: $('abReason')?.value || '', note: $('abNote')?.value || '' });

  autosave();
  closeM('addAbsence');
  renderSubsPage();
  toast(`Відсутність ${tN(t)} збережено`, 'ok');
}

// ── SIDEBAR SUB SEARCH ──
export function runSubSearch() {
  const day    = +($('srDay')?.value    || 0);
  const slot   = +($('srLesson')?.value || 1) - 1;
  const subjId = +($('srSubj')?.value   || 0);

  const busy = getDay(SCHED, day).filter(e => e.slot === slot).map(e => e.teacherId);
  const free = TEACHERS.filter(t => !busy.includes(t.id) && !t.absent && (!subjId || t.subjects.includes(subjId))).slice(0, 5);

  const sr = $('srRes'); if (!sr) return;
  sr.innerHTML = free.length
    ? free.map(t => `
        <div class="avt">
          <div class="ava" style="background:${t.color}22;color:${t.color}">${t.last[0]}${t.first[0]}</div>
          <div style="flex:1">
            <div class="avn">${tN(t)}</div>
            <div class="avs">${t.subjects.map(s => sN(s)).join(', ')}</div>
          </div>
          <button class="bp" style="font-size:10px;padding:3px 8px;flex-shrink:0"
            onclick="App.toast('${t.last} призначений','ok')">Призн.</button>
        </div>`).join('')
    : '<div style="font-size:12px;color:var(--muted);text-align:center;padding:10px">Вільних не знайдено</div>';
}

// ── PRINT ORDER MODAL ──
export function showPrintOrder() {
  $('detTitle').textContent = 'Наказ про заміни';
  $('detBody').innerHTML = `
    <div style="font-size:12.5px;line-height:1.9">
      <div style="text-align:center;margin-bottom:14px">
        <b style="font-size:14px">НАКАЗ №___</b><br>
        про заміни уроків<br>від ${new Date().toLocaleDateString('uk-UA')}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px">
        <thead>
          <tr style="background:var(--bg)">
            <th style="padding:6px;border:1px solid var(--border)">№</th>
            <th style="padding:6px;border:1px solid var(--border)">Відсутній</th>
            <th style="padding:6px;border:1px solid var(--border)">Замінює</th>
            <th style="padding:6px;border:1px solid var(--border)">Предмет</th>
            <th style="padding:6px;border:1px solid var(--border)">Клас</th>
            <th style="padding:6px;border:1px solid var(--border)">Урок</th>
          </tr>
        </thead>
        <tbody>
          ${SUBLOG.map((r, i) => {
            const ab   = tById(r.absentId);
            const sub  = tById(r.subId);
            const subj = sById(r.subjId);
            const cls  = cById(r.classId);
            return `
              <tr>
                <td style="padding:5px;border:1px solid var(--border);text-align:center">${i+1}</td>
                <td style="padding:5px;border:1px solid var(--border)">${ab  ? tN(ab)     : '—'}</td>
                <td style="padding:5px;border:1px solid var(--border)">${sub ? tN(sub)    : '—'}</td>
                <td style="padding:5px;border:1px solid var(--border)">${subj ? subj.name : '—'}</td>
                <td style="padding:5px;border:1px solid var(--border)">${cN(cls)}</td>
                <td style="padding:5px;border:1px solid var(--border);text-align:center">${r.lesson}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top:20px;display:flex;justify-content:space-between">
        <div>Директор: ___________________</div>
        <div>Заступник: ___________________</div>
      </div>
    </div>`;
  $('detFoot').innerHTML = `
    <button class="bs" onclick="App.closeM('detail')">Закрити</button>
    <button class="bp" onclick="window.print()"><i class="fa-solid fa-print"></i>Друкувати</button>`;
  openM('detail');
}
