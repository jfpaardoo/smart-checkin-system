import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

function renderHeaderIcon(Icon) {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  if (typeof Icon === 'function') return <Icon size={26} />;
  return Icon;
}

/**
 * Cabecera simétrica con botón de retorno y píldora de icono centrado para formularios.
 *
 * @param {React.ReactNode|React.ComponentType} icon - Icono representativo
 * @param {string} title - Título del formulario
 * @param {string} subtitle - Subtítulo explicativo
 * @param {string} [backUrl] - Ruta a la que volver
 * @param {Function} [onBack] - Callback manual de retroceso (alternativa a backUrl)
 * @param {string} [className] - Clases CSS adicionales
 */
export default function GlassFormHeader({
  icon: Icon,
  title,
  subtitle,
  backUrl,
  onBack,
  className = ''
}) {
  const { t } = useTranslation();
  const renderedIcon = renderHeaderIcon(Icon);

  const renderBackButton = () => {
    const buttonClasses =
      "absolute left-0 top-0 p-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/70 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition shadow-xs flex items-center justify-center text-decoration-none";

    if (backUrl) {
      return (
        <Link to={backUrl} className={buttonClasses} title={t('common.back', 'Volver')}>
          <FaArrowLeft size={16} />
        </Link>
      );
    }

    if (onBack) {
      return (
        <button
          type="button"
          onClick={onBack}
          className={buttonClasses}
          title={t('common.back', 'Volver')}
        >
          <FaArrowLeft size={16} />
        </button>
      );
    }

    return null;
  };

  return (
    <div className={`relative mb-6 pb-4 border-b border-white/30 dark:border-white/10 text-center ${className}`}>
      {renderBackButton()}
      {renderedIcon && (
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-[#b3c34c]/20 text-[#8fa228] shadow-xs mb-2">
          {renderedIcon}
        </div>
      )}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
          {subtitle}
        </p>
      )}
    </div>
  );
}
