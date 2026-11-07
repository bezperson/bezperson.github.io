# БезПерсон — сайт психологині

Односторінковий сайт-портфоліо для психологині та її проєкту **БезПерсон** —
групи психологічної підтримки. Статичний сайт (HTML + CSS + трохи JS), без бекенду,
готовий до безкоштовного хостингу на **GitHub Pages**.

## 📁 Структура

```
BezPerson/
├── index.html        ← вся структура сторінки (тексти редагуються тут)
├── styles.css        ← оформлення (кольори, шрифти)
├── script.js         ← меню, анімації, рік у підвалі
├── .nojekyll         ← щоб GitHub Pages віддавав файли як є
└── assets/
    ├── photo-placeholder.svg   ← тимчасове фото
    ├── cert-placeholder.svg    ← тимчасовий сертифікат
    ├── favicon.svg             ← іконка вкладки
    └── certs/                  ← сюди кладемо зображення сертифікатів
```

## ✏️ Що потрібно замінити (шукайте текст у `[ квадратних дужках ]`)

У файлі `index.html`:

- **Ім'я** — скрізь `[Ім'я Прізвище]` та `[Ім'я]` → реальне ім'я.
- **Про мене** — абзаци у секції «Про мене», блок «Освіта / Напрям / Досвід».
- **З чим працюю** — за потреби відкоригуйте список під свою спеціалізацію.
- **Ціни** — `[ціна] грн` у секції «Послуги» та у FAQ.
- **Контакти** — замініть у секції «Зв'язатися» та у підвалі:
  - Telegram: `https://t.me/[username]`
  - Email: `mailto:[email@example.com]`
  - Instagram: `https://instagram.com/[username]` (або приберіть рядок)
- **Посилання на Telegram-групу** — `[ПОСИЛАННЯ НА TELEGRAM-ГРУПУ]` у секції БезПерсон.
- **Відгуки** — додайте реальні анонімні відгуки.

### Фото
Покладіть фото як `assets/photo.jpg`, тоді у `index.html` змініть:
```html
<img src="assets/photo-placeholder.svg" ... />
<!-- на -->
<img src="assets/photo.jpg" ... />
```

### Сертифікати
1. Покладіть зображення у `assets/certs/` (напр. `cert-1.jpg`, `cert-2.jpg`…).
2. У секції «Сертифікати» замініть `assets/cert-placeholder.svg` на свій файл
   та оновіть підпис `[Назва сертифіката]`.
3. Додавайте/видаляйте блоки `<a class="cert-item">…</a>` за кількістю сертифікатів.

### Форма зворотного зв'язку
Форма працює через безкоштовний сервіс **Formspree** (бо GitHub Pages не має сервера):
1. Зареєструйтесь на https://formspree.io
2. Створіть форму, скопіюйте її ID.
3. У `index.html` замініть `YOUR_FORM_ID`:
   ```html
   <form ... action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

## 🚀 Публікація на GitHub Pages

1. Створіть репозиторій на GitHub (напр. `bezperson`).
2. Завантажте всі файли цієї теки в репозиторій (через сайт GitHub або `git`).
3. У репозиторії: **Settings → Pages**.
4. У розділі **Build and deployment → Source** оберіть **Deploy from a branch**.
5. Branch: **main**, тека: **/ (root)** → **Save**.
6. За хвилину-дві сайт буде доступний за адресою
   `https://ВАШ-НІК.github.io/bezperson/`.

### Через git (за бажанням)
```bash
git init
git add .
git commit -m "Перша версія сайту БезПерсон"
git branch -M main
git remote add origin https://github.com/ВАШ-НІК/bezperson.git
git push -u origin main
```

### Власний домен (опційно)
Якщо матимете свій домен (напр. `bezperson.com.ua`) — його можна підключити
у **Settings → Pages → Custom domain**.

## 👀 Переглянути локально
У теці проєкту:
```bash
python3 -m http.server 8000
```
Відкрийте http://localhost:8000
