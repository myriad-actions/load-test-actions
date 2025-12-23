import { sleep } from 'k6';
import scenario from './config.js';
import { reportSummary } from './utils/summary.js';
import { defaultOptions } from "./utils/options.js";

const testType = __ENV.TEST_TYPE || 'smoke';
export const options = scenario[testType]?.options || defaultOptions[testType];


export default function () {
    for (const fn of scenario[testType].scenario) {
        fn();
    }
    sleep(1);
}


export function handleSummary(data) {
    return reportSummary(data, testType);
}