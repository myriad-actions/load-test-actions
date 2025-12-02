import { sleep } from 'k6';
import scenario from '../scenario.js';
import { reportSummary } from '../utils/summary.js';


export const options = {
    stages: [
        // simulate real like load
        { duration: '1m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '1m', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<1000'],
        http_req_duration: ['p(99)<2000'],
        iteration_duration: ['p(95)<5000'],
    },
};


export default function () {
    for (const fn of scenario.acceptance) {
        fn();
    }
    // Realistic think time between user actions
    sleep(Math.random() * 2 + 1);
}


export function handleSummary(data) {
    return reportSummary(data, 'acceptance');
}