// БезПерсон — невеликі покращення взаємодії

// 1) Поточний рік у підвалі
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// 2) Мобільне меню (бургер)
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Закривати меню після кліку по пункту (на мобільному)
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// 3) Плавна поява секцій під час прокрутки
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.section').forEach((el) => {
  el.classList.add('reveal');
  observer.observe(el);
});

// 4) Дихальна вправа (коробкове дихання 4-4-4-4, цикл = 16 с)
(function () {
  const circle = document.getElementById('breatheCircle');
  const phase = document.getElementById('breathePhase');
  const btn = document.getElementById('breatheBtn');
  if (!circle || !phase || !btn) return;

  // 4 фази по 4 секунди, синхронно з @keyframes breathe
  const phases = [
    { label: 'Вдих…', duration: 4000 },
    { label: 'Затримка', duration: 4000 },
    { label: 'Видих…', duration: 4000 },
    { label: 'Пауза', duration: 4000 },
  ];

  let running = false;
  let idx = 0;
  let timer = null;

  function step() {
    phase.textContent = phases[idx].label;
    timer = setTimeout(() => {
      idx = (idx + 1) % phases.length;
      step();
    }, phases[idx].duration);
  }

  function start() {
    running = true;
    idx = 0;
    circle.classList.add('is-breathing');
    btn.textContent = 'Зупинити';
    btn.setAttribute('aria-pressed', 'true');
    step();
  }

  function stop() {
    running = false;
    clearTimeout(timer);
    circle.classList.remove('is-breathing');
    phase.textContent = 'Гарна робота 🤍';
    btn.textContent = 'Почати';
    btn.setAttribute('aria-pressed', 'false');
  }

  btn.addEventListener('click', () => (running ? stop() : start()));
})();

// 5) Надсилання форм без переходу на нову сторінку (Google Форми у фоні)
function showFormStatus(form, message, ok) {
  let el = form.querySelector('.form-status');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form-status';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    form.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove('is-ok', 'is-error');
  el.classList.add(ok ? 'is-ok' : 'is-error');
}

document.querySelectorAll('.contact-form, .ask-form').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    const action = form.getAttribute('action') || '';
    // Обробляємо лише Google Форми; інше лишаємо на стандартну поведінку
    if (!action.includes('docs.google.com')) return;

    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Надсилаємо…'; }

    try {
      // Google Форми не віддають відповідь у браузер (CORS), тому mode:'no-cors':
      // запит проходить, але прочитати результат не можна — показуємо успіх оптимістично.
      await fetch(action, {
        method: 'POST',
        mode: 'no-cors',
        body: new FormData(form),
      });
      const okMsg = form.classList.contains('ask-form')
        ? 'Дякуємо за ваше запитання 🤍 Ми дбайливо розберемо його на одній із найближчих зустрічей.'
        : 'Дякую, що наважилися написати 💛 Я прочитаю ваше повідомлення й відповім якомога швидше.';
      showFormStatus(form, okMsg, true);
      form.reset();
    } catch (err) {
      showFormStatus(form, '⚠️ Немає зʼєднання. Спробуйте, будь ласка, трохи пізніше.', false);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
  });
});

// 6) Автоматичний розклад зустрічей із Google Таблиці (CSV)
(function () {
  const grid = document.getElementById('scheduleGrid');
  if (!grid) return;
  const src = grid.getAttribute('data-src');
  if (!src) return;

  const DAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const MONTHS = ['січ.', 'лют.', 'бер.', 'квіт.', 'трав.', 'черв.',
                  'лип.', 'серп.', 'вер.', 'жовт.', 'лист.', 'груд.'];
  const MAX = 6;
  const DURATION_MIN = 40; // Тривалість зустрічі у хвилинах

  function parseCSV(text) {
    const rows = [];
    let field = '', row = [], inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function showEmpty(msg) {
    grid.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'schedule-empty';
    p.textContent = msg;
    grid.appendChild(p);
  }

  function buildCard(ev, now) {
    const start = new Date(ev.дата + 'T' + (ev.час || '00:00'));
    const end = new Date(start.getTime() + DURATION_MIN * 60000);
    const isLive = now >= start && now < end;
    const isQA = (ev.формат || '').trim().toLowerCase() === 'qa';

    const card = document.createElement('article');
    card.className = 'schedule-card' + (isLive ? ' schedule-card-live' : '');

    const date = document.createElement('div');
    date.className = 'schedule-date';
    const day = document.createElement('span');
    day.className = 'schedule-day'; day.textContent = DAYS[start.getDay()];
    const num = document.createElement('span');
    num.className = 'schedule-num'; num.textContent = start.getDate();
    const mon = document.createElement('span');
    mon.className = 'schedule-month'; mon.textContent = MONTHS[start.getMonth()];
    date.append(day, num, mon);

    const info = document.createElement('div');
    info.className = 'schedule-info';
    const tag = document.createElement('span');
    tag.className = 'schedule-tag' + (isQA ? ' schedule-tag-alt' : '');
    tag.textContent = isQA ? '💬 Q&A — ваші запитання' : '🌿 Тематична зустріч';
    const h3 = document.createElement('h3');
    h3.textContent = ev.тема || (isQA ? 'Відповіді на запитання учасників' : 'Тематична зустріч');
    const meta = document.createElement('p');
    meta.className = 'schedule-meta' + (isLive ? ' schedule-meta-live' : '');

    if (isLive) {
      const minsLeft = Math.max(1, Math.ceil((end - now) / 60000));
      meta.textContent = ' Зараз триває · ще ' + minsLeft + ' хв · Zoom';
    } else {
      meta.textContent = '⏰ ' + (ev.час || '') + ' · ' + DURATION_MIN + ' хв · Zoom';
    }

    info.append(tag, h3, meta);
    card.append(date, info);

    const link = (ev.посилання || '').trim();
    if (/^https?:\/\//i.test(link)) {
      const a = document.createElement('a');
      a.className = 'btn ' + (isLive ? 'btn-primary' : 'btn-ghost');
      a.href = link; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = isLive ? 'Долучитися зараз' : 'Долучитися';
      card.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.className = 'schedule-soon';
      span.textContent = 'Посилання згодом';
      card.appendChild(span);
    }
    return card;
  }

  let allParsedEvents = [];

  function renderSchedule() {
    const now = new Date();
    const activeEvents = allParsedEvents
      .filter((o) => {
        const start = new Date(o.дата + 'T' + (o.час || '00:00'));
        const end = new Date(start.getTime() + DURATION_MIN * 60000);
        return end > now;
      })
      .sort((a, b) => new Date(a.дата + 'T' + (a.час || '00:00')) - new Date(b.дата + 'T' + (b.час || '00:00')))
      .slice(0, MAX);

    if (!activeEvents.length) {
      showEmpty('Найближчі зустрічі зʼявляться тут незабаром. Актуальний розклад — у нашій Telegram-спільноті.');
      return;
    }

    grid.innerHTML = '';
    activeEvents.forEach((ev) => grid.appendChild(buildCard(ev, now)));
  }

  fetch(src)
    .then((r) => { if (!r.ok) throw new Error('fetch'); return r.text(); })
    .then((text) => {
      const rows = parseCSV(text).filter((r) => r.some((c) => c.trim() !== ''));
      if (rows.length < 2) {
        showEmpty('Найближчі зустрічі зʼявляться тут незабаром. Актуальний розклад — у нашій Telegram-спільноті.');
        return;
      }
      const headers = rows[0].map((h) => h.trim());
      allParsedEvents = rows.slice(1)
        .map((r) => {
          const o = {};
          headers.forEach((h, i) => { o[h] = (r[i] || '').trim(); });
          return o;
        })
        .filter((o) => o.дата && !isNaN(new Date(o.дата + 'T' + (o.час || '00:00'))));

      renderSchedule();
      setInterval(renderSchedule, 60000); // Оновлення статусу та лічильника щохвилини
    })
    .catch(() => showEmpty('Не вдалося завантажити розклад. Актуальні зустрічі — у нашій Telegram-спільноті.'));
})();
// 7) Запис на консультацію: вихідні дні, зайняті слоти з Google Таблиці, запис у Google-форму
(function () {
  const root = document.getElementById('bookingWizard');
  if (!root) return;

  // ---- Налаштування розкладу (змінюйте тут) ----
  const BOOKING_RULES = {
    days: [6, 0],                                       // 6 = субота, 0 = неділя
    times: ['10:00', '11:30', '13:00', '14:30', '16:00'], // час початку за Києвом
    weeksAhead: 4,                                      // на скільки тижнів уперед показувати
    minNoticeHours: 24,                                 // не раніше ніж за N годин до початку
  };
  const TZ = 'Europe/Kyiv';
  const CONTACT_FALLBACK = 'https://t.me/bezperson';

  const METHODS = {
    Telegram:  { label: 'Telegram', placeholder: '@username', type: 'text', inputmode: 'text', autocomplete: 'off',
                 test: (v) => /^@?[A-Za-z0-9_]{4,32}$/.test(v), err: 'Вкажіть, будь ласка, Telegram у форматі @username.', done: 'у Telegram' },
    'Телефон': { label: 'Номер телефону', placeholder: '+380 XX XXX XX XX', type: 'tel', inputmode: 'tel', autocomplete: 'tel',
                 test: (v) => /^\+?[\d\s()-]+$/.test(v) && v.replace(/\D/g, '').length >= 9, err: 'Перевірте, будь ласка, номер телефону.', done: 'на вказаний номер' },
    Instagram: { label: 'Instagram', placeholder: '@username', type: 'text', inputmode: 'text', autocomplete: 'off',
                 test: (v) => /^@?[A-Za-z0-9_.]{1,30}$/.test(v), err: 'Вкажіть, будь ласка, Instagram у форматі @username.', done: 'в Instagram' },
    Email:     { label: 'Email', placeholder: 'name@example.com', type: 'email', inputmode: 'email', autocomplete: 'email',
                 test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), err: 'Перевірте, будь ласка, email.', done: 'на email' },
  };

  const DOW = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const DOW_FULL = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота'];
  const MONTHS = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
                  'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
  const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
                      'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

  const form = root.querySelector('.booking-form');
  const flow = root.querySelector('.booking-flow');
  const done = root.querySelector('.booking-done');
  const details = root.querySelector('.booking-block-details');
  const summary = root.querySelector('.booking-summary');
  const stepItems = [...root.querySelectorAll('.booking-steps li:not(.booking-step-line)')];
  const stepLines = [...root.querySelectorAll('.booking-step-line')];
  const hidden = {
    slot: form.querySelector('[data-booking="slot"]'),
    method: form.querySelector('[data-booking="method"]'),
  };
  const calGrid = root.querySelector('.booking-cal-grid');
  const calMonth = root.querySelector('.booking-cal-month');
  const calPrev = root.querySelector('[data-cal="prev"]');
  const calNext = root.querySelector('[data-cal="next"]');
  const timesBox = root.querySelector('.booking-times');
  const contactInput = form.querySelector('#bkContact');
  const contactLabel = form.querySelector('label[for="bkContact"]');
  const nameInput = form.querySelector('#bkName');
  const errorBox = form.querySelector('.booking-error');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    date: '',   // 'YYYY-MM-DD'
    time: '',   // 'HH:MM'
    method: 'Telegram',
    monthIdx: 0,
    busy: new Set(),
  };

  // ---- Дати за київським часом ----
  const pad = (n) => String(n).padStart(2, '0');
  const kyivFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  function kyivParts(d) {
    const p = {};
    kyivFmt.formatToParts(d).forEach((x) => { p[x.type] = +x.value; });
    return p;
  }
  // Момент часу (мс) для дати/часу «на годиннику» в Києві
  function kyivInstant(dateKey, time) {
    const [y, m, d] = dateKey.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const wall = Date.UTC(y, m - 1, d, hh, mm);
    let t = wall;
    for (let i = 0; i < 2; i++) {
      const p = kyivParts(new Date(t));
      const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
      t += wall - shown;
    }
    return t;
  }
  const keyOf = (y, m, d) => y + '-' + pad(m) + '-' + pad(d);
  function addDays(key, n) {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return keyOf(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  const dowOf = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
  function humanDate(key) {
    const [, m, d] = key.split('-').map(Number);
    return DOW_FULL[dowOf(key)] + ', ' + d + ' ' + MONTHS_GEN[m - 1];
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // Діапазон дат для запису
  function rangeInfo() {
    const p = kyivParts(new Date());
    const first = keyOf(p.year, p.month, p.day);
    return { first, last: addDays(first, BOOKING_RULES.weeksAhead * 7) };
  }

  function slotsFor(dateKey) {
    if (!BOOKING_RULES.days.includes(dowOf(dateKey))) return [];
    const { first, last } = rangeInfo();
    if (dateKey < first || dateKey > last) return [];
    const earliest = Date.now() + BOOKING_RULES.minNoticeHours * 3600000;
    return BOOKING_RULES.times
      .filter((t) => kyivInstant(dateKey, t) >= earliest)
      .map((t) => ({ time: t, busy: state.busy.has(dateKey + ' ' + t) }));
  }

  function monthsInRange() {
    const { first, last } = rangeInfo();
    const out = [];
    let [y, m] = first.split('-').map(Number);
    const [ly, lm] = last.split('-').map(Number);
    while (y < ly || (y === ly && m <= lm)) {
      out.push([y, m]);
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }

  // Перший місяць, у якому є хоч один слот
  function firstUsefulMonth() {
    const months = monthsInRange();
    for (let i = 0; i < months.length; i++) {
      const [y, m] = months[i];
      const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (let d = 1; d <= dim; d++) if (slotsFor(keyOf(y, m, d)).length) return i;
    }
    return 0;
  }

  // ---- Зайняті слоти з опублікованої таблиці (CSV) ----
  function normalizeSlot(cell) {
    const s = String(cell).trim();
    let r;
    if ((r = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T,]+(\d{1,2}):(\d{2})/))) return keyOf(+r[1], +r[2], +r[3]) + ' ' + pad(+r[4]) + ':' + r[5];
    if ((r = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})[ ,]+(\d{1,2}):(\d{2})/))) return keyOf(+r[3], +r[2], +r[1]) + ' ' + pad(+r[4]) + ':' + r[5];
    if ((r = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,]+(\d{1,2}):(\d{2})/))) return keyOf(+r[3], +r[1], +r[2]) + ' ' + pad(+r[4]) + ':' + r[5];
    return '';
  }

  function loadBusy() {
    const src = root.getAttribute('data-busy-src') || '';
    if (!/^https?:\/\//.test(src)) return;
    // Google кешує опубліковану таблицю — змінний параметр змушує віддати свіжу версію
    const fresh = src + (src.includes('?') ? '&' : '?') + '_=' + Date.now();
    fetch(fresh, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('fetch'); return r.text(); })
      .then((text) => {
        text.split(/\r?\n/).forEach((line) => {
          line.split(',').forEach((cell) => {
            const k = normalizeSlot(cell.replace(/"/g, ''));
            if (k) state.busy.add(k);
          });
        });
        // Якщо обраний час щойно виявився зайнятим — скидаємо вибір
        if (state.date && state.time && state.busy.has(state.date + ' ' + state.time)) state.time = '';
        renderCalendar(false);
        updateProgress();
      })
      .catch(() => { /* без таблиці показуємо всі слоти вільними */ });
  }

  // ---- Календар ----
  function renderCalendar(animate) {
    const months = monthsInRange();
    state.monthIdx = Math.min(Math.max(state.monthIdx, 0), months.length - 1);
    const [y, m] = months[state.monthIdx];
    calMonth.textContent = MONTHS[m - 1] + ' ' + y;
    calPrev.disabled = state.monthIdx === 0;
    calNext.disabled = state.monthIdx === months.length - 1;

    const today = rangeInfo().first;
    const frag = document.createDocumentFragment();
    const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const offset = (firstDow + 6) % 7; // тиждень з понеділка
    for (let i = 0; i < offset; i++) frag.appendChild(document.createElement('span'));

    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = keyOf(y, m, d);
      const slots = slotsFor(key);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking-day';
      btn.textContent = d;
      btn.dataset.key = key;
      if (key === today) btn.classList.add('is-today');
      if (slots.length) {
        const full = slots.every((s) => s.busy);
        btn.classList.add('is-open');
        if (full) btn.classList.add('is-full');
        btn.setAttribute('aria-label', humanDate(key) + (full ? ' — усе зайнято' : ''));
        if (key === state.date) { btn.classList.add('is-selected'); btn.setAttribute('aria-pressed', 'true'); }
        btn.addEventListener('click', () => selectDate(key));
      } else {
        btn.disabled = true;
        btn.tabIndex = -1;
      }
      frag.appendChild(btn);
    }
    calGrid.replaceChildren(frag);
    if (animate) {
      calGrid.classList.remove('is-swapping');
      void calGrid.offsetWidth; // перезапуск анімації
      calGrid.classList.add('is-swapping');
    }
  }

  function selectDate(key) {
    if (state.date === key) return;
    state.date = key;
    state.time = '';
    calGrid.querySelectorAll('.booking-day.is-open').forEach((b) => {
      const on = b.dataset.key === key;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderTimes();
    updateProgress();
  }

  function renderTimes() {
    const slots = state.date ? slotsFor(state.date) : [];
    timesBox.replaceChildren();
    if (!state.date || !slots.length) { state.date = ''; return; }
    const title = document.createElement('p');
    title.className = 'booking-times-title';
    title.textContent = cap(humanDate(state.date));
    const list = document.createElement('div');
    list.className = 'booking-times-list';
    slots.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'booking-time';
      b.style.setProperty('--i', i);
      b.textContent = s.time;
      if (s.busy) {
        b.disabled = true;
        b.title = 'Зайнято';
        b.setAttribute('aria-label', s.time + ' — зайнято');
      } else {
        b.setAttribute('aria-pressed', s.time === state.time ? 'true' : 'false');
        b.addEventListener('click', () => selectTime(s.time));
      }
      list.appendChild(b);
    });
    timesBox.append(title, list);
    const note = document.createElement('p');
    note.className = 'booking-tz';
    note.textContent = slots.every((s) => s.busy)
      ? 'На цей день усе зайнято — оберіть, будь ласка, інший.'
      : 'Час вказано за Києвом.';
    timesBox.appendChild(note);
  }

  function selectTime(time) {
    state.time = time;
    timesBox.querySelectorAll('.booking-time:not(:disabled)').forEach((b) => {
      b.setAttribute('aria-pressed', b.textContent === time ? 'true' : 'false');
    });
    updateProgress();
    // Форма з'являється нижче календаря — м'яко підводимо до неї
    requestAnimationFrame(() => {
      const r = details.getBoundingClientRect();
      if (r.top > window.innerHeight - 200) {
        details.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  calPrev.addEventListener('click', () => { state.monthIdx--; renderCalendar(true); });
  calNext.addEventListener('click', () => { state.monthIdx++; renderCalendar(true); });

  // ---- Прогрес: 01 Дата і час → 02 Ваші дані → 03 Готово ----
  function setStep(n) {
    stepItems.forEach((li, i) => {
      li.classList.toggle('is-active', i + 1 === n);
      li.classList.toggle('is-done', i + 1 < n);
    });
    stepLines.forEach((line, i) => line.classList.toggle('is-done', i + 1 < n));
  }

  function updateProgress() {
    const ready = !!(state.date && state.time);
    const wasHidden = details.hidden;
    details.hidden = !ready;
    setStep(ready ? 2 : 1);
    if (!ready) return;
    summary.replaceChildren(cap(humanDate(state.date)) + ', ' + state.time);
    const small = document.createElement('small');
    small.textContent = 'Онлайн-консультація · 50 хв · за київським часом';
    summary.appendChild(small);
    // Плавна поява форми або оновлення обраного часу
    const el = wasHidden ? details : summary;
    const cls = wasHidden ? 'is-revealing' : 'is-updated';
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // ---- Спосіб зв'язку ----
  function setMethod(name) {
    state.method = name;
    const m = METHODS[name];
    root.querySelectorAll('.booking-method').forEach((b) => {
      const on = b.dataset.method === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    contactLabel.textContent = m.label;
    contactInput.placeholder = m.placeholder;
    contactInput.type = m.type;
    contactInput.inputMode = m.inputmode;
    contactInput.autocomplete = m.autocomplete;
    contactInput.classList.remove('is-invalid');
  }
  root.querySelectorAll('.booking-method').forEach((b) => b.addEventListener('click', () => { setMethod(b.dataset.method); contactInput.focus(); }));

  function showError(...parts) {
    errorBox.replaceChildren(...parts);
    errorBox.hidden = !parts.length;
  }
  [nameInput, contactInput].forEach((el) => el.addEventListener('input', () => { el.classList.remove('is-invalid'); showError(); }));

  // ---- Надсилання ----
  function isConfigured() {
    const action = form.getAttribute('action') || '';
    if (!action.includes('docs.google.com') || action.includes('YOUR_')) return false;
    return ![...form.querySelectorAll('[name^="entry."]')].some((el) => /_ID$/.test(el.name));
  }

  function showDone() {
    root.querySelector('.booking-done-when').textContent = cap(humanDate(state.date)) + ', ' + state.time;
    root.querySelector('[data-done-method]').textContent = METHODS[state.method].done;
    setStep(3);
    const swap = () => {
      flow.hidden = true;
      root.classList.add('is-complete');
      done.hidden = false;
      const top = root.getBoundingClientRect().top;
      if (top < 0) root.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };
    if (reduceMotion) return swap();
    flow.classList.add('is-leaving');
    setTimeout(swap, 380);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(state.date && state.time)) return;

    const name = nameInput.value.trim();
    const contact = contactInput.value.trim();
    const m = METHODS[state.method];
    if (!name) { nameInput.classList.add('is-invalid'); showError("Вкажіть, будь ласка, як до вас звертатися."); nameInput.focus(); return; }
    if (!m.test(contact)) { contactInput.classList.add('is-invalid'); showError(m.err); contactInput.focus(); return; }

    if (!isConfigured()) {
      const a = document.createElement('a');
      a.href = CONTACT_FALLBACK; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'у Telegram';
      showError('Онлайн-запис зараз налаштовується. Напишіть мені, будь ласка, ', a, ' — і ми домовимося про час.');
      return;
    }

    hidden.slot.value = state.date + ' ' + state.time + ' (' + DOW[dowOf(state.date)] + ')';
    hidden.method.value = state.method;

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true; btn.textContent = 'Надсилаємо…';
    showError();
    try {
      // Google Форми не віддають відповідь (CORS) — показуємо успіх оптимістично
      await fetch(form.getAttribute('action'), { method: 'POST', mode: 'no-cors', body: new FormData(form) });
      state.busy.add(state.date + ' ' + state.time);
      showDone();
    } catch (err) {
      showError('⚠️ Немає зʼєднання. Спробуйте, будь ласка, ще раз трохи пізніше.');
    } finally {
      btn.disabled = false; btn.textContent = originalText;
    }
  });

  setMethod('Telegram');
  state.monthIdx = firstUsefulMonth();
  renderCalendar(false);
  renderTimes();
  updateProgress();
  loadBusy();
})();

// 8) Сертифікати: перегляд на весь екран зі стрілками
(function () {
  const viewer = document.querySelector('.cert-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return; // без підтримки — звичайні посилання
  const items = [...document.querySelectorAll('.cert-item')];
  const img = viewer.querySelector('img');
  const cap = viewer.querySelector('figcaption');
  const navs = viewer.querySelectorAll('.cert-viewer-nav');
  let idx = 0;

  function show(i, animate) {
    idx = (i + items.length) % items.length;
    const item = items[idx];
    const thumb = item.querySelector('img');
    img.src = item.querySelector('.cert-frame').getAttribute('href');
    img.alt = thumb.alt;
    cap.textContent = [...item.querySelectorAll('.cert-title, .cert-org')].map((el) => el.textContent).join(' — ');
    if (animate) { img.classList.remove('is-swapping'); void img.offsetWidth; img.classList.add('is-swapping'); }
  }

  items.forEach((item, i) => {
    item.querySelector('.cert-frame').addEventListener('click', (e) => {
      e.preventDefault();
      show(i, false);
      navs.forEach((b) => { b.hidden = items.length < 2; });
      viewer.showModal();
      document.body.style.overflow = 'hidden';
    });
  });

  navs.forEach((b) => b.addEventListener('click', () => show(idx + Number(b.dataset.dir), true)));
  viewer.querySelector('.cert-viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    document.body.style.overflow = '';
    // Після перегляду карусель показує останній відкритий документ
    const track = document.querySelector('.cert-track');
    if (track) track.scrollTo({ left: items[idx].offsetLeft - items[0].offsetLeft, behavior: 'auto' });
  });
  // Клік поза документом закриває перегляд
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(idx + 1, true);
    if (e.key === 'ArrowLeft') show(idx - 1, true);
  });
  // Свайп на телефоні
  let x0 = null;
  viewer.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), true);
    x0 = null;
  });
})();

// 9) Карусель сертифікатів: стрілки, крапки, клавіатура
(function () {
  const carousel = document.querySelector('.cert-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.cert-track');
  const items = [...track.querySelectorAll('.cert-item')];
  const dotsBox = carousel.querySelector('.cert-dots');
  const prev = carousel.querySelector('.cert-arrow[data-dir="-1"]');
  const next = carousel.querySelector('.cert-arrow[data-dir="1"]');
  let stops = [];

  // Позиції, на яких може зупинитися стрічка (останні слайди можуть уміщатися разом)
  function computeStops() {
    const max = track.scrollWidth - track.clientWidth;
    const base = items[0].offsetLeft;
    stops = [];
    items.forEach((it) => {
      const x = Math.min(it.offsetLeft - base, max);
      if (!stops.length || x - stops[stops.length - 1] > 4) stops.push(x);
    });
    dotsBox.replaceChildren();
    stops.forEach((x, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'cert-dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Документ ' + (i + 1) + ' з ' + stops.length);
      d.addEventListener('click', () => goTo(i));
      dotsBox.appendChild(d);
    });
    carousel.querySelector('.cert-controls').hidden = stops.length < 2;
    update();
  }

  function current() {
    let best = 0;
    stops.forEach((x, i) => { if (Math.abs(x - track.scrollLeft) < Math.abs(stops[best] - track.scrollLeft)) best = i; });
    return best;
  }

  function goTo(i) {
    i = Math.max(0, Math.min(stops.length - 1, i));
    track.scrollTo({ left: stops[i] });
  }

  function update() {
    const c = current();
    dotsBox.querySelectorAll('.cert-dot').forEach((d, i) => d.setAttribute('aria-selected', i === c ? 'true' : 'false'));
    prev.disabled = c === 0;
    next.disabled = c === stops.length - 1;
  }

  prev.addEventListener('click', () => goTo(current() - 1));
  next.addEventListener('click', () => goTo(current() + 1));
  track.addEventListener('keydown', (e) => {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
  });
  let raf = 0;
  track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(computeStops, 150); });
  computeStops();
  window.addEventListener('load', computeStops);
})();
