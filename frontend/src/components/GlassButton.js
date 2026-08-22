import React from 'react';
import { motion } from 'framer-motion';

const VARIANT_MAP = {
  primary: 'da-btn-primary',
  secondary: 'da-btn-secondary',
  danger: 'da-btn-danger',
  blue: 'da-btn-blue',
  ghost: 'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40 border border-transparent'
};

function renderIconElement(Icon) {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  if (typeof Icon === 'function') return <Icon />;
  return Icon;
}

/**
 * Botón con micro-animación táctil Framer Motion y gestión de estado de carga.
 *
 * @param {'primary'|'secondary'|'danger'|'blue'|'ghost'} [variant='primary']
 * @param {boolean} [loading=false]
 * @param {string} [loadingText]
 * @param {React.ReactNode|React.ComponentType} [icon]
 * @param {'button'|'submit'|'reset'} [type='button']
 * @param {React.ReactNode} children
 */
export default function GlassButton({
  variant = 'primary',
  loading = false,
  loadingText,
  icon: Icon,
  disabled = false,
  className = '',
  type = 'button',
  children,
  onClick,
  ...props
}) {
  const variantClass = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  const isButtonDisabled = disabled || loading;
  const renderedIcon = renderIconElement(Icon);

  let labelContent = children;
  if (loading && loadingText) {
    labelContent = loadingText;
  }

  return (
    <motion.button
      type={type}
      whileTap={{ scale: isButtonDisabled ? 1 : 0.96 }}
      whileHover={{ scale: isButtonDisabled ? 1 : 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      disabled={isButtonDisabled}
      className={`${variantClass} inline-flex items-center justify-center gap-2 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}

      {!loading && renderedIcon && (
        <span className="flex-shrink-0">
          {renderedIcon}
        </span>
      )}

      <span>{labelContent}</span>
    </motion.button>
  );
}
