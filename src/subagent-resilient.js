/**
 * ✅ THE ANSWER: RESILIENT IMPLEMENTATION (Hub-and-Spoke & Specialized Synthesis)
 * 
 * Demonstrates best practices:
 * 1. Local Error Recovery & Bounded Retries: Catches TransientErrors locally and retries with backoff/fallback.
 * 2. Structured Escalation Contract: Never throws raw bubbling exceptions. When unresolvable FatalErrors occur,
 *    returns a structured Result envelope (status, partialResults, attemptLog, errorContext).
 * 3. Specialized Synthesis Agent: Reconciles, combines, and merges disparate data sets into a coherent, non-redundant output.
 */

import { Result, AgentFinding, SynthesisReport, KNOWLEDGE_BASE } from './domain.js';
import { MockWebSearchService, MockDocumentRepository, MockSynthesisLLM, SystemError } from './infrastructure.js';
import { sleep, simulateLatency } from './utils.js';

export class ResilientWebSearchSubagent {
  constructor(service = new MockWebSearchService(0.4), maxRetries = 2) {
    this.name = 'ResilientWebSearchSubagent';
    this.service = service;
    this.maxRetries = maxRetries;
    this.fallbackCache = new Map();
  }

  /**
   * Duck-typed process method with local retry loop and fallback degradation.
   */
  async process(queryRequest, options = {}) {
    const startTime = Date.now();
    const attemptLog = [];
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        // On retries (attempt > 1), simulate that the temporary rate limit or network hiccup has resolved
        const callOptions = attempt > 1 ? { ...options, simulateTransientError: false } : options;
        const rawData = await this.service.search(queryRequest.topic, callOptions);
        attemptLog.push(`Attempt ${attempt}: Success (Fetched ${rawData.length} web items)`);

        // Update fallback cache for graceful degradation
        this.fallbackCache.set(queryRequest.topic, rawData);

        const finding = new AgentFinding({
          sourceAgent: this.name,
          queryId: queryRequest.id,
          rawData,
          confidence: attempt === 1 ? 0.95 : 0.88, // Slightly lower confidence if retried
          metadata: {
            topic: queryRequest.topic,
            durationMs: Date.now() - startTime,
            retries: attempt - 1,
            errorHandledLocally: attempt > 1
          }
        });

        const status = attempt > 1 ? 'RECOVERED_LOCAL' : 'SUCCESS';
        return Result.ok(finding, status, { durationMs: Date.now() - startTime, retries: attempt - 1 }, attemptLog);
      } catch (err) {
        lastError = err;
        const isRecoverable = err.recoverable !== false;
        attemptLog.push(`Attempt ${attempt} Failed [${err.code}]: ${err.message}`);

        if (!isRecoverable) {
          // STRUCTURED ESCALATION: Do NOT throw raw exception! Return structured FATAL_ESCALATION
          attemptLog.push(`Escalating unresolvable FatalError without bubbling crash.`);
          const partialData = this.fallbackCache.get(queryRequest.topic) || KNOWLEDGE_BASE[queryRequest.topic]?.webSearch || null;
          return Result.fail(err, 'FATAL_ESCALATION', partialData, attemptLog, {
            durationMs: Date.now() - startTime,
            retries: attempt - 1,
            errorContext: { code: err.code, recoverable: false }
          });
        }

        if (attempt <= this.maxRetries) {
          attemptLog.push(`Local retry triggered. Waiting exponential backoff (${Math.pow(2, attempt) * 20}ms)...`);
          await sleep(Math.pow(2, attempt) * 20); // Bounded backoff
        }
      }
    }

    // If we exhausted retries, check if we can degrade gracefully from fallback cache or offline knowledge base
    const cachedData = this.fallbackCache.get(queryRequest.topic) || KNOWLEDGE_BASE[queryRequest.topic]?.webSearch;
    if (cachedData) {
      attemptLog.push(`All retries exhausted. Gracefully degrading to fallback cache.`);
      const finding = new AgentFinding({
        sourceAgent: this.name,
        queryId: queryRequest.id,
        rawData: cachedData,
        confidence: 0.70, // Degraded confidence
        metadata: {
          topic: queryRequest.topic,
          durationMs: Date.now() - startTime,
          retries: this.maxRetries,
          errorHandledLocally: true,
          degraded: true
        }
      });
      return Result.ok(finding, 'RECOVERED_LOCAL', { durationMs: Date.now() - startTime, retries: this.maxRetries, degraded: true }, attemptLog);
    }

    return Result.fail(lastError, 'FAILED', null, attemptLog, { durationMs: Date.now() - startTime, retries: this.maxRetries });
  }
}

export class ResilientDocumentAnalysisSubagent {
  constructor(repo = new MockDocumentRepository(0.35), maxRetries = 2) {
    this.name = 'ResilientDocumentAnalysisSubagent';
    this.repo = repo;
    this.maxRetries = maxRetries;
    this.fallbackCache = new Map();
  }

  async process(queryRequest, options = {}) {
    const startTime = Date.now();
    const attemptLog = [];
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        const callOptions = attempt > 1 ? { ...options, simulateTransientError: false } : options;
        const rawData = await this.repo.scanDocuments(queryRequest.topic, callOptions);
        attemptLog.push(`Attempt ${attempt}: Success (Scanned ${rawData.length} internal docs)`);

        this.fallbackCache.set(queryRequest.topic, rawData);

        const finding = new AgentFinding({
          sourceAgent: this.name,
          queryId: queryRequest.id,
          rawData,
          confidence: attempt === 1 ? 0.98 : 0.92,
          metadata: {
            topic: queryRequest.topic,
            durationMs: Date.now() - startTime,
            retries: attempt - 1,
            errorHandledLocally: attempt > 1
          }
        });

        const status = attempt > 1 ? 'RECOVERED_LOCAL' : 'SUCCESS';
        return Result.ok(finding, status, { durationMs: Date.now() - startTime, retries: attempt - 1 }, attemptLog);
      } catch (err) {
        lastError = err;
        const isRecoverable = err.recoverable !== false;
        attemptLog.push(`Attempt ${attempt} Failed [${err.code}]: ${err.message}`);

        if (!isRecoverable) {
          attemptLog.push(`Escalating unresolvable FatalError without bubbling crash.`);
          const partialData = this.fallbackCache.get(queryRequest.topic) || KNOWLEDGE_BASE[queryRequest.topic]?.docAnalysis || null;
          return Result.fail(err, 'FATAL_ESCALATION', partialData, attemptLog, {
            durationMs: Date.now() - startTime,
            retries: attempt - 1,
            errorContext: { code: err.code, recoverable: false }
          });
        }

        if (attempt <= this.maxRetries) {
          attemptLog.push(`Local retry triggered. Waiting exponential backoff (${Math.pow(2, attempt) * 20}ms)...`);
          await sleep(Math.pow(2, attempt) * 20);
        }
      }
    }

    const cachedData = this.fallbackCache.get(queryRequest.topic) || KNOWLEDGE_BASE[queryRequest.topic]?.docAnalysis;
    if (cachedData) {
      attemptLog.push(`All retries exhausted. Gracefully degrading to fallback cache.`);
      const finding = new AgentFinding({
        sourceAgent: this.name,
        queryId: queryRequest.id,
        rawData: cachedData,
        confidence: 0.75,
        metadata: {
          topic: queryRequest.topic,
          durationMs: Date.now() - startTime,
          retries: this.maxRetries,
          errorHandledLocally: true,
          degraded: true
        }
      });
      return Result.ok(finding, 'RECOVERED_LOCAL', { durationMs: Date.now() - startTime, retries: this.maxRetries, degraded: true }, attemptLog);
    }

    return Result.fail(lastError, 'FAILED', null, attemptLog, { durationMs: Date.now() - startTime, retries: this.maxRetries });
  }
}

/**
 * Specialized Synthesis Agent.
 * Receives findings routed through the Coordinator and reconciles, combines,
 * and merges disparate data sets into a coherent, non-redundant output.
 */
export class SynthesisSubagent {
  constructor(llmEngine = new MockSynthesisLLM()) {
    this.name = 'SynthesisSubagent';
    this.llmEngine = llmEngine;
  }

  /**
   * Duck-typed process method for synthesizing multiple agent findings.
   * @param {Object} input - { queryRequest, findings: [AgentFinding, ...] }
   */
  async process({ queryRequest, findings }) {
    const startTime = Date.now();
    const attemptLog = ['Initiating specialized synthesis integration intelligence...'];

    try {
      // Filter out any invalid or missing findings, but extract rawData or fallback items if needed
      const validFindings = findings.filter(f => f && (f.data || f.error));
      if (validFindings.length === 0) {
        throw new Error('No valid agent findings provided for synthesis.');
      }

      const findingDataArray = validFindings.map(f => {
        if (f.data) return f.data;
        // If structured failure with partial results, use partial results
        if (f.error && f.data) return f.data;
        return { rawData: [] };
      });

      const synthesisResult = await this.llmEngine.synthesize(findingDataArray);

      attemptLog.push(`Successfully reconciled ${findingDataArray.length} subagent streams.`);
      attemptLog.push(`Eliminated ${synthesisResult.redundancyRemovedCount} duplicate entries.`);
      attemptLog.push(`Synthesis quality score achieved: ${synthesisResult.qualityScore}/100.`);

      const report = new SynthesisReport({
        queryId: queryRequest.id,
        executiveSummary: synthesisResult.executiveSummary,
        reconciledFindings: synthesisResult.reconciledFindings,
        redundancyRemovedCount: synthesisResult.redundancyRemovedCount,
        qualityScore: synthesisResult.qualityScore,
        executionMetadata: {
          durationMs: Date.now() - startTime,
          sourceCount: findingDataArray.length
        }
      });

      return Result.ok(report, 'SUCCESS', { durationMs: Date.now() - startTime }, attemptLog);
    } catch (err) {
      attemptLog.push(`Synthesis Error: ${err.message}`);
      return Result.fail(err, 'FAILED_SYNTHESIS', null, attemptLog, { durationMs: Date.now() - startTime });
    }
  }
}
