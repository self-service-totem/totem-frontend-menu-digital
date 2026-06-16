import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LANGUAGE, resolveLanguage, type LanguageCode } from './labels';
import { tenantService } from '@/lib/services/adminService';

const ADMIN_LANG_KEY = 'ff_admin_lang';

/**
 * Idioma de las pantallas de staff (admin, caja, mozo, cocina, reportes, reservas).
 * Modelo híbrido: el default sale de `tenant.defaultLanguage` (config del restaurante);
 * la elección explícita del operador se persiste en localStorage y tiene prioridad.
 */
export function useAdminLanguage() {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(ADMIN_LANG_KEY);
    return saved ? resolveLanguage(saved) : DEFAULT_LANGUAGE;
  });

  // Sin elección explícita guardada → adoptar el default del tenant cuando cargue
  // (sin persistirlo: sigue siendo "default", no una elección del usuario).
  useEffect(() => {
    if (localStorage.getItem(ADMIN_LANG_KEY)) return;
    let active = true;
    tenantService.get().then((tenant) => {
      if (active && tenant?.defaultLanguage) {
        setLangState(resolveLanguage(tenant.defaultLanguage));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setLang = useCallback((l: LanguageCode) => {
    localStorage.setItem(ADMIN_LANG_KEY, l);
    setLangState(l);
  }, []);

  return { lang, setLang };
}
