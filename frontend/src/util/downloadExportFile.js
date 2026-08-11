import api from '../services/api';

/**
 * Utility function to handle secure binary/file downloads (CSV, Excel, PDF)
 * with automated JWT injection, error handling, and localized Toast notifications.
 *
 * @param {string} endpoint - API relative path e.g. '/api/v1/exports/formations/csv'
 * @param {string} defaultFilename - Default download filename
 * @param {object} toast - Toast notification provider instance
 * @param {function} t - Translation function
 */
export async function downloadExportFile(endpoint, defaultFilename, toast, t) {
  try {
    const url = endpoint.startsWith('/') ? endpoint : `/api/v1/exports/${endpoint}`;
    
    // Request blob using axios
    const response = await api.get(url, {
      responseType: 'blob'
    });

    if (response.status === 200) {
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      if (toast && t) {
        toast.success(t('common.exportSuccess', 'Informe descargado con éxito'));
      }
    }
  } catch (error) {
    console.error('Failed to download export file:', error);
    if (toast && t) {
      if (error.response && error.response.status !== 401) {
          toast.error(t('common.exportError', 'Error al generar la descarga del informe'));
      } else if (!error.response) {
          toast.error(t('common.networkError', 'Error de red o conexión al servidor'));
      }
    }
  }
}

export default downloadExportFile;
