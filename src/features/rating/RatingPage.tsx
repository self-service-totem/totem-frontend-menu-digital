import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useLabels } from '@/i18n/I18nContext';
import type { LabelKey } from '@/i18n/labels';

const SCORE_KEYS: LabelKey[] = [
  'rating.score1',
  'rating.score2',
  'rating.score3',
  'rating.score4',
  'rating.score5',
];

export function RatingPage() {
  const { t } = useLabels();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  // Score label reflects hover (preview) or the locked-in rating
  const shown = hover || rating;

  if (sent) {
    return (
      <div className="ff-page">
        <TopBar title={t('rating.title')} />
        <div className="ff-rating-thanks">
          <div className="ff-rating-thanks__icon">
            <i className="bi bi-check-lg" />
          </div>
          <h2 className="ff-rating-thanks__title">{t('rating.thanks')}</h2>
          <p className="ff-rating-thanks__desc">{t('rating.thanksDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-page">
      <TopBar title={t('rating.title')} />
      <div className="ff-rating-head">
        <h2 className="ff-rating-head__title">{t('rating.question')}</h2>
        <p className="ff-rating-head__sub">{t('rating.tapStars')}</p>
      </div>

      <div className="ff-stars" role="radiogroup" aria-label={t('rating.title')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n <= rating}
            className={n <= shown ? 'active' : ''}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={t('rating.starLabel', { n })}
          >
            <i className={n <= shown ? 'bi bi-star-fill' : 'bi bi-star'} />
          </button>
        ))}
      </div>

      <div className="ff-rating-score" aria-live="polite">
        {shown > 0 ? t(SCORE_KEYS[shown - 1]) : ' '}
      </div>

      <div className="ff-rating-comment">
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
