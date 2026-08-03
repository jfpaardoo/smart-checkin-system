import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const ToastContext = createContext(null);

let toastIdCounter = 0;

const TOAST_CONFIG = {
  success: {
    accent: "from-[#b3c34c] to-[#7a9e2e]",
    accentColor: "#b3c34c",
    iconBg: "bg-[#7a9e2e]",
    iconRing: "ring-[#b3c34c]/40",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    progressFrom: "#b3c34c",
    progressTo: "#7a9e2e",
  },
  error: {
    accent: "from-[#ef4444] to-[#b91c1c]",
    accentColor: "#ef4444",
    iconBg: "bg-[#b91c1c]",
    iconRing: "ring-red-500/40",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    progressFrom: "#ef4444",
    progressTo: "#b91c1c",
  },
  info: {
    accent: "from-[#60a5fa] to-[#2563eb]",
    accentColor: "#60a5fa",
    iconBg: "bg-[#2563eb]",
    iconRing: "ring-blue-400/40",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    progressFrom: "#60a5fa",
    progressTo: "#2563eb",
  },
  confirm: {
    accent: "from-[#fb923c] to-[#c2410c]",
    accentColor: "#fb923c",
    iconBg: "bg-[#c2410c]",
    iconRing: "ring-orange-400/40",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    progressFrom: "#fb923c",
    progressTo: "#c2410c",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, options = {}) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message, ...options }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastApi = React.useMemo(() => ({
    success: (msg) => addToast("success", msg),
    error: (msg) => addToast("error", msg),
    info: (msg) => addToast("info", msg),
    confirm: (msg, onConfirm) => addToast("confirm", msg, { onConfirm, persistent: true }),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {/* Toast container — fixed top-right, pointer-events isolated */}
      <div className="fixed top-24 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none w-[370px] max-w-[calc(100vw-2rem)] sm:max-w-[370px]">
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
  const timerRef = useRef(null);
  const DURATION = 4200;

  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  useEffect(() => {
    if (toast.persistent) return;
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 380);
    }, DURATION);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.persistent, onRemove]);

  const handleClose = () => {
    clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 380);
  };

  const handleConfirm = () => {
    if (toast.onConfirm) toast.onConfirm();
    handleClose();
  };

  return (
    <div
      className={`
        pointer-events-auto relative overflow-hidden rounded-[20px]
        bg-slate-900/75
        border border-white/[0.12]
        shadow-[0_20px_60px_rgba(0,0,0,0.35),0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]
        ${exiting ? "ba-toast-exit-tw" : "ba-toast-enter-tw"}
      `}
      style={{
        backdropFilter: "blur(48px) saturate(180%)",
        WebkitBackdropFilter: "blur(48px) saturate(180%)",
        borderLeft: `3px solid ${cfg.accentColor}`,
      }}
    >
      {/* Subtle inner glow on top */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.07] to-transparent pointer-events-none" />

      {/* Body */}
      <div className="flex items-center gap-3 px-4 py-4">
        {/* Icon badge */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white
          ${cfg.iconBg} ring-2 ${cfg.iconRing}
          shadow-lg
        `}>
          {cfg.icon}
        </div>

        {/* Message */}
        <span className="flex-1 text-white/90 text-[0.88rem] font-medium leading-[1.45] tracking-[0.01em]">
          {toast.message}
        </span>

        {/* Close button */}
        {toast.type !== "confirm" && (
          <button
            type="button"
            onClick={handleClose}
            className="
              flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
              bg-white/10 hover:bg-white/20 border border-white/10
              text-white/50 hover:text-white/90
              text-xs transition-all duration-200 hover:scale-110 cursor-pointer
            "
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Confirm action buttons */}
      {toast.type === "confirm" && (
        <div className="flex gap-2 px-4 pb-4 pt-0 pl-[60px]">
          <button
            type="button"
            onClick={handleConfirm}
            className="
              px-5 py-1.5 rounded-full text-[0.8rem] font-600 font-semibold text-white
              bg-red-600 hover:bg-red-700
              shadow-[0_4px_12px_rgba(220,38,38,0.35)]
              transition-all duration-200 hover:-translate-y-px hover:scale-[1.03]
              cursor-pointer border-0
            "
          >
            {t('common.yes', 'Sí')}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="
              px-5 py-1.5 rounded-full text-[0.8rem] font-semibold text-white/70 hover:text-white
              bg-white/10 hover:bg-white/20 border border-white/10
              transition-all duration-200 hover:-translate-y-px
              cursor-pointer
            "
          >
            {t('common.no', 'No')}
          </button>
        </div>
      )}

      {/* Progress bar */}
      {!toast.persistent && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2.5px]"
          style={{
            background: `linear-gradient(90deg, ${cfg.progressFrom}, ${cfg.progressTo})`,
            animation: `ba-toast-progress-shrink ${DURATION}ms linear forwards`,
            transformOrigin: "left",
            opacity: 0.8,
          }}
        />
      )}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
