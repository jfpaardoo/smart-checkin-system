import React from 'react';

function renderEmptyStateIcon(Icon) {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  if (typeof Icon === 'function') return <Icon size={36} />;
  return Icon;
}

/**
 * Componente visual para estados vacíos o búsquedas sin resultados en Liquid Glass.
 *
 * @param {React.ReactNode|React.ComponentType} icon - Icono representativo
 * @param {string} title - Título del estado vacío
 * @param {string} [description] - Descripción o sugerencia
 * @param {React.ReactNode} [action] - Botón o enlace de acción principal
 * @param {string} [className] - Clases CSS adicionales
 */
export default function GlassEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) {
  const renderedIcon = renderEmptyStateIcon(Icon);

  return (
    <div className={`text-center py-12 px-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-3xl border border-white/50 dark:border-white/10 shadow-sm my-4 ${className}`}>
      {renderedIcon && (
        <div className="inline-flex p-4 rounded-full bg-[#b3c34c]/20 text-[#8fa228] mb-3 shadow-xs">
          {renderedIcon}
        </div>
      )}
      <h5 className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-1">
        {title}
      </h5>
      {description && (
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-0">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4 flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
