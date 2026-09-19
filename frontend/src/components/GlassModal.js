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
const SIZE_MAP = {
  sm: '380px',
  md: '500px',
  lg: '700px',
  xl: '900px',
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
  const resolvedMaxWidth = maxWidth || SIZE_MAP[size] || SIZE_MAP.md;
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
          className="fixed inset-0 z-[1050] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(10px) saturate(150%)', WebkitBackdropFilter: 'blur(10px) saturate(150%)' }}
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
            className={`w-full relative flex flex-col ${className}`}
            style={{
              maxWidth: resolvedMaxWidth,
              maxHeight: '92vh',
              background: 'var(--da-glass-modal-bg, rgba(255, 255, 255, 0.75))',
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              border: '1.5px solid rgba(255, 255, 255, 0.75)',
              borderRadius: '28px',
              boxShadow: '0 25px 60px rgba(15, 23, 42, 0.18), inset 0 1.5px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 1.5px rgba(255, 255, 255, 0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            {title !== undefined && (
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-white/60 dark:border-white/10 bg-white/20 dark:bg-white/[0.03]"
              >
                <h5
                  className="m-0 font-bold text-slate-800 dark:text-slate-100 text-base"
                  style={{ lineHeight: 1.3 }}
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
              className="px-6 py-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100"
              style={{ overscrollBehavior: 'contain' }}
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
