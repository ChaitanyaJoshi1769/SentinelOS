/**
 * Memory System for Autonomous Agents
 * Implements episodic, semantic, and procedural memory for learning and optimization
 */

import pino from 'pino';

const logger = pino();

/**
 * Episodic memory - specific incidents and experiences
 */
export interface EpisodicMemory {
  memory_id: string;
  incident_id: string;
  timestamp: number;
  alert_type: string;
  tactics: string[];
  detection_method: string;
  investigation_duration_ms: number;
  confidence: number;
  outcome: 'true_positive' | 'false_positive' | 'inconclusive';
  findings: string[];
  techniques_used: string[];
  effectiveness_score: number;
  lessons_learned: string[];
}

/**
 * Semantic memory - patterns and knowledge extracted from experiences
 */
export interface SemanticMemory {
  memory_id: string;
  pattern_id: string;
  pattern_name: string;
  description: string;
  indicators: string[];
  tactics: string[];
  attack_techniques: string[];
  typical_duration_minutes: number;
  detection_methods: string[];
  confidence: number;
  frequency_observed: number;
  associated_threat_actors: string[];
  remediation_steps: string[];
  created_at: number;
  updated_at: number;
}

/**
 * Procedural memory - operational procedures and playbooks
 */
export interface ProceduralMemory {
  procedure_id: string;
  name: string;
  description: string;
  trigger_patterns: string[];
  steps: ProcedureStep[];
  required_tools: string[];
  estimated_duration_minutes: number;
  success_rate: number;
  times_executed: number;
  last_executed: number;
  approval_required: boolean;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
}

export interface ProcedureStep {
  step_number: number;
  action: string;
  description: string;
  expected_outcome: string;
  rollback_action?: string;
  required_approval: boolean;
}

/**
 * Threat pattern - learned attack patterns
 */
export interface ThreatPattern {
  pattern_id: string;
  name: string;
  tactics: string[];
  techniques: string[];
  indicators: string[];
  detection_confidence: number;
  false_positive_rate: number;
  typical_ttk_minutes: number;
  associated_actors: string[];
  remediation_complexity: string;
}

/**
 * Memory Store - Central repository for all memory types
 */
export class MemoryStore {
  private episodic_memories: Map<string, EpisodicMemory> = new Map();
  private semantic_memories: Map<string, SemanticMemory> = new Map();
  private procedural_memories: Map<string, ProceduralMemory> = new Map();
  private threat_patterns: Map<string, ThreatPattern> = new Map();
  private access_count: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultPatterns();
    logger.info('Memory store initialized');
  }

  /**
   * Store episodic memory from investigation
   */
  storeEpisodicMemory(memory: EpisodicMemory): void {
    this.episodic_memories.set(memory.memory_id, memory);
    this.access_count.set(memory.memory_id, 0);

    // Extract semantic patterns from episodic memory
    this.extractSemanticPatterns(memory);

    logger.info(
      {
        incident_id: memory.incident_id,
        outcome: memory.outcome,
        confidence: memory.confidence,
      },
      'Episodic memory stored'
    );
  }

  /**
   * Store semantic memory (learned patterns)
   */
  storeSemanticMemory(memory: SemanticMemory): void {
    this.semantic_memories.set(memory.memory_id, memory);
    this.access_count.set(memory.memory_id, 0);

    logger.info(
      { pattern_name: memory.pattern_name, confidence: memory.confidence },
      'Semantic memory stored'
    );
  }

  /**
   * Store procedural memory (playbooks/procedures)
   */
  storeProceduralMemory(memory: ProceduralMemory): void {
    this.procedural_memories.set(memory.procedure_id, memory);
    this.access_count.set(memory.procedure_id, 0);

    logger.info(
      { procedure_name: memory.name, success_rate: memory.success_rate },
      'Procedural memory stored'
    );
  }

  /**
   * Retrieve relevant episodic memories for a pattern
   */
  retrieveEpisodicMemories(
    alert_type: string,
    tactics: string[],
    limit: number = 10
  ): EpisodicMemory[] {
    const relevant: EpisodicMemory[] = [];

    for (const memory of this.episodic_memories.values()) {
      if (memory.alert_type === alert_type) {
        const matchingTactics = tactics.filter((t) => memory.tactics.includes(t));
        if (matchingTactics.length > 0) {
          relevant.push(memory);
        }
      }
    }

    // Sort by confidence and recency
    relevant.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;
      return b.timestamp - a.timestamp;
    });

    return relevant.slice(0, limit);
  }

  /**
   * Retrieve relevant semantic patterns
   */
  retrieveSemanticPatterns(
    tactics: string[],
    limit: number = 5
  ): SemanticMemory[] {
    const relevant: SemanticMemory[] = [];

    for (const memory of this.semantic_memories.values()) {
      const matchingTactics = tactics.filter((t) => memory.tactics.includes(t));
      if (matchingTactics.length > 0) {
        relevant.push(memory);
      }
    }

    relevant.sort((a, b) => b.confidence - a.confidence);
    return relevant.slice(0, limit);
  }

  /**
   * Retrieve applicable procedures
   */
  retrieveProcedures(alert_type: string, limit: number = 3): ProceduralMemory[] {
    const applicable: ProceduralMemory[] = [];

    for (const proc of this.procedural_memories.values()) {
      if (proc.trigger_patterns.some((p) => alert_type.includes(p))) {
        applicable.push(proc);
      }
    }

    // Sort by success rate
    applicable.sort((a, b) => b.success_rate - a.success_rate);
    return applicable.slice(0, limit);
  }

  /**
   * Recommend investigation approach based on memory
   */
  recommendApproach(
    alert_type: string,
    tactics: string[],
    entities: string[]
  ): {
    procedures: ProceduralMemory[];
    similar_incidents: EpisodicMemory[];
    threat_patterns: ThreatPattern[];
    estimated_duration_minutes: number;
  } {
    const procedures = this.retrieveProcedures(alert_type, 3);
    const similarIncidents = this.retrieveEpisodicMemories(alert_type, tactics, 5);
    const applicablePatterns = this.retrieveSemanticPatterns(tactics, 3);

    // Convert to threat patterns
    const patterns: ThreatPattern[] = applicablePatterns.map((sm) => ({
      pattern_id: sm.pattern_id,
      name: sm.pattern_name,
      tactics: sm.tactics,
      techniques: sm.attack_techniques,
      indicators: sm.indicators,
      detection_confidence: sm.confidence,
      false_positive_rate: 1 - sm.confidence,
      typical_ttk_minutes: sm.typical_duration_minutes,
      associated_actors: sm.associated_threat_actors,
      remediation_complexity: 'medium',
    }));

    // Estimate duration based on historical data
    const avgDuration =
      similarIncidents.length > 0
        ? similarIncidents.reduce((sum, inc) => sum + inc.investigation_duration_ms, 0) /
          similarIncidents.length /
          60000
        : 30;

    return {
      procedures,
      similar_incidents: similarIncidents,
      threat_patterns: patterns,
      estimated_duration_minutes: Math.ceil(avgDuration),
    };
  }

  /**
   * Extract and learn semantic patterns from episodic memory
   */
  private extractSemanticPatterns(episodic: EpisodicMemory): void {
    // High-confidence positive memories should be generalized into patterns
    if (episodic.outcome === 'true_positive' && episodic.confidence > 0.8) {
      const patternId = `pattern_${episodic.incident_id}`;

      // Check if similar pattern already exists
      const existing = Array.from(this.semantic_memories.values()).find(
        (sm) =>
          sm.tactics.every((t) => episodic.tactics.includes(t)) &&
          sm.attack_techniques.every((at) => episodic.techniques_used.includes(at))
      );

      if (existing) {
        // Update existing pattern
        existing.frequency_observed++;
        existing.updated_at = Date.now();
        existing.confidence = Math.min(
          1,
          existing.confidence + (episodic.confidence * 0.1)
        );
      } else {
        // Create new pattern
        const newPattern: SemanticMemory = {
          memory_id: patternId,
          pattern_id: patternId,
          pattern_name: `${episodic.alert_type} Pattern`,
          description: `Attack pattern learned from incident ${episodic.incident_id}`,
          indicators: episodic.findings,
          tactics: episodic.tactics,
          attack_techniques: episodic.techniques_used,
          typical_duration_minutes: Math.ceil(episodic.investigation_duration_ms / 60000),
          detection_methods: [episodic.detection_method],
          confidence: episodic.confidence,
          frequency_observed: 1,
          associated_threat_actors: [],
          remediation_steps: episodic.lessons_learned,
          created_at: Date.now(),
          updated_at: Date.now(),
        };

        this.storeSemanticMemory(newPattern);
      }
    }
  }

  /**
   * Initialize default threat patterns
   */
  private initializeDefaultPatterns(): void {
    // Common attack patterns
    const commonPatterns: ThreatPattern[] = [
      {
        pattern_id: 'lateral_movement',
        name: 'Lateral Movement',
        tactics: ['T1570', 'T1021'],
        techniques: ['Remote Services', 'Lateral Tool Transfer'],
        indicators: ['PowerShell', 'RDP traffic', 'PsExec'],
        detection_confidence: 0.85,
        false_positive_rate: 0.05,
        typical_ttk_minutes: 30,
        associated_actors: ['APT28', 'APT29'],
        remediation_complexity: 'high',
      },
      {
        pattern_id: 'data_exfil',
        name: 'Data Exfiltration',
        tactics: ['T1041'],
        techniques: ['Exfiltration Over C2'],
        indicators: ['Large data transfers', 'Compression tools', 'Archive creation'],
        detection_confidence: 0.9,
        false_positive_rate: 0.02,
        typical_ttk_minutes: 60,
        associated_actors: ['APT1', 'APT28'],
        remediation_complexity: 'high',
      },
      {
        pattern_id: 'persistence',
        name: 'Persistence Mechanism',
        tactics: ['T1547', 'T1547.001'],
        techniques: ['Boot or Logon Autostart Execution', 'Registry Run Keys'],
        indicators: ['Registry modifications', 'Startup folder changes'],
        detection_confidence: 0.8,
        false_positive_rate: 0.1,
        typical_ttk_minutes: 15,
        associated_actors: ['APT28'],
        remediation_complexity: 'medium',
      },
    ];

    for (const pattern of commonPatterns) {
      this.threat_patterns.set(pattern.pattern_id, pattern);
    }
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      episodic_memories: this.episodic_memories.size,
      semantic_memories: this.semantic_memories.size,
      procedural_memories: this.procedural_memories.size,
      threat_patterns: this.threat_patterns.size,
      total_memories:
        this.episodic_memories.size +
        this.semantic_memories.size +
        this.procedural_memories.size,
    };
  }

  /**
   * Clear old memories (keep last N)
   */
  pruneMemories(keepCount: number = 1000): void {
    if (this.episodic_memories.size > keepCount) {
      // Remove least accessed memories
      const sorted = Array.from(this.episodic_memories.entries())
        .sort((a, b) => (this.access_count.get(a[0]) || 0) - (this.access_count.get(b[0]) || 0))
        .slice(keepCount);

      for (const [id] of sorted) {
        this.episodic_memories.delete(id);
        this.access_count.delete(id);
      }

      logger.info({ removed_count: sorted.length }, 'Pruned episodic memories');
    }
  }
}

export default MemoryStore;
