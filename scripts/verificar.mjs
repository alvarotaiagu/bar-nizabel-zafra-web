/* Verificación de la maqueta Bar Nizabel · «Punto medio».
   Levanta un servidor estático, abre el sitio con Playwright y comprueba:
     · un test por cada punto del checklist de web desde cero (cursor, pila,
       menú móvil, cookies, cortina, hero en móviles bajos, con-movimiento);
     · el estado en vivo con turnos que cruzan la medianoche (Europe/Madrid);
     · las dos densidades, y que sin ?revision no hay mando;
     · que ningún texto habla de juego, máquinas ni del salón;
     · noindex, versionado ?v=, contraste, sin GSAP, movimiento reducido, 404,
       y la copia sin mando que viajaría al cliente.
   Se baja con mouse.wheel: con Lenis, window.scrollTo no dispara ScrollTrigger.

   node scripts/verificar.mjs            (todo)
   node scripts/verificar.mjs --capturas (además guarda screenshots/)
*/
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conCapturas = process.argv.includes('--capturas');
if (conCapturas) fs.mkdirSync(path.join(raiz, 'screenshots'), { recursive: true });
const foto = n => path.join(raiz, 'screenshots', n);
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json'
};

function servir(dir, puerto) {
  const s = http.createServer((req, res) => {
    const limpia = decodeURIComponent(req.url.split('?')[0]);
    const destino = path.join(dir, limpia === '/' ? 'index.html' : limpia);
    if (!destino.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(dir, '404.html')));
      return;
    }
    res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(destino));
  });
  return new Promise(r => s.listen(puerto, '127.0.0.1', () => r(s)));
}

const fallos = [];
const notas = [];
function comprobar(ok, mensaje) { (ok ? notas : fallos).push((ok ? 'OK   ' : 'FALLA') + ' · ' + mensaje); }

async function rueda(page, vueltas, paso = 600, espera = 220) {
  for (let i = 0; i < vueltas; i++) { await page.mouse.wheel(0, paso); await page.waitForTimeout(espera); }
  await page.waitForTimeout(1600);
}
/* baja una distancia exacta llevando la cuenta de lo despachado (con Lenis scrollY va por detrás) */
async function bajar(page, px, paso = 120) {
  let resto = px;
  while (Math.abs(resto) > 1) {
    const d = Math.abs(resto) > paso ? Math.sign(resto) * paso : resto;
    await page.mouse.wheel(0, d); resto -= d;
    await page.waitForTimeout(45);
  }
  await page.waitForTimeout(1500);
}
async function hasta(page, selector, margen = 0) {
  for (let i = 0; i < 90; i++) {
    const top = await page.evaluate(s => document.querySelector(s).getBoundingClientRect().top, selector);
    if (top <= 90 + margen && top > -40) break;
    const paso = top > 0 ? Math.min(600, Math.max(100, top - 60)) : Math.max(-600, top - 80);
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(1600);
}

async function nuevaPagina(navegador, opciones = {}) {
  const contexto = await navegador.newContext({
    viewport: opciones.viewport || { width: 1440, height: 900 },
    reducedMotion: opciones.reducedMotion || 'no-preference',
    timezoneId: opciones.zona || 'Europe/Madrid',
    hasTouch: !!opciones.tactil, isMobile: !!opciones.tactil,
    deviceScaleFactor: 1
  });
  if (opciones.cookiesVistas) await contexto.addInitScript(() => { try { localStorage.setItem('nizabel-cookies', 'ok'); } catch (e) {} });
  if (opciones.reloj) await contexto.addInitScript(r => { window.NIZABEL_RELOJ = r; }, opciones.reloj);
  const page = await contexto.newPage();
  const errores = [];
  const caidas = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.on('requestfailed', r => caidas.push(r.url() + ' → ' + (r.failure()?.errorText || '')));
  page.on('response', r => { if (r.status() >= 400) caidas.push(r.status() + ' ' + r.url()); });
  return { contexto, page, errores, caidas };
}
const esperarCortina = page => page.waitForFunction(() => getComputedStyle(document.getElementById('cortina')).display === 'none', null, { timeout: 9000 }).catch(() => {});

const base = 'http://127.0.0.1:4193';
const servidor = await servir(raiz, 4193);
const navegador = await chromium.launch();
const VIEWPORTS = [[360, 640], [375, 667], [390, 844], [768, 1024], [1440, 900]];

try {
  /* ───── 0. archivos: noindex, versionado, sin palabras vetadas ───── */
  {
    const paginas = ['index.html', 'aviso-legal.html', 'privacidad.html', '404.html'];
    for (const p of paginas) {
      const t = fs.readFileSync(path.join(raiz, p), 'utf8');
      const charset = t.indexOf('<meta charset'), robots = t.indexOf('<meta name="robots" content="noindex, nofollow">');
      comprobar(robots > charset && charset > 0 && t.indexOf('<head>') < charset, p + ': noindex justo detrás del charset');
    }
    const huella = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, f))).digest('hex').slice(0, 8);
    const idx = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
    for (const f of ['css/estilos.css', 'js/horario.js', 'js/main.js']) {
      const m = idx.match(new RegExp('(?:href|src)="' + f.replace(/[./]/g, '\\$&') + '\\?v=([0-9a-f]{8})"'));
      comprobar(m && m[1] === huella(f), 'versionado: ' + f + '?v=' + (m ? m[1] : '—') + ' = huella ' + huella(f));
    }
    comprobar(!/cdnjs\.cloudflare\.com\/ajax\/libs\/lenis/.test(idx) && /cdn\.jsdelivr\.net\/npm\/lenis@/.test(idx), 'Lenis desde jsDelivr (cdnjs da 404)');
    const css = fs.readFileSync(path.join(raiz, 'css/estilos.css'), 'utf8');
    comprobar(/\.cookies:not\(\[hidden\]\)\s*\{\s*display:\s*flex/.test(css) && !/\.cookies\s*\{[^}]*display:\s*flex/.test(css), 'cookies: display:flex solo en .cookies:not([hidden])');
    comprobar(/height:\s*100dvh/.test(css), 'menú móvil con altura 100dvh');
    const js = fs.readFileSync(path.join(raiz, 'js/main.js'), 'utf8');
    comprobar(!/getContext\(|\.filter\s*=|shadowBlur/.test(js), 'sin canvas con blur por fotograma (no hay canvas: el punto es DOM y SVG)');
  }

  /* ───── 1. escritorio, pasada normal ───── */
  {
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });

    /* cortina: fotogramas intermedios (punto, palabras, línea, lente) */
    const muestras = [];
    const t0 = Date.now();
    let capturadas = 0;
    const instantes = [450, 1200, 1950, 2500];
    while (Date.now() - t0 < 3600) {
      const m = await page.evaluate(() => {
        const c = document.getElementById('cortina');
        const e = getComputedStyle(c);
        const pt = getComputedStyle(document.getElementById('cortina-punto'));
        return { display: e.display, fondo: e.backgroundColor, filo: (document.getElementById('cortina-filo').getAttribute('d') || '').length, punto: pt.transform, muro: getComputedStyle(document.getElementById('cortina-muro')).fill };
      });
      muestras.push({ t: Date.now() - t0, ...m });
      if (conCapturas && capturadas < instantes.length && Date.now() - t0 >= instantes[capturadas]) {
        await page.screenshot({ path: foto('00' + 'abcd'[capturadas] + '-cortina.png') });
        capturadas++;
      }
      await page.waitForTimeout(60);
    }
    const tapaba = muestras.find(m => m.t < 300);
    comprobar(tapaba && tapaba.display === 'block', 'cortina: tapa la página al cargar');
    comprobar(muestras.some(m => /matrix\((0\.[1-9]|1)/.test(m.punto)), 'cortina: aparece el punto en el centro');
    const lente = muestras.find(m => m.filo > 10 && m.display === 'block');
    comprobar(!!lente, 'cortina: se ve la línea abrirse en lente (fotograma a medias capturado)');
    comprobar(lente && lente.fondo === 'rgba(0, 0, 0, 0)', 'cortina: con el hueco abierto la capa no tiene fondo opaco → ' + (lente && lente.fondo));
    const fondoHero = await page.evaluate(() => getComputedStyle(document.getElementById('inicio')).backgroundColor);
    comprobar(lente && lente.muro !== fondoHero, 'cortina: su color (' + (lente && lente.muro) + ') es distinto del fondo del hero (' + fondoHero + ')');
    await esperarCortina(page);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display) === 'none', 'cortina: acaba en display:none (pasada normal)');
    comprobar(await page.evaluate(() => document.documentElement.classList.contains('con-movimiento')), 'con-movimiento activo con GSAP y sin movimiento reducido');
    await page.waitForTimeout(1600);
    const desborda = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    comprobar(desborda <= 1, 'sin desbordamiento horizontal en escritorio (' + desborda + 'px)');
    if (conCapturas) await page.screenshot({ path: foto('01-hero.png') });

    /* cursor propio: sustituye al del sistema y se rellena de forma visible sobre lo pulsable */
    await page.mouse.move(700, 300);
    await page.mouse.move(720, 320, { steps: 4 });
    await page.waitForTimeout(400);
    const cursorLibre = await page.evaluate(() => ({
      sistema: getComputedStyle(document.body).cursor,
      aro: getComputedStyle(document.querySelector('.cursor')).opacity,
      punto: getComputedStyle(document.querySelector('.cursor-punto')).opacity
    }));
    comprobar(cursorLibre.sistema === 'none' && cursorLibre.aro === '1' && cursorLibre.punto === '1',
      'cursor: aro + punto visibles y el del sistema oculto → ' + JSON.stringify(cursorLibre));
    const boton = await page.locator('.hero__acciones .boton--punto').boundingBox();
    await page.mouse.move(boton.x + boton.width / 2, boton.y + boton.height / 2, { steps: 6 });
    await page.waitForTimeout(700);
    const cursorBoton = await page.evaluate(() => {
      const e = getComputedStyle(document.querySelector('.cursor'));
      return { fondo: e.backgroundColor, ancho: e.width, sistema: getComputedStyle(document.querySelector('.hero__acciones .boton')).cursor };
    });
    comprobar(/rgba\(200, 71, 58, 0\.38\)/.test(cursorBoton.fondo) && cursorBoton.ancho === '64px' && cursorBoton.sistema === 'none',
      'cursor: sobre un botón el aro crece y se rellena (≥ .35), sin cursor del sistema → ' + JSON.stringify(cursorBoton));
    if (conCapturas) await page.screenshot({ path: foto('01b-cursor-boton.png'), clip: { x: boton.x - 50, y: boton.y - 50, width: boton.width + 100, height: boton.height + 100 } });
    await page.mouse.move(1435, 450, { steps: 4 });

    /* hero anclado: CAFÉ se va, COPAS se centra, el punto crece quieto en medio */
    const alto = 900;
    const heroEstado = () => page.evaluate(() => {
      const r = el => el.getBoundingClientRect();
      const cafe = document.querySelector('.hero__cafe'), copas = document.querySelector('.hero__copas'), pt = document.getElementById('hero-punto');
      const m = getComputedStyle(pt).transform;
      const esc = m === 'none' ? 1 : parseFloat(m.split('(')[1]);
      const rp = r(pt), rc = r(copas);
      return {
        heroTop: Math.round(r(document.getElementById('inicio')).top),
        cafe: +parseFloat(getComputedStyle(cafe).opacity).toFixed(2),
        copasCentro: Math.round(rc.left + rc.width / 2), puntoCentro: Math.round(rp.left + rp.width / 2),
        escala: +esc.toFixed(2), scrollY: Math.round(scrollY)
      };
    });
    const h0 = await heroEstado();
    await bajar(page, alto * 0.35);
    const h1 = await heroEstado();
    if (conCapturas) await page.screenshot({ path: foto('02-hero-035.png') });
    await bajar(page, alto * 0.4);
    const h2 = await heroEstado();
    if (conCapturas) await page.screenshot({ path: foto('02b-hero-075.png') });
    await bajar(page, alto * 0.4);
    const h3 = await heroEstado();
    if (conCapturas) await page.screenshot({ path: foto('02c-hero-115.png') });
    comprobar(Math.abs(h1.heroTop) <= 1 && Math.abs(h2.heroTop) <= 1, 'hero: se queda anclado mientras dura el gesto → ' + JSON.stringify([h1.heroTop, h2.heroTop]));
    comprobar(h0.cafe > 0.95 && h2.cafe < 0.3, 'hero: CAFÉ sale por la izquierda → opacidad ' + [h0.cafe, h1.cafe, h2.cafe].join(' → '));
    comprobar(Math.abs(h3.copasCentro - 720) <= 6 && Math.abs(h0.copasCentro - 720) > 60, 'hero: COPAS acaba centrada → ' + h0.copasCentro + ' → ' + h3.copasCentro);
    comprobar(h3.escala >= 5 && Math.abs(h3.puntoCentro - h0.puntoCentro) <= 2, 'hero: el punto crece (×' + h3.escala + ') sin moverse del centro (' + h0.puntoCentro + ' → ' + h3.puntoCentro + ')');

    /* la pila: alturas iguales y contenido que cabe */
    await hasta(page, '#horario');
    if (conCapturas) await page.screenshot({ path: foto('03-horario.png') });
    await hasta(page, '#momento-tarde', 40); await rueda(page, 1, 250);
    if (conCapturas) await page.screenshot({ path: foto('04-pila-tarde.png') });
    await hasta(page, '#momento-noche', 40); await rueda(page, 1, 250);
    if (conCapturas) await page.screenshot({ path: foto('05-pila-noche.png') });
    const alturas = await page.evaluate(() => [...document.querySelectorAll('.pila__item .tarjeta')].map(t => ({ alto: t.offsetHeight, cabe: t.scrollHeight <= t.clientHeight + 1 })));
    comprobar(new Set(alturas.map(a => a.alto)).size === 1 && alturas.every(a => a.cabe), 'pila: las tres tarjetas miden lo mismo y su contenido cabe → ' + JSON.stringify(alturas));
    const agujas = await page.evaluate(() => [...document.querySelectorAll('.reloj')].map(f => {
      const ang = el => { const m = el.transform.baseVal.consolidate(); const mm = m ? m.matrix : { a: 1, b: 0 }; return Math.round(((Math.atan2(mm.b, mm.a) * 180 / Math.PI) + 360) % 360); };
      return f.dataset.hora + '=' + ang(f.querySelector('.reloj__horas')) + '/' + ang(f.querySelector('.reloj__minutos'));
    }));
    comprobar(agujas.join(' ') === '8:30=255/180 16:00=120/0 2:00=60/0', 'relojes: cada uno marca su hora (horas/minutos en grados) → ' + agujas.join(' '));

    /* la máscara se muestrea mientras la foto sube desde abajo: punto pequeño al asomar, abierta al llegar */
    const mascara = () => page.evaluate(() => {
      const f = document.getElementById('terraza-foto');
      return { alto: +(f.getBoundingClientRect().top / innerHeight).toFixed(2), r: parseFloat(getComputedStyle(f).getPropertyValue('--r')) };
    });
    for (let i = 0; i < 20 && (await mascara()).alto < 1.1; i++) { await page.mouse.wheel(0, -250); await page.waitForTimeout(160); }
    await page.waitForTimeout(1500);
    let asomando = null;
    for (let i = 0; i < 40; i++) {
      const m = await mascara();
      if (m.alto <= 0.95 && m.alto >= 0.8 && !asomando) {
        await page.waitForTimeout(900);
        asomando = await mascara();
        if (conCapturas) await page.screenshot({ path: foto('06-cinta-y-punto.png') });
      }
      if (m.alto < 0.2) break;
      await page.mouse.wheel(0, m.alto > 1.3 ? 300 : 70);
      await page.waitForTimeout(140);
    }
    await page.waitForTimeout(1400);
    if (conCapturas) await page.screenshot({ path: foto('07-terraza.png') });
    const terraza = await page.evaluate(() => ({ r: getComputedStyle(document.getElementById('terraza-foto')).getPropertyValue('--r').trim(), clip: getComputedStyle(document.querySelector('#terraza-foto img')).clipPath }));
    comprobar(/circle/.test(terraza.clip) && asomando && asomando.r < 25 && parseFloat(terraza.r) > 60,
      'terraza: la foto se abre desde un punto (máscara al asomar ' + JSON.stringify(asomando) + ' → ' + terraza.r + ')');

    await hasta(page, '#resenas');
    await page.waitForTimeout(1200);
    if (conCapturas) await page.screenshot({ path: foto('08-resenas.png') });
    const resenas = await page.evaluate(() => ({
      titulo: document.getElementById('resenas-titulo').textContent.replace(/\s+/g, ' ').trim(),
      cifras: [...document.querySelectorAll('[data-contador]')].map(n => n.textContent.trim()).join('/'),
      citas: document.querySelectorAll('.cita blockquote').length,
      boton: document.querySelector('#resenas a.boton').href
    }));
    comprobar(resenas.titulo.includes('4,3★ · 365 reseñas en Google') && resenas.cifras === '4,3/365', 'reseñas: «4,3★ · 365 reseñas en Google» y los contadores acaban en su cifra → ' + resenas.cifras);
    comprobar(resenas.citas === 3 && /google\.com\/maps\/place/.test(resenas.boton), 'reseñas: tres citas y botón a la ficha de Google');

    await hasta(page, '#visita');
    if (conCapturas) await page.screenshot({ path: foto('09-visita.png') });
    const visita = await page.evaluate(() => ({ hoy: document.querySelectorAll('#semana tr.hoy').length, datos: document.querySelector('.datos').textContent }));
    comprobar(visita.hoy === 1, 'visita: un día de la semana marcado como hoy');
    comprobar(/No se aceptan reservas/.test(visita.datos) && /De 1 a 10 €/.test(visita.datos), 'visita: «No se aceptan reservas» y el precio medio, como datos');

    const cookiesVisible = await page.evaluate(() => { const c = document.getElementById('cookies'); return { oculto: c.hidden, display: getComputedStyle(c).display }; });
    comprobar(!cookiesVisible.oculto && cookiesVisible.display === 'flex', 'cookies: el aviso se ve al entrar');
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display) === 'none', 'cookies: el botón lo cierra de verdad');

    const iframesAntes = await page.$$eval('iframe', n => n.length);
    await page.click('#mapa-boton');
    await page.waitForTimeout(600);
    const marcos = await page.$$eval('iframe', n => n.map(i => i.src));
    comprobar(iframesAntes === 0 && marcos.length === 1 && /output=embed/.test(marcos[0]) && !/nizabel|recreativ/i.test(marcos[0]), 'mapa: el iframe no existe hasta el clic y se pide por dirección, no por el nombre de la ficha');

    await rueda(page, 4, 700);
    if (conCapturas) await page.screenshot({ path: foto('10-pie.png') });

    const mandoSin = await page.evaluate(() => { const m = document.getElementById('mando'); return { oculto: m.hidden, display: getComputedStyle(m).display }; });
    comprobar(mandoSin.oculto && mandoSin.display === 'none', 'sin ?revision no hay mando → ' + JSON.stringify(mandoSin));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => document.getElementById('cookies').hidden), 'cookies: tras aceptar, al recargar ya no sale');

    comprobar(errores.length === 0, 'consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    const caidasReales = caidas.filter(c => !/favicon\.ico|google\.com\/maps|gstatic|googleapis\.com\/maps|maps\.google/.test(c));
    comprobar(caidasReales.length === 0, 'sin peticiones caídas' + (caidasReales.length ? ' → ' + caidasReales.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 1b. la pila, en una página limpia y bajando desde arriba ─────
     El fallo clásico está en la ÚLTIMA tarjeta: las de atrás se sueltan antes
     de que se pose, la anterior asoma por debajo, o no salen en bloque. */
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: vp, cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await page.waitForTimeout(1200);
    await page.mouse.move(vp.width - 5, vp.height / 2);
    const suelta = await page.evaluate(() => document.getElementById('horario').classList.contains('pila-suelta'));
    if (suelta) { comprobar(true, 'pila ' + vp.width + '×' + vp.height + ': no cabe anclada y se desapila (medido)'); await contexto.close(); continue; }
    await hasta(page, '#momento-tarde', 300);
    const tope = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.pila__item')).top));
    let ultimo = null, sueltaAntes = null, asomaDebajo = null, seSeparan = null, ultimaPosada = false;
    for (let i = 0; i < 60; i++) {
      await page.mouse.wheel(0, 90);
      await page.waitForTimeout(170);
      const m = await page.evaluate(() => [...document.querySelectorAll('.pila__item')].map(li => { const r = li.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }));
      ultimo = m;
      const ultima = m[m.length - 1];
      const anteriores = m.slice(0, -1);
      if (!ultimaPosada && ultima[0] > tope + 2 && ultima[0] < vp.height && anteriores.some(a => a[0] < tope - 2)) sueltaAntes = sueltaAntes || { paso: i, m };
      if (Math.abs(ultima[0] - tope) <= 2) {
        ultimaPosada = true;
        if (anteriores.some(a => a[1] > ultima[1] + 1)) asomaDebajo = asomaDebajo || { paso: i, m };
      }
      if (ultimaPosada && anteriores.some(a => Math.abs(a[0] - ultima[0]) > 2)) seSeparan = seSeparan || { paso: i, m };
    }
    const n = vp.width + '×' + vp.height;
    const sinLlegar = ultimaPosada ? '' : ' (la última no llegó a posarse: ' + JSON.stringify(ultimo) + ')';
    comprobar(ultimaPosada && !sueltaAntes, 'pila ' + n + ': ninguna tarjeta se suelta antes de que se pose la última' + (sueltaAntes ? ' → ' + JSON.stringify(sueltaAntes) : '') + sinLlegar);
    comprobar(ultimaPosada && !asomaDebajo, 'pila ' + n + ': la última tapa entera a la anterior' + (asomaDebajo ? ' → ' + JSON.stringify(asomaDebajo) : '') + sinLlegar);
    comprobar(ultimaPosada && !seSeparan, 'pila ' + n + ': al acabarse, las tres salen juntas' + (seSeparan ? ' → ' + JSON.stringify(seSeparan) : '') + sinLlegar);
    await contexto.close();
  }

  /* ───── 2. estado en vivo: turnos que cruzan la medianoche ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    /* 0 = lunes … 6 = domingo. «V 1:30» del encargo: el jueves cierra a la 1:00
       según Google, así que el viernes a la 1:30 está CERRADO (ver README). */
    const casos = [
      ['V 1:30', 4, 90, false, 'Abre hoy a las 8:30'],
      ['S 1:30', 5, 90, true, 'Abierto ahora · cierra a las 2:00'],
      ['S 10:00', 5, 600, false, 'Abre hoy a las 16:00'],
      ['D 23:59', 6, 1439, true, 'Abierto ahora · cierra a medianoche'],
      ['L 0:30', 0, 30, false, 'Abre hoy a las 8:30'],
      ['M 0:30', 1, 30, true, 'Abierto ahora · cierra a la 1:00'],
      /* de propina, los bordes */
      ['V 0:30', 4, 30, true, 'Abierto ahora · cierra a la 1:00'],
      ['D 1:30', 6, 90, true, 'Abierto ahora · cierra a las 2:00'],
      ['J 1:00', 3, 60, false, 'Abre hoy a las 8:30'],
      ['D 0:00', 6, 0, true, 'Abierto ahora · cierra a las 2:00'],
      ['L 8:30', 0, 510, true, 'Abierto ahora · cierra a la 1:00'],
      ['D 15:59', 6, 959, false, 'Abre hoy a las 16:00']
    ];
    for (const [nombre, dia, min, abierto, frase] of casos) {
      const e = await page.evaluate(([d, m]) => window.NizabelHorario.estadoEn(d, m), [dia, min]);
      comprobar(e.abierto === abierto && e.frase === frase, 'estado ' + nombre + ' → ' + (e.abierto ? 'abierto' : 'cerrado') + ' · «' + e.frase + '»');
    }
    await contexto.close();

    /* en la página, con el navegador en otra zona horaria: manda Europe/Madrid */
    const escenas = [
      ['2026-10-03T01:30:00+02:00', 'Abierto ahora · cierra a las 2:00', 4, 'noche', 'sábado 1:30 (turno del viernes)'],
      ['2026-10-03T10:00:00+02:00', 'Abre hoy a las 16:00', 5, 'cerrado', 'sábado 10:00'],
      ['2026-10-05T09:15:00+02:00', 'Abierto ahora · cierra a la 1:00', 0, 'manana', 'lunes 9:15']
    ];
    for (const [reloj, frase, diaHoy, momento, nombre] of escenas) {
      const { contexto: c2, page: p2 } = await nuevaPagina(navegador, { cookiesVistas: true, reloj, zona: 'America/New_York' });
      await p2.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
      await p2.waitForTimeout(300);
      const r = await p2.evaluate(() => ({
        hero: document.querySelector('.hero [data-estado-texto]').textContent,
        visita: document.querySelector('.visita [data-estado-texto]').textContent,
        clase: document.querySelector('.hero [data-estado]').className,
        hoy: [...document.querySelectorAll('#semana tr.hoy')].map(t => Number(t.dataset.dia)),
        momento: document.documentElement.dataset.momento
      }));
      comprobar(r.hero === frase && r.visita === frase && r.hoy.join() === String(diaHoy) && r.momento === momento,
        'página ' + nombre + ' desde Nueva York → «' + r.hero + '», hoy=' + r.hoy + ', momento=' + r.momento);
    }
  }

  /* ───── 3. las dos densidades ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { reloj: '2026-10-02T18:00:00+02:00' });
    await page.goto(base + '/index.html?revision', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => !document.getElementById('mando').hidden && getComputedStyle(document.getElementById('mando')).display !== 'none'), 'con ?revision el mando aparece (lo enseña el JS)');
    const cargada = await page.evaluate(() => ({
      reloj: getComputedStyle(document.querySelector('.reloj')).display,
      franja: getComputedStyle(document.querySelector('.franja')).display,
      ahora: getComputedStyle(document.getElementById('ahora')).display,
      sep: getComputedStyle(document.querySelector('.sep__punto')).display,
      boton: document.querySelector('[data-densidad="punto"]').textContent
    }));
    comprobar(cargada.boton === 'Punto medio' && cargada.reloj !== 'none' && cargada.franja === 'none' && cargada.ahora === 'none' && cargada.sep !== 'none',
      '«Punto medio»: relojes y puntos a la vista, sin tabla ni franja «ahora mismo» → ' + JSON.stringify(cargada));

    await page.click('[data-densidad="sobria"]');
    await page.waitForTimeout(900);
    await page.mouse.move(600, 400); await page.mouse.move(640, 420, { steps: 3 });
    await page.waitForTimeout(300);
    const sobria = await page.evaluate(() => ({
      clase: document.documentElement.className,
      reloj: getComputedStyle(document.querySelector('.reloj')).display,
      franja: getComputedStyle(document.querySelector('.franja')).display,
      ahora: getComputedStyle(document.getElementById('ahora')).display,
      ahoraTexto: document.getElementById('ahora').textContent.replace(/\s+/g, ' ').trim(),
      sep: getComputedStyle(document.querySelector('.sep__punto')).display,
      cursor: getComputedStyle(document.body).cursor,
      aro: document.querySelector('.cursor') ? getComputedStyle(document.querySelector('.cursor')).display : 'none',
      estado: getComputedStyle(document.querySelector('.hero .estado__punto')).display,
      clip: getComputedStyle(document.querySelector('#terraza-foto img')).clipPath,
      desborda: document.documentElement.scrollWidth - window.innerWidth,
      pulsado: document.querySelector('[data-densidad="sobria"]').getAttribute('aria-pressed')
    }));
    comprobar(sobria.clase.includes('densidad-sobria') && sobria.pulsado === 'true', 'sobria: la clase cambia en <html> y el botón queda pulsado');
    comprobar(sobria.reloj === 'none' && sobria.franja === 'table', 'sobria: los relojes se cambian por tabla horaria compacta');
    comprobar(sobria.ahora === 'flex' && /hora de cañas/.test(sobria.ahoraTexto) && /cierra a las 2:00/.test(sobria.ahoraTexto), 'sobria: añade la franja «ahora mismo» (viernes 18:00) → «' + sobria.ahoraTexto + '»');
    comprobar(sobria.sep === 'none' && sobria.aro === 'none' && sobria.cursor !== 'none' && sobria.clip === 'none', 'sobria: sin punto en separadores, cursor ni máscara → ' + JSON.stringify({ sep: sobria.sep, aro: sobria.aro, cursor: sobria.cursor, clip: sobria.clip }));
    comprobar(sobria.estado !== 'none', 'sobria: el punto se queda como indicador de abierto');
    comprobar(sobria.desborda <= 1, 'sobria: sin desbordamiento nuevo (' + sobria.desborda + 'px)');
    await page.mouse.move(1435, 450);
    const escalaSobria = await (async () => { await bajar(page, 700); return page.evaluate(() => getComputedStyle(document.getElementById('hero-punto')).transform); })();
    comprobar(escalaSobria === 'none', 'sobria: el hero no ancla ni hace crecer el punto → ' + escalaSobria);
    if (conCapturas) {
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
      await page.screenshot({ path: foto('20-sobria-hero.png') });
      await hasta(page, '#ahora', 380); await page.screenshot({ path: foto('21-sobria-ahora.png') });
      await hasta(page, '#momento-tarde', 40); await page.screenshot({ path: foto('22-sobria-pila.png') });
      await hasta(page, '#terraza'); await page.screenshot({ path: foto('23-sobria-terraza.png') });
      await hasta(page, '#resenas'); await page.screenshot({ path: foto('24-sobria-resenas.png') });
    }
    const alturasSobria = await page.evaluate(() => [...document.querySelectorAll('.pila__item .tarjeta')].map(t => t.offsetHeight));
    const suelta = await page.evaluate(() => document.getElementById('horario').classList.contains('pila-suelta'));
    comprobar(suelta || new Set(alturasSobria).size === 1, 'sobria: la pila vuelve a igualarse con las tablas → ' + alturasSobria.join('/'));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    comprobar((await page.evaluate(() => document.documentElement.className)).includes('densidad-sobria'), 'la densidad elegida se aplica sin parpadeo al recargar con ?revision');
    await esperarCortina(page);
    await page.click('[data-densidad="punto"]');
    await page.waitForTimeout(700);
    const vuelta = await page.evaluate(() => ({ clase: document.documentElement.className, reloj: getComputedStyle(document.querySelector('.reloj')).display }));
    comprobar(vuelta.clase.includes('densidad-punto') && vuelta.reloj !== 'none', 'se puede volver a «Punto medio»');
    await page.click('[data-densidad="sobria"]');
    await page.waitForTimeout(300);
    /* sin ?revision, la sobria guardada no se aplica y no hay mando para volver */
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    const limpio = await page.evaluate(() => ({ clase: document.documentElement.className, mando: getComputedStyle(document.getElementById('mando')).display, guardada: localStorage.getItem('nizabel-densidad') }));
    comprobar(limpio.guardada === 'sobria' && limpio.clase.includes('densidad-punto') && limpio.mando === 'none', 'sin ?revision: aunque haya una sobria guardada, se ve «Punto medio» y sin mando');
    await contexto.close();
  }

  /* ───── 4. móvil: menú, mando y cookies ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { viewport: { width: 390, height: 844 }, tactil: true });
    await page.goto(base + '/index.html?revision', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await page.waitForTimeout(800);
    const ancho = await page.evaluate(() => ({ innerWidth: window.innerWidth, scroll: document.documentElement.scrollWidth }));
    comprobar(ancho.innerWidth === 390 && ancho.scroll - ancho.innerWidth <= 1, 'móvil: el viewport no se ensancha (' + JSON.stringify(ancho) + ')');
    comprobar(await page.evaluate(() => !document.querySelector('.cursor')), 'móvil táctil: no hay cursor propio');
    comprobar(await page.evaluate(() => { const e = getComputedStyle(document.getElementById('mando')); return e.visibility === 'hidden' || e.opacity === '0'; }), 'móvil: el mando se aparta mientras el aviso de cookies está en pantalla');
    await page.tap('#cookies-aceptar');
    await page.waitForTimeout(600);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('mando')).visibility !== 'hidden'), 'móvil: el mando vuelve al cerrar el aviso de cookies');

    await page.tap('#hamburguesa');
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'true', 'móvil: el menú abre');
    if (conCapturas) await page.screenshot({ path: foto('30-movil-menu.png') });
    await page.tap('#hamburguesa');
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'false', 'móvil: el mismo botón cierra el menú');
    /* con la cabecera YA fija (backdrop-filter) el panel no puede asomar */
    await page.evaluate(() => window.scrollTo(0, 2600));
    await page.waitForTimeout(700);
    const panel = await page.evaluate(() => {
      const n = document.getElementById('menu').getBoundingClientRect();
      return { fija: document.getElementById('cabecera').classList.contains('cabecera--fija'), filtro: getComputedStyle(document.getElementById('cabecera')).backdropFilter, bottom: Math.round(n.bottom), alto: Math.round(n.height) };
    });
    comprobar(panel.fija && /blur/.test(panel.filtro) && panel.bottom <= 1 && panel.alto >= 844, 'móvil: con la cabecera fija (blur) el menú cerrado queda fuera y mide la pantalla → ' + JSON.stringify(panel));
    await page.tap('#hamburguesa');
    await page.waitForTimeout(900);
    const abierto = await page.evaluate(() => { const r = document.getElementById('menu').getBoundingClientRect(); return { top: Math.round(r.top), alto: Math.round(r.height) }; });
    comprobar(abierto.top === 0 && abierto.alto >= 844, 'móvil: con la cabecera fija el menú abierto ocupa toda la pantalla → ' + JSON.stringify(abierto));
    if (conCapturas) await page.screenshot({ path: foto('31-movil-menu-fija.png') });
    await page.tap('#hamburguesa');
    comprobar(errores.length === 0, 'móvil: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 5. hero en cinco pantallas: nada se pisa ni se sale + capturas ───── */
  for (const [w, hgt] of VIEWPORTS) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: { width: w, height: hgt }, cookiesVistas: true, tactil: w < 1000 });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await page.waitForTimeout(1900);
    const r = await page.evaluate(() => {
      const c = s => document.querySelector(s).getBoundingClientRect();
      const cab = c('#cabecera'), t = c('.hero__titulo'), pie = c('.hero__pie'), hero = c('#inicio');
      const linea = c('.hero__linea');
      return { cabAbajo: Math.round(cab.bottom), tituloArriba: Math.round(t.top), tituloAbajo: Math.round(t.bottom), pieArriba: Math.round(pie.top), pieAbajo: Math.round(pie.bottom), heroAbajo: Math.round(hero.bottom), lineaIzq: Math.round(linea.left), lineaDer: Math.round(linea.right), ancho: innerWidth, desborda: document.documentElement.scrollWidth - innerWidth };
    });
    comprobar(r.tituloArriba >= r.cabAbajo && r.tituloAbajo <= r.pieArriba && r.pieAbajo <= r.heroAbajo && r.desborda <= 1 && r.lineaIzq >= 0 && r.lineaDer <= r.ancho,
      'hero ' + w + '×' + hgt + ': rótulo bajo la cabecera, sin pisar el pie ni salirse → ' + JSON.stringify(r));
    if (conCapturas) {
      const n = w + 'x' + hgt;
      await page.screenshot({ path: foto('40-' + n + '-hero.png') });
      for (const [sel, et, m] of [['#horario', 'horario', 0], ['#momento-noche', 'pila', 40], ['#terraza', 'terraza', 0], ['#resenas', 'resenas', 0], ['#visita', 'visita', 0]]) {
        await hasta(page, sel, m);
        await page.screenshot({ path: foto('40-' + n + '-' + et + '.png') });
      }
    }
    await contexto.close();
  }

  /* ───── 6. ningún texto habla de juego, máquinas ni del salón ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true });
    const vetado = /recreativ|m[aá]quina|juego/i;
    for (const p of ['index.html?revision', 'aviso-legal.html', 'privacidad.html', 'no-existe.html']) {
      await page.goto(base + '/' + p, { waitUntil: 'domcontentloaded' });
      const textos = await page.evaluate(() => [
        document.title, document.body.textContent,
        ...[...document.querySelectorAll('[alt],[title],[aria-label],meta[content]')].map(n => n.getAttribute('alt') || n.getAttribute('title') || n.getAttribute('aria-label') || n.getAttribute('content') || '')
      ].join(' \n '));
      const m = textos.match(vetado);
      comprobar(!m, p.replace('?revision', '') + ': ningún texto contiene «recreativo», «máquinas» ni «juego»' + (m ? ' → «' + m[0] + '»' : ''));
      comprobar(!/\bTODO\b/.test(textos), p.replace('?revision', '') + ': sin marcadores TODO');
    }
    const svgs = fs.readdirSync(path.join(raiz, 'assets')).filter(f => f.endsWith('.svg')).map(f => fs.readFileSync(path.join(raiz, 'assets', f), 'utf8')).join(' ');
    comprobar(!vetado.test(svgs), 'logotipos y favicon: sin texto vetado');
    await contexto.close();
  }

  /* ───── 7. contraste medido en el navegador (componiendo el alfa) ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const pares = await page.evaluate(() => {
      const leer = s => {
        const m = s.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
        if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : +m[4]];
        const n = s.match(/[\d.]+/g).map(Number);
        return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
      };
      const lum = c => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const sobre = (a, b) => [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3]));
      const ratio = (t, f) => { const c = sobre(t, f); const [x, y] = [lum(c), lum(f)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
      const medir = (sel, fondoSel) => {
        const el = document.querySelector(sel);
        const f = leer(getComputedStyle(fondoSel ? document.querySelector(fondoSel) : el).backgroundColor);
        return ratio(leer(getComputedStyle(el).color), f);
      };
      return {
        'texto sobre toldo': medir('.horas__entrada', 'body'),
        'antetítulo sobre toldo': medir('.horas .antetitulo', 'body'),
        'texto sobre cal': medir('.terraza__texto p:not(.antetitulo)', '.terraza'),
        'antetítulo sobre cal': medir('.terraza .antetitulo', '.terraza'),
        'número de tarjeta sobre cal': medir('.tarjeta__num', '.tarjeta'),
        'botón Llamar': medir('.hero__acciones .boton--punto'),
        'secundario sobre cal': medir('.tarjeta__cuando', '.tarjeta'),
        'dato de visita': medir('.datos dt', '.visita')
      };
    });
    for (const [que, r] of Object.entries(pares)) comprobar(r >= 4.5, 'contraste ' + que + ': ' + r + ':1');
    await contexto.close();
  }

  /* ───── 8. carta: vacía no se ve; con datos se pinta y la pila se reiguala ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    comprobar(await page.evaluate(() => [...document.querySelectorAll('.tarjeta__carta')].every(u => u.hidden && !u.children.length)), 'carta: el JSON está vacío y no se pinta nada inventado');
    await page.route('**/data/carta.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ momentos: { manana: [{ nombre: 'Prueba A', precio: '1,00 €' }, { nombre: 'Prueba B' }], tarde: [], noche: [] } }) }));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const c = await page.evaluate(() => ({ items: document.querySelectorAll('[data-carta="manana"] li').length, alturas: [...document.querySelectorAll('.pila__item .tarjeta')].map(t => t.offsetHeight) }));
    comprobar(c.items === 2 && new Set(c.alturas).size === 1, 'carta: con datos se pinta en su tarjeta y las tres siguen igual de altas → ' + JSON.stringify(c));
    await contexto.close();
  }

  /* ───── 9. sin GSAP (CDN caído) ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador);
    await page.route('**/cdn.jsdelivr.net/**', r => r.abort());
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const estado = await page.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      conMovimiento: document.documentElement.classList.contains('con-movimiento'),
      estado: document.querySelector('.hero [data-estado-texto]').textContent,
      reloj: document.querySelector('.reloj .reloj__horas').getAttribute('transform')
    }));
    comprobar(estado.cortina === 'none', 'sin GSAP: la cortina se retira igual → ' + estado.cortina);
    comprobar(!estado.conMovimiento, 'sin GSAP: no se activa con-movimiento (nada queda a medio revelar)');
    comprobar(/^(Abierto ahora|Abre)/.test(estado.estado) && /rotate\(255/.test(estado.reloj || ''), 'sin GSAP: estado en vivo y relojes con su hora');
    const apagados = await page.evaluate(() => [...document.querySelectorAll('h1, h2, h3, p, img, .letra, .palabra-int')].filter(n => {
      const r = n.getBoundingClientRect();
      if (!r.height || r.top > innerHeight) return false;
      return parseFloat(getComputedStyle(n).opacity) < 0.15 || /matrix\(1, 0, 0, 1, 0, [1-9]/.test(getComputedStyle(n).transform);
    }).map(n => n.className || n.tagName));
    comprobar(apagados.length === 0, 'sin GSAP: nada de la primera pantalla queda oculto' + (apagados.length ? ' → ' + apagados.join(',') : ''));
    if (conCapturas) await page.screenshot({ path: foto('50-sin-gsap.png') });
    const propios = errores.filter(e => !/Failed to load resource|ERR_FAILED/.test(e));
    comprobar(propios.length === 0, 'sin GSAP: consola sin errores propios' + (propios.length ? ' → ' + propios.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 10. movimiento reducido: el contenido sigue, el movimiento no ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { reducedMotion: 'reduce', reloj: '2026-10-03T01:30:00+02:00' });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      movimiento: document.documentElement.classList.contains('con-movimiento'),
      estado: document.querySelector('.hero [data-estado-texto]').textContent,
      hoy: [...document.querySelectorAll('#semana tr.hoy')].map(t => t.dataset.dia).join(),
      latido: getComputedStyle(document.querySelector('.hero .estado__punto'), '::after').animationName,
      titulo: getComputedStyle(document.querySelector('.hero__cafe .letra')).transform,
      cursor: !!document.querySelector('.cursor')
    }));
    comprobar(r.cortina === 'none' && !r.movimiento, 'movimiento reducido: sin cortina ni con-movimiento');
    comprobar(r.estado === 'Abierto ahora · cierra a las 2:00' && r.hoy === '4', 'movimiento reducido: el estado en vivo y el día marcado siguen → «' + r.estado + '», hoy=' + r.hoy);
    comprobar(r.latido === 'none' && r.titulo === 'none' && !r.cursor, 'movimiento reducido: sin latido, sin letras desplazadas y sin cursor propio');
    await page.evaluate(() => document.getElementById('resenas').scrollIntoView());
    await page.waitForTimeout(800);
    const cifras = await page.$$eval('[data-contador]', ns => ns.map(n => n.textContent.trim()).join('/'));
    comprobar(cifras === '4,3/365', 'movimiento reducido: los contadores muestran el dato → ' + cifras);
    if (conCapturas) { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300); await page.screenshot({ path: foto('51-movimiento-reducido.png') }); }
    comprobar(errores.length === 0, 'movimiento reducido: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 11. 404 y páginas legales ───── */
  {
    const { contexto, page, caidas } = await nuevaPagina(navegador);
    const resp = await page.goto(base + '/no-existe.html', { waitUntil: 'domcontentloaded' });
    const titulo = await page.textContent('h1').catch(() => '');
    comprobar(resp.status() === 404 && /punto y aparte/i.test(titulo || ''), '404 propio con el lenguaje del sitio → «' + titulo + '»');
    if (conCapturas) await page.screenshot({ path: foto('60-404.png') });
    for (const p of ['aviso-legal.html', 'privacidad.html']) {
      await page.goto(base + '/' + p, { waitUntil: 'networkidle' });
      const t = await page.evaluate(() => document.body.textContent);
      comprobar((t.match(/\[PENDIENTE\]/g) || []).length >= 2 && /NIF/.test(t) && /[Tt]itular/.test(t), p + ': titular y NIF como [PENDIENTE]');
    }
    comprobar(/nizabel-cookies/.test(await page.evaluate(() => document.body.textContent)), 'privacidad: explica la clave que guarda el aviso de cookies');
    const propias = caidas.filter(c => !/no-existe\.html/.test(c));
    comprobar(propias.length === 0, 'legales: sin peticiones caídas' + (propias.length ? ' → ' + propias.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 12. la copia sin mando que viajaría al cliente ───── */
  {
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'nizabel-entrega-'));
    execFileSync(process.execPath, [path.join(raiz, 'scripts/quitar-mando.mjs'), destino]);
    let limpio = true;
    try { execFileSync(process.execPath, [path.join(raiz, 'scripts/comprobar-borrado.mjs'), destino]); } catch (e) { limpio = false; }
    comprobar(limpio, 'entrega: quitar-mando.mjs deja la copia sin rastros (comprobado contra los archivos)');
    const s2 = await servir(destino, 4194);
    const { contexto, page, errores } = await nuevaPagina(navegador);
    await page.goto('http://127.0.0.1:4194/index.html?revision', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    const r = await page.evaluate(() => ({ mando: !!document.getElementById('mando'), ahora: !!document.getElementById('ahora'), cortina: getComputedStyle(document.getElementById('cortina')).display, estado: document.querySelector('.hero [data-estado-texto]').textContent }));
    comprobar(!r.mando && !r.ahora && r.cortina === 'none' && /^(Abierto|Abre)/.test(r.estado) && errores.length === 0, 'entrega: la copia funciona sin mando ni errores → ' + JSON.stringify(r) + (errores.length ? ' ' + errores.join(' | ') : ''));
    await contexto.close();
    s2.close();
    fs.rmSync(destino, { recursive: true, force: true });
  }
} finally {
  await navegador.close();
  servidor.close();
}

console.log('\n' + notas.join('\n'));
if (fallos.length) {
  console.log('\n──────── FALLOS ────────\n' + fallos.join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nTodo en orden: ' + notas.length + ' comprobaciones.');
}
