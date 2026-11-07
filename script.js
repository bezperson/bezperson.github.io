// БезПерсон — невеликі покращення взаємодії

// 1) Поточний рік у підвалі
document.getElementById('year').textContent = new Date().getFullYear();

// 2) Мобільне меню (бургер)
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

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
