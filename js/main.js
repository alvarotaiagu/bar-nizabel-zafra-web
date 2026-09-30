/* ═══════════════════════════════════════════════════════════════════════════
   Bar Nizabel · «Punto medio»
   El punto de «CAFÉ · COPAS» hace de hilo: la cortina es ese punto que se
   estira en línea y se abre; en el hero, al bajar, CAFÉ se va, COPAS se centra
   y el punto crece detrás; los separadores son una línea que sale del punto;
   la terraza se abre desde un punto; y el estado «abierto ahora» es un punto.

   Banderas separadas a propósito:
     gsapReady  → hay motor de animación (GSAP + ScrollTrigger cargados)
     movimiento → además el usuario NO ha pedido reducir el movimiento
   Con movimiento reducido el CONTENIDO sigue: el estado en vivo, el día de hoy
   en la tabla, las agujas de los relojes y las cifras. Lo que se apaga es el
   viaje.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esTactil = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapReady && !reduce;
  var gsap = window.gsap;
  var H = window.NizabelHorario;

  if (gsapReady) gsap.registerPlugin(window.ScrollTrigger);
  if (movimiento) html.classList.add('con-movimiento');

  function densidad() { return html.classList.contains('densidad-sobria') ? 'sobria' : 'punto'; }
  function alturaCabecera() { return parseFloat(getComputedStyle(html).getPropertyValue('--cab')) || 72; }
  function refrescar() { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }
  function todos(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }

  function cuandoVisible(nodos, umbral, alEntrar) {
    if (!('IntersectionObserver' in window)) { nodos.forEach(alEntrar); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        alEntrar(en.target);
      });
    }, { threshold: umbral });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  /* ───────────────────────── Lenis ───────────────────────── */
  var lenis = null;
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  }

  function irA(destino) {
    var desfase = -alturaCabecera() + 1;
    if (lenis) { lenis.scrollTo(destino, { offset: desfase, duration: 1.5 }); return; }
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset + desfase);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || !document.querySelector(id)) return;
    e.preventDefault();
    cerrarMenu();
    irA(id === '#inicio' ? 0 : id);
  });

  /* ───────────────────── estado en vivo (contenido: siempre) ───────────────────── */
  /* Las pruebas fijan la hora con window.NIZABEL_RELOJ; en la web es la del reloj. */
  function fechaAhora() { return window.NIZABEL_RELOJ ? new Date(window.NIZABEL_RELOJ) : new Date(); }

  function pintarEstado() {
    if (!H) return;
    var e = H.ahora(fechaAhora());
    todos('[data-estado]').forEach(function (el) {
      el.classList.toggle('estado--abierto', e.abierto);
      el.classList.toggle('estado--cerrado', !e.abierto);
      var t = el.querySelector('[data-estado-texto]');
      if (t) t.textContent = e.frase;
    });
    var marcado = H.diaMarcado(e);
    todos('#semana tr[data-dia]').forEach(function (tr) {
      var es = Number(tr.dataset.dia) === marcado;
      tr.classList.toggle('hoy', es);
      if (es) tr.setAttribute('aria-current', 'date'); else tr.removeAttribute('aria-current');
    });
    var momento = document.querySelector('[data-ahora-momento]');
    var que = document.querySelector('[data-ahora-que]');
    var estado = document.querySelector('[data-ahora-estado]');
    if (momento && que && estado) {
      if (e.momento) {
        momento.textContent = e.momento.texto;
        que.textContent = '· ' + e.momento.que;
      } else {
        momento.textContent = 'cerrado';
        que.textContent = '';
      }
      estado.textContent = e.frase;
    }
    html.dataset.momento = e.momento ? e.momento.id : 'cerrado';
  }
  pintarEstado();
  setInterval(pintarEstado, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) pintarEstado(); });

  /* ───────────────────── carta (preparada, vacía hasta que la pasen) ───────────────────── */
  (function carta() {
    if (!window.fetch) return;
    fetch('data/carta.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (datos) {
      if (!datos || !datos.momentos) return;
      var hubo = false;
      Object.keys(datos.momentos).forEach(function (id) {
        var lista = document.querySelector('[data-carta="' + id + '"]');
        var items = datos.momentos[id] || [];
        if (!lista || !items.length) return;
        items.forEach(function (it) {
          var li = document.createElement('li');
          li.textContent = it.nombre + (it.precio ? ' · ' + it.precio : '');
          lista.appendChild(li);
        });
        lista.hidden = false;
        hubo = true;
      });
      if (hubo) document.dispatchEvent(new CustomEvent('pila-cambiada'));
    }).catch(function () { /* sin carta: la pila se queda con las categorías */ });
  })();

  /* ───────────────────── titulares partidos ───────────────────── */
  function partir(el) {
    var modo = el.dataset.revelar;
    var texto = el.textContent.trim();
    var palabras = texto.split(/\s+/);
    if (!el.closest('[aria-hidden="true"]')) el.setAttribute('aria-label', texto);
    el.textContent = '';
    var piezas = [];
    palabras.forEach(function (palabra, i) {
      var caja = document.createElement('span');
      caja.className = 'palabra';
      caja.setAttribute('aria-hidden', 'true');
      if (modo === 'letras') {
        palabra.split('').forEach(function (c) {
          var s = document.createElement('span');
          s.className = 'letra';
          s.textContent = c;
          caja.appendChild(s);
          piezas.push(s);
        });
      } else {
        var s = document.createElement('span');
        s.className = 'palabra-int';
        s.textContent = palabra;
        caja.appendChild(s);
        piezas.push(s);
      }
      el.appendChild(caja);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return piezas;
  }

  function revelar(el, piezas, retardo) {
    gsap.to(piezas, {
      y: 0, yPercent: 0, duration: 1.1, ease: 'expo.out', delay: retardo || 0,
      stagger: el.dataset.revelar === 'letras' ? 0.045 : 0.08
    });
  }

  todos('[data-revelar]').forEach(function (el) {
    var piezas = partir(el);
    if (!movimiento) return;
    if (el.closest('.hero')) {
      /* el rótulo del hero espera a que la línea de la cortina empiece a abrirse */
      var retardo = el.classList.contains('hero__copas') ? 0.12 : 0;
      document.addEventListener('cortina-abre', function () { revelar(el, piezas, 0.25 + retardo); }, { once: true });
      return;
    }
    /* una sola vez: IntersectionObserver (ScrollTrigger once:true no dispara si ya está en pantalla) */
    cuandoVisible([el], 0.3, function () { revelar(el, piezas); });
  });

  /* ───────────────── cortina: punto → línea → la línea se abre ───────────────── */
  var cortinaAbierta = false;
  function avisarApertura() {
    if (cortinaAbierta) return;
    cortinaAbierta = true;
    document.dispatchEvent(new CustomEvent('cortina-abre'));
  }

  (function cortina() {
    var cort = document.getElementById('cortina');
    if (!cort) { avisarApertura(); return; }
    var lienzo = document.getElementById('cortina-lienzo');
    var muro = document.getElementById('cortina-muro');
    var filo = document.getElementById('cortina-filo');
    var punto = document.getElementById('cortina-punto');
    var izq = cort.querySelector('.cortina__palabra--izq > span');
    var der = cort.querySelector('.cortina__palabra--der > span');
    var hecho = false;

    function retirar() {
      if (hecho) return;
      hecho = true;
      avisarApertura();
      cort.classList.add('fuera');
      html.classList.add('cortina-fuera');
      /* con Lenis, lagSmoothing(0) al retirarla, nunca antes (el tirón de la carga saltaría el trazo) */
      if (gsapReady) gsap.ticker.lagSmoothing(0);
      refrescar();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }

    if (!movimiento) {
      /* sin GSAP o con movimiento reducido se retira igual: nunca tapa la página */
      setTimeout(retirar, reduce ? 0 : 60);
      return;
    }

    var w = 0, h = 0;
    var lente = { a: 0, b: 0, filo: 1 };

    /* Hueco en forma de lente, de (cx−a, cy) a (cx+a, cy), con altura 2b en el centro.
       Con a = 0,75·ancho, para destapar las esquinas basta b ≈ 0,95·alto. */
    function hueco() {
      var cx = w / 2, cy = h / 2, a = lente.a, b = lente.b;
      return 'M' + (cx - a).toFixed(1) + ' ' + cy +
        'Q' + cx + ' ' + (cy - 2 * b).toFixed(1) + ' ' + (cx + a).toFixed(1) + ' ' + cy +
        'Q' + cx + ' ' + (cy + 2 * b).toFixed(1) + ' ' + (cx - a).toFixed(1) + ' ' + cy + 'Z';
    }
    function pintar() {
      var d = lente.a > 0 ? hueco() : '';
      muro.setAttribute('d', 'M0 0H' + w + 'V' + h + 'H0Z' + d);
      filo.setAttribute('d', d);
      filo.style.opacity = lente.filo;
    }
    function medir() {
      w = window.innerWidth; h = window.innerHeight;
      lienzo.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      pintar();
    }
    medir();
    cort.classList.add('cortina--pintada');      /* ya hay muro: el fondo provisional se quita */
    window.addEventListener('resize', medir);

    var conPunto = densidad() === 'punto';
    var tl = gsap.timeline({ paused: true, onComplete: retirar });
    var abre;
    if (conPunto) {
      var anchoPunto = punto.offsetWidth || 18;
      tl.to(punto, { scale: 1, duration: 0.55, ease: 'expo.out' }, 0)
        /* CAFÉ y COPAS salen del punto, cada una hacia su lado */
        .to([izq, der], { x: 0, xPercent: 0, duration: 0.8, ease: 'expo.out' }, 0.28)
        .to([izq, der], { opacity: 0, duration: 0.3, ease: 'power2.in' }, 1.3)
        /* el punto se estira hasta ser una línea de lado a lado */
        .to(punto, {
          scaleX: function () { return (w * 1.5) / anchoPunto; },
          scaleY: 3 / anchoPunto,
          duration: 0.7, ease: 'expo.inOut'
        }, 1.45)
        .set(punto, { opacity: 0 }, 2.15)
        .set(lente, { a: function () { return w * 0.75; }, b: 0.9, onComplete: pintar }, 2.15);
      abre = 2.15;
    } else {
      /* sobria: sin punto ni palabras, solo la línea que se abre */
      tl.set(punto, { opacity: 0 }, 0)
        .fromTo(lente, { a: 0, b: 0.9 }, { a: function () { return w * 0.75; }, b: 0.9, duration: 0.7, ease: 'expo.inOut', onUpdate: pintar, immediateRender: false }, 0.1);
      abre = 0.8;
    }
    tl.call(avisarApertura, null, abre)
      .to(lente, { b: function () { return h * 1.02; }, duration: 1.15, ease: 'expo.inOut', onUpdate: pintar }, abre)
      .to(lente, { filo: 0, duration: 0.45, ease: 'power1.in', onUpdate: pintar }, abre + 0.55);

    /* arranca con la letra ya cargada (como mucho espera 700 ms) */
    var arrancada = false;
    function arrancar() { if (!arrancada) { arrancada = true; tl.play(); } }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arrancar);
    setTimeout(arrancar, 700);

    /* quien empieza a bajar no espera: la cortina acelera, no se corta */
    function prisa() { if (!hecho) tl.timeScale(3.2); }
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, prisa, { passive: true, once: true }); });

    /* red de seguridad: pase lo que pase, a los 6 s la cortina se va */
    setTimeout(retirar, 6000);
  })();

  /* ───────────────── hero: CAFÉ se va, COPAS se centra, el punto crece ───────────────── */
  (function hero() {
    var seccion = document.getElementById('inicio');
    if (!seccion) return;
    var cafe = seccion.querySelector('.hero__cafe');
    var copas = seccion.querySelector('.hero__copas');
    var punto = document.getElementById('hero-punto');
    var puntoInt = punto.querySelector('.hero__punto-int');
    var nombre = seccion.querySelector('.hero__nombre');
    var pie = seccion.querySelector('.hero__pie');
    var desliza = seccion.querySelector('.hero__desliza');
    if (!movimiento) return;

    /* entrada tras la cortina (propiedades distintas de las del scroll) */
    gsap.set(puntoInt, { scale: 0 });
    gsap.set([nombre, pie], { opacity: 0, y: 22 });
    document.addEventListener('cortina-abre', function () {
      gsap.to(puntoInt, { scale: 1, duration: 0.9, ease: 'back.out(2.2)', delay: 0.2 });
      gsap.to([nombre, pie], { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, delay: 0.55 });
    }, { once: true });

    var disparo = null;
    function montar() {
      if (disparo) { disparo.kill(true); disparo = null; }
      gsap.set([cafe, copas, punto], { clearProps: 'transform,opacity' });
      if (desliza) gsap.set(desliza, { clearProps: 'opacity' });
      if (densidad() !== 'punto') return;

      var tl = gsap.timeline({ defaults: { ease: 'none' } });
      tl.fromTo(cafe, { x: 0, opacity: 1 }, {
        x: function () { return -(cafe.getBoundingClientRect().right + 60); },
        opacity: 0, duration: 0.6, ease: 'power1.in', immediateRender: false
      }, 0)
        .fromTo(copas, { x: 0 }, {
          x: function () {
            var r = copas.getBoundingClientRect();
            return window.innerWidth / 2 - (r.left + r.width / 2);
          },
          duration: 0.75, ease: 'power2.inOut', immediateRender: false
        }, 0.1)
        .fromTo(punto, { scale: 1 }, {
          /* crece detrás de COPAS hasta ~la mitad de la pantalla, quieto en su sitio */
          scale: function () {
            var d = punto.offsetWidth || 1;
            return Math.min(window.innerWidth * 0.7, window.innerHeight * 0.5, copas.offsetWidth * 1.3) / d;
          },
          duration: 0.9, ease: 'power2.inOut', immediateRender: false
        }, 0.1);
      if (desliza) tl.to(desliza, { opacity: 0, duration: 0.15 }, 0);

      disparo = window.ScrollTrigger.create({
        trigger: seccion,
        start: 'top top',
        end: '+=110%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: tl
      });
    }
    montar();
    document.addEventListener('densidad-cambiada', function () { montar(); refrescar(); });
  })();

  /* ───────────────── relojes: marcas, agujas y trazo ───────────────── */
  (function relojes() {
    var ns = 'http://www.w3.org/2000/svg';
    todos('.reloj').forEach(function (fig) {
      var g = fig.querySelector('.reloj__marcas');
      for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6;
        var r1 = i % 3 === 0 ? 64 : 70, r2 = 78;
        var l = document.createElementNS(ns, 'line');
        l.setAttribute('x1', (100 + r1 * Math.sin(a)).toFixed(2));
        l.setAttribute('y1', (100 - r1 * Math.cos(a)).toFixed(2));
        l.setAttribute('x2', (100 + r2 * Math.sin(a)).toFixed(2));
        l.setAttribute('y2', (100 - r2 * Math.cos(a)).toFixed(2));
        if (i % 3 === 0) l.setAttribute('class', 'reloj__marca--cuarto');
        g.appendChild(l);
      }
      var partes = fig.dataset.hora.split(':');
      var hh = Number(partes[0]), mm = Number(partes[1]);
      var angHoras = ((hh % 12) + mm / 60) * 30;
      var angMin = mm * 6;
      var horas = fig.querySelector('.reloj__horas');
      var minutos = fig.querySelector('.reloj__minutos');
      var esfera = fig.querySelector('.reloj__esfera');

      if (!movimiento) {
        /* sin viaje, pero el reloj marca su hora igual */
        horas.setAttribute('transform', 'rotate(' + angHoras + ' 100 100)');
        minutos.setAttribute('transform', 'rotate(' + angMin + ' 100 100)');
        return;
      }
      var largo = 2 * Math.PI * 88;
      gsap.set(esfera, { strokeDasharray: largo, strokeDashoffset: largo });
      gsap.set([horas, minutos], { rotation: 0, svgOrigin: '100 100' });
      gsap.set(g.children, { opacity: 0 });
      cuandoVisible([fig], 0.45, function () {
        gsap.to(esfera, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' });
        gsap.to(g.children, { opacity: 1, duration: 0.3, stagger: 0.04, delay: 0.3 });
        /* las agujas dan vueltas hasta su hora: la de minutos dos vueltas de más */
        gsap.to(horas, { rotation: angHoras, svgOrigin: '100 100', duration: 2, ease: 'expo.out', delay: 0.4 });
        gsap.to(minutos, { rotation: angMin + 720, svgOrigin: '100 100', duration: 2, ease: 'expo.out', delay: 0.4 });
      });
    });
  })();

  /* ───────────────── pila: mismo alto para todas, medido ───────────────── */
  (function pila() {
    var seccion = document.getElementById('horario');
    var lista = document.getElementById('pila');
    if (!seccion || !lista) return;
    var items = todos('.pila__item', lista);
    var disparos = [];

    /* Todas miden lo que la más alta (condición para que la pila no se deshaga)
       y se mide el contenido real, nunca la pantalla. Si la más alta no cabe
       anclada bajo la cabecera, se desapila. */
    function igualar() {
      var tarjetas = items.map(function (it) { return it.querySelector('.tarjeta'); });
      seccion.classList.remove('pila-suelta');
      lista.style.removeProperty('--alto-tarjeta');
      tarjetas.forEach(function (t) { t.style.height = 'auto'; });
      var alto = Math.max.apply(null, tarjetas.map(function (t) { return t.offsetHeight; }));   /* offsetHeight ignora el scale */
      tarjetas.forEach(function (t) { t.style.removeProperty('height'); });
      var tope = alturaCabecera() + window.innerHeight * 0.03;
      if (alto > window.innerHeight - tope - 16) { seccion.classList.add('pila-suelta'); return false; }
      lista.style.setProperty('--alto-tarjeta', alto + 'px');
      return true;
    }

    function montar() {
      var apilada = igualar();
      disparos.forEach(function (d) { d.kill(); });
      disparos = [];
      items.forEach(function (it) {
        var t = it.querySelector('.tarjeta');
        if (gsapReady) gsap.set(t, { clearProps: 'transform' });
        t.style.removeProperty('--oscuro');
      });
      if (!movimiento || !apilada) return;
      var tope = alturaCabecera() + window.innerHeight * 0.03;
      items.forEach(function (it, i) {
        var siguiente = items[i + 1];
        if (!siguiente) return;
        var tarjeta = it.querySelector('.tarjeta');
        var tw = gsap.fromTo(tarjeta, { scale: 1, '--oscuro': 0 }, { scale: 0.93, '--oscuro': 0.3, ease: 'none', paused: true });
        disparos.push(window.ScrollTrigger.create({
          trigger: siguiente,
          start: 'top bottom',
          end: 'top ' + Math.round(tope) + 'px',          /* acaba justo cuando la siguiente se posa */
          scrub: true,
          animation: tw
        }));
      });
    }

    montar();
    var temporizador;
    function rehacer(ms) {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { montar(); refrescar(); }, ms);
    }
    window.addEventListener('resize', function () { rehacer(220); });
    document.addEventListener('densidad-cambiada', function () { rehacer(60); });
    document.addEventListener('pila-cambiada', function () { rehacer(30); });
    /* Antonio y Nunito cambian la altura de los textos al llegar: volver a medir */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { rehacer(0); });
  })();

  /* ───────────────── separadores: la línea sale del punto ───────────────── */
  (function separadores() {
    if (!movimiento) return;
    todos('.sep').forEach(function (sep) {
      var lineas = todos('.sep__linea', sep);
      var punto = sep.querySelector('.sep__punto');
      var tl = gsap.timeline({ defaults: { ease: 'none' } });
      tl.fromTo(punto, { scale: 0 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, 0)
        .fromTo(lineas, { scaleX: 0 }, { scaleX: 1, duration: 0.75 }, 0.2);
      window.ScrollTrigger.create({ trigger: sep, start: 'top 94%', end: 'top 45%', scrub: 0.7, animation: tl });
    });
  })();

  /* ───────────────── terraza: el punto se abre en foto ───────────────── */
  (function terraza() {
    var fig = document.getElementById('terraza-foto');
    if (!fig || !movimiento) return;
    var punto = fig.querySelector('.terraza__punto');
    var tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.fromTo(fig, { '--r': '7%' }, { '--r': '75%', duration: 1, ease: 'power2.inOut' }, 0)
      .fromTo(punto, { '--punto-escala': 1, opacity: 1 }, { '--punto-escala': 1.35, opacity: 0, duration: 0.32 }, 0.02)
      .fromTo(fig.querySelector('img'), { scale: 1.14 }, { scale: 1, duration: 1 }, 0);
    window.ScrollTrigger.create({ trigger: fig, start: 'top 88%', end: 'center 45%', scrub: 0.8, animation: tl });
  })();

  /* ───────────────── cinta infinita ───────────────── */
  (function cinta() {
    var pista = document.getElementById('cinta-pista');
    if (!pista) return;
    var grupo = pista.firstElementChild;
    var copias = Math.ceil((window.innerWidth * 2) / Math.max(1, grupo.offsetWidth)) + 1;
    for (var i = 0; i < copias; i++) {
      var c = grupo.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      pista.appendChild(c);
    }
    if (!movimiento) return;
    var x = 0, base = 0.7, extra = 0;
    if (lenis) lenis.on('scroll', function (e) { extra = Math.min(Math.abs(e.velocity || 0) * 0.35, 9); });
    /* rAF propio: ningún tween de GSAP toca esta propiedad, el += no pisa nada */
    (function paso() {
      var ancho = grupo.offsetWidth;
      x -= base + extra;
      extra *= 0.92;
      if (ancho && x <= -ancho) x += ancho;
      pista.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(paso);
    })();
  })();

  /* ───────────────── contadores ───────────────── */
  (function contadores() {
    var nodos = todos('[data-contador]');
    function formatear(n, el) {
      var dec = parseInt(el.dataset.decimales || '0', 10);
      return dec ? n.toFixed(dec).replace('.', ',') : Math.round(n).toString();
    }
    if (movimiento) nodos.forEach(function (el) { el.textContent = formatear(0, el); });
    cuandoVisible(nodos, 0.5, function (el) {
      var fin = parseFloat(el.dataset.contador);
      /* con movimiento reducido el dato aparece igual: se pone, no se anima */
      if (!movimiento) { el.textContent = formatear(fin, el); return; }
      var estado = { v: 0 };
      gsap.to(estado, {
        v: fin, duration: 1.8, ease: 'power2.out',
        onUpdate: function () { el.textContent = formatear(estado.v, el); },
        onComplete: function () { el.textContent = formatear(fin, el); }
      });
    });
  })();

  cuandoVisible(todos('.cita'), 0.25, function (n) { n.classList.add('visible'); });

  /* ───────────────── botones magnéticos ───────────────── */
  (function imanes() {
    if (!movimiento || esTactil) return;
    todos('.iman').forEach(function (el) {
      var aX = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' });
      var aY = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        aX((e.clientX - (c.left + c.width / 2)) * 0.3);
        aY((e.clientY - (c.top + c.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', function () { aX(0); aY(0); });
    });
  })();

  /* ───────────────── cursor propio: punto sólido + aro ───────────────── */
  (function cursor() {
    if (!movimiento || esTactil) return;
    var aro = document.createElement('div');
    var pt = document.createElement('div');
    aro.className = 'cursor';
    pt.className = 'cursor-punto';
    [aro, pt].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
    var aX = gsap.quickTo(aro, 'x', { duration: 0.28, ease: 'power3.out' });
    var aY = gsap.quickTo(aro, 'y', { duration: 0.28, ease: 'power3.out' });
    var ultimo = null;

    function mostrar(si) { aro.classList.toggle('cursor--vivo', si); pt.classList.toggle('cursor--vivo', si); }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!aro.classList.contains('cursor--vivo')) {
        gsap.set(aro, { x: e.clientX, y: e.clientY });
        mostrar(true);
      }
      /* el del sistema se oculta solo cuando el propio ya se ve (y solo en «Punto medio») */
      if (densidad() === 'punto' && !html.classList.contains('con-cursor')) html.classList.add('con-cursor');
      gsap.set(pt, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
      /* el estado se decide aquí, por el objetivo (pointerover no siempre llega) */
      if (e.target !== ultimo) {
        ultimo = e.target;
        var sobre = !!(e.target.closest && e.target.closest('a, button, .terraza__foto'));
        aro.classList.toggle('cursor--activo', sobre);
        pt.classList.toggle('cursor-punto--activo', sobre);
      }
    });
    html.addEventListener('mouseleave', function () { mostrar(false); });
    html.addEventListener('mouseenter', function () { if (html.classList.contains('con-cursor')) mostrar(true); });
  })();

  /* ───────────────── cabecera ───────────────── */
  var cabecera = document.getElementById('cabecera');
  var boton = document.getElementById('hamburguesa');

  (function cabeceraFija() {
    var hero = document.getElementById('inicio');
    if (!cabecera || !hero) return;
    function actualizar() {
      /* en cuanto se baja un poco: si no, el menú transparente se monta sobre el rótulo */
      var fija = window.pageYOffset > 48;
      cabecera.classList.toggle('cabecera--fija', fija);
    }
    window.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar);
    actualizar();
  })();

  function cerrarMenu() {
    if (!cabecera || !boton || !cabecera.classList.contains('menu-abierto')) return;
    cabecera.classList.remove('menu-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.querySelector('.visualmente-oculto').textContent = 'Abrir menú';
    if (lenis) lenis.start();
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('menu-abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.querySelector('.visualmente-oculto').textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abierto) lenis.stop(); else lenis.start(); }
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ───────────────── mapa solo bajo clic ───────────────── */
  (function mapa() {
    var btn = document.getElementById('mapa-boton');
    var caja = document.getElementById('mapa-consentimiento');
    if (!btn || !caja) return;
    btn.addEventListener('click', function () {
      var marco = document.createElement('iframe');
      /* por dirección, no por nombre: la ficha de Google lleva un nombre que no es el del rótulo */
      marco.src = 'https://www.google.com/maps?q=' + encodeURIComponent('Ronda del Pilar 6, 06300 Zafra, Badajoz') + '&output=embed';
      marco.loading = 'lazy';
      marco.title = 'Mapa: Bar Nizabel, Ronda del Pilar 6, Zafra';
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      caja.parentNode.replaceChild(marco, caja);
    });
  })();

  /* ───────────────── aviso de cookies ───────────────── */
  (function cookies() {
    var caja = document.getElementById('cookies');
    var ok = document.getElementById('cookies-aceptar');
    var reabrir = document.getElementById('cookies-reabrir');
    if (!caja || !ok) return;
    function ver(si) {
      caja.hidden = !si;                      /* el CSS pone display solo si NO hay [hidden] */
      document.body.classList.toggle('cookies-visibles', si);
    }
    var guardado = null;
    try { guardado = localStorage.getItem('nizabel-cookies'); } catch (e) {}
    if (guardado !== 'ok') ver(true);
    ok.addEventListener('click', function () {
      ver(false);
      try { localStorage.setItem('nizabel-cookies', 'ok'); } catch (e) {}
    });
    if (reabrir) reabrir.addEventListener('click', function () { ver(true); ok.focus(); });
  })();

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  if (gsapReady && document.fonts && document.fonts.ready) document.fonts.ready.then(refrescar);

  /* ═══════════════════════════════════════════════════════════════════════
     [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
     Borrar este bloque entero, el bloque CSS marcado igual en estilos.css,
     el <div class="mando"> y el <aside class="ahora"> del HTML, y la parte de
     densidad del script bloqueante del <head>. Receta en el README.
     ═══════════════════════════════════════════════════════════════════════ */
  (function mandoMaqueta() {
    var mando = document.getElementById('mando');
    if (!mando) return;
    /* solo con ?revision: el enlace que recibe el cliente sale limpio */
    if (!/[?&]revision\b/.test(window.location.search)) return;
    mando.hidden = false;                       /* sin JS no haría nada: lo enseña el JS */
    var botones = todos('[data-densidad]', mando);

    function aplicar(d) {
      html.classList.remove('densidad-punto', 'densidad-sobria');
      html.classList.add('densidad-' + d);
      if (d === 'sobria') html.classList.remove('con-cursor');
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.densidad === d ? 'true' : 'false'); });
      try { localStorage.setItem('nizabel-densidad', d); } catch (e) {}
      document.dispatchEvent(new CustomEvent('densidad-cambiada', { detail: d }));
      setTimeout(refrescar, 90);
    }
    var actual = densidad();
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.densidad === actual ? 'true' : 'false');
      b.addEventListener('click', function () { aplicar(b.dataset.densidad); });
    });
  })();
  /* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */
})();
