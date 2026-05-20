/*
Purpose: Conflict detection and resolution — renders conflict list, mini calendar,
         recommendations, and triggers auto-fix via generator
Inputs:  SCHED, TEACHERS, CLASSES, CURRICULUM from data.js; runChecks() from generator.js
Outputs: Renders #cfList, #cfRec, #mcal; updates conflict badge
Dependencies: data.js, utils.js, generator.js
*/

import { SCHED, TEACHERS, CLASSES, DAYS } from './data.js';
import { $, toast, tN, cN, sN, tById, cById } from './utils.js';
import { runChecks } from './generator.js';

let cfFixed = 0;

// ── RENDER CONFLICTS PAGE ──
export function renderConflicts() {
  const checks = runChecks();
  const crit   = checks.filter(c => c.t === 'c');
  const warn   = checks.filter(c => c.t === 'w');
  const info   = checks.filter(c => c.t === 'i');

  const cc = $('cfCrit'), cw = $('cfWarn'), ci = $('cfInfo'), cf = $('cfFixed');
  if (cc) cc.textContent = crit.length;
  if (cw) cw.textContent = warn.length;
  if (ci) ci.textContent = info.length;
  if (cf) cf.textContent = cfFixed;

  const el = $('cfList');
  if (!el) return;

  if (!checks.length) {
    el.innerHTML = '<div class="empty"><i class="fa-solid fa-circle-check" style="color:var(--ok)"></i>Конфліктів не виявлено!</div>';
    return;
  }

  el.innerHTML = checks.map((c, i) => `
    <div id="cf${i}" class="cfi ${c.t === 'c' ? 'cfi-c' : c.t === 'w' ? 'cfi-w' : 'cfi-i'}">
      <i class="fa-solid ${c.t === 'c' ? 'fa-triangle-exclamation' : c.t === 'w' ? 'fa-clock' : 'fa-circle-info'}"
         style="color:${c.t === 'c' ? 'var(--err)' : c.t === 'w' ? 'var(--warn)' : 'var(--acc)'};font-size:14px;margin-top:2px;flex-shrink:0"></i>
      <div style="flex:1;font-size:12.5px">${c.msg}</div>
      <span class="tag ${c.t === 'c' ? 'td' : c.t === 'w' ? 'tw' : 'ti'}" style="flex-shrink:0">
        ${c.t === 'c' ? 'Критично' : c.t === 'w' ? 'Попередження' : 'Інфо'}
      </span>
      <button class="bs" style="font-size:11px;padding:2px 7px;flex-shrink:0" onclick="App.fixCf(${i})">
        Вирішити
      </button>
    </div>`).join('');

  // Recommendations
  const cr = $('cfRec');
  if (cr) cr.innerHTML = checks.slice(0, 3)
    .map(c => `<p style="margin-bottom:7px">💡 ${c.msg.replace(/^[⚠❌ℹ✅]\s*/,'')}</p>`)
    .join('');
}

// ── MARK CONFLICT AS FIXED ──
export function fixCf(i) {
  const el = $('cf' + i);
  if (!el) return;
  el.style.opacity      = '.35';
  el.style.pointerEvents = 'none';
  el.querySelector('button').textContent = '✓ Вирішено';
  cfFixed++;
  const cf = $('cfFixed'); if (cf) cf.textContent = cfFixed;
  toast('Конфлікт вирішено', 'ok');
}

// ── AUTO FIX (re-generate) ──
export async function autoFixConflicts() {
  toast('Запускаємо повторну генерацію...', 'acc');
  // imported lazily to avoid circular dep
  const { startGeneration } = await import('./generator.js');
  await startGeneration();
  renderConflicts();
}

// ── MINI CALENDAR (May 2025) ──
export function renderMCal() {
  const el = $('mcal');
  if (!el) return;
  const dh = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];
  let h = dh.map(d => `<div class="mch">${d}</div>`).join('');
  // May 1 2025 = Thursday → offset 3 from Monday
  for (let i = 0; i < 3; i++) h += '<div></div>';
  const ev = [3, 7, 8, 13, 14, 15, 20, 21];
  for (let d = 1; d <= 31; d++) {
    const isT  = d === 13;
    const hasE = ev.includes(d);
    h += `<div class="mcd${isT ? ' tod' : hasE ? ' hev' : ''}">${d}</div>`;
  }
  el.innerHTML = h;
}

// ── GET CRITICAL COUNT (for badge) ──
export function getCriticalCount() {
  return runChecks().filter(c => c.t === 'c').length;
}
