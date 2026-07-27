import { useCallback } from 'react';
import tokenService from '../services/token.service';
import { useToast } from '../components/ToastProvider';
import { useTranslation } from 'react-i18next';

/**
 * Custom React Hook providing a unified API fetch wrapper with automated JWT injection,
 * status code handling (401 session expiration), and localized Toast notifications.
 */
export function useApiRequest() {
  const toast = useToast();
  const { t } = useTranslation();

  const request = useCallback(async (url, options = {}) => {
    const jwt = tokenService.getLocalAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        if (options.showToast !== false) {
          toast.error(t('common.sessionExpired', 'Sesión expirada. Por favor vuelva a iniciar sesión.'));
        }
        tokenService.removeUser();
        window.location.href = '/login';
        return { ok: false, status: 401, data: null };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || t('common.genericError', 'Ha ocurrido un error en la solicitud');
        if (options.showToast !== false) {
          toast.error(errorMessage);
        }
        return { ok: false, status: response.status, data: errorData };
      }

      const data = await response.json().catch(() => null);
      if (options.successMessage && options.showToast !== false) {
        toast.success(options.successMessage);
      }
      return { ok: true, status: response.status, data };
    } catch (error) {
      console.error('API Request Error:', error);
      if (options.showToast !== false) {
        toast.error(t('common.networkError', 'Error de conexión con el servidor'));
      }
      return { ok: false, status: 0, error };
    }
  }, [toast, t]);

  return { request };
}

export default useApiRequest;
