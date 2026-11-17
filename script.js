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