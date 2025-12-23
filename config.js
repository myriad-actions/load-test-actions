import { defaultOptions } from "./utils/options.js";
import http from "k6/http";
import { check } from "k6";

function ping() {
  const res = http.get(`${__ENV.BASE_URL}/internal/health`);
  // const res = http.get(`http://127.0.0.1:5000/api/v1/internal/health`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}

export default {
  smoke: {
    scenario: [ping],
    options: defaultOptions.smoke
  },

  acceptance: {
    scenarios: [ping],
    options: defaultOptions.acceptance,
  },

  stress: {
    scenario: [ping],
    options: defaultOptions.stress
  },

  soak: {
    scenario: [ping],
    options: defaultOptions.soak
  },
};