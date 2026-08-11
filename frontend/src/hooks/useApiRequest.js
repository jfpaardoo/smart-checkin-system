import { useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';
import { useTranslation } from 'react-i18next';

/**
 * Custom React Hook providing a unified API fetch wrapper with automated JWT injection,
 * status code handling (401 session expiration via Axios interceptors), and localized Toast notifications.
 */
export function useApiRequest() {
  const toast = useToast();
  const { t } = useTranslation();

  const handleError = useCallback((error, showToast) => {
    if (!error.response) {
      if (showToast) toast.error(t('common.networkError', 'Error de conexión con el servidor'));
      return { ok: false, status: 0, error };
    }

    const { status, data: errorData = {} } = error.response;
    if (status === 401) {
      if (showToast) toast.error(t('common.sessionExpired', 'Sesión expirada. Por favor vuelva a iniciar sesión.'));
      return { ok: false, status: 401, data: null };
    }

    const errorMessage = errorData.message || t('common.genericError', 'Ha ocurrido un error en la solicitud');
    if (showToast) toast.error(errorMessage);
    return { ok: false, status, data: errorData };
  }, [toast, t]);

  const request = useCallback(async (url, options = {}) => {
    const showToast = options.showToast !== false;
    try {
      const response = await api({
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        data: options.body,
      });

      if (options.successMessage && showToast) {
        toast.success(options.successMessage);
      }
      return { ok: true, status: response.status, data: response.data };
    } catch (error) {
      console.error('API Request Error:', error);
      return handleError(error, showToast);
    }
  }, [handleError, toast]);

  return { request };
}

export default useApiRequest;
