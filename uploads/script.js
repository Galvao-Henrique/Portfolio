(function () {
  var hero = document.getElementById('hero');
  var photo = document.querySelector('.hero-photo');
  var photoWrap = document.querySelector('.hero-photo-wrap');
  var sidebar = document.querySelector('.sidebar');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  /* ---- Entrada do hero ----
     Dois rAF garantem que o navegador pintou o estado "fechado"
     pelo menos uma vez antes de virar a classe que dispara a
     transição — senão uma imagem em cache pula direto pro fim. */
  function startReveal() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.add('hero-ready');
      });
    });
  }

  if (photo && photo.complete && photo.naturalWidth > 0) {
    startReveal();
  } else if (photo) {
    photo.addEventListener('load', startReveal, { once: true });
    setTimeout(startReveal, 800);
  } else {
    startReveal();
  }

  /* ---- Parallax leve no mouse (só desktop) ---- */
  if (!reduceMotion && !isCoarsePointer && hero && photoWrap) {
    var raf = null;
    var targetX = 0, targetY = 0, curX = 0, curY = 0;

    function onMove(e) {
      var rect = hero.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width - 0.5;
      targetY = (e.clientY - rect.top) / rect.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;

      photoWrap.style.transform =
        'translate(' + (curX * -10) + 'px, ' + (curY * -8) + 'px) scale(1.03)';

      if (sidebar && window.innerWidth > 980) {
        sidebar.style.transform =
          'translate(' + (curX * 6) + 'px, ' + (curY * 5) + 'px)';
      }

      if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    hero.addEventListener('mousemove', onMove);
    hero.addEventListener('mouseleave', function () {
      targetX = 0;
      targetY = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }
})();

/* =========================================================
   RESTO DA PÁGINA
   Menu mobile, nav fixa, scroll-spy, seletor de projetos,
   revelação ao rolar, copiar e-mail e ano do rodapé.
========================================================= */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Nav: fundo ao rolar ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Menu mobile ---- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  function setMenu(open) {
    if (!toggle || !links) return;
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) setMenu(false);
    });
  }

  /* ---- Scroll-spy ---- */
  var navAnchors = links ? links.querySelectorAll('a[href^="#"]') : [];
  var sections = [];

  Array.prototype.forEach.call(navAnchors, function (a) {
    var el = document.querySelector(a.getAttribute('href'));
    if (el) sections.push({ el: el, anchor: a });
  });

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sections.forEach(function (s) {
          s.anchor.classList.toggle('is-active', s.el === entry.target);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { spy.observe(s.el); });
  }

  /* ---- Seletor de projetos ---- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.project-tab'));

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.setAttribute('tabindex', selected ? '0' : '-1');
      if (panel) {
        if (selected) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      }
    });
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });

    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        selectTab(next, true);
      }
    });
  });

  /* ---- Revelação ao rolar ---- */
  var fx = document.querySelectorAll('.fx');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(fx, function (el) { el.classList.add('is-visible'); });
  } else {
    var reveal = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(fx, function (el) { reveal.observe(el); });
  }

  /* ---- Copiar e-mail ---- */
  var copyBtn = document.getElementById('copyEmail');
  var emailLink = document.getElementById('emailLink');

  if (copyBtn && emailLink) {
    copyBtn.addEventListener('click', function () {
      var email = emailLink.textContent.trim();
      var done = function () {
        copyBtn.textContent = 'Copiado';
        copyBtn.classList.add('is-copied');
        setTimeout(function () {
          copyBtn.textContent = 'Copiar';
          copyBtn.classList.remove('is-copied');
        }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done, function () {
          copyBtn.textContent = 'Copie manualmente';
        });
      } else {
        var tmp = document.createElement('textarea');
        tmp.value = email;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); done(); }
        catch (err) { copyBtn.textContent = 'Copie manualmente'; }
        document.body.removeChild(tmp);
      }
    });
  }

  /* ---- Ano do rodapé ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

/* =========================================================
   CERTIFICADOS — A GRADE
   ---------------------------------------------------------
   👇 É AQUI QUE VOCÊ CADASTRA SEUS CERTIFICADOS.

   Coloque os PDFs na pasta "certificados/" (do lado do
   index.html) e adicione um item na lista abaixo. Pode ter
   quantos quiser: a grade, os filtros, a contagem e a
   paginação se montam sozinhos. A grade mostra 6 por vez
   (3 colunas x 2 linhas); o resto fica em outras páginas,
   navegáveis pelos botões Anterior/Próxima.

   titulo    → o curso. Aparece grande no papel.
   emissor   → quem emitiu. As iniciais viram o selo.
   plataforma→ opcional: onde foi feito (Coursera, Alura...).
               Aparece na linha da assinatura.
   data      → opcional: data por extenso, como no documento.
               Se faltar, o papel mostra só o ano.
   ano       → usado na legenda e na ordenação visual.
   categoria → vira um botão de filtro. Repita o mesmo nome
               nos certificados do mesmo tipo.
   detalhe   → opcional: carga horária, nota, o que quiser.
   arquivo   → caminho do PDF.
   imagem    → opcional: PNG/JPG do certificado. Se preencher,
               o visualizador mostra a imagem em vez do PDF
               (útil porque celular às vezes não abre PDF).
   verificar → opcional: link de verificação (Coursera etc).
========================================================= */
(function () {

  /* Seu nome, do jeito que está impresso nos certificados. */
  var TITULAR = 'Henrique Galvão Freitas Pires';

  var CERTIFICADOS = [
    {
      titulo: 'Programming for Everybody (Getting Started with Python)',
      emissor: 'University of Michigan',
      plataforma: 'Coursera',
      data: '14 out 2024',
      ano: '2024',
      categoria: 'Cursos',
      detalhe: 'Programa de cursos integrados',
      arquivo: 'Certificados/Programming for Everybody (Getting Started with Python).pdf',
      imagem: '',
      verificar: 'https://coursera.org/verify/GYR6HKYRZJ2O'
    },
    {
      titulo: 'Introdução à Ciência da Computação com Python Parte 1',
      emissor: 'Coursera',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cursos',
      detalhe: 'Ciência da computação e Python',
      arquivo: 'Certificados/Introdução à Ciência da Computação com Python Parte 1.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Introdução à Ciência da Computação com Python Parte 2',
      emissor: 'Coursera',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cursos',
      detalhe: 'Ciência da computação e Python',
      arquivo: 'Certificados/Introdução à Ciência da Computação com Python Parte 2.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Introduction to Software Engineering',
      emissor: 'Coursera',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cursos',
      detalhe: 'Engenharia de software',
      arquivo: 'Certificados/Introduction to Software Engineering.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Introduction to HTML, CSS, & JavaScript',
      emissor: 'Coursera',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cursos',
      detalhe: 'Desenvolvimento web',
      arquivo: 'Certificados/Introduction to HTML, CSS, & JavaScript.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Introduction to Artificial Intelligence (AI)',
      emissor: 'Coursera',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cursos',
      detalhe: 'Inteligência artificial',
      arquivo: 'Certificados/Introduction to Artificial Intelligence (AI).pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Generative AI Prompt Engineering Basics',
      emissor: 'Coursera',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cursos',
      detalhe: 'Inteligência artificial generativa',
      arquivo: 'Certificados/Generative AI Prompt Engineering Basics.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Generative AI Introduction and Applications',
      emissor: 'Coursera',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cursos',
      detalhe: 'Inteligência artificial generativa',
      arquivo: 'Certificados/Generative AI Introduction and Applications.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Foundations Data, Data, Everywhere',
      emissor: 'Coursera',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cursos',
      detalhe: 'Fundamentos de dados',
      arquivo: 'Certificados/Foundations Data, Data, Everywhere.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Foundations of Cybersecurity',
      emissor: 'Google',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cibersegurança',
      detalhe: 'Fundamentos de cibersegurança',
      arquivo: 'Certificados/Ciber/Foundations of Cybersecurity.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Assets, Threats, and Vulnerabilities',
      emissor: 'Google',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cibersegurança',
      detalhe: 'Ativos, ameaças e vulnerabilidades',
      arquivo: 'Certificados/Ciber/Assets, Threats, and Vulnerabilities.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Connect and Protect Networks and Network Security',
      emissor: 'Google',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cibersegurança',
      detalhe: 'Redes e segurança de redes',
      arquivo: 'Certificados/Ciber/Connect and Protect Networks and Network.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Tools of the Trade Linux and SQL',
      emissor: 'Google',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cibersegurança',
      detalhe: 'Linux e SQL',
      arquivo: 'Certificados/Ciber/Tools of the Trade Linux and SQL.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Sound the Alarm Detection and Response',
      emissor: 'Google',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cibersegurança',
      detalhe: 'Detecção e resposta',
      arquivo: 'Certificados/Ciber/Sound the Alarm Detection and Response.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Automate Cybersecurity Tasks with Python',
      emissor: 'Google',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cibersegurança',
      detalhe: 'Automação com Python',
      arquivo: 'Certificados/Ciber/Automate Cybersecurity Tasks with Python.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Put It to Work Prepare for Cybersecurity Jobs',
      emissor: 'Google',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cibersegurança',
      detalhe: 'Preparação para carreira em cibersegurança',
      arquivo: 'Certificados/Ciber/Put It to Work Prepare for Cybersecurity Jobs.pdf',
      imagem: '',
      verificar: ''
    },
    {
      titulo: 'Play It Safe Manage Security Risks',
      emissor: 'Google',
      plataforma: 'Coursera',
      data: '',
      ano: '',
      categoria: 'Cibersegurança',
      detalhe: 'Gestão de riscos de segurança',
      arquivo: 'Certificados/Ciber/Play It Safe Manage Security Risks.pdf',
      imagem: '',
      verificar: ''
    }
  ];

  /* ---- Quantos certificados por página da grade.
          3 colunas x 2 linhas = 6. ---- */
  var POR_PAGINA = 6;

  var grade = document.getElementById('certGrid');
  var filtros = document.getElementById('certFiltros');
  var contagem = document.getElementById('certContagem');
  var vazio = document.getElementById('certVazio');
  var viewer = document.getElementById('certViewer');
  var paginacao = document.getElementById('certPaginacao');
  var btnPagAnterior = document.getElementById('certPagAnterior');
  var btnPagProxima = document.getElementById('certPagProxima');
  var pagInfo = document.getElementById('certPagInfo');
  if (!grade || !viewer) return;

  var frame = document.getElementById('certViewerFrame');
  var tituloEl = document.getElementById('certViewerTitle');
  var metaEl = document.getElementById('certViewerMeta');
  var contaEl = document.getElementById('certViewerCount');
  var btnPrev = document.getElementById('certPrev');
  var btnNext = document.getElementById('certNext');
  var btnAbrir = document.getElementById('certOpen');
  var btnBaixar = document.getElementById('certDownload');
  var btnVerificar = document.getElementById('certVerify');
  var fechar = viewer.querySelectorAll('[data-cert-close]');

  var lista = CERTIFICADOS.slice();   // o que está sendo exibido agora (já filtrado)
  var categoriaAtual = 'Todos';
  var pagina = 0;
  var atual = 0;
  var ultimoFoco = null;

  function iniciais(texto) {
    return (texto || '?')
      .split(/[\s\-—]+/)
      .filter(function (p) { return p.length > 2 || /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(p); })
      .slice(0, 2)
      .map(function (p) { return p.charAt(0).toUpperCase(); })
      .join('') || '•';
  }

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto) n.textContent = texto;
    return n;
  }

    /* ---------------------------------------------------------
      Prévia do certificado real em PDF.
    --------------------------------------------------------- */
  function criarCard(cert, indice) {
    var btn = el('button', 'cert-card');
    btn.type = 'button';
    btn.dataset.i = indice;
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', 'Abrir certificado: ' + cert.titulo);

    var papel = el('span', 'cert-paper cert-paper-real');
    var preview = document.createElement('iframe');
    preview.src = cert.arquivo + '#toolbar=0&navpanes=0&scrollbar=0&view=Fit';
    preview.title = 'Prévia do certificado: ' + cert.titulo;
    preview.setAttribute('aria-hidden', 'true');
    preview.tabIndex = -1;
    papel.appendChild(preview);

    btn.appendChild(papel);
    return btn;
  }

  /* ---------------------------------------------------------
     MONTAGEM DA GRADE
     Estática, sem animação: 3 colunas x 2 linhas (6 cards) por
     página. Se a categoria tiver mais que isso, a paginação
     abaixo da grade navega entre os grupos.
  --------------------------------------------------------- */
  function montarGrade() {
    grade.innerHTML = '';
    if (!lista.length) return;

    var inicio = pagina * POR_PAGINA;
    var visiveis = lista.slice(inicio, inicio + POR_PAGINA);

    visiveis.forEach(function (cert) {
      grade.appendChild(criarCard(cert, lista.indexOf(cert)));
    });

    var totalPaginas = Math.ceil(lista.length / POR_PAGINA);
    if (paginacao) {
      paginacao.hidden = totalPaginas <= 1;
      if (totalPaginas > 1) {
        if (pagInfo) pagInfo.textContent = (pagina + 1) + ' de ' + totalPaginas;
        if (btnPagAnterior) btnPagAnterior.disabled = pagina === 0;
        if (btnPagProxima) btnPagProxima.disabled = pagina >= totalPaginas - 1;
      }
    }
  }

  /* ---- Filtro escolhido ---- */
  function desenhar(categoria) {
    categoriaAtual = categoria;
    pagina = 0;
    lista = categoria === 'Todos'
      ? CERTIFICADOS.slice()
      : CERTIFICADOS.filter(function (c) { return c.categoria === categoria; });

    montarGrade();

    if (vazio) vazio.hidden = lista.length > 0;
    if (contagem) {
      contagem.textContent = lista.length === 1
        ? '1 certificado'
        : lista.length + ' certificados';
    }
  }

  function montarFiltros() {
    if (!filtros) return;
    var categorias = ['Todos'];
    CERTIFICADOS.forEach(function (c) {
      if (c.categoria && categorias.indexOf(c.categoria) === -1) categorias.push(c.categoria);
    });
    if (categorias.length < 3) return;   // com uma categoria só, filtro não ajuda

    categorias.forEach(function (cat, i) {
      var b = el('button', 'cert-filter', cat);
      b.type = 'button';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(filtros.querySelectorAll('.cert-filter'), function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        desenhar(cat);
      });
      filtros.appendChild(b);
    });
  }

  /* ---- Abrir o certificado ---- */
  grade.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('.cert-card') : null;
    if (!card) return;
    abrir(parseInt(card.dataset.i, 10), card);
  });

  /* ---- Paginação da grade ---- */
  if (btnPagAnterior) {
    btnPagAnterior.addEventListener('click', function () {
      if (pagina === 0) return;
      pagina--;
      montarGrade();
    });
  }
  if (btnPagProxima) {
    btnPagProxima.addEventListener('click', function () {
      var totalPaginas = Math.ceil(lista.length / POR_PAGINA);
      if (pagina >= totalPaginas - 1) return;
      pagina++;
      montarGrade();
    });
  }

  function mostrar(i) {
    var cert = lista[i];
    if (!cert) return;
    atual = i;

    tituloEl.textContent = cert.titulo;
    metaEl.textContent = [cert.emissor, cert.plataforma, cert.data || cert.ano, cert.detalhe]
      .filter(Boolean).join(' — ');
    contaEl.textContent = (i + 1) + ' de ' + lista.length;

    frame.innerHTML = '';
    if (cert.imagem) {
      var img = document.createElement('img');
      img.src = cert.imagem;
      img.alt = 'Certificado: ' + cert.titulo;
      frame.appendChild(img);
    } else {
      var iframe = document.createElement('iframe');
      iframe.src = cert.arquivo + '#view=FitH&toolbar=0';
      iframe.title = 'Certificado: ' + cert.titulo;
      frame.appendChild(iframe);
    }

    btnAbrir.href = cert.arquivo;
    btnBaixar.href = cert.arquivo;

    if (btnVerificar) {
      if (cert.verificar) {
        btnVerificar.href = cert.verificar;
        btnVerificar.hidden = false;
      } else {
        btnVerificar.hidden = true;
      }
    }

    btnPrev.disabled = i === 0;
    btnNext.disabled = i === lista.length - 1;
  }

  function abrir(i, origem) {
    if (isNaN(i)) return;
    ultimoFoco = origem || null;
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    mostrar(i);
    viewer.querySelector('.cert-viewer-close').focus();
  }

  function fecharViewer() {
    viewer.hidden = true;
    frame.innerHTML = '';
    document.body.style.overflow = '';
    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
  }

  Array.prototype.forEach.call(fechar, function (n) {
    n.addEventListener('click', fecharViewer);
  });
  btnPrev.addEventListener('click', function () { mostrar(atual - 1); });
  btnNext.addEventListener('click', function () { mostrar(atual + 1); });

  document.addEventListener('keydown', function (e) {
    if (viewer.hidden) return;
    if (e.key === 'Escape') fecharViewer();
    if (e.key === 'ArrowLeft' && atual > 0) mostrar(atual - 1);
    if (e.key === 'ArrowRight' && atual < lista.length - 1) mostrar(atual + 1);
  });

  montarFiltros();
  desenhar('Todos');

  if (!CERTIFICADOS.length && vazio) {
    vazio.hidden = false;
    vazio.textContent = 'Os certificados entram na lista CERTIFICADOS, no script.js.';
  }
})();
