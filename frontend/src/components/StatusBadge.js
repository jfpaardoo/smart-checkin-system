import React from 'react';

const VARIANT_STYLES = {
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  primary: 'bg-[#b3c34c]/20 text-[#73841e] dark:text-[#cce364] border-[#b3c34c]/40',
  neutral: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  secondary: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-400/30'
};

const PULSE_COLORS = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  primary: 'bg-[#b3c34c]',
  neutral: 'bg-slate-400',
  secondary: 'bg-slate-400'
};

function renderBadgeIcon(Icon) {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  if (typeof Icon === 'function') return <Icon size={12} />;
  return Icon;
}

/**
 * Insignia de estado semántica y adaptable con estilo Liquid Glass.
 *
 * @param {'success'|'warning'|'danger'|'info'|'primary'|'neutral'|'secondary'} [variant='neutral'] - Variante visual
 * @param {boolean} [pulse=false] - Mostrar punto pulsante animado
 * @param {React.ReactNode|React.ComponentType} [icon] - Icono opcional
 * @param {React.ReactNode} children - Contenido del badge
 * @param {string} [className] - Clases CSS adicionales
 */
export default function StatusBadge({
  variant = 'neutral',
  pulse = false,
  icon: Icon,
  children,
  className = ''
}) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  const pulseColor = PULSE_COLORS[variant] || PULSE_COLORS.neutral;
  const renderedIcon = renderBadgeIcon(Icon);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md whitespace-nowrap shadow-2xs ${variantClass} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColor}`} />
        </span>
      )}
      {renderedIcon && (
        <span className="flex-shrink-0">
          {renderedIcon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
