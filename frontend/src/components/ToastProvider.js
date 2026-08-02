import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * Central Toast Provider — wraps the entire app and renders
 * Liquid Glass notification toasts in a fixed stack (top-right).
 */
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
    confirm: (msg, onConfirm) =>
      addToast("confirm", msg, { onConfirm, persistent: true }),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <div className="ba-toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Individual Toast notification rendered inside the container.
 */
function ToastItem({ toast, onRemove }) {
  const { t } = useTranslation();
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);
  const DURATION = 4000;

  useEffect(() => {
    if (toast.persistent) return;
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 350);
    }, DURATION);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.persistent, onRemove]);

  const handleClose = () => {
    clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 350);
  };

  const handleConfirm = () => {
    if (toast.onConfirm) toast.onConfirm();
    handleClose();
  };

  let icon = "ℹ";
  if (toast.type === "success") {
    icon = "✓";
  } else if (toast.type === "error") {
    icon = "✕";
  } else if (toast.type === "confirm") {
    icon = "⚠";
  }

  return (
    <div
      className={`ba-toast ba-toast-${toast.type} ${exiting ? "ba-toast-exit" : ""}`}
    >
      <div className="ba-toast-body">
        <span className="ba-toast-icon">{icon}</span>
        <span className="ba-toast-message">{toast.message}</span>
        {toast.type !== "confirm" && (
          <button className="ba-toast-close" onClick={handleClose}>
            ×
          </button>
        )}
      </div>

      {toast.type === "confirm" && (
        <div className="ba-toast-actions">
          <button className="ba-toast-btn ba-toast-btn-yes" onClick={handleConfirm}>
            {t('common.yes', 'Sí')}
          </button>
          <button className="ba-toast-btn ba-toast-btn-no" onClick={handleClose}>
            {t('common.no', 'No')}
          </button>
        </div>
      )}

      {!toast.persistent && (
        <div
          className="ba-toast-progress"
          style={{ animationDuration: `${DURATION}ms` }}
        />
      )}
    </div>
  );
}

/**
 * Hook to access the toast API from any component.
 * @returns {{ success: Function, error: Function, info: Function, confirm: Function }}
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
