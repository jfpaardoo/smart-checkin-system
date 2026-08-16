import useSWR from 'swr';

const DEFAULT_KEY = '1x00000000000000000000AA';
const fetcher = (url) => fetch(url).then((res) => (res.ok ? res.json() : null));

export function useCaptchaSiteKey() {
  const defaultKey = process.env.REACT_APP_CAPTCHA_SITE_KEY || DEFAULT_KEY;
  const { data } = useSWR('/api/v1/auth/captcha-config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return data?.siteKey || defaultKey;
}