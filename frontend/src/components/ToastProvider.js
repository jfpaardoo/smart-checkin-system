import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

import soundAndHaptics from "../util/soundAndHaptics";

const ToastContext = createContext(null);

let toastIdCounter = 0;

const TOAST_CONFIG = {
  success: { 
    badgeDot: "bg-[#73841e] dark:bg-[#b3c34c]", 
    progressBg: "bg-[#73841e] dark:bg-[#b3c34c]",
    badgeText: "text-[#73841e] dark:text-[#b3c34c]",
    ringColor: "ring-[#73841e]/25 dark:ring-[#b3c34c]/25",
  },
  error: { 
    badgeDot: "bg-rose-500", 
    progressBg: "bg-rose-500",
    badgeText: "text-rose-600 dark:text-rose-400",
    ringColor: "ring-rose-500/25",
  },
  warning: { 
    badgeDot: "bg-amber-500", 
    progressBg: "bg-amber-500",
    badgeText: "text-amber-600 dark:text-amber-400",
    ringColor: "ring-amber-500/25",
  },
  info: { 
    badgeDot: "bg-sky-500", 
    progressBg: "bg-sky-500",
    badgeText: "text-sky-600 dark:text-sky-400",
    ringColor: "ring-sky-500/25",
  },
  confirm: { 
    badgeDot: "bg-amber-500", 
    progressBg: "bg-amber-500",
    badgeText: "text-amber-600 dark:text-amber-400",
    ringColor: "ring-amber-500/25",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, options = {}) => {
    const id = ++toastIdCounter;

    // Trigger audible and tactile feedback
    if (type === "success") {
      soundAndHaptics.playSuccess();
    } else if (type === "error") {
      soundAndHaptics.playError();
    } else if (type === "warning" || type === "confirm") {
      soundAndHaptics.playWarning();
    } else {
      soundAndHaptics.playInfo();
    }

    setToasts((prev) => [...prev, { id, type, message, ...options }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastApi = React.useMemo(() => ({
    success: (msg) => addToast("success", msg),
    error: (msg) => addToast("error", msg),
    warning: (msg) => addToast("warning", msg),
    info: (msg) => addToast("info", msg),
    confirm: (msg, onConfirm) => addToast("confirm", msg, { onConfirm, persistent: true }),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {/* Contenedor flotante centrado bajo la barra superior, respetando el notch/Dynamic Island de iOS */}
      <div 
        className="fixed left-0 right-0 z-[999999] flex flex-col items-center pointer-events-none px-3"
        style={{ top: 'calc(4.75rem + env(safe-area-inset-top, 0px))' }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const { t } = useTranslation();
  const [exiting, setExiting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const DURATION = 4500;
  const remainingRef = useRef(DURATION);
  const lastStartRef = useRef(Date.now());
  const timerRef = useRef(null);
  const isHoveredRef = useRef(false);
  const isExpandedRef = useRef(false);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  const typeLabels = {
    success: t('common.success', 'Éxito'),
    error: t('common.error', 'Error'),
    warning: t('common.warning', 'Aviso'),
    info: t('common.info', 'Información'),
    confirm: t('common.confirm', 'Confirmación'),
  };
  const typeLabel = typeLabels[toast.type] || typeLabels.info;

  const pauseTimer = useCallback(() => {
    if (toast.persistent) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - lastStartRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }
    setIsPaused(true);
  }, [toast.persistent]);

  const resumeTimer = useCallback(() => {
    if (toast.persistent) return;
    if (remainingRef.current <= 0) {
      setExiting(true);
      return;
    }
    lastStartRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, remainingRef.current);
    setIsPaused(false);
  }, [toast.persistent]);

  useEffect(() => {
    if (toast.persistent) return;
    lastStartRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, remainingRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.persistent]);

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
  };

  const handleConfirm = (e) => {
    if (e) e.stopPropagation();
    if (toast.onConfirm) toast.onConfirm();
    handleClose();
  };

  const toggleExpand = (e) => {
    if (e) e.stopPropagation();
    setIsExpanded((prev) => {
      const next = !prev;
      if (next) {
        pauseTimer();
      } else if (!isHoveredRef.current) {
        resumeTimer();
      }
      return next;
    });
  };

  return (
    <output
      onMouseEnter={() => {
        isHoveredRef.current = true;
        pauseTimer();
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        if (!isExpandedRef.current) {
          resumeTimer();
        }
      }}
      className={`
        pointer-events-auto relative overflow-hidden block
        transition-[width,max-width,border-radius,padding,box-shadow] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
        bg-white/85 dark:bg-slate-900/85
        backdrop-blur-2xl backdrop-saturate-180
        border border-white/70 dark:border-white/15
        border-t-2 border-t-white dark:border-t-white/30
        border-l border-l-white/80 dark:border-l-white/20
        ${isExpanded 
          ? 'w-[calc(100vw-32px)] sm:w-[420px] rounded-[24px] p-4 sm:p-4.5 my-2 shadow-[0_20px_45px_rgba(15,23,42,0.10),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_1.5px_rgba(255,255,255,0.4)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)]' 
          : 'w-auto max-w-[calc(100vw-32px)] sm:max-w-md rounded-full px-4 py-2 sm:px-4.5 sm:py-2.5 my-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_1.5px_rgba(255,255,255,0.35)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)]'
        }
        ${exiting ? 'da-toast-exiting' : ''}
      `}
      style={{
        animation: !exiting 
          ? "daLiquidDropIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards" 
          : "daLiquidRetractToBall 0.46s cubic-bezier(0.25, 1, 0.35, 1) forwards",
        transformOrigin: "center center",
        willChange: "transform, opacity, clip-path",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "translate3d(0, 0, 0)",
        isolation: "isolate",
      }}
      onAnimationEnd={(e) => {
        if (exiting && e.target === e.currentTarget) {
          onRemove(toast.id);
        }
      }}
    >
      {/* Núcleo central luminoso que brilla al fusionarse en bolita */}
      <div className="da-toast-exit-orb absolute inset-0 m-auto w-3.5 h-3.5 rounded-full opacity-0 pointer-events-none flex items-center justify-center z-10">
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.badgeDot} shadow-sm`} />
      </div>

      {/* Contenedor interno que se desvanece suavemente cuando el toast se fusiona en bola */}
      <div className="da-toast-inner w-full flex flex-col">
        {/* Fila principal alineada: dot, texto/título y controles */}
        <div className="flex items-center justify-between gap-3 w-full select-none">
          <button
            type="button"
            onClick={toggleExpand}
            aria-expanded={isExpanded}
            className="flex items-center gap-2.5 min-w-0 flex-1 bg-transparent border-0 p-0 text-left cursor-pointer focus:outline-none"
          >
            {/* Halo e indicador circular luminoso */}
            <div className="shrink-0 flex items-center justify-center p-0.5">
              <span className={`relative flex h-2.5 w-2.5 rounded-full ring-2 ${cfg.ringColor}`}>
                <span 
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${cfg.badgeDot}`} 
                  style={{ willChange: "transform, opacity" }}
                />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.badgeDot} shadow-2xs`} />
              </span>
            </div>

            {isExpanded ? (
              <div className="flex items-center gap-2 min-w-0 da-fade-in">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Smart Check-in
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold bg-black/5 dark:bg-white/10 ${cfg.badgeText}`}>
                  {typeLabel}
                </span>
              </div>
            ) : (
              <span className="text-slate-800 dark:text-slate-100 text-[0.85rem] sm:text-[0.90rem] font-semibold tracking-tight truncate min-w-0">
                {toast.message}
              </span>
            )}
          </button>

          {/* Controles: chevron de estado y botón de cierre */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleExpand}
              aria-expanded={isExpanded}
              className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-transform duration-300 bg-transparent border-0 p-0 cursor-pointer"
              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
              aria-label={isExpanded ? t('common.collapse', 'Contraer') : t('common.expand', 'Expandir')}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" className="w-2.5 h-2.5">
                <path d="M4 6l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {toast.type !== "confirm" && (
              <button
                type="button"
                onClick={handleClose}
                className="
                  w-5 h-5 rounded-full flex items-center justify-center
                  bg-white/60 hover:bg-white/90 text-slate-600 hover:text-slate-950
                  dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:hover:text-white
                  border border-white/70 dark:border-white/15
                  shadow-2xs transition-all duration-150 cursor-pointer p-0
                "
                aria-label={t('common.close', 'Cerrar')}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" className="w-2.5 h-2.5">
                  <path d="M1 1l10 10M11 1L1 11" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Contenido desplegable suave mediante CSS Grid (sin saltos bruscos) */}
        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded 
              ? 'grid-rows-[1fr] opacity-100 mt-2.5' 
              : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden">
            <p className="text-slate-700 dark:text-slate-200 text-[0.88rem] sm:text-[0.92rem] leading-relaxed font-medium select-text break-words m-0">
              {toast.message}
            </p>

            {toast.type === "confirm" && (
              <div className="flex gap-2 justify-end mt-3 pt-2.5 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-950 bg-[#b3c34c] hover:bg-[#a2b144] transition-transform active:scale-95 cursor-pointer border-0 shadow-2xs"
                >
                  {t('common.yes', 'Sí')}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 bg-black/5 hover:bg-black/10 dark:text-white/80 dark:hover:text-white dark:bg-white/10 dark:hover:bg-white/20 transition-transform active:scale-95 cursor-pointer border-0"
                >
                  {t('common.no', 'No')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progreso continua (nunca se desmonta ni se reinicia al hacer clic) */}
      {!toast.persistent && (
        <div className="da-toast-progress-container absolute bottom-0 left-4 right-4 h-[2px] bg-slate-400/20 dark:bg-white/15 rounded-full overflow-hidden">
          <div
            className={`h-full ${cfg.progressBg}`}
            style={{
              animation: `daToastProgressShrink ${DURATION}ms linear forwards`,
              animationPlayState: isPaused ? "paused" : "running",
              transformOrigin: "left",
            }}
          />
        </div>
      )}

      {/* Animaciones fluidas aceleradas por GPU */}
      <style>{`
        @keyframes daLiquidDropIn {
          0% {
            transform: translate3d(0, -26px, 0) scale3d(0.85, 0.85, 1);
            opacity: 0;
          }
          60% {
            transform: translate3d(0, 2px, 0) scale3d(1.01, 1.01, 1);
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
            opacity: 1;
          }
        }

        .da-toast-exiting {
          transition: none !important;
          pointer-events: none !important;
          will-change: transform, opacity, clip-path;
        }

        @keyframes daLiquidRetractToBall {
          0% {
            clip-path: inset(0px 0px 0px 0px round 9999px);
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
          45% {
            /* Se contrae fluidamente desde ambos lados hasta una bola perfectamente circular de 38px */
            clip-path: inset(calc(50% - 19px) calc(50% - 19px) calc(50% - 19px) calc(50% - 19px) round 9999px);
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
          56% {
            /* Micro-compresión elástica antes del impulso vertical */
            clip-path: inset(calc(50% - 18px) calc(50% - 18px) calc(50% - 18px) calc(50% - 18px) round 9999px);
            transform: translate3d(0, 2px, 0) scale(0.96);
            opacity: 0.98;
          }
          100% {
            /* Disparo directo hacia arriba con desvanecimiento fluido */
            clip-path: inset(calc(50% - 14px) calc(50% - 14px) calc(50% - 14px) calc(50% - 14px) round 9999px);
            transform: translate3d(0, -48px, 0) scale(0.35);
            opacity: 0;
          }
        }

        .da-toast-exiting .da-toast-exit-orb {
          animation: daOrbGlow 0.46s ease-out forwards;
        }

        @keyframes daOrbGlow {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          40% {
            opacity: 1;
            transform: scale(1.15);
          }
          56% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.4);
          }
        }

        .da-toast-exiting .da-toast-inner,
        .da-toast-exiting .da-toast-progress-container {
          animation: daContentRetractFade 0.12s ease-out forwards;
        }

        @keyframes daContentRetractFade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes daToastProgressShrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }

        @keyframes daFadeIn {
          from {
            opacity: 0;
            transform: translateY(-2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .da-fade-in {
          animation: daFadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </output>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}