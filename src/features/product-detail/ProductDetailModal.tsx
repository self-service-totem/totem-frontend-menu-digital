import { useEffect, useMemo, useState } from 'react';
import type { CartModifier, Product } from '@/types';
import type { ModifierGroup } from '@/lib/types';
import { menuService } from '@/services';
import { modifierService } from '@/lib/services/modifierService';
import { mapProductResponseToViewModel } from '@/lib/jsonapi';
import { useCart } from '@/app/CartContext';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { useNotify } from '@/lib/notifications';
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
  const { menuContext } = useSession();
  const { t } = useLabels();
  const notify = useNotify();
  const currency = menuContext?.currency ?? 'BRL';

  const [product, setProduct] = useState<Product | null>(null);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({}); // groupId → optionId[]
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    menuService.getProduct(productId).then((response) =>
      setProduct(response ? mapProductResponseToViewModel(response) : null),
    );
    modifierService.listForProduct(productId).then(setModifierGroups);
    setQuantity(1);
    setNote('');
    setSelectedModifiers({});
    setShowErrors(false);
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

  // Required groups that don't yet have the minimum selection.
  const missingRequiredIds = useMemo(() => {
    return modifierGroups
      .filter((g) => g.required && (selectedModifiers[g.id]?.length ?? 0) < Math.max(1, g.min))
      .map((g) => g.id);
  }, [modifierGroups, selectedModifiers]);

  const modifierPrice = modifierGroups.reduce((sum, group) => {
    const sel = selectedModifiers[group.id] ?? [];
    return sum + group.options
      .filter((o) => sel.includes(o.id))
      .reduce((s, o) => s + o.priceModifier, 0);
  }, 0);

  const handleAdd = () => {
    if (!product) return;
    if (missingRequiredIds.length > 0) {
      setShowErrors(true);
      notify(t('product.selectRequired'), 'warning');
      return;
    }
    const modifiers: CartModifier[] = modifierGroups.flatMap((group) =>
      (selectedModifiers[group.id] ?? []).map((optId) => {
        const opt = group.options.find((o) => o.id === optId)!;
        return {
          groupId: group.id,
          groupName: group.name,
          optionId: opt.id,
          optionName: opt.name,
          priceModifier: opt.priceModifier,
        };
      }),
    );
    add({ product, quantity, note: note.trim() || undefined, modifiers });
    notify(`${product.name} · ${t('menu.addedToCart')}`, 'success');
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
              <div className="ff-product-modal__head">
                <h2 className="ff-product-modal__name">{product.name}</h2>
                <span className="ff-product-modal__price">{formatMoney(product.price, currency)}</span>
              </div>
              {product.description && (
                <p className="ff-product-modal__desc">{product.description}</p>
              )}

              {/* Modifier groups */}
              {modifierGroups.map((group) => {
                const invalid = showErrors && missingRequiredIds.includes(group.id);
                return (
                  <div key={group.id} className="ff-modgroup">
                    <div className="ff-modgroup__head">
                      <span className="ff-modgroup__name">{group.name}</span>
                      {group.required && (
                        <span className={`ff-modgroup__req ${invalid ? 'ff-modgroup__req--error' : ''}`}>
                          {t('product.required')}
                        </span>
                      )}
                      {group.max > 1 && (
                        <span className="ff-modgroup__hint">{t('product.upTo', { max: group.max })}</span>
                      )}
                    </div>
                    <div className="ff-modgroup__options">
                      {group.options.filter((o) => o.available).map((opt) => {
                        const sel = (selectedModifiers[group.id] ?? []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={`ff-modchip ${sel ? 'ff-modchip--active' : ''}`}
                            onClick={() => toggleModifierOption(group, opt.id)}
                          >
                            {opt.name}
                            {opt.priceModifier > 0 && (
                              <span className="ff-modchip__price">+{formatMoney(opt.priceModifier, currency)}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

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

            <div className="ff-product-modal__cta">
              <SecondaryButton onClick={onClose}>
                <i className="bi bi-chevron-left" /> {t('common.back')}
              </SecondaryButton>
              <PrimaryButton onClick={handleAdd}>
                {t('product.add')} {formatMoney(total, currency)}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
