/* ==========================================================================
   VALLE CARNES — script.js
   ========================================================================== */

/* ---------------------------------------------------------------------
   CONFIGURAÇÃO — edite aqui as informações do seu negócio
   --------------------------------------------------------------------- */
const CONFIG = {
  // Número de WhatsApp com código do país (DDI 55) + DDD, apenas números.
  whatsappNumber: '5512997052003',
  whatsappMessage: 'Olá! Vim pelo site e gostaria de saber mais sobre os cortes disponíveis.',
};

document.addEventListener('DOMContentLoaded', () => {
  initWhatsAppLinks();
  initHeaderScroll();
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();
  initCounters();
  initActiveNav();
  initHeroParallax();
  initProductCatalog();
  initFloatingWhatsapp();
  initBackToTop();
  initFooterYear();
});

/* ---------------------------------------------------------------------
   WHATSAPP — atualiza todos os links [data-whatsapp] com o número/mensagem
   --------------------------------------------------------------------- */
function initWhatsAppLinks() {
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;
  document.querySelectorAll('[data-whatsapp]').forEach((link) => {
    link.setAttribute('href', url);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener');
  });
}

/* ---------------------------------------------------------------------
   HEADER — transparente no topo, escurece com blur ao rolar
   --------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;

  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------------------------------------------------------------------
   MENU MOBILE
   --------------------------------------------------------------------- */
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  const close = () => {
    toggle.classList.remove('is-active');
    menu.classList.remove('is-active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  toggle.addEventListener('click', () => {
    const isActive = toggle.classList.toggle('is-active');
    menu.classList.toggle('is-active', isActive);
    toggle.setAttribute('aria-expanded', String(isActive));
    document.body.classList.toggle('menu-open', isActive);
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
}

/* ---------------------------------------------------------------------
   SCROLL SUAVE COM DESCONTO DA ALTURA DO HEADER
   --------------------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId.length <= 1) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const headerOffset = 88;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ---------------------------------------------------------------------
   REVEAL — fade/slide/scale ao entrar na tela (IntersectionObserver)
   --------------------------------------------------------------------- */
function initScrollReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  items.forEach((item) => observer.observe(item));
}

/* ---------------------------------------------------------------------
   CONTADORES ANIMADOS (+10, +50, +1000)
   --------------------------------------------------------------------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.counter, 10) || 0;
  const prefix = el.dataset.prefix || '';
  const duration = 1700;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + Math.floor(eased * target);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = prefix + target;
    }
  }
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------------------
   NAV ATIVO CONFORME A SEÇÃO VISÍVEL
   --------------------------------------------------------------------- */
function initActiveNav() {
  const sections = document.querySelectorAll('main section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav__link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { threshold: 0.3, rootMargin: '-90px 0px -55% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------------------------------------------------------------------
   PARALLAX SUTIL NA IMAGEM DO HERO
   --------------------------------------------------------------------- */
function initHeroParallax() {
  const img = document.getElementById('heroImg');
  const hero = document.querySelector('.hero');
  if (!img || !hero) return;

  window.addEventListener(
    'scroll',
    () => {
      const scrolled = window.scrollY;
      const heroHeight = hero.offsetHeight;
      if (scrolled < heroHeight) {
        img.style.transform = `translateY(${scrolled * 0.22}px) scale(1.06)`;
      }
    },
    { passive: true }
  );
}

/* ---------------------------------------------------------------------
   CATÁLOGO DE CORTES — filtro por categoria + busca por texto + paginação
   Ajuste PRODUCTS_PER_PAGE para mudar quantos cortes aparecem por página.
   --------------------------------------------------------------------- */
const PRODUCTS_PER_PAGE = 8;
let catalogFilter = 'todos';
let catalogSearch = '';
let catalogPage = 1;

function initProductCatalog() {
  const buttons = document.querySelectorAll('.filter-btn');
  const grid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('productSearch');
  if (!grid) return;

  const setFilter = (filterValue) => {
    catalogFilter = filterValue;
    catalogPage = 1;
    buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.filter === filterValue));
    renderProductCatalog();
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      setFilter(btn.dataset.filter);
    });
  });

  // Cards da seção "Categorias" (Bovinos, Suínos, Aves, Linguiças) agora
  // realmente aplicam o filtro correspondente ao clicar, em vez de só rolar
  // a página até "Todos".
  document.querySelectorAll('[data-filter-target]').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      setFilter(card.dataset.filterTarget);
      document.getElementById('carnes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        catalogSearch = searchInput.value.trim().toLowerCase();
        catalogPage = 1;
        renderProductCatalog();
      }, 180);
    });
  }

  renderProductCatalog();
}

function renderProductCatalog() {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('productsEmpty');
  const countEl = document.getElementById('productsCount');
  if (!grid) return;

  const allCards = Array.from(grid.querySelectorAll('.product-card'));
  const filtered = allCards.filter((card) => {
    const matchesCategory = catalogFilter === 'todos' || card.dataset.category === catalogFilter;
    const matchesSearch = !catalogSearch || card.textContent.toLowerCase().includes(catalogSearch);
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  if (catalogPage > totalPages) catalogPage = totalPages;

  const start = (catalogPage - 1) * PRODUCTS_PER_PAGE;
  const visiblePage = new Set(filtered.slice(start, start + PRODUCTS_PER_PAGE));

  grid.classList.add('is-transitioning');

  window.setTimeout(() => {
    allCards.forEach((card) => {
      const inFilter = filtered.includes(card);
      const inPage = inFilter && visiblePage.has(card);
      card.classList.toggle('is-hidden-filter', !inFilter);
      card.classList.toggle('is-hidden-page', inFilter && !inPage);
      // Garante que o card apareça mesmo se o observer de scroll-reveal
      // ainda não tiver disparado (evita cards "invisíveis" ao trocar de página).
      if (inPage) card.classList.add('is-visible');
    });

    if (emptyState) emptyState.hidden = filtered.length > 0;
    if (countEl) {
      countEl.textContent = filtered.length === allCards.length
        ? `${filtered.length} cortes disponíveis`
        : `${filtered.length} de ${allCards.length} cortes`;
    }

    renderPagination(totalPages);
    grid.classList.remove('is-transitioning');
  }, 220);
}

function renderPagination(totalPages) {
  const nav = document.getElementById('pagination');
  if (!nav) return;
  nav.innerHTML = '';
  if (totalPages <= 1) return;

  const goTo = (page) => {
    catalogPage = page;
    renderProductCatalog();
    document.getElementById('carnes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const makeBtn = (label, page, { isNav = false, disabled = false, active = false } = {}) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pagination-btn' + (isNav ? ' pagination-btn--nav' : '') + (active ? ' is-active' : '');
    btn.textContent = label;
    btn.setAttribute('aria-label', isNav ? label : `Página ${page}`);
    if (disabled) btn.disabled = true;
    else btn.addEventListener('click', () => goTo(page));
    return btn;
  };

  nav.appendChild(makeBtn('‹', catalogPage - 1, { isNav: true, disabled: catalogPage === 1 }));
  for (let i = 1; i <= totalPages; i++) {
    nav.appendChild(makeBtn(String(i), i, { active: i === catalogPage }));
  }
  nav.appendChild(makeBtn('›', catalogPage + 1, { isNav: true, disabled: catalogPage === totalPages }));
}

/* ---------------------------------------------------------------------
   BOTÃO FLUTUANTE DO WHATSAPP — aparece após rolar a hero
   --------------------------------------------------------------------- */
function initFloatingWhatsapp() {
  const btn = document.getElementById('floatWhatsapp');
  const hero = document.querySelector('.hero');
  if (!btn || !hero) return;

  const toggle = () => {
    btn.classList.toggle('is-visible', window.scrollY > hero.offsetHeight * 0.7);
  };
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
}

/* ---------------------------------------------------------------------
   ANO DINÂMICO NO RODAPÉ
   --------------------------------------------------------------------- */
function initFooterYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ---------------------------------------------------------------------
   BOTÃO VOLTAR AO TOPO — aparece após rolar a hero (mesmo gatilho do WhatsApp)
   --------------------------------------------------------------------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  const hero = document.querySelector('.hero');
  if (!btn || !hero) return;

  const toggle = () => {
    btn.classList.toggle('is-visible', window.scrollY > hero.offsetHeight * 0.7);
  };
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
}
