/**
 * Simulated Infrastructure, Network Services, and Typed Error Seams.
 * This module defines distinct error classes so callers can programmatically branch on failure type.
 */

import { simulateLatency, randomChance } from './utils.js';
import { KNOWLEDGE_BASE } from './domain.js';

/**
 * Base Error class for system failures.
 */
export class SystemError extends Error {
  constructor(message, code, recoverable) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.recoverable = recoverable; // True for transient, False for fatal
    this.timestamp = Date.now();
  }
}

/**
 * TransientError represents recoverable failures (e.g., Network Timeouts, Rate Limits, 503 Unavailable).
 * Tagged with `recoverable: true`.
 */
export class TransientError extends SystemError {
  constructor(message = 'Temporary Network Timeout or Rate Limit Exceeded', code = 'ERR_TRANSIENT_TIMEOUT') {
    super(message, code, true);
  }
}

/**
 * FatalError represents unresolvable failures (e.g., Dependency Down, Corrupt Index, Unauthorized).
 * Tagged with `recoverable: false`.
 */
export class FatalError extends SystemError {
  constructor(message = 'Unresolvable Fatal Error: External Dependency Down or Corrupt Index', code = 'ERR_FATAL_UNRESOLVABLE') {
    super(message, code, false);
  }
}

/**
 * Simulated Web Search API Service.
 */
export class MockWebSearchService {
  constructor(failureRate = 0.3) {
    this.failureRate = failureRate;
    this.callCount = 0;
  }

  /**
   * Performs simulated web search for a given topic.
   * @param {string} topic 
   * @param {Object} options - { simulateTransientError: boolean, simulateFatalError: boolean }
   * @returns {Promise<Array>}
   */
  async search(topic, options = {}) {
    this.callCount++;
    await simulateLatency(40, 15);

    if (options.simulateFatalError) {
      throw new FatalError(`Web Search API Gateway Revoked Token for topic: "${topic}"`, 'ERR_WEB_AUTH_REVOKED');
    }

    if (options.simulateTransientError || randomChance(this.failureRate)) {
      throw new TransientError(`Web Search Rate Limit Exceeded (HTTP 429) on attempt #${this.callCount}`, 'ERR_WEB_RATE_LIMIT');
    }

    const data = KNOWLEDGE_BASE[topic]?.webSearch || [
      { id: 'w-default', title: `General Web finding regarding ${topic}`, source: 'Global Web Index', year: 2026, reliability: 0.70 }
    ];

    return JSON.parse(JSON.stringify(data)); // Return clean copy
  }
}

/**
 * Simulated Document Analysis Repository Service.
 */
export class MockDocumentRepository {
  constructor(failureRate = 0.25) {
    this.failureRate = failureRate;
    this.callCount = 0;
  }

  /**
   * Scans internal vault documents for a given topic.
   * @param {string} topic 
   * @param {Object} options 
   * @returns {Promise<Array>}
   */
  async scanDocuments(topic, options = {}) {
    this.callCount++;
    await simulateLatency(50, 20);

    if (options.simulateFatalError) {
      throw new FatalError(`Document Repository Index Corrupted for topic: "${topic}"`, 'ERR_DOC_INDEX_CORRUPT');
    }

    if (options.simulateTransientError || randomChance(this.failureRate)) {
      throw new TransientError(`Document Vault Connection Timeout (504 Gateway Timeout)`, 'ERR_DOC_TIMEOUT');
    }

    const data = KNOWLEDGE_BASE[topic]?.docAnalysis || [
      { id: 'd-default', title: `Internal Vault summary on ${topic}`, source: 'Internal Archive DOC-000', year: 2025, reliability: 0.85 }
    ];

    return JSON.parse(JSON.stringify(data));
  }
}

/**
 * Simulated Synthesis LLM Engine.
 * Reconciles, combines, and merges disparate datasets into a coherent, non-redundant output.
 */
export class MockSynthesisLLM {
  /**
   * Synthesizes findings from multiple subagents into a coherent report.
   * @param {Array} findingsArray - Array of AgentFinding objects
   * @returns {Promise<Object>}
   */
  async synthesize(findingsArray) {
    await simulateLatency(60, 20);

    const allItems = [];
    findingsArray.forEach(f => {
      if (f && Array.isArray(f.rawData)) {
        allItems.push(...f.rawData);
      }
    });

    // Reconcile and Deduplicate based on title similarity or exact match
    const seenTitles = new Set();
    const reconciled = [];
    let duplicatesRemoved = 0;

    allItems.forEach(item => {
      const normalizedTitle = item.title.toLowerCase().replace(/ \(.+\)/g, '').trim();
      if (seenTitles.has(normalizedTitle)) {
        duplicatesRemoved++;
      } else {
        seenTitles.add(normalizedTitle);
        reconciled.push({
          ...item,
          reconciledScore: Math.min(0.99, (item.reliability || 0.8) + 0.05)
        });
      }
    });

    // Sort by reliability descending
    reconciled.sort((a, b) => b.reconciledScore - a.reconciledScore);

    const topic = findingsArray[0]?.metadata?.topic || 'Research Synthesis';
    const executiveSummary = `Unified Synthesis Report for "${topic}": Successfully reconciled ${allItems.length} raw findings from ${findingsArray.length} specialized subagent streams. Eliminated ${duplicatesRemoved} redundant reports and resolved conflicting data timestamps to establish high-confidence technical consensus.`;

    const qualityScore = Math.min(100, Math.round(75 + (reconciled.length * 5) + (duplicatesRemoved * 3)));

    return {
      executiveSummary,
      reconciledFindings: reconciled,
      redundancyRemovedCount: duplicatesRemoved,
      qualityScore
    };
  }
}
