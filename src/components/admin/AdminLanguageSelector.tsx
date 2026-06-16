import { useState, useRef, useEffect } from 'react';
import { useLabels } from '@/i18n/I18nContext';
import { FlagIcon } from '@/components/common/FlagIcon';
import type { LanguageCode } from '@/i18n/labels';

const OPTIONS: { code: LanguageCode; labelKey: 'lang.pt' | 'lang.es' | 'lang.en' }[] = [
  { code: 'pt-BR', labelKey: 'lang.pt' },
  { code: 'es',    labelKey: 'lang.es' },
  { code: 'en',    labelKey: 'lang.en' },
];

export function AdminLanguageSelector({
  language,
  onChange,
}: {
  language: LanguageCode;
  onChange: (lang: LanguageCode) => void;
}) {
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

  return (
    <div ref={ref} className="ff-lang-dropdown">
      <button
        type="button"
        className="ff-lang-dropdown__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t('lang.selector')}
      >
        <FlagIcon code={language} />
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
                  onChange(o.code);
                  setOpen(false);
                }}
              >
                <FlagIcon code={o.code} />
                <span>{t(o.labelKey)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
