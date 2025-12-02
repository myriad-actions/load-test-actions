import { sleep } from 'k6';
import scenario from '../scenario.js';
import { reportSummary } from '../utils/summary.js';


export const options = {
    stages: [
        { duration: '5m', target: 10 },
        // Long load (4+ hours)
        { duration: '4h', target: 10 },
        { duration: '5m', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.001'],
        http_req_duration: ['p(95)<800'],
        http_req_duration: ['p(99)<1500'],
        'iteration_duration{scenario:default}': [
            'max<10000',
            'med<3000',
        ],
    },
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};


export default function () {
    for (const fn of scenario.soak) {
        fn();
    }
    sleep(Math.random() * 5 + 2);
}


export function handleSummary(data) {
    return reportSummary(data, 'soak');
}