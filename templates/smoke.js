import { sleep } from 'k6';
import scenario from '../scenario.js';
import { reportSummary } from '../utils/summary.js';


export const options = {
    stages: [
        { duration: '10s', target: 1 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.05'],
        http_req_duration: ['p(95)<500'],
    },
};


export default function () {
    for (const fn of scenario.smoke) {
        fn();
    }
sleep(1);
}


export function handleSummary(data) {
    return reportSummary(data, 'smoke');
}