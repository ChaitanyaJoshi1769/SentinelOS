# SentinelOS Architecture

## System Overview

SentinelOS is a production-grade autonomous AI-native cybersecurity operations platform designed to ingest massive volumes of security telemetry, autonomously investigate alerts, and orchestrate intelligent remediation.

```
┌─────────────────────────────────────────────────────────────┐
│                  Security Telemetry Sources                 │
│  CrowdStrike │ Splunk │ Defender │ Okta │ AWS │ GCP │ etc  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   Telemetry Ingestion   │
        │  - Normalization        │
        │  - Validation           │
        │  - Enrichment           │
        │  - Deduplication        │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────────┐
        │   Stream Processing Layer   │
        │  - Kafka / NATS            │
        │  - Real-time Correlation   │
        │  - Initial Filtering       │
        └────────────┬────────────────┘
                     │
        ┌────────────▼──────────────────┐
        │   Data Layer                  │
        │  ┌──────────────────────────┐ │
        │  │ ClickHouse: Telemetry    │ │
        │  │ PostgreSQL: Operations   │ │
        │  │ Neo4j: Threat Graph      │ │
        │  │ Qdrant: Embeddings       │ │
        │  │ Redis: Cache             │ │
        │  └──────────────────────────┘ │
        └────────────┬──────────────────┘
                     │
        ┌────────────▼─────────────────────┐
        │   Autonomous Investigation       │
        │   Engine (AI Orchestration)      │
        │  - Alert Triage Agent           │
        │  - Investigation Agent          │
        │  - Graph Analyzer Agent         │
        │  - Threat Intelligence Agent    │
        │  - Remediation Planner Agent    │
        └────────────┬─────────────────────┘
                     │
        ┌────────────▼──────────────────┐
        │  Detection & Correlation      │
        │  - Sigma Rules               │
        │  - YARA Patterns             │
        │  - AI Anomaly Detection      │
        │  - Behavioral Analysis       │
        │  - Graph Correlation         │
        └────────────┬──────────────────┘
                     │
        ┌────────────▼──────────────────┐
        │  Remediation Orchestration    │
        │  - Action Planning            │
        │  - Approval Workflow          │
        │  - Multi-tool Execution       │
        │  - Rollback Support           │
        └────────────┬──────────────────┘
                     │
        ┌────────────▼──────────────────┐
        │   Frontend SOC Dashboard      │
        │  - Real-time Threat Graph    │
        │  - Investigation Timeline    │
        │  - AI Agent Control Center   │
        │  - Remediation Workspace     │
        │  - Executive Analytics       │
        └──────────────────────────────┘
```

## Core Modules

### 1. Telemetry Ingestion Layer

**Purpose:** Ingest, normalize, and enrich security telemetry from 50+ sources

**Components:**
- **Normalizers:** Convert vendor-specific formats to unified schema
  - CrowdStrike EDR events
  - Splunk/Elastic logs
  - Microsoft Defender alerts
  - Cloud logging (CloudTrail, GCP Logs, Azure)
  - Identity systems (Okta, AD)

- **Processors:** Validation, deduplication, field extraction

- **Enrichers:** Threat intelligence, asset context, risk scoring

- **Storage:** ClickHouse (time-series), PostgreSQL (relational)

**Performance Targets:**
- 1M+ events per second ingestion
- Sub-100ms processing latency
- Petabyte-scale retention with hot/cold tiering

### 2. Stream Processing & Real-time Correlation

**Purpose:** Enable real-time alert correlation and initial threat assessment

**Components:**
- Kafka/NATS message brokers
- Stream processing rules engine
- Event correlation window (5-60 second windows)
- Initial severity assessment

**Capabilities:**
- Alert deduplication across sources
- Cross-source event correlation
- Initial false positive suppression
- Real-time metric aggregation

### 3. Data Layer

**Databases:**
- **ClickHouse:** Time-series telemetry (petabyte scale)
  - Automatic data tiering (hot/warm/cold)
  - Column-oriented compression
  - Real-time aggregation

- **PostgreSQL:** Operational data
  - Investigations
  - Alerts
  - Remediation actions
  - User configurations

- **Neo4j:** Threat Intelligence Graph
  - Entity relationships
  - Attack paths
  - Privilege escalation chains
  - Blast radius calculation

- **Qdrant:** Vector embeddings
  - Semantic search for similar incidents
  - Threat pattern clustering
  - Behavioral grouping

- **Redis:** Caching layer
  - Session state
  - Deduplication checksums
  - Investigation context

### 4. Autonomous Investigation Engine

**Purpose:** Autonomous AI-driven investigation of security alerts

**Architecture:**
- **Coordinator Agent:** Manages investigation flow, delegates tasks
- **Specialist Agents:**
  - **Triage Agent:** Initial alert assessment and risk scoring
  - **Investigation Agent:** Gathers evidence, builds case
  - **Graph Analyzer:** Analyzes attack paths, lateral movement
  - **Threat Intelligence Agent:** Correlates with known threats
  - **Remediation Planner:** Plans remediation actions

**Capabilities:**
- Autonomous multi-stage investigation
- Evidence gathering and timeline reconstruction
- Attack chain analysis
- Threat actor attribution (when applicable)
- Confidence scoring for findings
- Explainable reasoning traces

**Tools Available:**
- Graph queries (Neo4j)
- Telemetry search (ClickHouse)
- Threat intelligence APIs
- Behavioral analysis engines
- Risk assessment models

### 5. Detection & Correlation Engine

**Purpose:** Generate alerts and correlate events into incidents

**Detection Methods:**
1. **Sigma Rules:** Open standard detection rules
2. **YARA Patterns:** File and memory-based signatures
3. **Threshold Rules:** Statistical anomalies
4. **AI Models:** ML-based anomaly detection
5. **Behavioral Analysis:** Entity baseline deviation
6. **Graph Correlation:** Attack path detection

**Alert Generation:**
- Confidence scoring
- False positive filtering
- Attack framework mapping (MITRE ATT&CK)
- Alert enrichment with context

### 6. Threat Intelligence Graph

**Purpose:** Dynamic knowledge graph for attack path and risk analysis

**Entities:**
- Endpoints, processes, files, registry keys
- Identities, groups, service accounts
- Cloud resources, permissions
- Vulnerabilities, indicators
- Threat actors, malware families

**Relationships:**
- Execution chains (process parent-child)
- File operations (create, modify, delete)
- Network connections
- Privilege grants
- Attack techniques

**Queries:**
- Shortest path analysis
- All paths enumeration
- Neighborhood traversal
- Pattern matching
- Temporal replay

**Applications:**
- Blast radius calculation
- Lateral movement simulation
- Privilege escalation modeling
- Root cause analysis

### 7. Remediation Orchestration

**Purpose:** Plan and execute intelligent, approval-gated remediation

**Workflow:**
1. **Planning:** AI generates remediation steps with confidence scores
2. **Approval:** Human review (thresholds configurable)
3. **Execution:** Coordinate across security tools
4. **Monitoring:** Track action status
5. **Rollback:** Safely reverse if needed

**Actions:**
- Isolate endpoint
- Disable/reset credentials
- Revoke sessions
- Block indicators
- Patch systems
- Rotate secrets

**Integrations:**
- CrowdStrike Falcon for isolation
- Identity systems for credential reset
- EDR platforms for process termination
- Firewall for blocking
- Patch management systems

### 8. Memory & Learning System

**Purpose:** Build organizational cyber memory and improve over time

**Memory Types:**
- **Episodic:** Specific incident records and decisions
- **Semantic:** Knowledge about threats, techniques, patterns
- **Procedural:** Investigation processes and workflows

**Applications:**
- Similar incident retrieval
- Analyst decision analysis
- False positive pattern learning
- Playbook optimization
- Risk model refinement

### 9. Frontend SOC Dashboard

**Purpose:** Provide SOC analysts with AI-augmented command center

**Views:**
- **Security Operations Dashboard:** Real-time threat overview
- **Investigation Center:** AI analysis and timeline
- **Threat Graph Explorer:** Interactive attack visualization
- **AI Agent Control:** Monitor autonomous agents
- **Remediation Workspace:** Coordinate response
- **Analytics:** KPIs and trend analysis
- **Executive Risk:** Board-level risk metrics

**Technologies:**
- Next.js 15 frontend
- Real-time WebSocket updates
- Graph visualization (React Flow, D3.js)
- Streaming investigation results
- Animation (Framer Motion)

## Data Flow Examples

### Alert Triage Flow

```
Raw Event (CrowdStrike)
    ↓
Normalize to unified schema
    ↓
Validate against schema
    ↓
Enrich with threat intel
    ↓
Store in ClickHouse
    ↓
Apply detection rules
    ↓
Generate Alert
    ↓
Triage Agent analyzes
    ↓
Risk score assigned
    ↓
Investigation initiated (if needed)
```

### Investigation Flow

```
Alert received
    ↓
Coordinator Agent assigned
    ↓
Specialist agents collaborate:
  - Triage Agent: Assess severity
  - Investigation Agent: Gather evidence
  - Graph Analyzer: Check attack paths
  - Threat Intel Agent: Find known IOCs
    ↓
Evidence compiled
    ↓
AI generates narrative and recommendations
    ↓
Remediation Planner suggests actions
    ↓
Human review (if needed)
    ↓
Actions executed with rollback capability
    ↓
Investigation closed
```

### Graph Correlation Flow

```
Multiple alerts on same entity
    ↓
Graph engine identifies relationships
    ↓
Attack chain reconstructed
    ↓
Blast radius calculated
    ↓
Lateral movement detected
    ↓
Privilege escalation path identified
    ↓
Unified incident created
    ↓
Automated investigation initiated
```

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         Kubernetes Cluster (K8s)            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   Frontend (Next.js)                 │  │
│  │   - API Gateway (nginx)              │  │
│  │   - Web servers (multiple replicas)  │  │
│  │   - WebSocket server for streaming   │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   Services                           │  │
│  │   - Telemetry Ingest (Rust/FastAPI) │  │
│  │   - Investigation Engine (FastAPI)  │  │
│  │   - Remediation Orchestrator (gRPC) │  │
│  │   - Detection Engine (Rust)         │  │
│  │   - Graph API (Rust)                │  │
│  │   - Memory System (FastAPI)         │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   Databases                          │  │
│  │   - ClickHouse cluster (3+ nodes)   │  │
│  │   - PostgreSQL (HA with replication) │  │
│  │   - Neo4j cluster (3+ nodes)        │  │
│  │   - Qdrant (vector DB)              │  │
│  │   - Redis cluster                   │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   Message Brokers                    │  │
│  │   - Kafka cluster (3+ brokers)      │  │
│  │   - NATS for microservice messaging │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

## Security & Compliance

- Zero-trust architecture
- Encrypted telemetry in transit/at rest
- Immutable audit logging
- RBAC/ABAC for access control
- SOC2 compliance
- FedRAMP-ready isolation
- Data residency options

## Performance Targets

- Telemetry ingestion: 1M+ events/sec
- Investigation latency: <30 seconds for triage
- Alert generation: <5 seconds from event
- Query response: <1 second for 95th percentile
- Graph traversal: <100ms for 5-hop paths
- Remediation execution: <10 seconds

## Scalability

- Horizontal scaling for all services
- Database sharding for ClickHouse
- Neo4j federation for graph scaling
- Load balancing for APIs
- Kafka partitioning for throughput
- Redis clustering for cache

## Cost Optimization

- Auto-scaling based on load
- Cold storage for old telemetry
- Compression (ClickHouse columnar)
- Query result caching
- Batch API processing
- Reserved capacity for baseline load

## Extensibility

- Plugin system for custom normalizers
- Custom detection rules (Sigma, YARA)
- Webhook integrations
- Custom enrichment functions
- Agent role extension
- Custom remediation actions

---

This architecture enables production deployment of an autonomous AI-native SOC operating system capable of handling enterprise-scale security operations.
