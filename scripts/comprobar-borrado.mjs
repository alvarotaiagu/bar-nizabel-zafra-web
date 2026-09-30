/* Comprueba contra los archivos que el mando de maqueta ya no está.
   La receta del README no se escribe de memoria: se comprueba.

   node scripts/comprobar-borrado.mjs ../bar-nizabel-entrega
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raizMaqueta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raiz = process.argv[2] ? path.resolve(process.argv[2]) : raizMaqueta;

const rastros = [
  ['index.html',      /\[MANDO DE MAQUETA\]/,   'marcas [MANDO DE MAQUETA]'],
  ['index.html',      /id="mando"/,             'el <div class="mando">'],
  ['index.html',      /nizabel-densidad/,       'la lectura de la densidad en el <head>'],
  ['index.html',      /class="ahora"/,          'la franja «ahora mismo» (solo existe para la sobria)'],
  ['index.html',      /revision/,               'cualquier mención al modo ?revision'],
  ['css/estilos.css', /\[MANDO DE MAQUETA\]/,   'el bloque CSS del mando'],
  ['css/estilos.css', /densidad-sobria/,        'las reglas de la versión sobria'],
  ['css/estilos.css', /\.mando/,                'los estilos del mando'],
  ['js/main.js',      /\[MANDO DE MAQUETA\]/,   'el bloque JS del mando'],
  ['js/main.js',      /mandoMaqueta/,           'la función mandoMaqueta()'],
  ['js/main.js',      /nizabel-densidad/,       'la clave guardada de la densidad'],
  ['privacidad.html', /nizabel-densidad/,       'la fila del aviso de cookies'],
  ['privacidad.html', /\[MANDO DE MAQUETA\]/,   'el comentario de la fila']
];

let quedan = 0;
console.log('Rastros del mando de maqueta en ' + raiz);
console.log('-'.repeat(72));
for (const [archivo, patron, que] of rastros) {
  const texto = fs.readFileSync(path.join(raiz, archivo), 'utf8');
  const hay = patron.test(texto);
  if (hay) quedan++;
  console.log((hay ? 'QUEDA ' : 'limpio') + '  ' + archivo.padEnd(18) + que);
}
console.log('-'.repeat(72));
if (quedan) {
  console.log(quedan + ' rastro(s). No entregar todavía.');
  process.exitCode = 1;
} else {
  console.log('Sin rastros del mando. Se puede entregar.');
}
