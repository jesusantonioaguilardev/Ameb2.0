/* =========================================================
   AMEB · Interacciones del sitio
   ========================================================= */
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const nav = document.getElementById('main-nav');
  const navToggle = document.querySelector('.nav-toggle');

  /* ---------- Imágenes ausentes: muestra el fondo de respaldo ---------- */
  const watchImage = (img) => {
    const markMissing = () => img.parentElement.classList.add('img-missing');
    if (img.complete && img.naturalWidth === 0) markMissing();
    else img.addEventListener('error', markMissing);
  };
  document.querySelectorAll('main img').forEach(watchImage);

  /* ---------- Directorio de miembros ---------- */
  const members = (window.AMEB_MIEMBROS || []).slice()
    .sort((a, b) => Number(!a.cargo) - Number(!b.cargo));
  const membersGrid = document.getElementById('members-grid');
  const membersQuery = document.getElementById('members-q');
  const membersFilter = document.getElementById('members-filter');
  const membersCount = document.getElementById('members-count');
  const membersEmpty = document.getElementById('members-empty');
  const membersMore = document.getElementById('members-more');
  const PAGE = 12;
  let shown = PAGE;

  const normalize = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // Nombre + primer apellido: "César David Quiroz Guadarrama" → "CQ"
  const initials = (name) => {
    const w = name.replace(/^(Dra?\.|Lic\.|Mtr[oa]\.)\s*/i, '').split(/\s+/);
    const surname = w.length >= 3 ? w[w.length - 2] : w[1] || '';
    return `${w[0][0]}${surname[0] || ''}`.toUpperCase();
  };

  [...new Set(members.map((m) => m.especialidad).filter(Boolean))].sort()
    .forEach((esp) => membersFilter.add(new Option(esp, esp)));
  // El filtro solo tiene sentido con al menos dos especialidades
  membersFilter.closest('label').hidden = membersFilter.options.length < 3;

  const memberCard = (m) => {
    const li = document.createElement('li');
    li.className = 'member';

    const photo = document.createElement('div');
    photo.className = 'member__photo';
    photo.dataset.initials = initials(m.nombre);
    if (m.foto) {
      const img = document.createElement('img');
      img.src = m.foto;
      img.alt = m.nombre;
      img.loading = 'lazy';
      photo.append(img);
      watchImage(img);
    } else {
      photo.classList.add('img-missing');
    }

    const name = document.createElement('h3');
    name.textContent = m.nombre;
    li.append(photo, name);

    [['member__role', m.cargo], ['member__spec', m.especialidad],
      ['member__hospital', m.hospital], ['member__city', m.ciudad]]
      .filter(([, text]) => text)
      .forEach(([cls, text]) => {
        const p = document.createElement('p');
        p.className = cls;
        p.textContent = text;
        li.append(p);
      });
    return li;
  };

  const renderMembers = () => {
    const q = normalize(membersQuery.value.trim());
    const esp = membersFilter.value;
    const list = members.filter((m) =>
      (!esp || m.especialidad === esp) &&
      (!q || normalize(`${m.nombre} ${m.ciudad} ${m.hospital} ${m.especialidad}`).includes(q)));

    membersGrid.replaceChildren(...list.slice(0, shown).map(memberCard));
    membersEmpty.hidden = list.length > 0;
    membersMore.hidden = list.length <= shown;
    membersCount.textContent = `${list.length} ${list.length === 1 ? 'miembro' : 'miembros'}`;
  };

  const resetAndRender = () => { shown = PAGE; renderMembers(); };
  membersQuery.addEventListener('input', resetAndRender);
  membersFilter.addEventListener('change', resetAndRender);
  membersMore.addEventListener('click', () => { shown += PAGE; renderMembers(); });
  renderMembers();

  /* ---------- Sombra del encabezado al hacer scroll ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    navToggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  };
  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a, button').forEach((el) => el.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Enlace activo según la sección visible ---------- */
  const links = [...document.querySelectorAll('.nav__link')];
  const sectionFor = { consejo: 'nosotros' };
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = sectionFor[entry.target.id] || entry.target.id;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));

  /* ---------- Animaciones de aparición ---------- */
  const reveal = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const siblings = [...entry.target.parentElement.children].filter((el) => el.classList.contains('reveal'));
      entry.target.style.transitionDelay = `${Math.min(siblings.indexOf(entry.target), 6) * 70}ms`;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));

  /* ---------- Carrusel del consejo directivo ---------- */
  const carousel = document.querySelector('.carousel');
  const carouselBtns = document.querySelectorAll('.carousel__btn');
  const updateCarousel = () => {
    const max = carousel.scrollWidth - carousel.clientWidth - 2;
    carouselBtns[0].disabled = carousel.scrollLeft <= 2;
    carouselBtns[1].disabled = carousel.scrollLeft >= max;
  };
  carouselBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = carousel.querySelector('.member-card');
      const step = card.offsetWidth + parseFloat(getComputedStyle(carousel).columnGap || 24);
      carousel.scrollBy({ left: step * Number(btn.dataset.dir) });
    });
  });
  carousel.addEventListener('scroll', updateCarousel, { passive: true });
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') carouselBtns[1].click();
    if (e.key === 'ArrowLeft') carouselBtns[0].click();
  });
  window.addEventListener('resize', updateCarousel);
  updateCarousel();

  /* ---------- Cuenta regresiva CEBE 2026 ---------- */
  const countdown = document.getElementById('countdown');
  const eventStart = new Date('2026-11-07T08:00:00-07:00'); // Hermosillo (UTC-7)
  const eventEnd = new Date('2026-11-09T20:00:00-07:00');
  const renderCountdown = () => {
    const now = new Date();
    if (now > eventEnd) {
      countdown.textContent = 'Gracias por acompañarnos en CEBE 2026';
      return;
    }
    if (now >= eventStart) {
      countdown.textContent = 'El curso se está llevando a cabo';
      return;
    }
    const diff = eventStart - now;
    const days = Math.floor(diff / 864e5);
    const hours = Math.floor((diff % 864e5) / 36e5);
    const mins = Math.floor((diff % 36e5) / 6e4);
    countdown.textContent = `Faltan ${days} días · ${hours} h · ${mins} min`;
  };
  renderCountdown();
  setInterval(renderCountdown, 30000);

  /* ---------- Ventanas modales ---------- */
  const openDialog = (id) => {
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
    document.getElementById(id)?.showModal();
  };
  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => openDialog(btn.dataset.open));
  });
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    // Cerrar al hacer clic fuera del contenido
    dialog.addEventListener('click', (e) => {
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dialog.close();
    });
  });

  /* ---------- Formulario de membresía (abre el correo) ---------- */
  const form = document.getElementById('membership-form');
  const formError = form.querySelector('.form__error');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo);
    if (!data.nombre.trim() || !data.especialidad || !emailOk) {
      formError.hidden = false;
      return;
    }
    formError.hidden = true;
    const body = [
      `Nombre: ${data.nombre}`,
      `Especialidad: ${data.especialidad}`,
      `Correo: ${data.correo}`,
      `Teléfono: ${data.telefono || '—'}`,
    ].join('\n');
    window.location.href = `mailto:info@ameb.org.mx?subject=${encodeURIComponent('Solicitud de membresía AMEB')}&body=${encodeURIComponent(body)}`;
    form.reset();
    form.closest('dialog').close();
  });

  /* ---------- Año del pie de página ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
});
