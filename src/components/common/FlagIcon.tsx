import type { LanguageCode } from '@/i18n/labels';

// Inline SVG flags: emoji flags render inconsistently across OS/browsers
// (Windows shows plain text codes) and can't scale crisply on kiosk screens.

interface FlagIconProps {
  code: LanguageCode;
  className?: string;
}

export function FlagIcon({ code, className }: FlagIconProps) {
  const cls = `ff-flag ${className ?? ''}`.trim();

  if (code === 'es') {
    // Argentina
    return (
      <svg className={cls} viewBox="0 0 28 20" aria-hidden="true" focusable="false">
        <rect width="28" height="20" fill="#74ACDF" />
        <rect y="6.67" width="28" height="6.66" fill="#fff" />
        <circle cx="14" cy="10" r="2.3" fill="#F6B40E" />
      </svg>
    );
  }

  if (code === 'en') {
    // United States
    return (
      <svg className={cls} viewBox="0 0 28 20" aria-hidden="true" focusable="false">
        <rect width="28" height="20" fill="#fff" />
        {[0, 2, 4, 6].map((i) => (
          <rect key={i} y={i * 2.857} width="28" height="2.857" fill="#B22234" />
        ))}
        <rect width="11.2" height="10" fill="#3C3B6E" />
      </svg>
    );
  }

  // Brazil (pt-BR, default)
  return (
    <svg className={cls} viewBox="0 0 28 20" aria-hidden="true" focusable="false">
      <rect width="28" height="20" fill="#009C3B" />
      <path d="M14 3 L25 10 L14 17 L3 10 Z" fill="#FFDF00" />
      <circle cx="14" cy="10" r="3.4" fill="#002776" />
    </svg>
  );
}
