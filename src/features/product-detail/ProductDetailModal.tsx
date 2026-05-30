import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { menuService } from '@/services';
import { mapProductResponseToViewModel } from '@/lib/jsonapi';
import { useCart } from '@/app/CartContext';
import { useLabels } from '@/i18n/I18nContext';
import { formatMoney } from '@/utils/format';
import { QuantitySelector } from '@/components/common/QuantitySelector';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';

interface ProductDetailModalProps {
  productId: string;
  onClose: () => void;
}

export function ProductDetailModal({ productId, onClose }: ProductDetailModalProps) {
  const { add } = useCart();
  const { t } = useLabels();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    menuService.getProduct(productId).then((response) =>
      setProduct(response ? mapProductResponseToViewModel(response) : null),
    );
    setQuantity(1);
    setNote('');
  }, [productId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleAdd = () => {
    if (!product) return;
    add({ product, quantity, note });
    onClose();
  };

  const total = product ? product.price * quantity : 0;

  return (
    <div
      className="ff-product-modal"
      role="dialog"
      aria-modal="true"
      aria-label={product?.name}
      onClick={onClose}
    >
      <div
        className="ff-product-modal__sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {!product ? (
          <div className="ff-empty" style={{ padding: 32 }}>
            <i className="bi bi-arrow-repeat" />
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <>
            <div className="ff-product-modal__image-wrap">
              <button
                type="button"
                className="ff-product-modal__close"
                onClick={onClose}
                aria-label={t('common.close')}
              >
                <i className="bi bi-x-lg" />
              </button>
              <img
                className="ff-product-modal__image"
                src={product.imageUrl}
                alt={product.name}
              />
            </div>

            <div className="ff-product-modal__body">
              <h2 className="ff-product-modal__name">{product.name}</h2>
              {product.description && (
                <p className="ff-product-modal__desc">{product.description}</p>
              )}

              <div className="ff-product-modal__row">
                <span style={{ fontWeight: 600 }}>{t('product.quantity')}</span>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={20}
                />
              </div>

              <div>
                <div className="ff-product-modal__notes-label">
                  <i className="bi bi-chat" aria-hidden /> {t('product.notes')}
                </div>
                <textarea
                  className="ff-textarea"
                  rows={2}
                  placeholder={t('product.notesPlaceholder')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {product && (
        <div className="ff-product-modal__cta" onClick={(e) => e.stopPropagation()}>
          <SecondaryButton onClick={onClose}>
            <i className="bi bi-chevron-left" /> {t('common.back')}
          </SecondaryButton>
          <PrimaryButton onClick={handleAdd}>
            {t('product.add')} {formatMoney(total)}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
