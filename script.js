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
