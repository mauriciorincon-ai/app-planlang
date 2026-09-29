/**
 * `/` elige el idioma (ADR-008): el último que el visitante usó (lo guarda el script previo de cada página)
 * o, si no hay, el primero de `navigator.languages` que sea español o inglés; si ninguno, español. Con
 * `?elegir` no lleva a ninguna parte: muestra los dos enlaces (sin JS también se ven).
 *
 * El cuerpo recibe `location`, `localStorage` y `navigator` como nombres libres para que la prueba lo
 * corra con dobles; en la página va envuelto en una función que se llama sola.
 */
import { PREFIJO } from "./claves";

export const CUERPO_SCRIPT_IDIOMA = [
  "if(/[?&]elegir(=|&|$)/.test(location.search))return;",
  `var l=null;try{l=localStorage.getItem(${JSON.stringify(PREFIJO + "idioma")})}catch(e){}`,
  'if(l!=="es"&&l!=="en"){',
  'var n=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||""];',
  'l="es";',
  "for(var i=0;i<n.length;i++){var x=String(n[i]).toLowerCase();",
  'if(x.indexOf("es")===0){l="es";break}',
  'if(x.indexOf("en")===0){l="en";break}}}',
  'location.replace("/"+l);',
].join("");

export const SCRIPT_IDIOMA = `(function(){${CUERPO_SCRIPT_IDIOMA}})();`;
