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
    if (document.documentElement.classList.contains('hero-ready')) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.add('hero-ready');
      });
    });
    setTimeout(function () {
      document.documentElement.classList.add('hero-ready');
    }, 120);
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

  function selectTab(tab, focus, toggle) {
    var closing = toggle && tab.getAttribute('aria-selected') === 'true';
    tabs.forEach(function (t) {
      var selected = !closing && t === tab;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.setAttribute('tabindex', '0');
      if (panel) {
        if (selected) {
          panel.removeAttribute('hidden');
          var fr = panel.querySelector('iframe[data-src]');
          if (fr && !fr.src) fr.src = fr.getAttribute('data-src');
          if (window.__fitMonitors) window.__fitMonitors(panel);
        }
        else panel.setAttribute('hidden', '');
      }
    });
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false, true); });

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

   Coloque os PDFs na pasta "docs/Certificados/" (do lado do
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
      titulo: 'Google Cybersecurity — Certificado Profissional',
      emissor: 'Google',
      plataforma: 'Coursera',
      data: '28 mar 2025',
      ano: '2025',
      categoria: 'Cibersegurança',
      detalhe: 'Programa completo com 8 cursos',
      arquivo: 'docs/Certificados/Ciber/Cibersegurança.pdf',
      imagem: '',
      verificar: 'https://coursera.org/verify/professional-cert/7CQ2XEZIIX7W'
    },
    {
      titulo: 'Programming for Everybody (Getting Started with Python)',
      emissor: 'University of Michigan',
      plataforma: 'Coursera',
      data: '14 out 2024',
      ano: '2024',
      categoria: 'Cursos',
      detalhe: 'Programa de cursos integrados',
      arquivo: 'docs/Certificados/Programming for Everybody (Getting Started with Python).pdf',
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
      arquivo: 'docs/Certificados/Introdução à Ciência da Computação com Python Parte 1.pdf',
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
      arquivo: 'docs/Certificados/Introdução à Ciência da Computação com Python Parte 2.pdf',
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
      arquivo: 'docs/Certificados/Introduction to Software Engineering.pdf',
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
      arquivo: 'docs/Certificados/Introduction to HTML, CSS, & JavaScript.pdf',
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
      arquivo: 'docs/Certificados/Introduction to Artificial Intelligence (AI).pdf',
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
      arquivo: 'docs/Certificados/Generative AI Prompt Engineering Basics.pdf',
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
      arquivo: 'docs/Certificados/Generative AI Introduction and Applications.pdf',
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
      arquivo: 'docs/Certificados/Foundations Data, Data, Everywhere.pdf',
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
      arquivo: 'docs/Certificados/Ciber/Foundations of Cybersecurity.pdf',
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
      arquivo: 'docs/Certificados/Ciber/Assets, Threats, and Vulnerabilities.pdf',
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
      arquivo: 'docs/Certificados/Ciber/Connect and Protect Networks and Network.pdf',
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
      arquivo: 'docs/Certificados/Ciber/Tools of the Trade Linux and SQL.pdf',
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
      arquivo: 'docs/Certificados/Ciber/Sound the Alarm Detection and Response.pdf',
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
      arquivo: 'docs/Certificados/Ciber/Automate Cybersecurity Tasks with Python.pdf',
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
      arquivo: 'docs/Certificados/Ciber/Put It to Work Prepare for Cybersecurity Jobs.pdf',
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
      arquivo: 'docs/Certificados/Ciber/Play It Safe Manage Security Risks.pdf',
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

    var papel = el('span', 'cert-paper');
    btn.appendChild(papel);
    var gerar = function () { previaReal(cert, papel); };
    if (gradePerto) gerar(); else pendentes.push(gerar);
    return btn;
  }

  /* ---- Prévia real: 1ª página do PDF original, gerada uma vez e guardada ----
     Só começa quando a seção chega perto da tela, um PDF por vez e nos
     momentos livres do navegador, para a rolagem não travar. Nas próximas
     visitas a prévia sai do cache do navegador, sem gerar de novo. */
  var cachePrevia = {};
  var filaPrevias = Promise.resolve();
  var CACHE_PREVIAS = 'hg-cert-previas-v1';
  var pdfjsPromise = null;
  var ocioso = window.requestIdleCallback
    ? function (f) { window.requestIdleCallback(f, { timeout: 1500 }); }
    : function (f) { setTimeout(f, 60); };
  function carregarPdfjs() {
    if (!pdfjsPromise) {
      var base = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/';
      pdfjsPromise = import(base + 'pdf.min.mjs').then(function (lib) {
        lib.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
        return lib;
      });
    }
    return pdfjsPromise;
  }
  function renderizarPdf(url, largura, qualidade) {
    largura = largura || 720;
    return carregarPdfjs().then(function (lib) {
      return lib.getDocument(encodeURI(url)).promise;
    }).then(function (doc) {
      return doc.getPage(1).then(function (page) {
        var v = page.getViewport({ scale: 1 });
        var vp = page.getViewport({ scale: largura / v.width });
        var cv = document.createElement('canvas');
        cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
        var ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
        return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
          doc.destroy();
          return new Promise(function (ok) { cv.toBlob(ok, 'image/jpeg', qualidade || 0.82); });
        });
      });
    });
  }
  function abrirCache() {
    try { return 'caches' in window ? caches.open(CACHE_PREVIAS) : Promise.reject(); }
    catch (e) { return Promise.reject(e); }
  }
  function gerarPrevia(url) {
    if (cachePrevia[url]) return cachePrevia[url];
    var chave = new URL(url, location.href).href + '?previa=720';
    cachePrevia[url] = abrirCache()
      .then(function (cache) { return cache.match(chave); })
      .catch(function () { return null; })
      .then(function (res) {
        if (res) return res.blob();
        var job = filaPrevias.then(function () {
          return new Promise(function (ok) { ocioso(ok); });
        }).then(function () { return renderizarPdf(url); });
        filaPrevias = job.catch(function () {});
        return job.then(function (blob) {
          if (blob) abrirCache().then(function (cache) {
            return cache.put(chave, new Response(blob, { headers: { 'Content-Type': 'image/jpeg' } }));
          }).catch(function () {});
          return blob;
        });
      })
      .then(function (blob) {
        if (!blob) throw new Error('sem prévia');
        return URL.createObjectURL(blob);
      });
    return cachePrevia[url];
  }
  function previaReal(cert, papel) {
    if (!cert.imagem && !cert.arquivo) return;
    var p = cert.imagem ? Promise.resolve(cert.imagem) : gerarPrevia(cert.arquivo);
    p.then(function (src) {
      var img = new Image();
      img.className = 'cert-thumb';
      img.alt = 'Certificado: ' + cert.titulo;
      img.decoding = 'async';
      img.onload = function () { papel.classList.add('has-thumb'); };
      img.src = src;
      papel.appendChild(img);
    }).catch(function () {
      // sem conexão para gerar a prévia: mostra só o nome; o PDF abre normalmente
      papel.classList.add('is-failed');
      var fb = el('span', 'cert-fallback');
      fb.appendChild(el('small', null, 'PDF'));
      fb.appendChild(el('span', null, cert.titulo));
      papel.appendChild(fb);
    });
  }
  var gradePerto = !('IntersectionObserver' in window);
  var pendentes = [];
  function preCarregarResto() {
    CERTIFICADOS.forEach(function (ct) { if (ct.arquivo && !ct.imagem) gerarPrevia(ct.arquivo); });
  }
  if (!gradePerto) {
    var ioGrade = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      gradePerto = true; ioGrade.disconnect();
      pendentes.splice(0).forEach(function (f) { f(); });
      preCarregarResto();
    }, { rootMargin: '700px 0px' });
    ioGrade.observe(grade);
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
    metaEl.textContent = '';
    if (cert.emissor) {
      var em = document.createElement('span');
      em.className = 'cert-viewer-emissor';
      em.textContent = cert.emissor;
      metaEl.appendChild(em);
    }
    var resto = [cert.plataforma, cert.data || cert.ano, cert.detalhe].filter(Boolean).join(' — ');
    if (resto) metaEl.appendChild(document.createTextNode((cert.emissor ? ' — ' : '') + resto));
    contaEl.textContent = (i + 1) + ' de ' + lista.length;

    frame.innerHTML = '';
    if (cert.imagem) {
      var img = document.createElement('img');
      img.src = cert.imagem;
      img.alt = 'Certificado: ' + cert.titulo;
      frame.appendChild(img);
    } else {
      var token = (frame._token = (frame._token || 0) + 1);
      var load = document.createElement('div');
      load.className = 'cert-viewer-loading';
      load.textContent = 'Carregando certificado…';
      frame.appendChild(load);
      // Mostra a prévia já gerada na hora, depois troca pela versão nítida
      var pImg = document.createElement('img');
      pImg.alt = 'Certificado: ' + cert.titulo;
      gerarPrevia(cert.arquivo).then(function (src) {
        if (frame._token !== token) return;
        pImg.src = src; if (!pImg.parentNode) { frame.innerHTML = ''; frame.appendChild(pImg); }
      }).catch(function () {});
      var alta = Math.min(2400, Math.round(Math.max(frame.clientWidth, frame.clientHeight * 1.42) * (window.devicePixelRatio || 1)));
      renderizarPdf(cert.arquivo, Math.max(1200, alta), 0.92).then(function (blob) {
        if (frame._token !== token || !blob) return;
        pImg.src = URL.createObjectURL(blob);
        if (!pImg.parentNode) { frame.innerHTML = ''; frame.appendChild(pImg); }
      }).catch(function () {
        if (frame._token !== token || pImg.parentNode) return;
        frame.innerHTML = '';
        var iframe = document.createElement('iframe');
        iframe.src = cert.arquivo + '#view=Fit&toolbar=0';
        iframe.title = 'Certificado: ' + cert.titulo;
        frame.appendChild(iframe);
      });
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

/* ---- Demo RSA (projeto 02) — tradução do rsa.py ---- */
(function () {
  var root = document.getElementById('rsa-demo');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var err = $('rsa-err');

  // Encontra o MDC e os coeficientes com o Euclidiano Estendido
  function emdc(a, b) {
    if (a === 0n) return [b, 0n, 1n];
    var r = emdc(b % a, a), m = r[0], y = r[1], x = r[2];
    return [m, x - (b / a) * y, y];
  }
  // Checa se um número é primo
  function ePrimo(num) {
    if (num === 1 || num % 2 === 0) return false;
    for (var i = 3; i <= Math.floor(Math.sqrt(num)); i += 2) if (num % i === 0) return false;
    return true;
  }
  // Módulo multiplicativo inverso
  function modInverso(a, b) {
    var r = emdc(a, b);
    if (r[0] !== 1n) return 0n;
    return ((r[1] % b) + b) % b;
  }
  function randint(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  // Gera um número aleatório até que seja primo
  function gerandoPrimos(min, max) {
    var p = randint(min, max);
    while (!ePrimo(p)) p = randint(min, max);
    return p;
  }
  function randBig(min, max) { // inteiro aleatório em [min, max]
    return min + BigInt(Math.floor(Math.random() * Number(max - min + 1n)));
  }
  function modpow(b, e, m) { var r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; }

  function gerandoChaves() {
    var p = gerandoPrimos(1000, 10000), q = gerandoPrimos(1000, 10000);
    while (p === q) { p = gerandoPrimos(1000, 10000); q = gerandoPrimos(1000, 10000); }
    var n = BigInt(p) * BigInt(q);
    var tot = BigInt(p - 1) * BigInt(q - 1);
    var e = randBig(2n, tot - 1n);
    while (emdc(tot, e)[0] !== 1n) e = randBig(2n, tot - 1n);
    var d = modInverso(e, tot);
    return [[e, n], [d, n]];
  }
  function lerChave(str) {
    var parts = str.trim().split(/\s+/);
    if (parts.length !== 2 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) return null;
    return [BigInt(parts[0]), BigInt(parts[1])];
  }
  function falha(msg) { err.textContent = msg; }

  $('rsa-gen').addEventListener('click', function () {
    falha('');
    var k = gerandoChaves();
    var pub = k[0][0] + ' ' + k[0][1], priv = k[1][0] + ' ' + k[1][1];
    $('rsa-pub').textContent = pub;
    $('rsa-priv').textContent = priv;
    $('rsa-pubkey').value = pub;
    $('rsa-privkey').value = priv;
    $('rsa-cipher').textContent = '—';
    $('rsa-cin').value = '';
    $('rsa-plain').textContent = '—';
  });

  $('rsa-enc').addEventListener('click', function () {
    falha('');
    var msg = $('rsa-in').value;
    if (!msg) return falha('Digite uma mensagem.');
    if (msg.length > 128) return falha('Mensagem muito comprida. Separe em duas mensagens.');
    var k = lerChave($('rsa-pubkey').value);
    if (!k) return falha('Digitou errado. Use a chave pública no formato xxxx xxxx.');
    var nums = Array.from(msg).map(function (ch) { return modpow(BigInt(ch.codePointAt(0)), k[0], k[1]).toString(); });
    var out = nums.join(' ');
    embaralhar($('rsa-cipher'), nums, ' ', digito, $('rsa-enc'), function () { $('rsa-cin').value = out; });
  });

  // Mostra números aleatórios que vão se fixando até o valor criptografado
  var animId = null;
  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&@*?!';
  function digito() { return Math.floor(Math.random() * 10); }
  function letra() { return CHARS[Math.floor(Math.random() * CHARS.length)]; }
  function embaralhar(el, nums, sep, rnd, btn, done) {
    if (animId) cancelAnimationFrame(animId);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { el.textContent = nums.join(sep); done(); return; }
    var dur = Math.min(3600, 1300 + nums.length * 100), t0 = performance.now();
    var last = 0;
    btn.disabled = true;
    function frame(now) {
      var p = Math.min(1, (now - t0) / dur);
      if (p < 1 && now - last < 55) { animId = requestAnimationFrame(frame); return; }
      last = now;
      el.textContent = nums.map(function (n, i) {
        var start = (i / nums.length) * 0.6;
        var local = Math.max(0, Math.min(1, (p - start) / 0.4));
        var fixed = Math.floor(local * n.length);
        var s = n.slice(0, fixed);
        for (var j = fixed; j < n.length; j++) s += n[j] === ' ' ? ' ' : rnd();
        return s;
      }).join(sep);
      if (p < 1) animId = requestAnimationFrame(frame);
      else { animId = null; el.textContent = nums.join(sep); btn.disabled = false; done(); }
    }
    animId = requestAnimationFrame(frame);
  }

  $('rsa-dec').addEventListener('click', function () {
    falha('');
    var nums = $('rsa-cin').value.trim().split(/\s+/).filter(Boolean);
    if (!nums.length) return falha('Cole o texto criptografado.');
    var k = lerChave($('rsa-privkey').value);
    if (!k) return falha('Digitou errado. Use a chave privada no formato xxxx xxxx.');
    try {
      var chars = nums.map(function (c) { return String.fromCodePoint(Number(modpow(BigInt(c), k[0], k[1]))); });
      embaralhar($('rsa-plain'), chars, '', letra, $('rsa-dec'), function () {});
    } catch (x) { falha('Não foi possível descriptografar com essa chave.'); }
  });

  $('rsa-gen').click();
})();

/* ---- Escala o iframe como tela de computador (1440x900) ---- */
(function () {
  var views = document.querySelectorAll('.monitor-view');
  if (!views.length) return;
  function fit(v) {
    var f = v.querySelector('iframe'); if (!f) return;
    if (!v.clientWidth) return;
    // Sempre como tela de computador (1440x900), apenas reduzida
    var w = v.clientWidth;
    var vw = 1440, vh = 900;
    var s = w / vw;
    f.style.width = vw + 'px';
    f.style.height = vh + 'px';
    f.style.transform = 'scale(' + s + ')';
  }
  Array.prototype.forEach.call(views, function (v) {
    fit(v);
    if ('ResizeObserver' in window) new ResizeObserver(function () { fit(v); }).observe(v);
  });
  window.addEventListener('resize', function () { Array.prototype.forEach.call(views, fit); });
  window.__fitMonitors = function (scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('.monitor-view'), fit);
  };
})();

/* ---- Labirinto: fila, pilha e lista (projeto 04) ---- */
(function () {
  var canvas = document.getElementById('maze-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var algo = 'fila', size = 21, grid = [], start, end, running = false, timer = null, history = {};
  var DESC = {
    fila: 'Fila (FIFO): o primeiro a entrar é o primeiro a sair. A busca avança em camadas, explorando tudo que está a 1 passo, depois a 2, e assim por diante. Sempre encontra o menor caminho.',
    pilha: 'Pilha (LIFO): o último a entrar é o primeiro a sair. A busca segue um corredor até o fim antes de voltar. Costuma visitar menos células, mas o caminho nem sempre é o menor.',
    lista: 'Lista: a cada passo, percorre a lista inteira e escolhe a célula mais próxima da saída. A escolha é guiada pela distância, mas procurar na lista a cada passo tem um custo.'
  };
  var C = { wall: '#0d0d0e', open: '#1c1c1e', visit: 'rgba(219,169,79,0.28)', front: '#9a7530', path: '#f2cd78', start: '#6fbf8a', end: '#e28a6b' };

  function gerar() {
    grid = [];
    for (var y = 0; y < size; y++) { grid.push([]); for (var x = 0; x < size; x++) grid[y].push(1); }
    var st = [[1, 1]]; grid[1][1] = 0;
    while (st.length) {
      var c = st[st.length - 1], cx = c[0], cy = c[1];
      var viz = [[2,0],[-2,0],[0,2],[0,-2]].filter(function (d) {
        var nx = cx + d[0], ny = cy + d[1];
        return nx > 0 && ny > 0 && nx < size - 1 && ny < size - 1 && grid[ny][nx] === 1;
      });
      if (!viz.length) { st.pop(); continue; }
      var d = viz[Math.floor(Math.random() * viz.length)];
      grid[cy + d[1] / 2][cx + d[0] / 2] = 0; grid[cy + d[1]][cx + d[0]] = 0;
      st.push([cx + d[0], cy + d[1]]);
    }
    // abre algumas paredes extras para existir mais de um caminho
    var extra = Math.floor(size * size / 40);
    for (var i = 0; i < extra; i++) {
      var rx = 1 + Math.floor(Math.random() * (size - 2)), ry = 1 + Math.floor(Math.random() * (size - 2));
      if (grid[ry][rx] === 1 && ((grid[ry][rx-1] === 0 && grid[ry][rx+1] === 0) || (grid[ry-1][rx] === 0 && grid[ry+1][rx] === 0))) grid[ry][rx] = 0;
    }
    start = [1, 1]; end = [size - 2, size - 2];
    history = {}; renderHist();
    resetStats(); desenhar();
  }

  function cell(x, y, color) {
    var s = canvas.width / size;
    ctx.fillStyle = color; ctx.fillRect(Math.floor(x * s), Math.floor(y * s), Math.ceil(s), Math.ceil(s));
  }
  function desenhar() {
    var px = Math.min(560, canvas.parentElement.clientWidth - 32) * (window.devicePixelRatio || 1);
    canvas.width = canvas.height = Math.max(size, Math.floor(px / size) * size);
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) cell(x, y, grid[y][x] ? C.wall : C.open);
    cell(start[0], start[1], C.start); cell(end[0], end[1], C.end);
  }
  function resetStats() { $('maze-visited').textContent = '—'; $('maze-path').textContent = '—'; $('maze-peak').textContent = '—'; }

  function dist(a) { return Math.abs(a[0] - end[0]) + Math.abs(a[1] - end[1]); }

  function resolver() {
    if (running) return;
    desenhar(); resetStats();
    running = true; $('maze-run').disabled = true;
    var key = function (p) { return p[0] + ',' + p[1]; };
    var estrutura = [start], veio = {}, visto = {}, visitadas = 0, pico = 1;
    visto[key(start)] = true;
    var passosPorFrame = size > 30 ? 6 : size > 15 ? 2 : 1;

    function tirar() {
      if (algo === 'fila') return estrutura.shift();
      if (algo === 'pilha') return estrutura.pop();
      var melhor = 0;
      for (var i = 1; i < estrutura.length; i++) if (dist(estrutura[i]) < dist(estrutura[melhor])) melhor = i;
      return estrutura.splice(melhor, 1)[0];
    }

    function passo() {
      for (var k = 0; k < passosPorFrame; k++) {
        if (!estrutura.length) return fim(null, visitadas, pico);
        var atual = tirar(); visitadas++;
        if (atual[0] === end[0] && atual[1] === end[1]) return fim(atual, visitadas, pico, veio);
        if (!(atual[0] === start[0] && atual[1] === start[1])) cell(atual[0], atual[1], C.visit);
        [[1,0],[0,1],[-1,0],[0,-1]].forEach(function (d) {
          var n = [atual[0] + d[0], atual[1] + d[1]];
          if (grid[n[1]][n[0]] === 0 && !visto[key(n)]) {
            visto[key(n)] = true; veio[key(n)] = atual; estrutura.push(n);
            if (!(n[0] === end[0] && n[1] === end[1])) cell(n[0], n[1], C.front);
          }
        });
        if (estrutura.length > pico) pico = estrutura.length;
      }
      $('maze-visited').textContent = visitadas;
      $('maze-peak').textContent = pico;
      timer = setTimeout(passo, 16);
    }

    function fim(alvo, vis, pk, veioMap) {
      $('maze-visited').textContent = vis; $('maze-peak').textContent = pk;
      if (!alvo) { $('maze-path').textContent = 'sem saída'; return parar(); }
      var caminho = [], p = alvo;
      while (p) { caminho.push(p); p = veioMap[key(p)]; }
      caminho.reverse();
      var i = 0;
      (function pinta() {
        for (var j = 0; j < passosPorFrame * 2 && i < caminho.length; j++, i++) {
          var c = caminho[i];
          if (!(c[0] === start[0] && c[1] === start[1]) && !(c[0] === end[0] && c[1] === end[1])) cell(c[0], c[1], C.path);
        }
        $('maze-path').textContent = i;
        if (i < caminho.length) timer = setTimeout(pinta, 16);
        else { history[algo] = { vis: vis, path: caminho.length, peak: pk }; renderHist(); parar(); }
      })();
    }
    function parar() { running = false; $('maze-run').disabled = false; }
    passo();
  }

  function renderHist() {
    var nomes = { fila: 'Fila', pilha: 'Pilha', lista: 'Lista' };
    var ks = Object.keys(history);
    $('maze-history').hidden = !ks.length;
    if (!ks.length) return;
    var max = Math.max.apply(null, ks.map(function (k) { return history[k].vis; }));
    $('maze-hist-rows').innerHTML = ['fila', 'pilha', 'lista'].filter(function (k) { return history[k]; }).map(function (k) {
      var h = history[k];
      return '<div class="maze-hist-row"><b>' + nomes[k] + '</b><span class="maze-bar"><i style="width:' + Math.round(h.vis / max * 100) + '%"></i></span><span>' + h.vis + ' visitadas · caminho ' + h.path + '</span></div>';
    }).join('');
  }

  function parar() { clearTimeout(timer); running = false; $('maze-run').disabled = false; }

  Array.prototype.forEach.call(document.querySelectorAll('.maze-opt'), function (b) {
    b.addEventListener('click', function () {
      if (running) return;
      algo = b.dataset.algo;
      document.querySelectorAll('.maze-opt').forEach(function (o) { o.classList.toggle('is-on', o === b); o.setAttribute('aria-pressed', o === b); });
      $('maze-desc').textContent = DESC[algo];
      desenhar(); resetStats();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.maze-size'), function (b) {
    b.addEventListener('click', function () {
      parar();
      size = +b.dataset.size;
      document.querySelectorAll('.maze-size').forEach(function (o) { o.classList.toggle('is-on', o === b); o.setAttribute('aria-pressed', o === b); });
      gerar();
    });
  });
  $('maze-new').addEventListener('click', function () { parar(); gerar(); });
  $('maze-run').addEventListener('click', resolver);

  $('maze-desc').textContent = DESC[algo];
  gerar();
  var tab = document.getElementById('tab-poo');
  if (tab) tab.addEventListener('click', function () { setTimeout(function () { if (!running) desenhar(); }, 30); });
  var mzT;
  window.addEventListener('resize', function () {
    clearTimeout(mzT); mzT = setTimeout(function () { if (!running) desenhar(); }, 150);
  });
})();

/* ---- Chat em rede (projeto 05): simulação do protocolo do server.py ---- */
(function () {
  var root = document.getElementById('chat-demo');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var NOMES = { 1: 'Equipe Alfa', 2: 'Equipe Beta' };
  var srv = $('chat-srv-log');

  function hex(n, bytes) { var s = n.toString(16).padStart(bytes * 2, '0'); return s.match(/../g).join(' '); }
  function srvLine(html) {
    var d = document.createElement('div'); d.innerHTML = html; srv.appendChild(d); srv.scrollTop = srv.scrollHeight;
  }
  function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function msg(logId, texto, de, souEu) {
    var log = $(logId), vazio = log.querySelector('.chat-empty'); if (vazio) vazio.remove();
    var m = document.createElement('div'); m.className = 'chat-msg' + (souEu ? ' is-me' : '');
    m.innerHTML = '<small>' + (souEu ? 'Você' : NOMES[de]) + '</small>' + esc(texto);
    log.appendChild(m); log.scrollTop = log.scrollHeight;
  }
  function reset() {
    [1, 2].forEach(function (i) { $('chat-log-' + i).innerHTML = '<span class="chat-empty">Selecione e envie uma mensagem</span>'; });
    srv.innerHTML = '';
    srvLine('<span class="g">Starting server...</span>');
    srvLine('Client (\'10.0.0.11\', 51234) connected...');
    srvLine('Client (\'10.0.0.12\', 51235) connected...');
    srvLine('Login ok: <span class="b">Equipe Alfa</span> → id 1 · <span class="b">Equipe Beta</span> → id 2');
  }

  Array.prototype.forEach.call(root.querySelectorAll('.chat-form'), function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = f.querySelector('input'), texto = input.value.trim();
      if (!texto) return;
      var de = +f.dataset.me, para = de === 1 ? 2 : 1;
      var bytes = new TextEncoder().encode(texto).length;
      input.value = '';
      msg('chat-log-' + de, texto, de, true);
      srvLine('recv  id ' + de + ' → <span class="b">54</span> ' + hex(para, 1) + ' <span class="b">' + hex(bytes, 8) + '</span> + ' + bytes + ' bytes  <span class="g">"T" para id ' + para + '</span>');
      setTimeout(function () {
        srvLine('send  → id ' + para + ' · <span class="b">54</span> ' + hex(de, 1) + ' <span class="b">' + hex(bytes, 8) + '</span> + ' + bytes + ' bytes');
        msg('chat-log-' + para, texto, de, false);
      }, 450);
    });
  });
  $('chat-reset').addEventListener('click', reset);
  reset();
})();

/* ---- Abas: projetos acadêmicos / profissionais ---- */
(function () {
  var btns = document.querySelectorAll('.project-cat');
  if (!btns.length) return;
  var rows = document.querySelectorAll('.project-row[data-cat]');
  function contar() {
    Array.prototype.forEach.call(btns, function (b) {
      var n = document.querySelectorAll('.project-row[data-cat="' + b.dataset.cat + '"]').length;
      b.querySelector('.project-cat-n').textContent = String(n).padStart(2, '0');
    });
  }
  function mostrar(cat) {
    Array.prototype.forEach.call(btns, function (b) {
      var on = b.dataset.cat === cat;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on);
    });
    Array.prototype.forEach.call(rows, function (r) {
      var show = r.dataset.cat === cat;
      r.hidden = !show;
      if (show) r.classList.add('is-visible');
      if (!show) {
        var t = r.querySelector('.project-tab'), p = r.querySelector('.project-panel');
        if (t && t.getAttribute('aria-selected') === 'true') { t.setAttribute('aria-selected', 'false'); if (p) p.hidden = true; }
      }
    });
  }
  Array.prototype.forEach.call(btns, function (b) { b.addEventListener('click', function () { mostrar(b.dataset.cat); }); });
  contar();
  mostrar('academico');
})();


/* ---- Fundo: onda do mar vista de cima (partículas douradas) ----
   Desenho direto em buffer de pixels (ImageData) para manter 60fps com muitas partículas. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var c = document.createElement('canvas');
  var touch = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
  c.className = 'bg-wave'; c.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(c, document.body.firstChild);
  var ctx = c.getContext('2d'), W, H, img, buf, N, PX, PY, PJ, PB, raf;
  function resize() {
    var nw = window.innerWidth, nh = window.innerHeight;
    if (!nw || !nh) { img = null; return; }
    // celular: a barra do navegador muda a altura ao rolar; não recria o fundo por isso
    if (img && nw === W && nh <= H) return;
    W = nw; H = nh + (touch ? 140 : 0);
    c.width = W; c.height = H; c.style.height = H + 'px';
    img = ctx.createImageData(W, H); buf = new Uint32Array(img.data.buffer);
    N = Math.min(Math.round(W * H / 75), W < 700 ? 8000 : 22000);
    PX = new Float32Array(N); PY = new Float32Array(N); PJ = new Float32Array(N); PB = new Uint8Array(N);
    for (var i = 0; i < N; i++) { PX[i] = Math.random() * W; PY[i] = Math.random() * H; PJ[i] = 0.55 + Math.random() * 0.45; PB[i] = Math.random() < 0.35 ? 1 : 0; }
  }
  // cores (little-endian ABGR): latão e latão claro
  var GAP = 2400, BAND = 0, SPEED = 220;
  var custo = 0, quadros = 0;
  var R0 = 219, G0 = 169, B0 = 79, R1 = 242, G1 = 205, B1 = 120;
  function frame(now) {
    var t = now * 0.0004;
    if (!img) { if (!reduce) raf = requestAnimationFrame(frame); if (window.innerWidth && window.innerHeight) resize(); return; }
    var ts = performance.now();
    buf.fill(0);
    for (var i = 0; i < N; i++) {
      var x = PX[i], y = PY[i];
      // cada onda é uma faixa curva que atravessa a tela; entre uma e outra, água calma
      var perp = -x * 0.6 + y * 0.8;
      var u = x * 0.8 + y * 0.6 + Math.sin(perp / 340 + t * 0.15) * 70 + Math.sin(perp / 150 - t * 0.2) * 18;
      var f = ((u - t * SPEED) % GAP + GAP) % GAP / GAP;   // 0..1 dentro do ciclo
      // perfil único e contínuo: frente íngreme, depois uma cauda longa que se desfaz aos poucos
      var g = ((BAND - f) % 1 + 1) % 1;                   // 0 = frente da onda, cresce depois que ela passa
      var cr = g < 0.035 ? g / 0.035 : Math.exp(-(g - 0.035) * 6);
      if (cr < 0.6 && ((i * 0.618034) % 1) > cr * 1.7) cr = 0;   // cauda vai ficando rala
      var calm = 0.12 + Math.sin(x / 90 + t * 0.3) * Math.sin(y / 110 - t * 0.25) * 0.06;
      var a = (cr > 0 ? 0.02 + cr * 0.42 : 0) * PJ[i];
      if (a < 0.04) { if (PJ[i] > 0.93) a = calm * 0.45; else continue; }
      var px = (x + cr * 6.4) | 0, py = (y + cr * 4.8) | 0;
      if (px < 0 || py < 0 || px >= W - 1 || py >= H - 1) continue;
      var A = (a * 255) | 0, hi = cr > 0.75;
      var col = (A << 24) | ((hi ? B1 : B0) << 16) | ((hi ? G1 : G0) << 8) | (hi ? R1 : R0);
      var k = py * W + px;
      buf[k] = col;
      if (PB[i]) { buf[k + 1] = col; buf[k + W] = col; buf[k + W + 1] = col; }
    }
    ctx.putImageData(img, 0, 0);
    // aparelho mais lento: reduz as partículas aos poucos até manter a fluidez
    custo = custo * 0.94 + (performance.now() - ts) * 0.06;
    if (++quadros > 90 && custo > 9 && N > 3000) { N = Math.round(N * 0.8); quadros = 0; }
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  resize(); frame(0);
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (reduce) frame(0); }, 120); });
  document.addEventListener('visibilitychange', function () {
    if (reduce) return;
    if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(frame);
  });
})();

/* ---- Barra de rolagem dourada animada (telas com mouse) ---- */
(function () {
  if (!window.matchMedia || !window.matchMedia('(pointer:fine)').matches) return;
  var root = document.documentElement; root.classList.add('gold-scroll');
  var rail = document.createElement('div'); rail.className = 'gold-rail'; rail.setAttribute('aria-hidden', 'true');
  var thumb = document.createElement('div'); thumb.className = 'gold-thumb';
  rail.appendChild(thumb); document.body.appendChild(rail);
  function update() {
    var vh = window.innerHeight, dh = root.scrollHeight;
    if (dh <= vh + 1) { rail.style.display = 'none'; return; }
    rail.style.display = '';
    var h = Math.max(40, vh * vh / dh);
    var y = (window.scrollY / (dh - vh)) * (vh - h);
    thumb.style.height = h + 'px'; thumb.style.transform = 'translateY(' + y + 'px)';
  }
  var drag = null;
  thumb.addEventListener('pointerdown', function (e) {
    e.preventDefault(); thumb.setPointerCapture(e.pointerId); thumb.classList.add('dragging');
    drag = { y: e.clientY, s: window.scrollY };
    root.style.scrollBehavior = 'auto';
  });
  thumb.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var vh = window.innerHeight, dh = root.scrollHeight, h = thumb.offsetHeight;
    window.scrollTo(0, drag.s + (e.clientY - drag.y) * (dh - vh) / (vh - h));
  });
  function end() { drag = null; thumb.classList.remove('dragging'); root.style.scrollBehavior = ''; }
  thumb.addEventListener('pointerup', end); thumb.addEventListener('pointercancel', end);
  rail.addEventListener('pointerdown', function (e) {
    if (e.target !== rail) return;
    var vh = window.innerHeight, dh = root.scrollHeight;
    window.scrollTo({ top: (e.clientY / vh) * (dh - vh), behavior: 'smooth' });
  });
  var uq = false;
  function agendar() { if (uq) return; uq = true; requestAnimationFrame(function () { uq = false; update(); }); }
  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(document.body);
  update();
})();

/* ---- Cursor bolinha dourada (telas com mouse) ---- */
(function () {
  if (!window.matchMedia || !window.matchMedia('(pointer:fine)').matches) return;
  document.documentElement.classList.add('gold-cursor');
  var dot = document.createElement('div'); dot.className = 'gold-dot is-hidden'; dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  var sel = 'a, button, [role="button"], input, textarea, select, label, .cert-card, .project-tab, .gold-thumb';
  var px = 0, py = 0, alvo = null, pend = false;
  function pintar() {
    pend = false;
    dot.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
    dot.classList.remove('is-hidden');
    dot.classList.toggle('is-hover', !!(alvo && alvo.closest && alvo.closest(sel)));
  }
  document.addEventListener('pointermove', function (e) {
    px = e.clientX; py = e.clientY; alvo = e.target;
    if (!pend) { pend = true; requestAnimationFrame(pintar); }
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { dot.classList.add('is-hidden'); });
})();

/* ---- Trajetória: estrada em S ligando os marcos (1ª experiência no início) ---- */
(function () {
  var road = document.getElementById('road'); if (!road) return;
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'road-svg'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<defs><linearGradient id="roadGold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000">' +
    '<stop offset="0" stop-color="#a3742c"/><stop offset=".5" stop-color="#f5d58a"/><stop offset="1" stop-color="#a3742c"/></linearGradient></defs>' +
    '<path class="road-base"/><path class="road-glow"/>';
  road.insertBefore(svg, road.firstChild);
  var base = svg.querySelector('.road-base'), glow = svg.querySelector('.road-glow'), grad = svg.querySelector('linearGradient');
  var len = 0;
  function build() {
    var W = road.clientWidth, lis = road.querySelectorAll('li');
    if (window.innerWidth <= 760) {
      // mobile: estrada vertical com leve ondulação ligando os marcos
      var x = lis[0].offsetLeft - 37 + 5.5, top = lis[0].offsetTop + 10.5, end = lis[lis.length - 1].offsetTop + lis[lis.length - 1].offsetHeight;
      var dm = 'M' + x + ' ' + top, steps = Math.max(2, Math.round((end - top) / 120));
      var seg = (end - top) / steps;
      for (var j = 0; j < steps; j++) {
        var y0 = top + j * seg, s1 = j % 2 ? -7 : 7;
        dm += ' C' + (x + s1) + ' ' + (y0 + seg * 0.33) + ' ' + (x + s1) + ' ' + (y0 + seg * 0.66) + ' ' + x + ' ' + (y0 + seg);
      }
      base.setAttribute('d', dm); glow.setAttribute('d', dm);
      grad.setAttribute('y2', road.clientHeight);
      len = glow.getTotalLength(); glow.style.strokeDasharray = len; progress();
      return;
    }
    var L = 0, R = W, k = 48, d = '';
    var ys = Array.prototype.map.call(lis, function (li) { return li.offsetTop + 0.5; });
    for (var i = 0; i < lis.length; i++) {
      var y = ys[i], ltr = i % 2 === 0;
      if (i === 0) d = 'M' + L + ' ' + y;
      if (i === lis.length - 1) { d += ' L' + (ltr ? W * 0.6 : W * 0.4) + ' ' + y; break; }
      var yn = ys[i + 1];
      if (ltr) d += ' L' + (R - k) + ' ' + y + ' A' + k + ' ' + k + ' 0 0 1 ' + R + ' ' + (y + k) +
                    ' L' + R + ' ' + (yn - k) + ' A' + k + ' ' + k + ' 0 0 1 ' + (R - k) + ' ' + yn;
      else     d += ' L' + (L + k) + ' ' + y + ' A' + k + ' ' + k + ' 0 0 0 ' + L + ' ' + (y + k) +
                    ' L' + L + ' ' + (yn - k) + ' A' + k + ' ' + k + ' 0 0 0 ' + (L + k) + ' ' + yn;
    }
    base.setAttribute('d', d); glow.setAttribute('d', d);
    grad.setAttribute('y2', road.clientHeight);
    len = glow.getTotalLength();
    glow.style.strokeDasharray = len; progress();
  }
  function progress() {
    if (!len) return;
    var r = road.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / r.height));
    glow.style.strokeDashoffset = len * (1 - p);
  }
  build();
  window.addEventListener('resize', build);
  var rq = false;
  window.addEventListener('scroll', function () {
    if (rq) return; rq = true;
    requestAnimationFrame(function () { rq = false; progress(); });
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(build).observe(road);
})();

/* ---- Animações douradas só rodam enquanto estão visíveis na tela ---- */
(function () {
  if (!document.getAnimations || !('IntersectionObserver' in window)) return;
  function iniciar() {
    var mapa = new Map();
    document.getAnimations().forEach(function (a) {
      var alvo = a.effect && a.effect.target;
      if (!alvo || a.animationName !== 'onda' || alvo === document.documentElement) return;
      if (!mapa.has(alvo)) mapa.set(alvo, []);
      mapa.get(alvo).push(a);
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        (mapa.get(e.target) || []).forEach(function (a) { if (e.isIntersecting) a.play(); else a.pause(); });
      });
    }, { rootMargin: '120px 0px' });
    mapa.forEach(function (_, alvo) { io.observe(alvo); });
  }
  if (document.readyState === 'complete') iniciar(); else window.addEventListener('load', iniciar);
})();

/* ---- Placeholder "Digite aqui" com 3 pontos animados ---- */
(function () {
  var el = document.getElementById('rsa-in'); if (!el) return;
  var n = 0;
  setInterval(function () {
    n = (n + 1) % 4;
    el.placeholder = 'Digite aqui' + '...'.slice(0, n);
  }, 450);
})();
