import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Test: Nominal & Peak Check-in Traffic
export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Ramp-up to 20 virtual users
    { duration: '30s', target: 50 },  // Peak shift arrival: 50 concurrent employees
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // 95% of requests must complete below 200ms
    http_req_duration: ['p(95)<200', 'p(99)<400'],
    // Less than 1% failed requests under normal load
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function checkinsLoadTest() {
  const headers = {
    'Content-Type': 'application/json',
  };

  // 1. Health check & system metrics
  const healthRes = http.get(`${BASE_URL}/actuator/health`);
  check(healthRes, {
    'system is UP': (r) => r.status === 200,
  });

  // 2. Query public endpoints / checkins
  const checkinGetRes = http.get(`${BASE_URL}/api/v1/checkins/recent`, { headers });
  check(checkinGetRes, {
    'get status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}
