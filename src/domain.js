/**
 * Domain Models and Simulated Test Corpus / Workload for Multi-Agent Research Synthesis.
 * This module defines the core data structures and test queries used across the system.
 */

/**
 * Represents a user research query submitted to the coordinator.
 */
export class QueryRequest {
  constructor(id, topic, urgency = 'normal') {
    this.id = id;
    this.topic = topic;
    this.urgency = urgency;
    this.timestamp = Date.now();
  }
}

/**
 * Represents a specialized finding returned by a subagent (Web Search or Doc Analysis).
 */
export class AgentFinding {
  constructor({ sourceAgent, queryId, rawData, confidence = 0.85, metadata = {} }) {
    this.sourceAgent = sourceAgent; // 'WebSearchAgent' or 'DocumentAnalysisAgent'
    this.queryId = queryId;
    this.rawData = rawData;         // Array of findings / snippets
    this.confidence = confidence;
    this.metadata = metadata;       // Execution time, retry count, etc.
    this.timestamp = Date.now();
  }
}

/**
 * Represents the final unified research report produced by the Synthesis Agent.
 */
export class SynthesisReport {
  constructor({ queryId, executiveSummary, reconciledFindings, redundancyRemovedCount, qualityScore, executionMetadata }) {
    this.queryId = queryId;
    this.executiveSummary = executiveSummary;
    this.reconciledFindings = reconciledFindings; // Clean, deduplicated array
    this.redundancyRemovedCount = redundancyRemovedCount;
    this.qualityScore = qualityScore; // 0 to 100
    this.executionMetadata = executionMetadata;
    this.generatedAt = new Date().toISOString();
  }
}

/**
 * Universal Result envelope used by subagents and coordinator (Duck-Typed Contract).
 */
export class Result {
  constructor({ success, data = null, error = null, status = 'SUCCESS', attemptLog = [], metrics = {} }) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.status = status; // 'SUCCESS', 'RECOVERED_LOCAL', 'PARTIAL_SUCCESS', 'FATAL_ESCALATION', 'FAILED'
    this.attemptLog = attemptLog;
    this.metrics = metrics;
  }

  static ok(data, status = 'SUCCESS', metrics = {}, attemptLog = []) {
    return new Result({ success: true, data, status, metrics, attemptLog });
  }

  static fail(error, status = 'FAILED', partialData = null, attemptLog = [], metrics = {}) {
    return new Result({ success: false, data: partialData, error, status, attemptLog, metrics });
  }
}

/**
 * Simulated Corpus of Test Queries and Mock Knowledge Base.
 */
export const SAMPLE_QUERIES = [
  new QueryRequest('Q-101', 'Next-Generation Solid-State Battery Electrolytes', 'high'),
  new QueryRequest('Q-102', 'Autonomous Medical Nanobots in Targeted Oncology', 'normal'),
  new QueryRequest('Q-103', 'Fault-Tolerant Quantum Error Correction Protocols', 'critical'),
  new QueryRequest('Q-104', 'Zero-Knowledge Proofs in Decentralized Identity Systems', 'normal')
];

/**
 * Simulated Knowledge Base containing noisy web snippets and internal documents.
 * Notice intentional redundancies and conflicting data points between Web and Doc analysis.
 */
export const KNOWLEDGE_BASE = {
  'Next-Generation Solid-State Battery Electrolytes': {
    webSearch: [
      { id: 'w1', title: 'Sulfide-based electrolytes reach 12 mS/cm conductivity', source: 'TechPulse Web', year: 2026, reliability: 0.88 },
      { id: 'w2', title: 'Lithium dendrite growth suppressed by polymer coating', source: 'OpenScience News', year: 2025, reliability: 0.75 },
      { id: 'w3', title: 'Sulfide-based electrolytes reach 12 mS/cm conductivity (Duplicate Report)', source: 'BatteryWorld Blog', year: 2026, reliability: 0.80 }
    ],
    docAnalysis: [
      { id: 'd1', title: 'Internal Lab Report: Sulfide electrolyte stability test confirmed at 12.4 mS/cm', source: 'Internal Vault DOC-882', year: 2026, reliability: 0.98 },
      { id: 'd2', title: 'Proprietary polymer-ceramic interface reduces interfacial resistance by 40%', source: 'Patent Draft #4401', year: 2026, reliability: 0.95 },
      { id: 'd3', title: 'Lithium dendrite suppression study (Legacy draft)', source: 'Internal Vault DOC-102', year: 2024, reliability: 0.70 }
    ]
  },
  'Autonomous Medical Nanobots in Targeted Oncology': {
    webSearch: [
      { id: 'w4', title: 'DNA origami nanorobots deliver thrombin to tumor vessels', source: 'BioTech Online', year: 2026, reliability: 0.90 },
      { id: 'w5', title: 'Magnetic steering enables 85% targeting precision in in-vivo models', source: 'MedTech Weekly', year: 2025, reliability: 0.82 }
    ],
    docAnalysis: [
      { id: 'd4', title: 'Clinical Trial Phase 1: DNA origami nanorobots 92% tumor vessel occlusion', source: 'Internal Oncology Rep #12', year: 2026, reliability: 0.99 },
      { id: 'd5', title: 'Magnetic steering precision analysis and biosafety protocols', source: 'Internal Vault DOC-909', year: 2026, reliability: 0.96 }
    ]
  },
  'Fault-Tolerant Quantum Error Correction Protocols': {
    webSearch: [
      { id: 'w6', title: 'Surface code logical qubit surpasses physical qubit lifetime by 10x', source: 'QuantumDaily', year: 2026, reliability: 0.91 },
      { id: 'w7', title: 'Low-density parity-check (LDPC) codes reduce qubit overhead by 80%', source: 'ArXiv Preprint', year: 2026, reliability: 0.85 }
    ],
    docAnalysis: [
      { id: 'd6', title: 'Architecture Review: LDPC implementation hardware constraints on superconducting chips', source: 'Internal Quantum Lab Q-01', year: 2026, reliability: 0.97 },
      { id: 'd7', title: 'Surface code error rate benchmarking: 10x lifetime gain confirmed', source: 'Internal Vault DOC-331', year: 2026, reliability: 0.99 }
    ]
  },
  'Zero-Knowledge Proofs in Decentralized Identity Systems': {
    webSearch: [
      { id: 'w8', title: 'zk-SNARK verification time drops below 5 milliseconds on mobile devices', source: 'CryptoTech Web', year: 2026, reliability: 0.89 }
    ],
    docAnalysis: [
      { id: 'd8', title: 'Enterprise Identity Architecture using recursive zk-STARKs without trusted setup', source: 'Internal Security Whitepaper #09', year: 2026, reliability: 0.98 }
    ]
  }
};
