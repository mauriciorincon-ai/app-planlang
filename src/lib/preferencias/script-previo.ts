/**
 * El script que corre ANTES de pintar: primer hijo del `<head>` de cada página, en línea y síncrono
 * (no `next/script` con `beforeInteractive`: en el App Router corre después de los chunks y la página
 * destella en el tema equivocado).
 *
 * Orden de precedencia, igual para tema y perfil: `?tema=` / `?perfil=` en la URL (y se recuerda) >
 * lo guardado > el sistema (`prefers-color-scheme`) o «líder». Además guarda el idioma de la página
 * (`<html data-idioma>`) para que `/` lleve ahí la próxima vez.
 *
 * Todo acceso a `localStorage` va en try/catch: en una ventana privada o con el almacenamiento
 * bloqueado, el script sigue y la página se pinta con los valores por defecto.
 */
import {
  ATRIBUTO,
  ATRIBUTO_IDIOMA,
  ATRIBUTO_MONO,
  PREFIJO,
  VALORES,
} from "./claves";

const js = JSON.stringify;

export const SCRIPT_PREVIO = [
  "(function(){",
  "var d=document.documentElement,q=null;",
  "try{q=new URLSearchParams(location.search)}catch(e){}",
  `function lee(k){try{return localStorage.getItem(${js(PREFIJO)}+k)}catch(e){return null}}`,
  `function guarda(k,v){try{localStorage.setItem(${js(PREFIJO)}+k,v)}catch(e){}}`,
  "function elige(k,ok,defecto){var v=q&&q.get(k);",
  "if(ok.indexOf(v)>=0){guarda(k,v);return v}",
  "v=lee(k);return ok.indexOf(v)>=0?v:defecto()}",
  `d.setAttribute(${js(ATRIBUTO.tema)},elige("tema",${js(VALORES.tema)},function(){`,
  `try{return matchMedia("(prefers-color-scheme: light)").matches?${js(VALORES.tema[1])}:${js(VALORES.tema[0])}}`,
  `catch(e){return ${js(VALORES.tema[0])}}}));`,
  `d.setAttribute(${js(ATRIBUTO.perfil)},elige("perfil",${js(VALORES.perfil)},function(){return ${js(VALORES.perfil[0])}}));`,
  // Solo las páginas de un idioma lo recuerdan (`data-idioma`); la raíz `/` no lo pisa.
  `var i=d.getAttribute(${js(ATRIBUTO_IDIOMA)});if(i)guarda("idioma",i);`,
  // La mono de datos entra después de la carga (ADR-008): el primer pintado no la necesita.
  `addEventListener("load",function(){d.setAttribute(${js(ATRIBUTO_MONO)},"")});`,
  "})();",
].join("");
