import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";

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

const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 460,
  damping: 32,
  mass: 0.8,
};

const EXIT_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
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
      (toast) => toast.type === type && toast.message === message
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
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const toastApi = React.useMemo(
    () => ({
      success: (msg) => addToast("success", msg),
      error: (msg) => addToast("error", msg),
      warning: (msg) => addToast("warning", msg),
      info: (msg) => addToast("info", msg),
      confirm: (msg, onConfirm) => addToast("confirm", msg, { onConfirm, persistent: true }),
      clearAll: removeAllToasts,
    }),
    [addToast, removeAllToasts]
  );

  // Ordenamos para que la notificación más reciente esté al frente (arriba de la pila)
  const orderedToasts = [...toasts].reverse();

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <MotionConfig reducedMotion="user">
        {/* Única definición compartida para la barra de progreso */}
        <style>{`
          @keyframes daToastProgressShrink {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `}</style>

        {/* Contenedor flotante centrado bajo la barra superior, respetando el notch/Dynamic Island de iOS */}
        <div
          ref={containerRef}
          className="fixed left-0 right-0 z-[999999] flex flex-col items-center pointer-events-none px-3 select-none"
          style={{ top: "calc(4.75rem + env(safe-area-inset-top, 0px))" }}
        >
          {/* Barra de control superior cuando la pila de notificaciones está desplegada */}
          <AnimatePresence>
            {toasts.length > 1 && isStackExpanded && (
              <motion.div
                key="toast-stack-controls"
                initial={{ opacity: 0, y: -12, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.94 }}
                transition={SPRING_TRANSITION}
                className="pointer-events-auto flex items-center justify-between w-full max-w-[calc(100vw-32px)] sm:max-w-[440px] px-3.5 py-1.5 mb-2.5 rounded-full bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                style={{ willChange: "transform, opacity" }}
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#73841e] dark:bg-[#b3c34c] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#73841e] dark:bg-[#b3c34c]" />
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {toasts.length} {t("common.notifications", "notificaciones")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsStackExpanded(false)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    {t("common.collapse", "Plegar")}
                  </button>
                  <button
                    type="button"
                    onClick={removeAllToasts}
                    className="px-2.5 py-1 rounded-full text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    {t("common.clearAll", "Cerrar todas")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pila de Notificaciones con físicas de muelle y composición GPU */}
          <div
            className={`relative flex flex-col items-center w-full max-w-[calc(100vw-32px)] sm:max-w-[440px] ${
              isStackExpanded ? "gap-2" : ""
            }`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
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
            </AnimatePresence>
          </div>
        </div>
      </MotionConfig>
    </ToastContext.Provider>
  );
}

function getStackMotionProps(isStacked, index) {
  if (!isStacked) {
    return {
      y: 0,
      scale: 1,
      opacity: 1,
      zIndex: 40 - index,
      pointerEvents: "auto",
      position: "relative",
    };
  }

  const STACK_LEVELS = [
    { y: 0, scale: 1, opacity: 1, zIndex: 40, pointerEvents: "auto", position: "relative" },
    { y: 10, scale: 0.96, opacity: 0.84, zIndex: 30, pointerEvents: "none", position: "absolute" },
    { y: 19, scale: 0.92, opacity: 0.56, zIndex: 20, pointerEvents: "none", position: "absolute" },
  ];

  return (
    STACK_LEVELS[index] || {
      y: 25,
      scale: 0.88,
      opacity: 0,
      zIndex: 10,
      pointerEvents: "none",
      position: "absolute",
    }
  );
}

const ToastItem = React.forwardRef(function ToastItem(
  {
    toast,
    index,
    totalCount,
    isStackExpanded,
    onToggleStack,
    onRemove,
  },
  ref
) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const DURATION = 4500;
  const remainingRef = useRef(DURATION);
  const lastStartRef = useRef(Date.now());

  const isStacked = totalCount > 1 && !isStackExpanded;
  const isFrontOrExpanded = !isStacked || index === 0;
  const canSwipeDismiss = isFrontOrExpanded && !isExpanded && !toast.persistent;

  // Estado único de suspensión: mientras esté activo, el temporizador NO corre bajo ningún concepto
  const isSuspended =
    toast.persistent ||
    isHovered ||
    isExpanded ||
    isStackExpanded ||
    (isStacked && index > 0);

  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  const typeLabels = {
    success: t("common.success", "Éxito"),
    error: t("common.error", "Error"),
    warning: t("common.warning", "Aviso"),
    info: t("common.info", "Información"),
    confirm: t("common.confirm", "Confirmación"),
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
  // - Si isSuspended es false: programa un timeout con exactamente el tiempo que restaba.
  useEffect(() => {
    if (isSuspended) return;

    if (remainingRef.current <= 0) {
      onRemove(toast.id);
      return;
    }

    lastStartRef.current = Date.now();
    const timerId = setTimeout(() => {
      onRemove(toast.id);
    }, remainingRef.current);

    return () => {
      clearTimeout(timerId);
      const elapsed = Date.now() - lastStartRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    };
  }, [isSuspended, toast.bumpKey, toast.id, onRemove]);

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    onRemove(toast.id);
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

  const stackMotion = getStackMotionProps(isStacked, index);

  return (
    <motion.output
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: -22, scale: 0.9 }}
      animate={{
        opacity: stackMotion.opacity,
        y: stackMotion.y,
        scale: stackMotion.scale,
      }}
      exit={{
        opacity: 0,
        y: -24,
        scale: 0.86,
        transition: EXIT_TRANSITION,
      }}
      transition={SPRING_TRANSITION}
      drag={canSwipeDismiss ? "y" : false}
      dragConstraints={{ top: -80, bottom: 10 }}
      dragElastic={{ top: 0.35, bottom: 0.12 }}
      dragSnapToOrigin
      onDragEnd={(_, info) => {
        if (canSwipeDismiss && (info.offset.y < -32 || info.velocity.y < -280)) {
          onRemove(toast.id);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        pointer-events-auto relative overflow-hidden block w-full
        bg-white/45 dark:bg-slate-900/55
        backdrop-blur-2xl
        border border-white/60 dark:border-white/10
        border-t-white/80 dark:border-t-white/15
        shadow-[0_12px_40px_rgba(15,23,42,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.85)]
        dark:shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.06)]
        ${
          isStacked && index === 0
            ? "shadow-[0_18px_45px_rgba(15,23,42,0.16),inset_0_1px_1.5px_rgba(255,255,255,0.9)]"
            : ""
        }
        ${
          isExpanded
            ? "rounded-[24px] p-4 sm:p-4.5 my-2"
            : "rounded-full px-4 py-2 sm:px-4.5 sm:py-2.5 my-1"
        }
        ${canSwipeDismiss ? "touch-pan-x cursor-grab active:cursor-grabbing" : ""}
      `}
      style={{
        position: stackMotion.position,
        top: stackMotion.position === "absolute" ? 0 : undefined,
        left: stackMotion.position === "absolute" ? 0 : undefined,
        right: stackMotion.position === "absolute" ? 0 : undefined,
        zIndex: stackMotion.zIndex,
        pointerEvents: stackMotion.pointerEvents,
        transformOrigin: "center top",
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Contenedor interno */}
      <div className="relative z-10 w-full flex flex-col">
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

            {/* Badge de deduplicación con pop elástico */}
            {toast.count > 1 && (
              <motion.span
                key={toast.bumpKey}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 550, damping: 24 }}
                className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-black tracking-tight text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-xs border border-white/40 ring-1 ring-rose-500/30"
                title={`${toast.count} ${t("common.repetitions", "repeticiones")}`}
              >
                ×{toast.count}
              </motion.span>
            )}

            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 min-w-0"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Smart Check-in
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/40 dark:bg-white/10 border border-white/40 dark:border-white/10 ${cfg.badgeText}`}
                >
                  {typeLabel}
                </span>
              </motion.div>
            ) : (
              <span className="text-slate-800 dark:text-slate-100 text-[0.85rem] sm:text-[0.90rem] font-semibold tracking-tight truncate min-w-0">
                {toast.message}
              </span>
            )}
          </button>

          {/* Controles: botón de despliegue de pila, chevron de mensaje y botón de cierre */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pill indicador de pila apilada */}
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
                  shadow-2xs transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0
                "
                title={t("common.expandStack", "Ver todas las notificaciones")}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" className="w-3 h-3 text-slate-500 dark:text-slate-400">
                  <path d="M2 5l6-3 6 3-6 3-6-3z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 8.5l6 3 6-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12l6 3 6-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>+{totalCount - 1}</span>
              </button>
            )}

            {/* Chevron para ver el mensaje completo en detalle */}
            {isFrontOrExpanded && (
              <button
                type="button"
                onClick={toggleExpand}
                aria-expanded={isExpanded}
                className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] bg-transparent border-0 p-0 cursor-pointer"
                style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                aria-label={isExpanded ? t("common.collapse", "Contraer") : t("common.expand", "Expandir")}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" className="w-2.5 h-2.5">
                  <path d="M4 6l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {/* Botón cerrar */}
            {toast.type !== "confirm" && isFrontOrExpanded && (
              <button
                type="button"
                onClick={handleClose}
                className="
                  w-5 h-5 rounded-full flex items-center justify-center
                  bg-white/50 hover:bg-white/80 text-slate-600 hover:text-slate-950
                  dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:hover:text-white
                  border border-white/60 dark:border-white/15
                  shadow-2xs transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer p-0
                "
                aria-label={t("common.close", "Cerrar")}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" className="w-2.5 h-2.5">
                  <path d="M1 1l10 10M11 1L1 11" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Contenido desplegable suave acelerado */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? "auto" : 0,
            opacity: isExpanded ? 1 : 0,
            marginTop: isExpanded ? 10 : 0,
          }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={`overflow-hidden ${isExpanded ? "" : "pointer-events-none"}`}
        >
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
                {t("common.yes", "Sí")}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 bg-black/5 hover:bg-black/10 dark:text-white/80 dark:hover:text-white dark:bg-white/10 dark:hover:bg-white/20 transition-transform active:scale-95 cursor-pointer border-0"
              >
                {t("common.no", "No")}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Barra de progreso continua */}
      {!toast.persistent && (
        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-slate-400/20 dark:bg-white/15 rounded-full overflow-hidden">
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
    </motion.output>
  );
});

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
