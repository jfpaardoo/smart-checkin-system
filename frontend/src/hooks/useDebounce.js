import { useState, useEffect } from 'react';

/**
 * Hook para retrasar la actualización de un valor (debounce).
 * Útil para campos de búsqueda y filtros para evitar cómputos innecesarios.
 *
 * @param {any} value - Valor que se desea retrasar
 * @param {number} [delay=300] - Tiempo de espera en milisegundos
 * @returns {any} Valor retrasado
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
