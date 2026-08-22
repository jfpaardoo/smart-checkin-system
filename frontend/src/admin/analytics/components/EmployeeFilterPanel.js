import React from 'react';
import { useTranslation } from 'react-i18next';
import GlassSearchBar from '../../../components/GlassSearchBar';
import GlassDropdown from '../../../components/GlassDropdown';

const PREDEFINED_LOCATORS = [
  "AV", "MG", "VF", "LE", "VN", "SI", "JE", "SO", "PV", "BU", "OR", "MX"
];

export default function EmployeeFilterPanel({
  searchQuery,
  onSearchChange,
  selectedCompany,
  onCompanyChange,
  selectedLocator,
  onLocatorChange,
  selectedRole,
  onRoleChange,
  selectedPerf,
  onPerfChange,
  selectedStatus,
  onStatusChange,
  onClearFilters,
  companies = [],
  totalFiltered,
  totalCount
}) {
  const { t } = useTranslation();

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedCompany ||
    selectedLocator ||
    selectedRole !== 'ALL' ||
    selectedPerf !== 'ALL' ||
    selectedStatus !== 'ALL'
  );

  return (
    <div className="p-4 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] mb-4 flex flex-col gap-3 relative z-20">
      {/* Fila 1 de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative z-20">
        <div className="md:col-span-6">
          <GlassSearchBar 
            placeholder={t('analytics.searchEmployee', 'Buscar por nombre, código, usuario, empresa o localizador...')}
            onSearch={onSearchChange}
          />
        </div>

        <div className="md:col-span-3">
          <GlassDropdown
            options={[
              { value: '', label: t('users.allCompanies', 'Todas las empresas') },
              { value: 'NONE', label: t('users.noCompanyFilter', 'Sin empresa asignada') },
              ...companies.map(c => ({
                value: c.id,
                label: c.name
              }))
            ]}
            value={selectedCompany}
            onChange={onCompanyChange}
            placeholder={t('users.filterByCompany', 'Filtrar por Empresa')}
            className="w-full"
          />
        </div>

        <div className="md:col-span-3">
          <GlassDropdown
            options={[
              { value: '', label: t('analytics.allLocators', 'Todas las sedes / localizadores') },
              { value: 'NONE', label: t('analytics.noLocatorFilter', 'Sin localizador') },
              ...PREDEFINED_LOCATORS.map((loc) => ({ value: loc, label: `Sede ${loc}` }))
            ]}
            value={selectedLocator}
            onChange={onLocatorChange}
            placeholder={t('analytics.filterLocator', 'Filtrar por Sede')}
            className="w-full"
          />
        </div>
      </div>

      {/* Fila 2 de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2 border-t border-white/30 relative z-10">
        <div>
          <GlassDropdown
            options={[
              { value: 'ALL', label: t('analytics.allRoles', 'Todos los roles') },
              { value: 'ADMIN', label: 'ADMIN' },
              { value: 'EMPLOYEE', label: 'EMPLOYEE' },
              { value: 'USER', label: 'USER' }
            ]}
            value={selectedRole}
            onChange={onRoleChange}
            placeholder={t('analytics.filterRole', 'Rol')}
            className="w-full"
          />
        </div>

        <div>
          <GlassDropdown
            options={[
              { value: 'ALL', label: t('analytics.allPerf', 'Tasa de Asistencia (Todas)') },
              { value: 'HIGH', label: t('analytics.highPerf', 'Alta (≥ 75%)') },
              { value: 'MEDIUM', label: t('analytics.medPerf', 'Media (50% - 74%)') },
              { value: 'LOW', label: t('analytics.lowPerf', 'Baja (< 50%)') }
            ]}
            value={selectedPerf}
            onChange={onPerfChange}
            placeholder={t('analytics.filterPerf', 'Asistencia')}
            className="w-full"
          />
        </div>

        <div>
          <GlassDropdown
            options={[
              { value: 'ALL', label: t('analytics.allWorkStatus', 'Estado (Todos)') },
              { value: 'WORKING', label: t('users.statusWorking', 'Trabajando') },
              { value: 'RESTING', label: t('users.statusResting', 'Descansando') }
            ]}
            value={selectedStatus}
            onChange={onStatusChange}
            placeholder={t('analytics.filterWorkStatus', 'Estado')}
            className="w-full"
          />
        </div>
      </div>

      {/* Resumen de resultados */}
      <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pt-1">
        <span>{t('analytics.showing', 'Mostrando')}: {totalFiltered} de {totalCount} empleados</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-[#8fa228] hover:underline font-bold cursor-pointer"
          >
            {t('common.clearFilters', 'Limpiar filtros')}
          </button>
        )}
      </div>
    </div>
  );
}
