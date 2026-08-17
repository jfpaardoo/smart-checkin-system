import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metric to track rate limited responses
const rateLimitedCount = new Counter('rate_limited_429_total');

export const options = {
  scenarios: {
    stress_burst: {
      executor: 'constant-arrival-rate',
      rate: 100,             // 100 requests per second burst
      timeUnit: '1s',
      duration: '15s',
      preAllocatedVUs: 30,
      maxVUs: 100,
    },
  },
  thresholds: {
    // We expect the rate limiter to kick in under burst load
    'rate_limited_429_total': ['count>0'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function rateLimitStressTest() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '198.51.100.1', // Simulate single origin IP burst
    },
  };

  const res = http.get(`${BASE_URL}/api/v1/auth/session/active`, params);

  if (res.status === 429) {
    rateLimitedCount.add(1);
  }

  check(res, {
    'handled gracefully (200, 401, or 429)': (r) => [200, 401, 429].includes(r.status),
  });
}
