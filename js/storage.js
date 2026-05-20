/*
Purpose: localStorage abstraction layer — generic get/set/remove + auto-save scheduler
Inputs:  key (string), value (any serializable)
Outputs: Persisted data across page reloads
Dependencies: none (standalone, no imports)
*/

const PREFIX = 'sg_';

export const Storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch(e) {
      console.warn(`[Storage] get(${key}) failed:`, e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch(e) {
      console.warn(`[Storage] set(${key}) failed:`, e);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },

  has(key) {
    return localStorage.getItem(PREFIX + key) !== null;
  },

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },

  keys() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .map(k => k.slice(PREFIX.length));
  },
};

// ── Debounced auto-save (prevents flooding on drag-drop) ──
let _saveTimer = null;
export function scheduleSave(saveFn, ms = 800) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    saveFn();
  }, ms);
}
