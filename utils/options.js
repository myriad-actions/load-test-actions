export const defaultOptions = {
  smoke: {
    stages: [
        { duration: "10s", target: 1 },
    ],
    thresholds: {
        http_req_failed: ["rate<0.05"],
        http_req_duration: ["p(95)<0.00003"],
    },
  },
  acceptance: {
    stages: [
        { duration: "1m", target: 50 },
        { duration: "5m", target: 50 },
        { duration: "1m", target: 0 },
    ],
    thresholds: {
        http_req_failed: ["rate<0.01"],
        http_req_duration: ["p(95)<1000"],
        http_req_duration: ["p(99)<2000"],
        iteration_duration: ["p(95)<5000"],
    },
  },

  stress: {
    stages: [
        { duration: "2m", target: 100 },
        { duration: "3m", target: 100 },
        { duration: "2m", target: 250 },
        { duration: "1m", target: 500 },
        { duration: "2m", target: 500 },
        { duration: "2m", target: 100 },
        { duration: "1m", target: 0 },
    ],
    thresholds: {
        http_req_failed: ["rate<0.2"],
        http_req_duration: ["p(95)<3000"],
        "http_reqs{status:200}": ["count>0"],
        "http_reqs{status:429}": ["count>0"],
        "http_reqs{status:5xx}": ["count>0"],
    },
  },

  soak: {
    stages: [
        { duration: "5m", target: 10 },
        // Long load (4+ hours)
        { duration: "4h", target: 10 },
        { duration: "5m", target: 0 },
    ],
    thresholds: {
        http_req_failed: ["rate<0.001"],
        http_req_duration: ["p(95)<800"],
        http_req_duration: ["p(99)<1500"],
        "iteration_duration{scenario:default}": [
            "max<10000",
            "med<3000",
        ],
    },
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)", "count"],
  },
};