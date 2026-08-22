import React from 'react';

function renderPageHeaderIcon(Icon) {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  if (typeof Icon === 'function') return <Icon />;
  return Icon;
}

/**
 * Cabecera estándar para páginas y paneles de administración con estilo Liquid Glass.
 *
 * @param {React.ReactNode|React.ComponentType} icon - Icono FontAwesome o React-Icons
 * @param {string} title - Título principal de la vista
 * @param {string} subtitle - Subtítulo descriptivo
 * @param {React.ReactNode} [actions] - Botones o controles de acción alineados a la derecha
 * @param {string} [className] - Clases CSS adicionales
 */
export default function GlassPageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className = ''
}) {
  const renderedIcon = renderPageHeaderIcon(Icon);

  return (
    <div className={`da-card-header da-admin-header border-0 flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 text-center sm:text-left ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full sm:w-auto">
        {renderedIcon && (
          <div className="p-3.5 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 text-[#73841e] text-2xl flex-shrink-0 flex items-center justify-center shadow-xs mb-1 sm:mb-0">
            {renderedIcon}
          </div>
        )}
        <div>
          <h2 className="mb-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="da-admin-header-actions w-full sm:w-auto flex flex-wrap items-center justify-center sm:justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
