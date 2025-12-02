// Placeholder scenario
import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 1,
  duration: "5s",
};

function ping() {
  const res = http.get(`${__ENV.BASE_URL}/internal/health`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}

export default {
  smoke: [
    ping,
  ],

  acceptance: [
    ping,
  ],

  stress: [
    ping,
  ],

  soak: [
    ping,
  ],
};