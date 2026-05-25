import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '1m', target: 150 },
    { duration: '1m', target: 300 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed:   [{ threshold: 'rate<0.05',  abortOnFail: true, delayAbortEval: '10s' }],
    http_req_duration: [{ threshold: 'p(95)<1000', abortOnFail: true, delayAbortEval: '10s' }],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function STRESS() {
  const phone = `+38098${Math.floor(Math.random() * 9000000 + 1000000)}`;
  const password = 'Password123!';

  // 1. Register
  let res = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    phone, password, name: 'Stress Test User'
  }), { headers: { 'Content-Type': 'application/json' } });

  if (res.status === 200) {
    // 2. Fetch medications to order
    res = http.get(`${BASE_URL}/api/medications?limit=500`);
    const meds = res.json();

    if (meds && meds.length > 0) {
      const med = meds[Math.floor(Math.random() * meds.length)];
      // 3. Stress the orders endpoint
      res = http.post(`${BASE_URL}/api/orders`, JSON.stringify({
        items: [{ medication: med._id, quantity: 1, price: med.price }],
        total: med.price
      }), { headers: { 'Content-Type': 'application/json' } });

      check(res, { 'order status 200': (r) => r.status === 200 });

      http.del(`${BASE_URL}/api/orders`);
    }

    http.del(`${BASE_URL}/api/profile`);
  }

  sleep(0.5);
}

export function handleSummary() {
  http.del(`${BASE_URL}/api/orders`);
  http.del(`${BASE_URL}/api/profile`);
}
