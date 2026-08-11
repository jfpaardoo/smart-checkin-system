import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const ToastContext = createContext(null);

let toastIdCounter = 0;

const TOAST_CONFIG = {
  success: { badgeDot: "bg-[#b3c34c]", progressBg: "bg-[#b3c34c]" },
  error: { badgeDot: "bg-red-500", progressBg: "bg-red-500" },
  info: { badgeDot: "bg-blue-400", progressBg: "bg-blue-400" },
  confirm: { badgeDot: "bg-amber-500", progressBg: "bg-amber-500" },
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
      {/* Contenedor adaptado con padding lateral para que en móvil coincida con los márgenes de la navbar */}
      <div className="fixed top-24 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none px-4 sm:px-6 lg:px-8">
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
      setTimeout(() => onRemove(toast.id), 450);
    }, DURATION);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.persistent, onRemove]);

  const handleClose = () => {
    clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 450);
  };

  const handleConfirm = () => {
    if (toast.onConfirm) toast.onConfirm();
    handleClose();
  };

  return (
    <div
      className={`
        pointer-events-auto relative overflow-hidden 
        w-full sm:w-auto sm:max-w-md md:max-w-lg mx-auto
        da-nav-capsule px-6 py-3 my-2 shadow-[0_12px_35px_0_rgba(31,38,135,0.25)]
      `}
      style={{
        animation: !exiting 
          ? "baToastFluidIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards" 
          : "baToastFluidOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        transformOrigin: "top center",
      }}
    >
      <div className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-2 h-2 rounded-full ${cfg.badgeDot} shrink-0 shadow-sm`} />
          <span className="text-white text-[0.92rem] font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {toast.message}
          </span>
        </div>

        {toast.type !== "confirm" && (
          <button
            type="button"
            onClick={handleClose}
            className="
              flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
              bg-white/10 hover:bg-white/20 text-white/70 hover:text-white
              transition-all duration-200 cursor-pointer border-0 p-0
            "
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" className="w-2.5 h-2.5">
              <path d="M1 1l10 10M11 1L1 11" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {toast.type === "confirm" && (
        <div className="flex gap-2 justify-end mt-2 pt-1.5 border-t border-white/10">
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1 rounded-full text-xs font-semibold text-slate-900 bg-[#b3c34c] hover:bg-[#a2b144] transition-all cursor-pointer border-0"
          >
            {t('common.yes', 'Sí')}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1 rounded-full text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer"
          >
            {t('common.no', 'No')}
          </button>
        </div>
      )}

      {!toast.persistent && (
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