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
