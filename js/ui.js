/*
Purpose: UI orchestration — navigation, topbar, sidebar, dark mode, bells,
         modal open/close, tooltips, keyboard shortcuts
Inputs:  Called from app.js on init; nav() called throughout the app
Outputs: Page transitions, DOM mutations for nav state
Dependencies: utils.js, data.js
*/

import { $, toast, showTip, hideTip } from './utils.js';
import { BELLS, DAYS, SETTINGS } from './data.js';

// ── NAV CONFIG ──
export const NAV_ITEMS = [
  { id:'dashboard',   icon:'fa-table-columns',      label:'Дашборд' },
  { id:'schedule',    icon:'fa-calendar-week',       label:'Розклад' },
  { id:'subs',        icon:'fa-arrows-rotate',        label:'Заміни',      badge: 3 },
  { id:'generator',   icon:'fa-wand-magic-sparkles',  label:'Генератор' },
  { id:'teachers',    icon:'fa-chalkboard-user',      label:'Вчителі' },
  { id:'departments', icon:'fa-building-columns',     label:'Кафедри' },
  { id:'parallels',   icon:'fa-layer-group',          label:'Паралелі' },
  { id:'classgroups', icon:'fa-object-group',         label:'Класи/групи' },
  { id:'rooms',       icon:'fa-door-closed',          label:'Кабінети' },
  { id:'analytics',   icon:'fa-chart-line',           label:'Аналітика' },
  { id:'conflicts',   icon:'fa-circle-exclamation',   label:'Конфлікти', badge: 0 },
  { id:'settings',    icon:'fa-sliders',              label:'Налаштування' },
];

// ── PAGE HANDLERS (set externally by app.js) ──
const pageHandlers = {};
export function registerPage(id, fn) {
  pageHandlers[id] = fn;
}

// ── NAVIGATION ──
export function nav(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nb, .snb, .bnb').forEach(b => b.classList.remove('active'));

  const pg = $('page-' + name);
  if (pg) pg.classList.add('active');

  [$('nb-' + name), $('snb-' + name)].forEach(b => { if (b) b.classList.add('active'); });
  document.querySelectorAll('.bnb').forEach(b => {
    if ((b.getAttribute('onclick') || '').includes(`'${name}'`)) b.classList.add('active');
  });

  closeNotif();
  if (pageHandlers[name]) pageHandlers[name]();
}

// ── BUILD NAV ──
export function buildNav() {
  const mn = $('mainNav'), sn = $('sideNav');
  if (!mn || !sn) return;
  mn.innerHTML = '';
  sn.innerHTML = '';
  NAV_ITEMS.forEach(item => {
    const badge = item.badge !== undefined ? `<span class="badge">${item.badge}</span>` : '';
    mn.innerHTML += `<button class="nb" onclick="App.nav('${item.id}')" id="nb-${item.id}"><i class="fa-solid ${item.icon}"></i>${item.label}${badge}</button>`;
    sn.innerHTML += `<button class="snb" onclick="App.nav('${item.id}');App.closeSidebar()" id="snb-${item.id}"><i class="fa-solid ${item.icon}"></i>${item.label}${badge}</button>`;
  });
}

// ── SIDEBAR ──
export function openSidebar() {
  $('sidebar')?.classList.add('open');
  $('sovl')?.classList.add('open');
}
export function closeSidebar() {
  $('sidebar')?.classList.remove('open');
  $('sovl')?.classList.remove('open');
}

// ── NOTIF PANEL ──
export function toggleNotif() {
  const p = $('npnl');
  if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
}
export function closeNotif() {
  const p = $('npnl');
  if (p) p.style.display = 'none';
}

// ── DARK MODE ──
let darkMode = false;
export function toggleDark() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark', darkMode);
  const i = $('darkIcon');
  if (i) i.className = 'fa-solid fa-' + (darkMode ? 'sun' : 'moon');
}

// ── MODALS ──
export function openM(id) {
  const m = $('m-' + id);
  if (m) m.classList.add('open');
}
export function closeM(id) {
  const m = $('m-' + id);
  if (m) m.classList.remove('open');
}
export function initModalDismiss() {
  document.querySelectorAll('.movl').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.remove('open');
    });
  });
}

// ── BELLS ──
export function renderBells() {
  const el = $('bellList');
  if (!el) return;
  el.innerHTML = BELLS.map(b => `
    <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
      <div style="width:20px;height:20px;border-radius:50%;background:var(--accl);color:var(--acc);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${b.n}</div>
      <div style="flex:1;font-size:12px;font-weight:500">${b.s}–${b.e}</div>
      <span style="font-size:10.5px;color:var(--muted)">45 хв</span>
    </div>`).join('');
}

export function renderBellSet() {
  const el = $('bellSet');
  if (!el) return;
  el.innerHTML = BELLS.map(b => `
    <div class="fr" style="margin-bottom:8px">
      <div class="fg" style="margin-bottom:0"><label class="fl">${b.n}-й урок</label><input class="fi" type="time" value="${b.s}"></div>
      <div class="fg" style="margin-bottom:0"><label class="fl">Кінець</label><input class="fi" type="time" value="${b.e}"></div>
    </div>`).join('');
}

// ── DASHBOARD DATE ──
export function renderDashDate() {
  const el = $('dashDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) + ' · ' + SETTINGS.schoolName;
}

// ── KEYBOARD SHORTCUTS ──
export function initKeyboard(getCurDay, setCurDay, renderMain) {
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;

    if (e.key === 'Escape') {
      document.querySelectorAll('.movl.open').forEach(m => m.classList.remove('open'));
    }

    if (e.ctrlKey || e.metaKey) {
      const map = { '1':'dashboard','2':'schedule','3':'subs','4':'generator','5':'teachers' };
      if (map[e.key]) { e.preventDefault(); nav(map[e.key]); }
      if (e.key === 'f') { e.preventDefault(); openM('findSub'); }
    }

    // Arrow keys switch days on schedule page
    const sp = $('page-schedule');
    const tvw = $('tvw');
    if (sp && sp.classList.contains('active') && tvw && tvw.style.display !== 'none') {
      if (e.key === 'ArrowRight' && getCurDay() < 5) {
        const d = getCurDay() + 1;
        setCurDay(d);
        const tabs = document.querySelectorAll('#dayTabs .ti2');
        tabs.forEach(b => b.classList.remove('active'));
        if (tabs[d]) tabs[d].classList.add('active');
        renderMain(d);
      }
      if (e.key === 'ArrowLeft' && getCurDay() > 0) {
        const d = getCurDay() - 1;
        setCurDay(d);
        const tabs = document.querySelectorAll('#dayTabs .ti2');
        tabs.forEach(b => b.classList.remove('active'));
        if (tabs[d]) tabs[d].classList.add('active');
        renderMain(d);
      }
    }
  });
}

// ── CLOSE NOTIF ON OUTSIDE CLICK ──
export function initNotifDismiss() {
  document.addEventListener('click', e => {
    if (!e.target.closest('#npnl') && !e.target.closest('[onclick*="toggleNotif"]')) {
      closeNotif();
    }
  });
}

// ── UPDATE CONFLICT BADGE ──
export function updateConflictBadge(critCount) {
  document.querySelectorAll('.nb, .snb').forEach(b => {
    if (b.textContent.includes('Конфлікти')) {
      const bg = b.querySelector('.badge');
      if (bg) bg.textContent = critCount;
    }
  });
}
