import api from '../services/api';

// Set tracking all currently ongoing downloads to prevent duplicate clicks
const activeExports = new Set();

function isIOSOrPWA() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isPWA = window.navigator.standalone === true || 
    window.matchMedia('(display-mode: standalone)').matches;
  return isIOS || isPWA;
}

async function tryWebShareFile(blob, filename, mimeType) {
  if (!isIOSOrPWA() || typeof navigator === 'undefined' || !navigator.canShare) {
    return false;
  }

  try {
    const file = new File([blob], filename, { type: blob.type || mimeType });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: filename
      });
      return true;
    }
  } catch (shareErr) {
    if (shareErr.name === 'AbortError') {
      return true; // Usuario canceló el modal nativo
    }
    console.debug('Web Share fallback to anchor click:', shareErr);
  }
  return false;
}

function triggerAnchorDownload(blob, filename) {
  if (typeof window === 'undefined' || !window.URL) {
    return false;
  }

  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    try {
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {}
  }, 400);

  return true;
}

/**
 * Universal blob downloader compatible with Desktop, Android, iOS Safari, and iOS PWA standalone mode.
 * On iOS / PWA, if Web Share API supports file sharing, it opens the native iOS Share Sheet ("Guardar en Archivos").
 * Otherwise, it triggers the standard download mechanism.
 *
 * @param {Blob|ArrayBuffer|any} blobData - Binary data
 * @param {string} filename - Desired filename
 * @param {string} [mimeType='application/octet-stream'] - Mime type
 * @returns {Promise<boolean>}
 */
export async function saveBlobFile(blobData, filename, mimeType = 'application/octet-stream') {
  if (!blobData) {
    return false;
  }

  try {
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: mimeType });

    const shared = await tryWebShareFile(blob, filename, mimeType);
    if (shared) {
      return true;
    }

    return triggerAnchorDownload(blob, filename);
  } catch (error) {
    console.error('Failed to save blob file:', error);
    return false;
  }
}

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
  if (!endpoint) return false;

  // Fallback si por error se pasó directamente el Blob de datos en vez del endpoint URL
  if (endpoint instanceof Blob || typeof endpoint !== 'string') {
    const success = await saveBlobFile(endpoint, defaultFilename);
    if (success && toast && t) {
      toast.success(t('common.exportSuccess', 'Informe descargado con éxito'));
    }
    return success;
  }

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
      const mimeType = response.headers['content-type'] || 'application/octet-stream';
      await saveBlobFile(response.data, defaultFilename, mimeType);
      
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
