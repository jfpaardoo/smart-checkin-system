import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * GlassModal — Modal nativo con glassmorphism + Framer Motion.
 * Reemplaza el Modal de reactstrap en toda la aplicación.
 *
 * Props:
 *   isOpen     {boolean}   Controla visibilidad
 *   toggle     {function}  Callback para cerrar
 *   title      {node}      Contenido del header (texto o JSX)
 *   children   {node}      Contenido del body
 *   footer     {node}      Contenido del footer (opcional)
 *   maxWidth   {string}    Ancho máximo del modal (default: '500px')
 *   backdrop   {boolean|'static'} true = cierra al click, 'static' = no cierra (default: true)
 *   className  {string}    Clase extra en el contenedor del panel
 *   size       {string}    'sm' | 'md' | 'lg' | 'xl' — atajos de maxWidth
 */
const SIZE_CLASS_MAP = {
  sm: 'max-w-[380px]',
  md: 'max-w-[500px]',
  lg: 'max-w-[700px]',
  xl: 'max-w-[900px]',
};

export default function GlassModal({
  isOpen,
  toggle,
  onClose,
  title,
  children,
  footer,
  maxWidth,
  size = 'md',
  backdrop = true,
  className = '',
}) {
  const closeCallback = toggle || onClose;
  const resolvedSizeClass = SIZE_CLASS_MAP[size] || SIZE_CLASS_MAP.md;
  const panelRef = useRef(null);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen || String(backdrop) === 'static' || !backdrop) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeCallback?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCallback, backdrop]);

  // Trap focus dentro del modal
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) focusable[0].focus();
    }
  }, [isOpen]);

  const handleBackdropClick = () => {
    if (String(backdrop) !== 'static' && Boolean(backdrop)) closeCallback?.();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="glass-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/45 dark:bg-slate-950/65 backdrop-blur-md backdrop-saturate-150"
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
          aria-label={typeof title === 'string' ? title : 'Modal'}
        >
          <motion.div
            ref={panelRef}
            key="glass-modal-panel"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${resolvedSizeClass} max-h-[92vh] relative flex flex-col overflow-hidden rounded-[28px] bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl backdrop-saturate-180 border-[1.5px] border-white/75 dark:border-white/15 shadow-[0_25px_60px_rgba(15,23,42,0.18),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_1.5px_rgba(255,255,255,0.3)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.65),inset_0_1px_1.5px_rgba(255,255,255,0.12)] ${className}`}
            style={maxWidth ? { maxWidth } : undefined}
          >
            {/* Header */}
            {title !== undefined && (
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-white/60 dark:border-white/10 bg-white/20 dark:bg-white/[0.03]"
              >
                <h5
                  className="m-0 font-bold text-slate-800 dark:text-slate-100 text-base leading-snug"
                >
                  {title}
                </h5>
                {closeCallback && (
                  <button
                    type="button"
                    onClick={closeCallback}
                    aria-label="Cerrar"
                    className="ml-3 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/50 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-white/70 dark:border-white/15 shadow-2xs transition-all duration-150 focus:outline-none cursor-pointer p-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div
              className="px-6 py-5 overflow-y-auto overscroll-contain flex-1 text-slate-800 dark:text-slate-100"
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="px-6 py-4 flex-shrink-0 flex justify-end gap-2 border-t border-white/60 dark:border-white/10 bg-white/15 dark:bg-white/[0.02]"
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
