import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const ThemeContext = createContext(null);

/**
 * Obtiene el tema inicial:
 * 1. localStorage (preferencia guardada del usuario)
 * 2. prefers-color-scheme del sistema
 * 3. Fallback: 'light'
 */
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('da-theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch (err) {
    console.debug('LocalStorage initial theme access info:', err);
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      if (window.matchMedia('(prefers-color-scheme: dark)')?.matches) {
        return 'dark';
      }
    } catch (err) {
      console.debug('MatchMedia initial check info:', err);
    }
  }
  return 'light';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.backgroundColor = '#0f172a';
    root.style.colorScheme = 'dark';
    if (document.body) {
      document.body.style.backgroundColor = '#0f172a';
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#0f172a');
    }
  } else {
    root.classList.remove('dark');
    root.style.backgroundColor = '#f1f5f9';
    root.style.colorScheme = 'light';
    if (document.body) {
      document.body.style.backgroundColor = '#f1f5f9';
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#f1f5f9');
    }
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Aplicar clase al montar y cuando cambia
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('da-theme', theme);
    } catch (err) {
      console.debug('LocalStorage theme write info:', err);
    }
  }, [theme]);

  // Escuchar cambios del sistema operativo (solo si el usuario no ha elegido manualmente)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (!mq) return;
      
      const handleChange = (e) => {
        let stored = null;
        try {
          stored = localStorage.getItem('da-theme');
        } catch (err) {
          console.debug('LocalStorage theme read on change info:', err);
        }
        // Solo seguir al SO si no hay preferencia guardada
        if (!stored) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };

      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
      }
    } catch (err) {
      console.debug('MatchMedia event listener info:', err);
    }
  }, []);

  // Sincronización entre pestañas: si el tema cambia en otra pestaña, reflejarlo aquí
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e) => {
      if (e.key === 'da-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const isDark = theme === 'dark';

  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
    isDark,
    setTheme
  }), [theme, toggleTheme, isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para usar el tema en cualquier componente.
 * Uso: const { isDark, toggleTheme } = useTheme();
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
