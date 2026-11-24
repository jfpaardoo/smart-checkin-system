/**
 * SWR Persistent Cache Provider
 * Almacena la caché de SWR en memoria RAM y sincroniza con sessionStorage
 * para arranque instantáneo (0ms) en recargas y nuevas sesiones.
 */
export function localStorageProvider() {
  // 1. Inicializar mapa en memoria restaurando desde sessionStorage de forma segura
  let initialEntries = [];
  try {
    const raw = sessionStorage.getItem('da_swr_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        initialEntries = parsed;
      }
    }
  } catch (e) {
    console.debug('SWR Cache restore note:', e);
    try {
      sessionStorage.removeItem('da_swr_cache');
    } catch {
      // Ignorar
    }
  }
  const map = new Map(initialEntries);

  // 2. Antes de cerrar o descargar la ventana, serializar la caché
  window.addEventListener('beforeunload', () => {
    try {
      const appCache = Array.from(map.entries()).filter(([key]) => {
        // Solo persistir consultas GET de datos maestros
        return typeof key === 'string' && (
          key.startsWith('/users') ||
          key.startsWith('/companies') ||
          key.startsWith('/formations') ||
          key.startsWith('/audit') ||
          key.startsWith('/analytics')
        );
      });
      sessionStorage.setItem('da_swr_cache', JSON.stringify(appCache));
    } catch (e) {
      console.debug('SWR Cache persistence note:', e);
    }
  });

  return map;
}

export default localStorageProvider;
