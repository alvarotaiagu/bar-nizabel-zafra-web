/* ═══════════════════════════════════════════════════════════════════════════
   Horario de Bar Nizabel y estado en vivo.
   Fuente: ficha de Google (septiembre de 2026). Hay directorios con horarios
   viejos: manda Google.

   Tres días cierran pasada la medianoche, así que un turno se guarda como
   minutos desde las 0:00 del día en que ABRE, y el cierre puede pasar de 1440.
   A la 1:30 de un sábado el bar está abierto por el turno del VIERNES.

   Sin dependencias: lo usan la página (window.NizabelHorario) y las pruebas
   de scripts/verificar.mjs (que lo evalúan en el navegador con horas fijas).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  var CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  /* 0 = lunes … 6 = domingo · [abre, cierra] en minutos desde las 0:00 de ese día */
  var TURNOS = [
    [510, 1500],   /* L 8:30 – 1:00 */
    [510, 1500],   /* M 8:30 – 1:00 */
    [510, 1500],   /* X 8:30 – 1:00 */
    [510, 1500],   /* J 8:30 – 1:00 */
    [510, 1560],   /* V 8:30 – 2:00 */
    [960, 1560],   /* S 16:00 – 2:00 */
    [960, 1440]    /* D 16:00 – 24:00 */
  ];

  /* Momentos del día para «ahora mismo» (versión sobria). Los cortes de las
     13:00 y las 21:00 son editoriales, no horario del bar. */
  var MOMENTOS = [
    { id: 'manana', desde: 0, hasta: 780, texto: 'hora del café', que: 'café, desayunos, tostadas y bollería' },
    { id: 'tarde', desde: 780, hasta: 1260, texto: 'hora de cañas', que: 'cañas y tapas' },
    { id: 'noche', desde: 1260, hasta: 9999, texto: 'hora de copas', que: 'copas' }
  ];

  function hhmm(min) {
    min = ((min % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = min % 60;
    return h + ':' + (m < 10 ? '0' : '') + m;
  }

  /* «a la 1:00», «a las 2:00», «a medianoche», «a las 16:00» */
  function aLas(min) {
    if (min % 1440 === 0) return 'a medianoche';
    var h = Math.floor((min % 1440) / 60);
    return (h === 1 ? 'a la ' : 'a las ') + hhmm(min);
  }

  /* Día de la semana (0 = lunes) y minutos del reloj en Europe/Madrid. */
  function relojMadrid(fecha) {
    var partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(fecha || new Date());
    var d = {}, i;
    for (i = 0; i < partes.length; i++) d[partes[i].type] = partes[i].value;
    var dia = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(d.weekday);
    return { dia: dia, min: (parseInt(d.hour, 10) % 24) * 60 + parseInt(d.minute, 10) };
  }

  /* El corazón: dado un día (0–6) y un minuto (0–1439), ¿qué pasa? */
  function estadoEn(dia, min) {
    var hoy = TURNOS[dia];
    var ayer = TURNOS[(dia + 6) % 7];

    /* 1) turno de ayer que sigue abierto de madrugada */
    if (ayer[1] > 1440 && min < ayer[1] - 1440) {
      return { abierto: true, cierra: ayer[1], turnoDe: (dia + 6) % 7, minTurno: min + 1440, dia: dia, min: min };
    }
    /* 2) turno de hoy */
    if (min >= hoy[0] && min < hoy[1]) {
      return { abierto: true, cierra: hoy[1], turnoDe: dia, minTurno: min, dia: dia, min: min };
    }
    /* 3) cerrado: ¿abre hoy más tarde o mañana? */
    if (min < hoy[0]) return { abierto: false, abre: hoy[0], cuando: 'hoy', dia: dia, min: min };
    var manana = (dia + 1) % 7;
    return { abierto: false, abre: TURNOS[manana][0], cuando: 'mañana', diaAbre: manana, dia: dia, min: min };
  }

  function frase(e) {
    if (e.abierto) return 'Abierto ahora · cierra ' + aLas(e.cierra);
    return (e.cuando === 'hoy' ? 'Abre hoy ' : 'Abre mañana ') + aLas(e.abre);
  }

  /* Qué toca a esta hora (solo si está abierto). */
  function momento(e) {
    if (!e.abierto) return null;
    var m = e.minTurno;
    for (var i = 0; i < MOMENTOS.length; i++) {
      if (m >= MOMENTOS[i].desde && m < MOMENTOS[i].hasta) return MOMENTOS[i];
    }
    return MOMENTOS[2];
  }

  function ahora(fecha) {
    var r = relojMadrid(fecha);
    var e = estadoEn(r.dia, r.min);
    e.frase = frase(e);
    e.momento = momento(e);
    return e;
  }

  /* Día del calendario que se marca como «hoy» en la tabla. De madrugada se
     marca el día del turno que sigue abierto (el viernes a la 1:30 del sábado
     aún se lee como «la noche del viernes»). */
  function diaMarcado(e) {
    return e.abierto ? e.turnoDe : e.dia;
  }

  function tabla() {
    return TURNOS.map(function (t, i) {
      return { dia: DIAS[i], corto: CORTOS[i], abre: hhmm(t[0]), cierra: t[1] === 1440 ? '24:00' : hhmm(t[1]) };
    });
  }

  raiz.NizabelHorario = {
    TURNOS: TURNOS, DIAS: DIAS, MOMENTOS: MOMENTOS,
    estadoEn: function (dia, min) { var e = estadoEn(dia, min); e.frase = frase(e); e.momento = momento(e); return e; },
    ahora: ahora, relojMadrid: relojMadrid, diaMarcado: diaMarcado, tabla: tabla, hhmm: hhmm, aLas: aLas
  };
})(typeof window !== 'undefined' ? window : globalThis);
