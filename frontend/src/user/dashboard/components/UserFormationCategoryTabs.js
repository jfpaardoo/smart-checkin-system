import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faAward } from '@fortawesome/free-solid-svg-icons';
import GlassDropdown from '../../../components/GlassDropdown';

export default function UserFormationCategoryTabs({ activeTab, onSelectTab, counts }) {
  const { t } = useTranslation();

  const categoryOptions = useMemo(() => [
    { value: 'ALL', label: `${t('dashboard.tabAll', 'Todas las formaciones')} (${counts.total})` },
    { value: 'UPCOMING', label: `${t('dashboard.tabUpcoming', 'Próximas Programadas')} (${counts.upcoming})` },
    { value: 'IN_PROGRESS', label: `${t('dashboard.tabInProgress', 'En Curso')} (${counts.inProgress})` },
    { value: 'COMPLETED', label: `${t('dashboard.tabCompleted', 'Completadas & Diplomas')} (${counts.completed})` }
  ], [t, counts]);

  return (
    <div className="w-full">
      {/* 1. Selector GlassDropdown en Móvil (desplaza contenido naturalmente en acordeón) */}
      <div className="sm:hidden w-full">
        <GlassDropdown
          options={categoryOptions}
          value={activeTab}
          onChange={onSelectTab}
          className="w-full"
        />
      </div>

      {/* 2. Pestañas en Escritorio (sm y superior) */}
      <div className="hidden sm:flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onSelectTab('UPCOMING')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'UPCOMING'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <FontAwesomeIcon icon={faCalendarAlt} className={activeTab === 'UPCOMING' ? 'text-white' : ''} />
          <span className={activeTab === 'UPCOMING' ? 'text-white' : ''}>{t('dashboard.tabUpcoming', 'Próximas Programadas')}</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${activeTab === 'UPCOMING' ? 'bg-white/30 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
            {counts.upcoming}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('IN_PROGRESS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'IN_PROGRESS'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <FontAwesomeIcon icon={faClock} className={activeTab === 'IN_PROGRESS' ? 'text-slate-950' : ''} />
          <span className={activeTab === 'IN_PROGRESS' ? 'text-slate-950 font-extrabold' : ''}>{t('dashboard.tabInProgress', 'En Curso')}</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${activeTab === 'IN_PROGRESS' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>
            {counts.inProgress}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('COMPLETED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <FontAwesomeIcon icon={faAward} className={activeTab === 'COMPLETED' ? 'text-white' : ''} />
          <span className={activeTab === 'COMPLETED' ? 'text-white' : ''}>{t('dashboard.tabCompleted', 'Completadas & Diplomas')}</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${activeTab === 'COMPLETED' ? 'bg-white/30 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
            {counts.completed}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-[#73841e] dark:bg-[#d4e84a] text-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span className={activeTab === 'ALL' ? 'text-white dark:text-slate-950' : ''}>{t('dashboard.tabAll', 'Todas')}</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${activeTab === 'ALL' ? 'bg-black/20 dark:bg-black/20 text-white dark:text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
            {counts.total}
          </span>
        </button>
      </div>
    </div>
  );
}
