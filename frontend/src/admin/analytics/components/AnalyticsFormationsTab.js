import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from 'reactstrap';

// Cohesive component for a single formation row to ensure separation of concerns
const FormationTableRow = ({ formation }) => {
  const { formationName, formationDate, totalExpected, totalAttended, attendancePercentage } = formation;

  const formattedDate = formationDate ? new Date(formationDate).toLocaleDateString() : '-';

  let progressColor = 'bg-red-500';
  if (attendancePercentage >= 80) {
    progressColor = 'bg-green-500';
  } else if (attendancePercentage >= 50) {
    progressColor = 'bg-yellow-500';
  }

  return (
    <tr key={formation.formationId}>
      <td style={{ paddingLeft: '1rem' }} className="fw-bold">
        {formationName}
      </td>
      <td>
        {formattedDate}
      </td>
      <td className="text-center">
        {totalExpected}
      </td>
      <td className="text-center">
        {totalAttended}
      </td>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-full bg-gray-200/50 rounded-full h-2.5 backdrop-blur-sm overflow-hidden">
            <div
              className={`h-2.5 rounded-full ${progressColor} transition-all duration-500 ease-in-out`}
              style={{ width: `${attendancePercentage}%` }}
            ></div>
          </div>
          <span className="text-sm font-bold text-gray-700 min-w-[3rem]">
            {attendancePercentage}%
          </span>
        </div>
      </td>
    </tr>
  );
};

export default function AnalyticsFormationsTab({ formations }) {
  const { t } = useTranslation();

  return (
    <div className="w-full mt-4">
      
      {/* 1. VISTA ESCRITORIO */}
      <div className="hidden lg:block overflow-x-auto">
        <Table responsive hover aria-label="formations analytics" className="ba-table align-middle" style={{ tableLayout: 'fixed', minWidth: '800px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '25%', paddingLeft: '1rem' }}>{t('analytics.formationName', 'Nombre')}</th>
              <th style={{ width: '15%' }}>{t('analytics.formationDate', 'Fecha')}</th>
              <th style={{ width: '20%' }} className="text-center">{t('analytics.totalExpected', 'Empleados Esperados')}</th>
              <th style={{ width: '20%' }} className="text-center">{t('analytics.totalAttended', 'Asistentes')}</th>
              <th style={{ width: '20%' }}>{t('analytics.attendanceRate', 'Tasa de Asistencia')}</th>
            </tr>
          </thead>
          <tbody>
            {formations && formations.length > 0 ? (
              formations.map((f) => (
                <FormationTableRow key={f.formationId} formation={f} />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-6 text-slate-500">
                  {t('analytics.noFormations', 'No hay datos de formaciones disponibles.')}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* 2. VISTA MÓVIL / TABLET */}
      <div className="lg:hidden flex flex-col gap-4 mt-2">
        {formations && formations.length > 0 ? (
          formations.map((f) => {
            const { formationName, formationDate, totalExpected, totalAttended, attendancePercentage } = f;
            const formattedDate = formationDate ? new Date(formationDate).toLocaleDateString() : '-';
            let progressColor = 'bg-red-500';
            if (attendancePercentage >= 80) progressColor = 'bg-green-500';
            else if (attendancePercentage >= 50) progressColor = 'bg-yellow-500';

            return (
              <div key={f.formationId} className="bg-white/70 backdrop-blur-md shadow-sm rounded-[20px] p-5 border border-white/40 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 m-0 text-lg">{formationName}</h3>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">{formattedDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                  <span className="text-xs text-slate-500">{t('analytics.totalExpected', 'Empleados Esperados')}:</span>
                  <span className="font-bold">{totalExpected}</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                  <span className="text-xs text-slate-500">{t('analytics.totalAttended', 'Asistentes')}:</span>
                  <span className="font-bold">{totalAttended}</span>
                </div>

                <div className="flex flex-col gap-1 border-t border-slate-200/50 pt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500">{t('analytics.attendanceRate', 'Tasa de Asistencia')}</span>
                    <span className="text-sm font-bold text-gray-700">{attendancePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200/50 rounded-full h-2.5 backdrop-blur-sm overflow-hidden">
                    <div className={`h-2.5 rounded-full ${progressColor} transition-all duration-500 ease-in-out`} style={{ width: `${attendancePercentage}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center p-6 text-slate-500 bg-white/40 rounded-2xl border border-white/20 mt-4">
            {t('analytics.noFormations', 'No hay datos de formaciones disponibles.')}
          </div>
        )}
      </div>

    </div>
  );
}
