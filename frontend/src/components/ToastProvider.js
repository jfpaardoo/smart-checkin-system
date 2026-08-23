import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

import soundAndHaptics from "../util/soundAndHaptics";

const ToastContext = createContext(null);

let toastIdCounter = 0;

const TOAST_CONFIG = {
  success: { badgeDot: "bg-[#b3c34c]", progressBg: "bg-[#b3c34c]" },
  error: { badgeDot: "bg-red-500", progressBg: "bg-red-500" },
  warning: { badgeDot: "bg-amber-500", progressBg: "bg-amber-500" },
  info: { badgeDot: "bg-blue-400", progressBg: "bg-blue-400" },
  confirm: { badgeDot: "bg-amber-500", progressBg: "bg-amber-500" },
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
      {/* Contenedor adaptado aprovechando el ancho útil como la navbar */}
      <div className="fixed top-20 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none px-0">
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
  const timerRef = useRef(null);
  const DURATION = 4500;

  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  const startDismissTimer = useCallback(() => {
    if (toast.persistent) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, DURATION);
  }, [toast.persistent]);

  const pauseDismissTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      startDismissTimer();
    } else {
      pauseDismissTimer();
    }
    return () => pauseDismissTimer();
  }, [isExpanded, startDismissTimer, pauseDismissTimer]);

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    pauseDismissTimer();
    setExiting(true);
  };

  const handleConfirm = (e) => {
    if (e) e.stopPropagation();
    if (toast.onConfirm) toast.onConfirm();
    handleClose();
  };

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div
      onMouseEnter={pauseDismissTimer}
      onMouseLeave={() => {
        if (!isExpanded) startDismissTimer();
      }}
      className={`
        pointer-events-auto relative overflow-hidden
        w-[calc(100%-24px)] sm:w-auto sm:max-w-md md:max-w-lg mx-auto
        bg-slate-800/40 backdrop-blur-xl backdrop-saturate-150 border border-white/20 
        ${isExpanded ? 'rounded-[22px] px-3.5 py-2.5 sm:px-5 sm:py-3.5 my-1 shadow-[0_16px_45px_0_rgba(31,38,135,0.4)]' : 'rounded-[40px] px-3.5 py-2 sm:px-5 sm:py-2.5 my-1 shadow-[0_8px_32px_0_rgba(31,38,135,0.3)]'}
        transition-all duration-300 ease-out
      `}
      style={{
        animation: !exiting 
          ? "baToastFluidIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards" 
          : "baToastFluidOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        transformOrigin: "top center",
      }}
      onAnimationEnd={(e) => {
        if (exiting && e.target === e.currentTarget) {
          onRemove(toast.id);
        }
      }}
    >
      <div className={`flex ${isExpanded ? 'items-start' : 'items-center'} justify-between gap-2.5 sm:gap-3.5`}>
        <button
          type="button"
          onClick={toggleExpand}
          title={!isExpanded ? t('common.tapToExpand', 'Toca para expandir el texto') : undefined}
          aria-expanded={isExpanded}
          className={`flex ${isExpanded ? 'items-start' : 'items-center'} gap-2 sm:gap-2.5 overflow-hidden flex-1 min-w-0 bg-transparent border-0 p-0 text-left cursor-pointer focus:outline-none`}
        >
          <div className={`w-2 h-2 rounded-full ${cfg.badgeDot} shrink-0 shadow-sm ${isExpanded ? 'mt-1.5' : ''}`} />
          <span 
            className={`text-white text-[0.85rem] sm:text-[0.92rem] font-medium tracking-tight ${
              isExpanded 
                ? 'whitespace-normal break-words leading-relaxed' 
                : 'whitespace-nowrap overflow-hidden text-ellipsis'
            }`}
          >
            {toast.message}
          </span>
        </button>

        {toast.type !== "confirm" && (
          <button
            type="button"
            onClick={handleClose}
            className="
              flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
              bg-white/10 hover:bg-white/20 text-white/70 hover:text-white
              transition duration-200 cursor-pointer border-0 p-0 mt-0.5
            "
            aria-label={t('common.close', 'Cerrar')}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" className="w-2.5 h-2.5">
              <path d="M1 1l10 10M11 1L1 11" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {toast.type === "confirm" && (
        <div className="flex gap-2 justify-end mt-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-900 bg-[#b3c34c] hover:bg-[#a2b144] transition cursor-pointer border-0"
          >
            {t('common.yes', 'Sí')}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition cursor-pointer"
          >
            {t('common.no', 'No')}
          </button>
        </div>
      )}

      {!toast.persistent && !isExpanded && (
        <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${cfg.progressBg}`}
            style={{
              animation: `da-toast-progress-shrink ${DURATION}ms linear forwards`,
              transformOrigin: "left",
            }}
          />
        </div>
      )}

      {/* Animación fluida de expansión */}
      <style>{`
        @keyframes baToastFluidIn {
          0% {
            transform: scale(0.1) translateY(-30px);
            opacity: 0;
            border-radius: 9999px;
            max-width: 36px;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
            border-radius: 40px;
            max-width: 100%;
          }
        }

        @keyframes baToastFluidOut {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
            max-width: 100%;
          }
          100% {
            transform: scale(0.1) translateY(-25px);
            opacity: 0;
            max-width: 36px;
          }
        }
      `}</style>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}