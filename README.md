# Bar Nizabel (Zafra) · web «Punto medio»

Maqueta para un negocio real que **no la ha encargado**. Está en local y **sin publicar**. Lleva `noindex` en todas las páginas.

- Bar Nizabel · Ronda del Pilar, 6 · 06300 Zafra (Badajoz) · 622 69 35 98
- Construida el 2026-09-30 a partir de `bar-nizabel-zafra-bocetos/PROMPT-punto-medio.md`.

## Verla

```
node scripts/servir.mjs                 → http://127.0.0.1:4192
http://127.0.0.1:4192/?revision         → con el mando de las dos versiones
node scripts/verificar.mjs              → 123 comprobaciones
node scripts/verificar.mjs --capturas   → además rehace screenshots/
```

## Concepto: «Punto medio»

Lo único que es suyo es el **rótulo**. En el toldo pone «CAFÉ · COPAS  NIZABEL» y en el mural de dentro «CAFÉ · COPAS» sobre «NIZABEL», **con un punto rojo entre las dos palabras**.

Ese punto es el motivo de toda la web. Significa dos cosas:
- el bar está a medio camino entre el café de la mañana y la copa de la noche;
- es punto de encuentro del barrio.

Es un concepto de marca: no promete nada que pueda resultar falso.

Dónde aparece el punto:
- **Cortina:** aparece un punto en el centro, del que salen «CAFÉ» y «COPAS». Se estira hasta ser una línea de lado a lado, y la línea se abre en lente (`expo.inOut`) para desvelar la página.
- **Hero** (anclado con `pin`): «CAFÉ» sale por la izquierda y «COPAS» se centra. El punto no se mueve y crece detrás hasta ser un disco.
- **Cursor:** punto sólido + aro.
- **Separadores:** una línea que sale del punto hacia los dos lados.
- **Terraza:** la foto se abre desde un punto rojo (máscara circular).
- **Estado «abierto ahora»:** el punto late cuando está abierto y se queda hueco cuando está cerrado.
- **Nota de Google:** cinco puntos, el último relleno al 30 %.
- **Relojes:** el eje de las agujas es el punto.

### Qué la separa de las otras webs de Zafra (y de Marabú/Melao)

| | Restaurante Gabi | Raíces | **Nizabel** |
|---|---|---|---|
| Motivo | Arcada del soportal | Herbario, flor, «dos orillas» | Un punto y una línea, del rótulo |
| Cortina | Sello que se dibuja y se entra por un arco | Flor | Punto → CAFÉ · COPAS → línea → lente |
| Hero | Arcada anclada, la copa del sello se llena | Lámina botánica | Rótulo tipográfico anclado: CAFÉ se va, COPAS se centra, el punto crece |
| Pila | Capítulos de la carta en arcos | Láminas | Mañana / tarde / noche, cada una con su reloj de trazo |
| Paleta | Marino + ámbar + crema | Botánica | Marrón toldo + cal + un solo rojo |
| Tipografía | Fraunces + Inter | Zilla Slab + Figtree | Antonio + Nunito Sans |

No hay arcos, sellos, copas que se llenan, flores ni láminas. Tampoco hay cambio de tema día/noche (el de Marabú y Melao v2): las tres tarjetas son iguales y el fondo no cambia con la hora. La hora solo cambia el **texto** del estado.

## Secciones

1. **Hero:** el rótulo, la dirección, el estado en vivo y dos botones: Llamar y Cómo llegar.
2. **De 8:30 a 2:00:** pila sticky de tres tarjetas del mismo alto, medido por JS.
   - Mañana: café, desayunos, tostadas y bollería, de lunes a viernes. Reloj a las 8:30.
   - Tarde: cañas y tapas. Reloj a las 16:00.
   - Noche: copas. Reloj a las 2:00.
3. **Cinta:** café · tostadas · cañas · tapas · copas · terraza, con el punto de separador.
4. **La terraza:** foto que se abre desde un punto.
5. **Reseñas:** «4,3★ · 365 reseñas en Google», tres citas literales y un botón a Google.
6. **Visita:** horario de la semana con hoy marcado, precio medio, «No se aceptan reservas» como dato, teléfono y mapa con consentimiento.
7. **Pie:** logo, dirección, teléfono, Facebook, legales y el enlace para reabrir el aviso de cookies.

## Paleta y tipografía

Colores sacados con PIL de la fachada (Street View, septiembre de 2025) y del mural interior:

| Token | Medido | Usado | Papel |
|---|---|---|---|
| `--toldo` | `#3C3024` | `#3A2E25` | Fondo dominante |
| `--cal` | `#E4E4E4` | `#EEE9E0` | Superficie clara (la cal, algo más cálida para que conviva con el marrón) |
| `--punto` | `#933E34` | `#C8473A` | El único acento |

**Sobre el acento:** el `#933E34` se midió en la zona mejor iluminada del mural, pero la foto de interior está subexpuesta. Corregí media parada de exposición conservando el tono (≈7°). No es un color inventado: es el rojo de su «NIZABEL» y de su punto.

Derivados del acento, siempre con `color-mix`:
- `--punto-texto` (80 % punto + tinta) → 5,1:1 sobre cal. Se usa en botones y rótulos pequeños.
- `--punto-claro` (60 % punto + cal) → 4,8:1 sobre toldo. Se usa en antetítulos sobre fondo oscuro.

`verificar.mjs` mide ocho pares en el navegador componiendo el alfa: todos quedan por encima de 4,5:1. El rojo puro solo va en lo decorativo (puntos, el disco del hero) y en el texto grande.

Tipografía:
- **Antonio** para el rótulo: una grotesca condensada muy parecida a la del toldo.
- **Nunito Sans** para el texto: una sans cálida.

## Qué es real y qué es provisional

**Real (fuente: ficha de Google, consultada el 2026-09-30):**
- Nombre del rótulo, dirección y teléfono.
- Horario L–J 8:30–1:00 · V 8:30–2:00 · S 16:00–2:00 · D 16:00–24:00.
- 4,3★ con 365 reseñas.
- Precio de 1 a 10 € por persona (22 personas).
- Tiene terraza y no acepta reservas.

**Real (otras fuentes):**
- Las tres citas: literales, copiadas de Google el 2026-09-30.
- El Facebook, confirmado (ver abajo).

**Provisional o de relleno:**
- Logotipo.
- Foto de la terraza: es de Pexels y **no es el bar**.
- Textos de las tarjetas: son las categorías genéricas de Restaurant Guru, sin carta.
- Cortes de «ahora mismo» a las 13:00 y a las 21:00: son editoriales, no horario del bar.

**Fuera a propósito:**
- Wifi y pago con tarjeta: solo los da Restaurant Guru, que es genérico. Hay que confirmarlo.
- Carta y precios.
- Año de apertura y nombre del titular.

### Estado en vivo

Está en `js/horario.js`. Tres días cierran después de medianoche, así que cada turno se guarda en minutos desde las 0:00 del día en que **abre**, y el cierre puede pasar de 1440. La hora se calcula siempre en **Europe/Madrid** (el test se lanza con el navegador en Nueva York).

Casos probados: S 1:30 abierto · S 10:00 cerrado, «abre hoy a las 16:00» · D 23:59 abierto · L 0:30 cerrado · M 0:30 abierto. Hay seis casos más en los bordes.

⚠️ **El caso «V 1:30 → abierto» del encargo no cuadra con el horario de Google.** El jueves cierra a la 1:00, así que el viernes a la 1:30 está **cerrado** («abre hoy a las 8:30»). El test lo comprueba así. Si en la ficha de Google el jueves pasa a cerrar a las 2:00, se cambia una línea de `TURNOS`.

## Pendientes para el dueño

1. **Logotipo provisional.** Lo compuse a partir del rótulo:
   - mismo orden, «CAFÉ · COPAS» sobre «NIZABEL»;
   - el punto rojo del mural;
   - letra Antonio convertida a trazados (`scripts/logo.py`).

   También hace de favicon («N» + punto). Hay que preguntarle si lo quiere o si tiene la tipografía del rótulo.
2. **El salón.** Google llama al bar «Bar Nizabel (Salón Recreativo)» y su Facebook dice «salón recreativo tipo A».
   - Una reseña habla de «maquinitas recreativas (sin apuestas)», y en las fotos del propietario hay billar, ping-pong y hockey de aire.
   - **La web no lo menciona en ningún sitio**: en ningún texto, imagen ni estética. Un test lo vigila en las cuatro páginas.
   - Por qué: reduciría el bar a eso, y la publicidad del juego está regulada (RD 958/2020). Aunque las «tipo A» son sin premio, conviene hablarlo con él antes.
   - Si quiere que salga, habría que hacerlo con cuidado y como sala de ocio (billar), nunca como reclamo.
   - El nombre legal completo tampoco va en el aviso legal: el nombre de Google no es un nombre legal, y el legal será el del titular.
3. **La tilde.** El rótulo dice «NIZABEL» y Facebook, «Nízabel Cafetería Copas». La web usa «Nizabel», como el rótulo. Hay que preguntarle cuál es la buena.
4. **WhatsApp.** El 622 69 35 98 es un móvil, pero no está confirmado que tenga WhatsApp. La web solo ofrece llamar.
5. **Carta y precios.** No hay ninguna fuente fiable. `data/carta.json` está preparado y vacío. Cuando la pasen, se rellena y la web la pinta dentro de cada tarjeta; la pila se reiguala sola, y el test lo comprueba con datos de prueba.
   - Google destaca «Cerveza Estrella Galicia», «Magdalena casera muy rica» y «Mahou». Las reseñas hablan de tostadas, aperitivo y fritos. Nada de eso está en la web: que lo confirme él.
6. **Fotos propias.**
   - En Google hay fotos de la cuenta del propio bar (2015): la terraza con toldo y sombrillas, y la barra con el mural. Son del negocio, pero de hace diez años. Hay que pedir permiso y fotos nuevas.
   - Las fotos de clientes no se usan.
   - La foto de Pexels se quita en cuanto haya una propia, que pasará por `scripts/gradar.py`.
7. **Permiso de las reseñas.** Se citan literalmente, con el nombre de pila:
   - «Pili» = Pili Sayago, 5★, hace 2 años;
   - «Francisco» = francisco ramirez, 5★, hace 8 años;
   - «Carlos» = Carlos Rodríguez González, 5★, hace 8 años.

   Las de Francisco y Carlos son antiguas: si el dueño prefiere citas recientes, hay 70 reseñas descargadas para elegir. No se muestran fechas en la web.
8. **Titular y NIF.** Están como `[PENDIENTE]` en el aviso legal y en privacidad.
9. **Facebook: confirmado y enlazado en el pie.** facebook.com/nizabel.cb:
   - el perfil dice «Vive en Zafra, Extremadura»;
   - hay una publicación «Nizabel Bar #Zafra»;
   - la descripción coincide con Google («cafés, copas, Bar TV… y ahora, salón recreativo tipo A»);
   - Google enlaza facebook.com como web del bar.

   Sus fotos visibles sin sesión son personales o de baja resolución: no se usa ninguna. Hay que preguntarle si esa página sigue siendo la del bar (las publicaciones que se ven son antiguas).
10. **Horario de festivos y días de partido.** En Facebook anunciaban aperturas especiales para partidos. La web solo da el horario de Google.

## Las dos versiones (mando de maqueta)

Solo aparece con `?revision` en la URL. Sin ese parámetro no hay mando, y tampoco se aplica una densidad guardada.

- **«Punto medio»** (la cargada): el punto en la cortina, el cursor, los separadores, la máscara de la terraza, el hero anclado y los relojes de trazo.
- **«Sobria»:** el punto **solo** como indicador de abierto.
  - La cortina es una línea que se abre, sin punto ni palabras.
  - Sin cursor propio, sin puntos en los separadores y sin máscara.
  - El hero no se ancla.
  - Los relojes se cambian por **tablas horarias compactas**.
  - Añade la franja **«ahora mismo»**, que la cargada no tiene: lo que toca a esta hora (hora del café / de cañas / de copas) y cuándo cierra.

### Quitar el mando de maqueta

El mando **nunca viaja al cliente**. Todo lo que hay que quitar está entre marcas `[MANDO DE MAQUETA] … fin del bloque [MANDO DE MAQUETA]`, en cuatro archivos:

| Archivo | Qué se quita |
|---|---|
| `index.html` | el aviso del mando, la lectura de la densidad en el `<head>`, la franja «ahora mismo» y el `<div class="mando">` |
| `css/estilos.css` | el bloque del mando y las reglas de la sobria |
| `js/main.js` | `mandoMaqueta()` |
| `privacidad.html` | la fila `nizabel-densidad` |

**Caso A: entregan «Punto medio».**

```
node scripts/quitar-mando.mjs ../bar-nizabel-entrega
node scripts/comprobar-borrado.mjs ../bar-nizabel-entrega
```

La copia sale sin mando y la maqueta sigue intacta. `verificar.mjs` hace esto mismo en cada pasada: genera la copia, comprueba que no quedan rastros y la abre en el navegador (sin errores y sin mando).

**Caso B: eligen la sobria.**
1. Antes de pasar el script, en `index.html`, cambia la clase del `<html>` a `densidad-sobria`.
2. Saca la franja «ahora mismo» de sus marcas, para que no se borre.
3. En `css/estilos.css`, saca de sus marcas las reglas `.densidad-sobria` (las dos del bloque grande y las de pantallas estrechas).
4. Pasa `quitar-mando.mjs`. `comprobar-borrado.mjs` avisará de «reglas de la sobria» y de «franja ahora mismo»: en este caso es lo esperado. Revisa que el resto sale limpio.

## Obligatorios cumplidos (con su test)

- **Checklist de web desde cero:**
  - cursor sin el del sistema, con relleno de .38;
  - pila con el mismo alto y el mismo margen, probada en página limpia a 1440 y a 390;
  - menú móvil de `100dvh` con la cabecera ya fija;
  - cookies con `.cookies:not([hidden]){display:flex}`;
  - cortina con fotograma a medias, color distinto del hero y retirada sin GSAP y con movimiento reducido;
  - hero sin solapes a 360×640, 375×667, 390×844, 768×1024 y 1440×900;
  - `con-movimiento` solo con GSAP y sin reducción.
- `noindex` justo detrás del charset en las cuatro páginas.
- Legales con titular y NIF `[PENDIENTE]`.
- CSS y JS versionados con `?v=<huella>` por `scripts/versionar.mjs`, anclado a `href`/`src`: la segunda pasada no cambia nada.
- **Movimiento reducido:** el estado en vivo, el día de hoy, las agujas y las cifras siguen; el movimiento no.
- **Sin canvas:** el punto es DOM y SVG, así que no hay blur por fotograma.
- Mapa: el iframe solo existe tras el clic, y se pide **por dirección**, porque por nombre Google enseñaría «Salón Recreativo».
- Lenis desde jsDelivr (no cdnjs).

## Scripts

| Script | Para qué |
|---|---|
| `servir.mjs` | servidor local en el puerto 4192 |
| `verificar.mjs` | la batería de Playwright; `--capturas` guarda `screenshots/` |
| `versionar.mjs` | recalcula `?v=` de CSS y JS; pásalo antes de cada commit |
| `quitar-mando.mjs` · `comprobar-borrado.mjs` | la entrega sin mando |
| `logo.py` | rehace el logotipo y el favicon desde Antonio (fontTools) |
| `gradar.py` | la gradación común de las fotos |
