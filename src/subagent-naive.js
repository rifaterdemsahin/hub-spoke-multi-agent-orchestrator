/**
 * ❌ ANTI-PATTERN IMPLEMENTATION (Naive Subagents & Direct Concatenation)
 * 
 * Demonstrates common pitfalls:
 * 1. Lack of local error handling (no retry loops or fallback caches).
 * 2. Unhandled exception bubbling (errors crash the immediate execution thread or force coordinator intervention).
 * 3. Bypassing the Coordinator / Direct Concatenation (raw text is stitched together without specialized integration intelligence, resulting in redundancy and format clashes).
 */

import { Result, AgentFinding } from './domain.js';
import { MockWebSearchService, MockDocumentRepository } from './infrastructure.js';

export class NaiveWebSearchSubagent {
  constructor(service = new MockWebSearchService(0.4)) {
    this.name = 'NaiveWebSearchSubagent';
    this.service = service;
  }

  /**
   * Duck-typed process method.
   * In naive mode, errors are NOT caught locally. Any TransientError immediately causes a failure or bubbles up!
   */
  async process(queryRequest, options = {}) {
    const startTime = Date.now();
    try {
      // Direct call without local retry loop
      const rawData = await this.service.search(queryRequest.topic, options);
      
      const finding = new AgentFinding({
        sourceAgent: this.name,
        queryId: queryRequest.id,
        rawData,
        confidence: 0.70, // Lower confidence due to lack of validation
        metadata: {
          topic: queryRequest.topic,
          durationMs: Date.now() - startTime,
          retries: 0,
          errorHandledLocally: false
        }
      });

      return Result.ok(finding, 'SUCCESS', { durationMs: Date.now() - startTime }, ['Attempt 1: Success']);
    } catch (err) {
      // NAIVE PITFALL: No local retry or triaging. We bubble up the error or return raw failure requiring Coordinator Intervention!
      const attemptLog = [`Attempt 1 Failed: ${err.message} (${err.code})`];
      if (options.bubbleExceptions) {
        throw err; // Cascading unhandled exception!
      }
      return Result.fail(err, 'FAILED_NO_RECOVERY', null, attemptLog, { durationMs: Date.now() - startTime });
    }
  }
}

export class NaiveDocumentAnalysisSubagent {
  constructor(repo = new MockDocumentRepository(0.35)) {
    this.name = 'NaiveDocumentAnalysisSubagent';
    this.repo = repo;
  }

  async process(queryRequest, options = {}) {
    const startTime = Date.now();
    try {
      const rawData = await this.repo.scanDocuments(queryRequest.topic, options);

      const finding = new AgentFinding({
        sourceAgent: this.name,
        queryId: queryRequest.id,
        rawData,
        confidence: 0.75,
        metadata: {
          topic: queryRequest.topic,
          durationMs: Date.now() - startTime,
          retries: 0,
          errorHandledLocally: false
        }
      });

      return Result.ok(finding, 'SUCCESS', { durationMs: Date.now() - startTime }, ['Attempt 1: Success']);
    } catch (err) {
      const attemptLog = [`Attempt 1 Failed: ${err.message} (${err.code})`];
      if (options.bubbleExceptions) {
        throw err;
      }
      return Result.fail(err, 'FAILED_NO_RECOVERY', null, attemptLog, { durationMs: Date.now() - startTime });
    }
  }
}

/**
 * Naive Direct Concatenation / Integration Anti-Pattern.
 * Instead of routing through the Coordinator to the Synthesis Agent,
 * this function blindly concatenates raw text and items from both findings.
 */
export function naiveDirectConcatenation(webFinding, docFinding, queryRequest) {
  const webItems = (webFinding && webFinding.rawData) ? webFinding.rawData : [];
  const docItems = (docFinding && docFinding.rawData) ? docFinding.rawData : [];
  
  const combinedItems = [...webItems, ...docItems];
  
  // Calculate duplicates that were NOT removed
  const seenTitles = new Set();
  let duplicateCount = 0;
  combinedItems.forEach(item => {
    const norm = item.title.toLowerCase().trim();
    if (seenTitles.has(norm)) duplicateCount++;
    else seenTitles.add(norm);
  });

  const rawTextDump = combinedItems.map(i => `[${i.source}] ${i.title} (${i.year})`).join(' || ');
  
  // Low quality score due to unhandled duplicates, noisy formatting, and lack of synthesis intelligence
  const qualityScore = Math.max(20, Math.round(45 - (duplicateCount * 10)));

  return {
    queryId: queryRequest.id,
    executiveSummary: `NAIVE RAW CONCATENATION for "${queryRequest.topic}": Combined ${combinedItems.length} items without reconciliation. WARNING: Contains ${duplicateCount} unhandled duplicate entries and conflicting timestamps. Bypassed specialized synthesis agent.`,
    reconciledFindings: combinedItems, // Unfiltered with duplicates!
    redundancyRemovedCount: 0,
    qualityScore,
    rawTextDump,
    isNaive: true
  };
}
