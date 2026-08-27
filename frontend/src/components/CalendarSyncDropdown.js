import React, { useState } from "react";
import { FaCalendarPlus, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faClock } from "@fortawesome/free-solid-svg-icons";
import { calendarSyncManager } from "../services/calendar/CalendarSyncStrategies";
import { useToast } from "./ToastProvider";
import GlassModal from "./GlassModal";
import GlassButton from "./GlassButton";
import { formatDate } from "../utils/dateUtils";

function StrategyOptionButton({ strat, isRecommended, isLoading, onSync }) {
  const IconComponent = strat.icon;

  return (
    <button
      type="button"
      onClick={() => onSync(strat.id)}
      disabled={isLoading}
      className="w-full text-left p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 hover:bg-[#b3c34c]/15 dark:hover:bg-slate-700/90 border border-slate-200/80 dark:border-white/10 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
          {isLoading ? <FaSpinner className="animate-spin text-sm" /> : <IconComponent size={16} />}
        </div>
        <div className="truncate">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#73841e] dark:group-hover:text-[#d4e84a] transition-colors">
            {strat.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {strat.description}
          </div>
        </div>
      </div>

      {isRecommended && (
        <span className="text-[10px] px-2 py-1 rounded-xl font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex-shrink-0 flex items-center gap-1">
          <FaCheckCircle size={10} /> Auto
        </span>
      )}
    </button>
  );
}

export default function CalendarSyncDropdown({
  formation,
  buttonLabel = "Sincronizar Calendario",
  variant = "icon", // 'icon' | 'button'
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(null);
  const toast = useToast();

  const recommendedId = calendarSyncManager.detectRecommendedStrategy();
  const strategies = calendarSyncManager.getAllStrategies();

  const handleSync = async (strategyId) => {
    if (!formation) return;
    setLoadingStrategy(strategyId);
    try {
      await calendarSyncManager.sync(strategyId, formation);
      setIsOpen(false);
    } catch (err) {
      console.error("Error al sincronizar evento de calendario:", err);
      toast.error("No se pudo sincronizar el evento en el calendario.");
    } finally {
      setLoadingStrategy(null);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`p-2.5 rounded-xl bg-white/60 dark:bg-slate-700/60 border border-white/80 dark:border-white/10 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-500/20 active:scale-95 transition shadow-xs inline-flex items-center justify-center cursor-pointer ${className}`}
          title="Añadir a mi Calendario (Google, Outlook, Apple...)"
          aria-label="Añadir a mi Calendario"
        >
          <FaCalendarPlus size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer ${className}`}
        >
          <FaCalendarPlus className="text-sky-500 text-sm" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {/* Modal Nativo Liquid Glass: Sin problemas de clipping ni transparencia */}
      <GlassModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
              <FaCalendarPlus size={16} />
            </div>
            <span>Añadir a mi Calendario</span>
          </div>
        }
        footer={
          <div className="flex justify-end w-full">
            <GlassButton variant="secondary" onClick={() => setIsOpen(false)}>
              Cerrar
            </GlassButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Card Resumen de la Formación */}
          {formation && (
            <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/10 flex flex-col gap-2">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 m-0">
                {formation.name}
              </h4>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} className="text-amber-500" />
                  <span>{formatDate(formation.formationDate)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faLocationDot} className="text-rose-500" />
                  <span>{formation.location || "BA VILLAFRANCA"}</span>
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Elige tu plataforma de calendario preferida para guardar la convocatoria:
          </p>

          {/* Opciones de Sincronización */}
          <div className="flex flex-col gap-2">
            {strategies.map((strat) => (
              <StrategyOptionButton
                key={strat.id}
                strat={strat}
                isRecommended={strat.id === recommendedId}
                isLoading={loadingStrategy === strat.id}
                onSync={handleSync}
              />
            ))}
          </div>
        </div>
      </GlassModal>
    </>
  );
}
