/** app.js — BAON single-page app: routing, views, events. MIT */

import * as calc from './budget.js';
import * as db from './db.js';

const view = document.getElementById('view');
const toastEl = document.getElementById('toast');

/* ---------- state: the data the screens show ---------- */

const DEFAULT_BUDGET = {
  amount: 1000, period: 'weekly', startDate: calc.toISODate(new Date()),
};

const state = { budget: DEFAULT_BUDGET, expenses: [] };

async function loadState() {
  state.budget = await db.getSetting('budget', DEFAULT_BUDGET);
}

/* ---------- helpers ---------- */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ESC[ch]);

function toast(msg, action) {
  toastEl.innerHTML = `<span>${esc(msg)}</span>`;
  if (action) {
    const b = document.createElement('button');
    b.textContent = action.label;
    b.onclick = action.run;
    toastEl.append(b);
  }
  toastEl.hidden = false;
  clearTimeout(toast.timer);
  const hide = () => { toastEl.hidden = true; };
  if (!action) toast.timer = setTimeout(hide, 2500);
}

/* ---------- views ---------- */

function renderHome() {
  view.innerHTML = `<section class="card"><h2>Home</h2>
    <p class="muted">Your remaining baon will show here.</p></section>`;
}

function renderAdd() {
  const today = calc.toISODate(new Date());
  const cat = (c, i) => `
<input type="radio" name="category" id="c-${c.id}"
value="${c.id}" ${i === 0 ? 'checked' : ''}>
<label for="c-${c.id}">${c.emoji}<br>${c.label}</label>`;

  view.innerHTML = `
<section class="card">
<h2>Add expense</h2>
<form id="addForm" novalidate>
<label>Amount (₱)
<input class="amount-input" name="amount" type="number"
inputmode="decimal" step="0.01" placeholder="0.00">
</label>
<fieldset><legend>Category</legend>
<div class="cats">${calc.CATEGORIES.map(cat).join('')}</div>
</fieldset>
<label>Note
<input name="note" maxlength="60"
placeholder="e.g. Lunch sa canteen"></label>
<label>Date
<input name="date" type="date"
value="${today}" max="${today}"></label>
<ul class="errors" id="errors"></ul>
<button class="btn lime" type="submit">Save expense</button>
</form>
</section>`;
  document.getElementById('addForm').onsubmit = saveExpense;
}

async function saveExpense(ev) {
  ev.preventDefault();
  const data = Object.fromEntries(new FormData(ev.target));
  const errors = calc.validateExpense(data);
  document.getElementById('errors').innerHTML =
    errors.map((e) => `<li>${esc(e)}</li>`).join('');
  if (errors.length) return; // stay on the form
  await db.addExpense({ ...data, amount: Number(data.amount) });
  await loadState();
  toast('Saved! 💸');
  location.hash = '#/home';
}

function renderHistory() {
  view.innerHTML = `<section class="card"><h2>History</h2>
    <p class="muted">Your expenses will be listed here.</p></section>`;
}

function renderSettings() {
  const b = state.budget;
  const opt = (p) =>
    `<option ${p === b.period ? 'selected' : ''}>${p}</option>`;

  view.innerHTML = `
    <section class="card">
      <h2>My baon</h2>
      <form id="budgetForm">
        <label>Allowance amount (₱)
          <input name="amount" type="number" min="1" step="0.01"
                 value="${b.amount}" required></label>
        <label>Every
          <select name="period">
            ${['daily', 'weekly', 'monthly'].map(opt).join('')}
          </select></label>
        <label>Starting
          <input name="startDate" type="date"
                 value="${b.startDate}" required></label>
        <button class="btn lime">Save budget</button>
      </form>
    </section>`;

  document.getElementById('budgetForm').onsubmit = saveBudget;
}

async function saveBudget(ev) {
  ev.preventDefault();
  const d = Object.fromEntries(new FormData(ev.target));
  state.budget = {
    amount: Number(d.amount), period: d.period, startDate: d.startDate,
  };
  await db.setSetting('budget', state.budget);
  toast('Budget saved ✅');
}

/* ---------- router ---------- */

const routes = {
  home: renderHome, add: renderAdd,
  history: renderHistory, settings: renderSettings,
};

async function router() {
  const name = location.hash.replace('#/', '') || 'home';
  const render = routes[name] ?? renderHome;
  document.querySelectorAll('.tabbar a').forEach((a) =>
    a.classList.toggle('active', a.dataset.route === name));
  await render();
  window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
}

/* ---------- start ---------- */

window.addEventListener('hashchange', router);
await loadState();
router();