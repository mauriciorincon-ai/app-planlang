import { MessageCircleQuestion } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import { LIDER, PREGUNTA } from "@/textos/entrada";
import { Baldosa } from "../baldosa";

/** Las comillas de cada idioma: angulares en español, inglesas en inglés (tipografía, no texto). */
const COMILLAS: Record<Idioma, string> = {
  es: "[quotes:'«'_'»']",
  en: "[quotes:'“'_'”']",
};

/** La pregunta de entrevista de 2026 y la respuesta de planlang. */
export function Pregunta({ idioma }: { idioma: Idioma }) {
  return (
    <section
      aria-labelledby="s-preg"
      className="grid grid-cols-1 gap-6 border-t border-linea py-10 escritorio:grid-cols-12"
    >
      <p
        id="s-preg"
        className="flex items-center gap-3 self-start text-chico text-tinta-2 escritorio:col-span-4"
      >
        <Baldosa icono={MessageCircleQuestion} />
        {PREGUNTA.rotulo[idioma]}
      </p>
      <div className="escritorio:col-span-8 escritorio:col-start-5">
        <q
          className={`block text-cita font-medium tracking-cita ${COMILLAS[idioma]}`}
        >
          {PREGUNTA.cita[idioma]}
        </q>
        <p className="mt-3 max-w-lectura text-tinta-2">
          {LIDER.respuesta[idioma]}
        </p>
      </div>
    </section>
  );
}
