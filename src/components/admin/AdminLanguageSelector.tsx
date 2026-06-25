import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }, []);

  useEffect(() => {
    if (!open) return;
    calcPos();
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, calcPos]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="ff-lang-dropdown__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t('lang.selector')}
      >
        <FlagIcon code={language} />
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} />
      </button>
      {open && createPortal(
        <ul
          ref={menuRef}
          className="ff-lang-dropdown__menu"
          role="listbox"
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
        >
          {OPTIONS.map((o) => (
            <li key={o.code} role="option" aria-selected={language === o.code}>
              <button
                type="button"
                className={language === o.code ? 'active' : ''}
                onClick={() => { onChange(o.code); setOpen(false); }}
              >
                <FlagIcon code={o.code} />
                <span>{t(o.labelKey)}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </>
  );
}
