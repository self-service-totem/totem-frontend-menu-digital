import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useLabels } from '@/i18n/I18nContext';

export function RatingPage() {
  const { t } = useLabels();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="ff-page">
        <TopBar title={t('rating.title')} />
        <div className="ff-empty">
          <i className="bi bi-emoji-smile" style={{ color: 'var(--ff-primary)' }} />
          <p style={{ fontWeight: 600, color: 'var(--ff-text)', margin: '0 0 6px' }}>
            {t('rating.thanks')}
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('rating.thanksDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-page">
      <TopBar title={t('rating.title')} />
      <div style={{ padding: '20px 16px 0', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.15rem' }}>{t('rating.question')}</h2>
        <p style={{ margin: 0, color: 'var(--ff-text-muted)', fontSize: '0.9rem' }}>
          {t('rating.tapStars')}
        </p>
      </div>

      <div className="ff-stars" role="radiogroup" aria-label="Estrellas">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n <= rating}
            className={n <= rating ? 'active' : ''}
            onClick={() => setRating(n)}
            aria-label={`${n}`}
          >
            <i className={n <= rating ? 'bi bi-star-fill' : 'bi bi-star'} />
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        <textarea
          className="ff-textarea"
          rows={4}
          placeholder={t('rating.commentPlaceholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div className="ff-sticky-cta">
        <PrimaryButton disabled={rating === 0} onClick={() => setSent(true)}>
          {t('rating.send')}
        </PrimaryButton>
      </div>
    </div>
  );
}
