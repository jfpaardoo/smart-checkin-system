import React from 'react';
import { useTranslation } from 'react-i18next';
import GlassModal from './GlassModal';

const CONFIRM_VARIANT_CLASSES = {
  danger: 'da-btn-danger',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  primary: 'da-btn-primary'
};

/**
 * Modal preconfigurado para confirmaciones de borrado o acciones críticas.
 *
 * @param {boolean} isOpen - Estado de apertura
 * @param {Function} toggle - Función toggle de cierre
 * @param {string} title - Título del modal
 * @param {React.ReactNode} message - Mensaje de confirmación
 * @param {string} [warningMessage] - Mensaje de advertencia adicional
 * @param {Function} onConfirm - Callback de confirmación
 * @param {boolean} [loading=false] - Estado de carga al ejecutar la acción
 * @param {string} [confirmText] - Texto del botón de confirmación
 * @param {'danger'|'primary'|'warning'} [confirmVariant='danger'] - Variante de color del botón
 */
export default function GlassConfirmModal({
  isOpen,
  toggle,
  title,
  message,
  warningMessage,
  onConfirm,
  loading = false,
  confirmText,
  cancelText,
  confirmVariant = 'danger'
}) {
  const { t } = useTranslation();

  let defaultConfirmLabel = t('common.confirm', 'Confirmar');
  if (confirmVariant === 'danger') {
    defaultConfirmLabel = t('common.delete', 'Eliminar');
  }

  const finalConfirmText = confirmText || defaultConfirmLabel;
  const finalCancelText = cancelText || t('common.cancel', 'Cancelar');
  const btnVariantClass = CONFIRM_VARIANT_CLASSES[confirmVariant] || CONFIRM_VARIANT_CLASSES.primary;

  return (
    <GlassModal
      isOpen={isOpen}
      toggle={toggle}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button
            type="button"
            className="da-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
            onClick={toggle}
            disabled={loading}
          >
            {finalCancelText}
          </button>
          <button
            type="button"
            className={`${btnVariantClass} px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 border-0 cursor-pointer disabled:opacity-50`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            <span>{finalConfirmText}</span>
          </button>
        </div>
      }
    >
      <div className="py-2 space-y-3">
        <div className="text-slate-700 dark:text-slate-200 text-sm">
          {message}
        </div>
        {warningMessage && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
            {warningMessage}
          </div>
        )}
      </div>
    </GlassModal>
  );
}
