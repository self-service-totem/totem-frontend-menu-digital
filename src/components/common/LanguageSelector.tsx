import { useState, useRef, useEffect } from 'react';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import type { LanguageCode } from '@/i18n/labels';

interface Option {
  code: LanguageCode;
  flag: string;
  labelKey: 'lang.es' | 'lang.pt' | 'lang.en';
}

const OPTIONS: Option[] = [
  { code: 'es', flag: '🇦🇷', labelKey: 'lang.es' },
  { code: 'pt-BR', flag: '🇧🇷', labelKey: 'lang.pt' },
  { code: 'en', flag: '🇺🇸', labelKey: 'lang.en' },
];

interface LanguageSelectorProps {
  /** Render as a floating row of pills instead of a dropdown */
  variant?: 'dropdown' | 'pills';
  className?: string;
}

export function LanguageSelector({ variant = 'dropdown', className }: LanguageSelectorProps) {
  const { language, setLanguage } = useSession();
  const { t } = useLabels();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const current = OPTIONS.find((o) => o.code === language) ?? OPTIONS[0];

  if (variant === 'pills') {
    return (
      <div className={`ff-lang-pills ${className ?? ''}`}>
        {OPTIONS.map((o) => (
          <button
            key={o.code}
            type="button"
            className={`ff-lang-pill ${language === o.code ? 'ff-lang-pill--active' : ''}`}
            onClick={() => setLanguage(o.code)}
          >
            <span>{o.flag}</span>
            <span>{t(o.labelKey)}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className={`ff-lang-dropdown ${className ?? ''}`}>
      <button
        type="button"
        className="ff-lang-dropdown__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t('lang.selector')}
      >
        <span>{current.flag}</span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} />
      </button>
      {open && (
        <ul className="ff-lang-dropdown__menu" role="listbox">
          {OPTIONS.map((o) => (
            <li key={o.code} role="option" aria-selected={language === o.code}>
              <button
                type="button"
                className={language === o.code ? 'active' : ''}
                onClick={() => {
                  setLanguage(o.code);
                  setOpen(false);
                }}
              >
                <span>{o.flag}</span>
                <span>{t(o.labelKey)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
