import api from '../services/api';

// Set tracking all currently ongoing downloads to prevent duplicate clicks
const activeExports = new Set();

/**
 * Utility function to handle secure binary/file downloads (CSV, Excel, PDF)
 * with automated JWT injection, error handling, and localized Toast notifications.
 * Guards against double-clicks and concurrent download attempts.
 *
 * @param {string} endpoint - API relative path e.g. '/api/v1/exports/formations/csv'
 * @param {string} defaultFilename - Default download filename
 * @param {object} toast - Toast notification provider instance
 * @param {function} t - Translation function
 * @returns {Promise<boolean>} True if download succeeded, false otherwise
 */
export async function downloadExportFile(endpoint, defaultFilename, toast, t) {
  const cleanEndpoint = endpoint.replace(/^\/api\/v1\/exports\//, '').replace(/^\/exports\//, '');
  
  if (activeExports.has(cleanEndpoint)) {
    return false; // Prevent duplicate triggers if already downloading
  }
  
  activeExports.add(cleanEndpoint);
  
  try {
    const url = `/exports/${cleanEndpoint}`;
    
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
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to download export file:', error);
    if (toast && t) {
      if (error.response && error.response.status !== 401) {
          toast.error(t('common.exportError', 'Error al generar la descarga del informe'));
      } else if (!error.response) {
          toast.error(t('common.networkError', 'Error de red o conexión al servidor'));
      }
    }
    return false;
  } finally {
    activeExports.delete(cleanEndpoint);
  }
}

export default downloadExportFile;
