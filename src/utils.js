/**
 * Utility functions for simulation, latency modeling, and console formatting.
 */

/**
 * Sleeps for a specified duration in milliseconds.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulates network or processing latency with optional jitter.
 * @param {number} baseMs - Base latency in milliseconds.
 * @param {number} jitterMs - Maximum random jitter to add/subtract.
 * @returns {Promise<number>} - Actual duration waited.
 */
export async function simulateLatency(baseMs = 50, jitterMs = 20) {
  const jitter = (Math.random() * 2 - 1) * jitterMs;
  const actualMs = Math.max(5, Math.round(baseMs + jitter));
  await sleep(actualMs);
  return actualMs;
}

/**
 * Generates a random boolean with probability of true.
 * @param {number} probability - Probability between 0 and 1.
 * @returns {boolean}
 */
export function randomChance(probability = 0.3) {
  return Math.random() < probability;
}

/**
 * Formats a timestamp as HH:MM:SS.mmm
 * @returns {string}
 */
export function formatTimestamp() {
  const now = new Date();
  return now.toISOString().split('T')[1].replace('Z', '');
}

/**
 * ANSI Color Codes for terminal formatting.
 */
export const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m'
};

/**
 * Renders a clean ASCII table comparing Naive vs Resilient metrics.
 * @param {Object} naiveMetrics 
 * @param {Object} resilientMetrics 
 * @returns {string} Formatted table string
 */
export function formatComparisonTable(naiveMetrics, resilientMetrics) {
  const line = '+-------------------------------------+-------------------------+-------------------------+';
  const header = '| Metric                              | Naive Anti-Pattern      | Resilient Hub-&-Spoke   |';
  
  const formatCell = (val, isGood, isBad) => {
    const str = String(val).padEnd(23, ' ');
    if (isGood) return `${COLORS.green}${COLORS.bold}${str}${COLORS.reset}`;
    if (isBad) return `${COLORS.red}${COLORS.bold}${str}${COLORS.reset}`;
    return str;
  };

  const rows = [
    `| Architecture Pattern                | ${formatCell('Direct / Bypassed', false, true)} | ${formatCell('Orchestrated Hub', true, false)} |`,
    `| Coordinator Interventions (Overhead)| ${formatCell(naiveMetrics.coordinatorInterventions + ' (High/Manual)', false, true)} | ${formatCell(resilientMetrics.coordinatorInterventions + ' (Minimal/Auto)', true, false)} |`,
    `| Unhandled Exceptions / Bubbling     | ${formatCell(naiveMetrics.unhandledExceptions + ' (Cascading)', false, true)} | ${formatCell(resilientMetrics.unhandledExceptions + ' (0 Bubbling)', true, false)} |`,
    `| Local Error Recovery Rate           | ${formatCell(naiveMetrics.recoveryRate + '% (No Triaging)', false, true)} | ${formatCell(resilientMetrics.recoveryRate + '% (Self-Healing)', true, false)} |`,
    `| Data Redundancy & Duplicate Rate    | ${formatCell(naiveMetrics.redundancyRate + '% (Unfiltered)', false, true)} | ${formatCell(resilientMetrics.redundancyRate + '% (Reconciled)', true, false)} |`,
    `| Output Synthesis Quality Score      | ${formatCell(naiveMetrics.qualityScore + '/100 (Fragmented)', false, true)} | ${formatCell(resilientMetrics.qualityScore + '/100 (Coherent)', true, false)} |`,
    `| End-to-End Execution Latency        | ${formatCell(naiveMetrics.totalLatencyMs + ' ms (Bottlenecks)', false, true)} | ${formatCell(resilientMetrics.totalLatencyMs + ' ms (Optimized)', true, false)} |`,
    `| Throughput (Queries/sec)            | ${formatCell(naiveMetrics.throughputQps + ' QPS', false, true)} | ${formatCell(resilientMetrics.throughputQps + ' QPS', true, false)} |`,
    `| System Status                       | ${formatCell(naiveMetrics.status, false, true)} | ${formatCell(resilientMetrics.status, true, false)} |`
  ];

  return [line, header, line, ...rows, line].join('\n');
}
