import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import type { ModifierGroup, SelectedModifier } from '@/lib/types';
import { menuService } from '@/services';
import { modifierService } from '@/lib/services/modifierService';
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
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({}); // groupId → optionId[]
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    menuService.getProduct(productId).then((response) =>
      setProduct(response ? mapProductResponseToViewModel(response) : null),
    );
    modifierService.listForProduct(productId).then(setModifierGroups);
    setQuantity(1);
    setNote('');
    setSelectedModifiers({});
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

  function toggleModifierOption(group: ModifierGroup, optionId: string) {
    setSelectedModifiers((prev) => {
      const current = prev[group.id] ?? [];
      if (group.max === 1) {
        return { ...prev, [group.id]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (current.length < group.max) {
        return { ...prev, [group.id]: [...current, optionId] };
      }
      return prev;
    });
  }

  const modifierPrice = modifierGroups.reduce((sum, group) => {
    const sel = selectedModifiers[group.id] ?? [];
    return sum + group.options
      .filter((o) => sel.includes(o.id))
      .reduce((s, o) => s + o.priceModifier, 0);
  }, 0);

  const handleAdd = () => {
    if (!product) return;
    const resolvedModifiers: SelectedModifier[] = modifierGroups.flatMap((group) =>
      (selectedModifiers[group.id] ?? []).map((optId) => {
        const opt = group.options.find((o) => o.id === optId)!;
        return { groupId: group.id, groupName: group.name, optionId: opt.id, optionName: opt.name, priceModifier: opt.priceModifier };
      }),
    );
    const modNote = resolvedModifiers.map((m) => m.optionName).join(', ');
    const fullNote = [modNote, note].filter(Boolean).join(' | ');
    add({ product: { ...product, price: product.price + modifierPrice }, quantity, note: fullNote || undefined });
    onClose();
  };

  const total = product ? (product.price + modifierPrice) * quantity : 0;

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

              {/* F1: Modifier groups */}
              {modifierGroups.map((group) => (
                <div key={group.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                    {group.name}
                    {group.required && <span style={{ color: 'var(--ff-primary)', fontSize: '0.75rem', marginLeft: 4 }}>*obrigatório</span>}
                    {group.max > 1 && <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginLeft: 4 }}>até {group.max}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {group.options.filter((o) => o.available).map((opt) => {
                      const sel = (selectedModifiers[group.id] ?? []).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleModifierOption(group, opt.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            border: `2px solid ${sel ? 'var(--ff-primary)' : 'var(--ff-border)'}`,
                            background: sel ? 'var(--ff-primary-soft)' : '#fff',
                            color: sel ? 'var(--ff-primary)' : 'var(--ff-text)',
                            fontWeight: sel ? 700 : 400,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all .12s',
                          }}
                        >
                          {opt.name}
                          {opt.priceModifier > 0 && (
                            <span style={{ marginLeft: 4, fontSize: '0.75rem', color: sel ? 'var(--ff-primary)' : '#9ca3af' }}>
                              +{formatMoney(opt.priceModifier)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

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
