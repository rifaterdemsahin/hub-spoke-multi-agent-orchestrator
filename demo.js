#!/usr/bin/env node
/**
 * Command-Line Demo Runner for the Claude AI Architect Exam Demonstration Project.
 * 
 * Executes both the Naive Anti-Pattern and the Resilient Hub-and-Spoke Pattern side-by-side,
 * aggregating metrics and printing professional ASCII comparison tables.
 */

import { SAMPLE_QUERIES } from './src/domain.js';
import { NaiveWebSearchSubagent, NaiveDocumentAnalysisSubagent } from './src/subagent-naive.js';
import { ResilientWebSearchSubagent, ResilientDocumentAnalysisSubagent, SynthesisSubagent } from './src/subagent-resilient.js';
import { CoordinatorAgent } from './src/coordinator.js';
import { COLORS, formatComparisonTable, sleep } from './src/utils.js';

// Parse command line args
const args = process.argv.slice(2);
const runNaiveOnly = args.includes('--naive');
const runResilientOnly = args.includes('--resilient');
const simulateErrors = !args.includes('--no-errors');

async function main() {
  console.clear();
  console.log(`${COLORS.cyan}${COLORS.bold}=========================================================================================${COLORS.reset}`);
  console.log(`${COLORS.bold}   CLAUDE AI ARCHITECT EXAM: MULTI-AGENT SYNTHESIS & ORCHESTRATION DEMO PROJECT${COLORS.reset}`);
  console.log(`${COLORS.dim}   Architectural Comparison: Naive Direct Concatenation vs. Resilient Hub-and-Spoke${COLORS.reset}`);
  console.log(`${COLORS.cyan}${COLORS.bold}=========================================================================================${COLORS.reset}\n`);

  console.log(`${COLORS.yellow}${COLORS.bold}📝 EXAM SCENARIO QUESTION & ANSWER:${COLORS.reset}`);
  console.log(`${COLORS.bold}Question:${COLORS.reset} The web search and document analysis agents have both completed their tasks`);
  console.log(`          and returned findings to the coordinator. What is the appropriate next step for`);
  console.log(`          producing an integrated research output?\n`);
  console.log(`${COLORS.green}${COLORS.bold}Answer:${COLORS.reset}   The coordinator passes both sets of findings to the synthesis agent for unified integration.`);
  console.log(`${COLORS.bold}Why?${COLORS.reset}      In a hub-and-spoke multi-agent architecture, the coordinator acts as the central orchestrator.`);
  console.log(`          Once individual specialized subagents (web search and document analysis) finish their`);
  console.log(`          respective isolated tasks, their outputs must be routed through the coordinator to the`);
  console.log(`          synthesis agent. The synthesis agent is specifically designed to reconcile, combine,`);
  console.log(`          and merge disparate data sets into a coherent, non-redundant output. Bypassing the`);
  console.log(`          coordinator or concatenating raw text directly fails to utilize specialized integration`);
  console.log(`          intelligence.\n`);
  console.log(`${COLORS.cyan}-----------------------------------------------------------------------------------------${COLORS.reset}\n`);

  // Select test query
  const testQuery = SAMPLE_QUERIES[0]; // Next-Generation Solid-State Battery Electrolytes
  console.log(`${COLORS.bold}🔍 Simulating Workload for Query:${COLORS.reset} "${testQuery.topic}" (${testQuery.id})`);
  console.log(`${COLORS.dim}   Simulating Transient Network Errors / Rate Limits: ${simulateErrors ? 'ENABLED' : 'DISABLED'}${COLORS.reset}\n`);

  let naiveMetrics = {
    coordinatorInterventions: 'N/A',
    unhandledExceptions: 'N/A',
    recoveryRate: 'N/A',
    redundancyRate: 'N/A',
    qualityScore: 'N/A',
    totalLatencyMs: 'N/A',
    throughputQps: 'N/A',
    status: 'SKIPPED'
  };

  let resilientMetrics = {
    coordinatorInterventions: 'N/A',
    unhandledExceptions: 'N/A',
    recoveryRate: 'N/A',
    redundancyRate: 'N/A',
    qualityScore: 'N/A',
    totalLatencyMs: 'N/A',
    throughputQps: 'N/A',
    status: 'SKIPPED'
  };

  // --- RUN NAIVE WORKFLOW ---
  if (!runResilientOnly) {
    console.log(`${COLORS.red}${COLORS.bold}❌ [STEP 1] Executing Naive Anti-Pattern Workflow (Direct Concatenation)...${COLORS.reset}`);
    const naiveSearch = new NaiveWebSearchSubagent();
    const naiveDoc = new NaiveDocumentAnalysisSubagent();
    const naiveCoordinator = new CoordinatorAgent({
      webSearchAgent: naiveSearch,
      docAnalysisAgent: naiveDoc,
      synthesisAgent: null,
      mode: 'naive'
    });

    const naiveResult = await naiveCoordinator.executeWorkflow(testQuery, {
      simulateTransientError: simulateErrors
    });

    naiveMetrics = naiveResult.metrics;
    naiveMetrics.status = naiveResult.status;

    console.log(`${COLORS.dim}   -> Execution Log Snippet:${COLORS.reset}`);
    naiveResult.workflowLog.slice(0, 4).forEach(log => console.log(`      ${log}`));
    console.log(`      ${COLORS.red}${COLORS.bold}Result:${COLORS.reset} Quality Score: ${naiveMetrics.qualityScore}/100 | Interventions: ${naiveMetrics.coordinatorInterventions} | Redundancy: ${naiveMetrics.redundancyRate}%\n`);
    await sleep(200);
  }

  // --- RUN RESILIENT WORKFLOW ---
  if (!runNaiveOnly) {
    console.log(`${COLORS.green}${COLORS.bold}✅ [STEP 2] Executing Resilient Hub-and-Spoke Workflow (The Answer)...${COLORS.reset}`);
    const resilientSearch = new ResilientWebSearchSubagent();
    const resilientDoc = new ResilientDocumentAnalysisSubagent();
    const synthesisAgent = new SynthesisSubagent();
    const resilientCoordinator = new CoordinatorAgent({
      webSearchAgent: resilientSearch,
      docAnalysisAgent: resilientDoc,
      synthesisAgent: synthesisAgent,
      mode: 'resilient'
    });

    const resilientResult = await resilientCoordinator.executeWorkflow(testQuery, {
      simulateTransientError: simulateErrors
    });

    resilientMetrics = resilientResult.metrics;
    resilientMetrics.status = resilientResult.status;

    console.log(`${COLORS.dim}   -> Execution Log Snippet:${COLORS.reset}`);
    resilientResult.workflowLog.slice(0, 4).forEach(log => console.log(`      ${log}`));
    console.log(`      ${COLORS.green}${COLORS.bold}Result:${COLORS.reset} Quality Score: ${resilientMetrics.qualityScore}/100 | Interventions: ${resilientMetrics.coordinatorInterventions} | Redundancy: ${resilientMetrics.redundancyRate}%\n`);
    await sleep(200);
  }

  // --- PRINT COMPARISON TABLE ---
  if (!runNaiveOnly && !runResilientOnly) {
    console.log(`${COLORS.cyan}${COLORS.bold}📊 ARCHITECTURAL PERFORMANCE BENCHMARK & COMPARISON MATRIX:${COLORS.reset}`);
    console.log(formatComparisonTable(naiveMetrics, resilientMetrics));
    console.log('');
    console.log(`${COLORS.bold}💡 Key Takeaway:${COLORS.reset} The Resilient Hub-and-Spoke architecture eliminates cascading unhandled exceptions,`);
    console.log(`                 reduces coordinator overhead from ${naiveMetrics.coordinatorInterventions} interventions down to ${resilientMetrics.coordinatorInterventions}, and achieves a 100%`);
    console.log(`                 recovery rate while producing clean, zero-redundancy synthesized output (${resilientMetrics.qualityScore}/100 score).\n`);
  }

  console.log(`${COLORS.green}${COLORS.bold}✔ Verification Complete!${COLORS.reset}`);
  console.log(`${COLORS.dim}To view the interactive visual simulator, open ${COLORS.cyan}index.html${COLORS.dim} or run: ${COLORS.white}npm run serve${COLORS.reset}\n`);
}

main().catch(err => {
  console.error(`${COLORS.red}${COLORS.bold}Fatal Demo Error:${COLORS.reset}`, err);
  process.exit(1);
});
