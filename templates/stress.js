import { sleep } from 'k6';
import scenario from '../scenario.js';
import { reportSummary } from '../utils/summary.js';


export const options = {
    stages: [
        // Ramp-up slowly to find breaking point
        { duration: '2m', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '2m', target: 250 },
        { duration: '1m', target: 500 },
        { duration: '2m', target: 500 },
        // Recovery phase
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.2'],
        http_req_duration: ['p(95)<3000'],
        // Stress-specific metrics
        'http_reqs{status:200}': ['count>0'],
        'http_reqs{status:429}': ['count>0'],
        'http_reqs{status:5xx}': ['count>0'],
    },
};


export default function () {
    for (const fn of scenario.stress) {
        fn();
    }
    sleep(0.5);
}


export function handleSummary(data) {
    return reportSummary(data, 'stress');
}