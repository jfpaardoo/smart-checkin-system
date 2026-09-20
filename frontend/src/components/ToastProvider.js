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
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const [isStackExpanded, setIsStackExpanded] = useState(false);
  const containerRef = useRef(null);
  const toastsRef = useRef(toasts);

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  // Si queda 1 o ninguna notificación, colapsar el stack automáticamente
  useEffect(() => {
    if (toasts.length <= 1) {
      setIsStackExpanded(false);
    }
  }, [toasts.length]);

  // Cerrar el stack al hacer clic fuera o presionar la tecla Escape
  useEffect(() => {
    if (!isStackExpanded) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsStackExpanded(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsStackExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isStackExpanded]);

  const addToast = useCallback((type, message, options = {}) => {
    // 1. DEDUPLICACIÓN INTELIGENTE: Si ya existe un toast idéntico activo, incrementamos su contador
    const existing = toastsRef.current.find(
      (toast) => !toast.exiting && toast.type === type && toast.message === message
    );

    if (existing) {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === existing.id
            ? {
                ...toast,
                count: (toast.count || 1) + 1,
                bumpKey: Date.now(), // Provoca el pulso visual y reinicia el timer
              }
            : toast
        )
      );
      return existing.id;
    }

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

    setToasts((prev) => [
      ...prev,
      { id, type, message, count: 1, bumpKey: id, ...options },
    ]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, exiting: true })));
  }, []);

  const toastApi = React.useMemo(() => ({
    success: (msg) => addToast("success", msg),
    error: (msg) => addToast("error", msg),
    warning: (msg) => addToast("warning", msg),
    info: (msg) => addToast("info", msg),
    confirm: (msg, onConfirm) => addToast("confirm", msg, { onConfirm, persistent: true }),
    clearAll: removeAllToasts,
  }), [addToast, removeAllToasts]);

  // Ordenamos para que la notificación más reciente esté al frente (arriba de la pila)
  const orderedToasts = [...toasts].reverse();

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {/* Contenedor flotante centrado bajo la barra superior, respetando el notch/Dynamic Island de iOS */}
      <div 
        ref={containerRef}
        className="fixed left-0 right-0 z-[999999] flex flex-col items-center pointer-events-none px-3 select-none"
        style={{ top: 'calc(4.75rem + env(safe-area-inset-top, 0px))' }}
      >
        {/* Barra de control superior cuando la pila de notificaciones está desplegada */}
        {toasts.length > 1 && isStackExpanded && (
          <div className="da-fade-in pointer-events-auto flex items-center justify-between w-full max-w-[calc(100vw-32px)] sm:max-w-[440px] px-3.5 py-1.5 mb-2.5 rounded-full bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#73841e] dark:bg-[#b3c34c] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#73841e] dark:bg-[#b3c34c]" />
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {toasts.length} {t('common.notifications', 'notificaciones')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsStackExpanded(false)}
                className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border-0 bg-transparent"
              >
                {t('common.collapse', 'Plegar')}
              </button>
              <button
                type="button"
                onClick={removeAllToasts}
                className="px-2.5 py-1 rounded-full text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer border-0 bg-transparent"
              >
                {t('common.clearAll', 'Cerrar todas')}
              </button>
            </div>
          </div>
        )}

        {/* Pila de Notificaciones con efecto de relieve (Stack de profundidad) */}
        <div className={`relative flex flex-col items-center w-full max-w-[calc(100vw-32px)] sm:max-w-[440px] ${isStackExpanded ? 'gap-2' : ''}`}>
          {orderedToasts.map((toast, index) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              index={index}
              totalCount={orderedToasts.length}
              isStackExpanded={isStackExpanded}
              onToggleStack={() => setIsStackExpanded((prev) => !prev)}
              onRemove={removeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function getStackInlineStyle(isStacked, index) {
  if (!isStacked) {
    return {
      position: 'relative',
      transform: 'translate3d(0, 0, 0) scale(1)',
      zIndex: 20,
      opacity: 1,
      pointerEvents: 'auto',
    };
  }

  const STACK_LEVELS = [
    {
      position: 'relative',
      transform: 'translate3d(0, 0, 0) scale(1)',
      zIndex: 40,
      opacity: 1,
      pointerEvents: 'auto',
    },
    {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      marginLeft: 'auto',
      marginRight: 'auto',
      transform: 'translate3d(0, 11px, 0) scale(0.96)',
      zIndex: 30,
      opacity: 0.82,
      pointerEvents: 'none',
      filter: 'brightness(0.97)',
    },
    {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      marginLeft: 'auto',
      marginRight: 'auto',
      transform: 'translate3d(0, 21px, 0) scale(0.92)',
      zIndex: 20,
      opacity: 0.55,
      pointerEvents: 'none',
      filter: 'brightness(0.93)',
    },
  ];

  return STACK_LEVELS[index] || {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    marginLeft: 'auto',
    marginRight: 'auto',
    transform: 'translate3d(0, 27px, 0) scale(0.88)',
    zIndex: 10,
    opacity: 0,
    pointerEvents: 'none',
  };
}

function getToastAnimation(exiting, isStacked, index) {
  if (exiting) {
    return "daLiquidRetractToBall 0.46s cubic-bezier(0.25, 1, 0.35, 1) forwards";
  }
  if (!isStacked || index === 0) {
    return "daLiquidDropIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards";
  }
  return "none";
}

function ToastItem({ 
  toast, 
  index, 
  totalCount, 
  isStackExpanded, 
  onToggleStack, 
  onRemove 
}) {
  const { t } = useTranslation();
  const [exiting, setExiting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const DURATION = 4500;
  const remainingRef = useRef(DURATION);
  const lastStartRef = useRef(Date.now());

  const isStacked = totalCount > 1 && !isStackExpanded;

  // Estado único de suspensión: mientras esté activo, el temporizador NO corre bajo ningún concepto
  const isSuspended = 
    toast.persistent || 
    isHovered || 
    isExpanded || 
    isStackExpanded || 
    (isStacked && index > 0) || 
    exiting;

  // Si la notificación recibe señal externa de salida (ej. "Cerrar todas")
  useEffect(() => {
    if (toast.exiting && !exiting) {
      setExiting(true);
    }
  }, [toast.exiting, exiting]);

  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  const typeLabels = {
    success: t('common.success', 'Éxito'),
    error: t('common.error', 'Error'),
    warning: t('common.warning', 'Aviso'),
    info: t('common.info', 'Información'),
    confirm: t('common.confirm', 'Confirmación'),
  };
  const typeLabel = typeLabels[toast.type] || typeLabels.info;

  // Si se repite la notificación (deduplicada): reiniciar el tiempo de lectura a 4.5s
  useEffect(() => {
    if (!toast.bumpKey || toast.bumpKey === toast.id) return;
    remainingRef.current = DURATION;
    lastStartRef.current = Date.now();
  }, [toast.bumpKey, toast.id]);

  // Temporizador unificado estricto:
  // - Si isSuspended es true: limpia inmediatamente el timeout y guarda el tiempo restante.
  //   NO se programa ningún timeout mientras siga suspendido (hover, lectura de mensaje, pila, etc.).
  // - Si isSuspended es false: programa un timeout con exactamente el tiempo que restaba.
  useEffect(() => {
    if (isSuspended) return;

    if (remainingRef.current <= 0) {
      setExiting(true);
      return;
    }

    lastStartRef.current = Date.now();
    const timerId = setTimeout(() => {
      setExiting(true);
    }, remainingRef.current);

    return () => {
      clearTimeout(timerId);
      const elapsed = Date.now() - lastStartRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    };
  }, [isSuspended, toast.bumpKey]);

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setExiting(true);
  };

  const handleConfirm = (e) => {
    if (e) e.stopPropagation();
    if (toast.onConfirm) toast.onConfirm();
    handleClose();
  };

  const toggleExpand = (e) => {
    if (e) e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const stackInlineStyle = getStackInlineStyle(isStacked, index);
  const toastAnimation = getToastAnimation(exiting, isStacked, index);

  return (
    <output
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        pointer-events-auto relative overflow-hidden block w-full
        transition-[transform,opacity,box-shadow,filter,width,border-radius,padding] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]
        bg-white/40 dark:bg-slate-900/50
        backdrop-blur-2xl
        border border-white/60 dark:border-white/10
        border-t-white/80 dark:border-t-white/15
        shadow-[0_12px_40px_rgba(15,23,42,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.85)]
        dark:shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)]
        ${isStacked && index === 0 ? 'shadow-[0_18px_45px_rgba(15,23,42,0.16),inset_0_1px_1.5px_rgba(255,255,255,0.9)]' : ''}
        ${isExpanded 
          ? 'rounded-[24px] p-4 sm:p-4.5 my-2' 
          : 'rounded-full px-4 py-2 sm:px-4.5 sm:py-2.5 my-1'
        }
        ${exiting ? 'da-toast-exiting' : ''}
      `}
      style={{
        ...stackInlineStyle,
        animation: toastAnimation,
        transformOrigin: "center center",
        willChange: "transform, opacity, clip-path",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        isolation: "isolate",
      }}
      onAnimationEnd={(e) => {
        if (exiting && e.target === e.currentTarget) {
          onRemove(toast.id);
        }
      }}
    >
      {/* Núcleo central luminoso que brilla al fusionarse en bolita */}
      <div className="da-toast-exit-orb absolute inset-0 m-auto w-3.5 h-3.5 rounded-full opacity-0 pointer-events-none flex items-center justify-center z-20">
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.badgeDot} shadow-sm`} />
      </div>

      {/* Contenedor interno que se desvanece suavemente cuando el toast se fusiona en bola */}
      <div className="da-toast-inner relative z-10 w-full flex flex-col">
        {/* Fila principal alineada: dot, contador, título y controles */}
        <div className="flex items-center justify-between gap-3 w-full select-none">
          <button
            type="button"
            onClick={isStacked ? onToggleStack : toggleExpand}
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

            {/* Badge de deduplicación si el mensaje se repite */}
            {toast.count > 1 && (
              <span
                key={toast.bumpKey}
                className="da-badge-pop shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-black tracking-tight text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-xs border border-white/40 ring-1 ring-rose-500/30"
                title={`${toast.count} ${t('common.repetitions', 'repeticiones')}`}
              >
                ×{toast.count}
              </span>
            )}

            {isExpanded ? (
              <div className="flex items-center gap-2 min-w-0 da-fade-in">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Smart Check-in
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/40 dark:bg-white/10 border border-white/40 dark:border-white/10 ${cfg.badgeText}`}>
                  {typeLabel}
                </span>
              </div>
            ) : (
              <span className="text-slate-800 dark:text-slate-100 text-[0.85rem] sm:text-[0.90rem] font-semibold tracking-tight truncate min-w-0">
                {toast.message}
              </span>
            )}
          </button>

          {/* Controles: botón de despliegue de pila, chevron de mensaje y botón de cierre */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pill indicador de pila apilada (cuando está colapsado y hay más de 1 notificación) */}
            {isStacked && index === 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStack();
                }}
                className="
                  flex items-center gap-1 px-2.5 py-1 rounded-full
                  text-[11px] font-bold text-slate-700 dark:text-slate-200
                  bg-black/5 hover:bg-black/10 dark:bg-white/15 dark:hover:bg-white/25
                  border border-black/5 dark:border-white/10
                  shadow-2xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0
                "
                title={t('common.expandStack', 'Ver todas las notificaciones')}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" className="w-3 h-3 text-slate-500 dark:text-slate-400">
                  <path d="M2 5l6-3 6 3-6 3-6-3z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 8.5l6 3 6-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12l6 3 6-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>+{totalCount - 1}</span>
              </button>
            )}

            {/* Chevron para ver el mensaje completo en detalle */}
            {(!isStacked || index === 0) && (
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
            )}

            {/* Botón cerrar */}
            {toast.type !== "confirm" && (!isStacked || index === 0) && (
              <button
                type="button"
                onClick={handleClose}
                className="
                  w-5 h-5 rounded-full flex items-center justify-center
                  bg-white/50 hover:bg-white/80 text-slate-600 hover:text-slate-950
                  dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:hover:text-white
                  border border-white/60 dark:border-white/15
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

        {/* Contenido desplegable suave mediante CSS Grid */}
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

      {/* Barra de progreso continua */}
      {!toast.persistent && (
        <div className="da-toast-progress-container absolute bottom-0 left-4 right-4 h-[2px] bg-slate-400/20 dark:bg-white/15 rounded-full overflow-hidden">
          <div
            key={toast.bumpKey || toast.id}
            className={`h-full ${cfg.progressBg}`}
            style={{
              animation: `daToastProgressShrink ${DURATION}ms linear forwards`,
              animationPlayState: isSuspended ? "paused" : "running",
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
            clip-path: inset(calc(50% - 19px) calc(50% - 19px) calc(50% - 19px) calc(50% - 19px) round 9999px);
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
          56% {
            clip-path: inset(calc(50% - 18px) calc(50% - 18px) calc(50% - 18px) calc(50% - 18px) round 9999px);
            transform: translate3d(0, 2px, 0) scale(0.96);
            opacity: 0.98;
          }
          100% {
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

        @keyframes daBadgePop {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          60% {
            transform: scale(1.25);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .da-badge-pop {
          animation: daBadgePop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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