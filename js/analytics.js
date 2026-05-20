/*
Purpose: Analytics page — teacher workload bars, subject distribution, heatmap matrix,
         substitution log table
Inputs:  TEACHERS, SUBJECTS, DEPTS, SCHED, SUBLOG from data.js
Outputs: Renders #aLoad, #aSubj, #heatmap, #subLogTable; updates stats counters
Dependencies: data.js, utils.js
*/

import { TEACHERS, SUBJECTS, DEPTS, SCHED, SUBLOG, DAYS } from './data.js';
import { $, tN, sN, tById, getDay } from './utils.js';

// ── BAR CHART HELPER ──
function barChart(elId, items, maxV, colorFn) {
  const el = $(elId);
  if (!el || !items.length) return;
  el.innerHTML = items.map(([label, val]) => `
    <div class="brow">
      <span class="bl" title="${label}">${label}</span>
      <div class="bfw">
        <div class="bf" style="width:${Math.round(val / maxV * 100)}%;background:${colorFn(val)}"></div>
      </div>
      <span class="bv" style="color:${colorFn(val)}">${val}</span>
    </div>`).join('');
}

// ── RENDER ANALYTICS PAGE ──
export function renderAnalytics() {
  _renderStats();
  _renderLoadChart();
  _renderSubjectChart();
  _renderHeatmap();
  _renderSubLog();
}

function _renderStats() {
  const total = TEACHERS.reduce((a, t) => a + t.hours, 0);
  const avg   = (total / TEACHERS.length).toFixed(1);
  const over  = TEACHERS.filter(t => t.hours > 24).length;
  const under = TEACHERS.filter(t => t.hours < 10).length;

  [$('aTH'), $('aAH'), $('aOv'), $('aUn')].forEach((el, i) => {
    if (el) el.textContent = [total, avg, over, under][i];
  });
}

function _renderLoadChart() {
  const sorted = [...TEACHERS].sort((a, b) => b.hours - a.hours).slice(0, 16);
  barChart(
    'aLoad',
    sorted.map(t => [t.last + ' ' + t.first[0] + '.', t.hours]),
    40,
    v => v > 24 ? 'var(--err)' : v < 10 ? 'var(--warn)' : 'var(--acc)'
  );
}

function _renderSubjectChart() {
  const sc = {};
  TEACHERS.forEach(t => t.subjects.forEach(s => sc[s] = (sc[s] || 0) + 1));
  const se = Object.entries(sc).sort((a, b) => b[1] - a[1]).slice(0, 10);
  barChart(
    'aSubj',
    se.map(([sid, cnt]) => [sN(+sid), cnt]),
    se[0]?.[1] || 1,
    () => 'var(--pur)'
  );
}

function _renderHeatmap() {
  const el = $('heatmap');
  if (!el) return;

  const slice = TEACHERS.slice(0, 16);
  let h = `
    <table style="border-collapse:collapse;font-size:10.5px">
      <thead><tr>
        <th style="min-width:80px;text-align:left;padding:3px 5px;background:var(--bg);border:1px solid var(--border)">Вчитель</th>
        ${DAYS.map(d => `<th style="text-align:center;padding:3px 5px;background:var(--bg);border:1px solid var(--border);min-width:38px">${d.slice(0,2)}</th>`).join('')}
        <th style="padding:3px 5px;background:var(--bg);border:1px solid var(--border)">Σ</th>
      </tr></thead>
      <tbody>`;

  slice.forEach(t => {
    const dl  = DAYS.map((_, d) => getDay(SCHED, d).filter(e => e.teacherId === t.id).length);
    const tot = dl.reduce((a, b) => a + b, 0);
    h += `<tr>
      <td style="padding:3px 5px;border:1px solid var(--border);font-weight:500;white-space:nowrap">${t.last}</td>
      ${dl.map(v => {
        const bg  = v === 0 ? '' : v <= 2 ? '#dbeafe' : v <= 4 ? '#3b82f6' : '#1d4ed8';
        const col = v > 2 ? '#fff' : '';
        return `<td style="padding:3px 5px;border:1px solid var(--border);text-align:center;background:${bg};color:${col};font-weight:${v ? 600 : 400}">${v || ''}</td>`;
      }).join('')}
      <td style="padding:3px 5px;border:1px solid var(--border);text-align:center;font-weight:700;color:var(--acc)">${tot}</td>
    </tr>`;
  });

  el.innerHTML = h + '</tbody></table>';
}

function _renderSubLog() {
  const el = $('subLogTable');
  if (!el) return;
  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:var(--bg)">
          <th style="padding:6px;border-bottom:2px solid var(--border);text-align:left">Дата</th>
          <th style="padding:6px;border-bottom:2px solid var(--border);text-align:left">Відсутній</th>
          <th style="padding:6px;border-bottom:2px solid var(--border);text-align:left">Замінює</th>
          <th style="padding:6px;border-bottom:2px solid var(--border);text-align:left">Статус</th>
        </tr>
      </thead>
      <tbody>
        ${SUBLOG.map(r => `
          <tr style="border-bottom:1px solid var(--border)">
            <td style="padding:5px">${r.date}</td>
            <td style="padding:5px;font-weight:500">${tById(r.absentId)?.last || '—'}</td>
            <td style="padding:5px">${tById(r.subId)?.last || '—'}</td>
            <td style="padding:5px">
              <span class="tag ${r.status === 'confirmed' ? 'ts' : 'tw'}">
                ${r.status === 'confirmed' ? 'Підтверджено' : 'Очікує'}
              </span>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}
