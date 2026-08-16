import { useState, useEffect } from 'react';

const DEFAULT_KEY = '1x00000000000000000000AA';

export function useCaptchaSiteKey() {
  const [siteKey, setSiteKey] = useState(() => {
    return process.env.REACT_APP_CAPTCHA_SITE_KEY || DEFAULT_KEY;
  });

  useEffect(() => {
    let isMounted = true;
    fetch('/api/v1/auth/captcha-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.siteKey) {
          setSiteKey(data.siteKey);
        }
      })
      .catch(() => {
        // En caso de fallo de red, mantiene el valor por defecto
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return siteKey;
}
