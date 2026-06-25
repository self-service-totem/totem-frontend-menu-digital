import { AdminButton } from './AdminButton';

/**
 * Sticky bottom bar shown on forms/settings when there are unsaved changes
 * (`ff-admin-save-bar`). Renders nothing when `visible` is false.
 *
 * Standard pattern for the "form/settings" screen type — see docs/UI_STANDARDS.md.
 */
export function DirtySaveBar({
  visible,
  message = 'Você tem alterações não salvas',
  cancelLabel = 'Descartar',
  saveLabel = 'Salvar alterações',
  saving = false,
  onCancel,
  onSave,
}: {
  visible: boolean;
  message?: string;
  cancelLabel?: string;
  saveLabel?: string;
  saving?: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="ff-admin-save-bar">
      <span className="ff-admin-save-bar-text">{message}</span>
      <div className="ff-admin-save-bar-actions">
        <AdminButton variant="ghost" onClick={onCancel}>{cancelLabel}</AdminButton>
        <AdminButton variant="primary" loading={saving} onClick={onSave}>
          {saveLabel}
        </AdminButton>
      </div>
    </div>
  );
}
