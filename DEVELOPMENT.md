# SentinelOS Development Guide

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Docker & Docker Compose
- Python 3.11+
- Rust (for high-performance services)
- Git

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/ChaitanyaJoshi1769/SentinelOS.git
cd SentinelOS

# Install dependencies
npm install

# Start development databases
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Install Python dependencies for investigation engine
cd apps/investigation-engine
pip install -r requirements.txt
cd ../..
```

### Running Locally

**Terminal 1 - Frontend:**
```bash
cd apps/web
npm run dev
# Access at http://localhost:3000
```

**Terminal 2 - Investigation Engine:**
```bash
cd apps/investigation-engine
python app.py
# Access at http://localhost:8001
```

**Terminal 3 - Telemetry Ingest (when ready):**
```bash
cd apps/telemetry-ingest
npm run dev
```

### Database Access

- **PostgreSQL:** `postgresql://sentinelos:changeme@localhost:5432/sentinelos`
- **ClickHouse:** `http://localhost:8123`
- **Neo4j:** `bolt://localhost:7687` (user: neo4j, pass: changeme)
- **Qdrant:** `http://localhost:6333`
- **Redis:** `redis://localhost:6379`

## Project Structure

```
sentinelos/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── investigation-engine/   # FastAPI investigations
│   ├── telemetry-ingest/       # Telemetry processing
│   ├── remediation-orchestrator/ (Phase 2)
│   └── soc-runtime/            (Phase 2)
├── packages/
│   ├── shared/                 # Shared types and errors
│   ├── threat-graph/           # Graph database layer
│   ├── agent-core/             (Phase 2)
│   ├── detection-engine/       (Phase 2)
│   ├── memory-system/          (Phase 2)
│   ├── security-runtime/       (Phase 2)
│   └── ui/                     # Shared React components
├── infrastructure/
│   ├── terraform/              # IaC for cloud deployment
│   ├── k8s/                    # Kubernetes manifests
│   └── docker/                 # Docker configurations
└── docs/                       # Documentation
```

## Development Workflow

### Code Organization

1. **Shared Types First**: Define types in `packages/shared`
2. **Database Layers**: Create database abstractions in packages
3. **Service Implementation**: Implement services in apps
4. **UI Components**: Build components in packages/ui
5. **Pages**: Create pages using components

### Type Safety

All TypeScript code uses strict mode. No `any` types without explicit justification.

```bash
# Type check all packages
npm run type-check
```

### Linting

```bash
# Run linter across all packages
npm run lint

# Format code
npm run format
```

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# With coverage
npm run test -- --coverage
```

## Building for Production

```bash
# Build all packages and apps
npm run build

# This generates:
# - apps/web/.next
# - apps/investigation-engine/dist
# - packages/*/dist
```

## Phase 2 Implementation: Autonomous Investigations

### Architecture

The investigation engine needs to be enhanced with:

1. **LangGraph Integration**: Multi-agent orchestration
2. **Claude API Integration**: Autonomous reasoning agents
3. **Advanced Graph Queries**: Complex attack path analysis
4. **Memory System**: Episodic, semantic, procedural memory
5. **Remediation Planning**: AI-generated action sequences

### Key Components to Build

#### 1. Agent Core (`packages/agent-core`)

```
src/
├── agents/
│   ├── base-agent.ts        # Base agent class
│   ├── triage-agent.ts
│   ├── investigation-agent.ts
│   ├── graph-analyzer-agent.ts
│   ├── threat-intel-agent.ts
│   └── remediation-planner-agent.ts
├── orchestration/
│   ├── coordinator.ts       # Multi-agent coordinator
│   ├── state-machine.ts
│   └── workflow-executor.ts
├── tools/
│   ├── graph-tools.ts       # Neo4j query tools
│   ├── telemetry-tools.ts   # ClickHouse query tools
│   ├── intel-tools.ts       # Threat intelligence lookups
│   └── risk-scoring.ts      # Risk assessment tools
└── prompts/
    ├── system-prompts.ts
    └── examples.ts
```

#### 2. Detection Engine (`packages/detection-engine`)

```
src/
├── rules/
│   ├── sigma-engine.ts
│   ├── yara-engine.ts
│   └── rule-loader.ts
├── detection/
│   ├── anomaly-detector.ts
│   ├── behavioral-analyzer.ts
│   └── threshold-detector.ts
├── correlation/
│   ├── alert-correlator.ts
│   └── event-grouper.ts
└── alert-generator.ts
```

#### 3. Memory System (`packages/memory-system`)

```
src/
├── types/
│   ├── episodic-memory.ts
│   ├── semantic-memory.ts
│   └── procedural-memory.ts
├── storage/
│   ├── postgres-store.ts
│   ├── vector-store.ts     # Qdrant integration
│   └── cache-layer.ts
├── retrieval/
│   ├── semantic-search.ts
│   └── similarity-matching.ts
└── learning/
    ├── pattern-learner.ts
    └── optimizer.ts
```

#### 4. Security Runtime (`packages/security-runtime`)

```
src/
├── sandbox/
│   ├── execution-sandbox.ts
│   ├── resource-limits.ts
│   └── isolation.ts
├── audit/
│   ├── action-audit.ts
│   └── access-control.ts
└── policies/
    ├── policy-engine.ts
    └── enforcement.ts
```

### Implementation Checklist - Phase 2

- [ ] **Week 1: Agent Infrastructure**
  - [ ] Implement base agent class with LangGraph
  - [ ] Create agent state management
  - [ ] Build agent-to-agent communication
  - [ ] Implement tool calling system
  - [ ] Add logging and observability

- [ ] **Week 2: Specialist Agents**
  - [ ] Triage agent with alert assessment
  - [ ] Investigation agent with evidence gathering
  - [ ] Graph analyzer with attack path analysis
  - [ ] Threat intelligence agent with correlation
  - [ ] Remediation planner with action generation

- [ ] **Week 3: Graph Analysis**
  - [ ] Complex graph queries (shortest path, all paths)
  - [ ] Attack chain reconstruction
  - [ ] Blast radius calculation
  - [ ] Lateral movement detection
  - [ ] Privilege escalation modeling

- [ ] **Week 4: Memory & Learning**
  - [ ] Episodic memory implementation
  - [ ] Semantic search over incidents
  - [ ] Pattern learning and optimization
  - [ ] Playbook generation
  - [ ] Continuous improvement loops

- [ ] **Week 5: Detection Engines**
  - [ ] Sigma rule integration
  - [ ] YARA pattern matching
  - [ ] Anomaly detection (statistical)
  - [ ] Behavioral analysis (ML-based)
  - [ ] Alert correlation and deduplication

- [ ] **Week 6: Remediation Orchestration**
  - [ ] Action planning AI
  - [ ] Approval workflow system
  - [ ] Multi-tool orchestration
  - [ ] Rollback capability
  - [ ] Execution monitoring

- [ ] **Week 7: Frontend Enhancements**
  - [ ] Investigation timeline view
  - [ ] Real-time agent tracking
  - [ ] Graph explorer with D3.js
  - [ ] Investigation narrative display
  - [ ] Remediation dashboard

- [ ] **Week 8: Testing & Optimization**
  - [ ] Unit tests for agents
  - [ ] Integration tests for workflows
  - [ ] Performance optimization
  - [ ] Security hardening
  - [ ] Documentation

## Phase 3 Implementation: AI-Native Detection

### Key Focus Areas

1. **Graph Neural Networks**: Detect attack patterns
2. **Reinforcement Learning**: Optimize agent decisions
3. **Anomaly Detection**: ML-based behavioral analysis
4. **Threat Clustering**: Group related incidents
5. **Adaptive Baselines**: Dynamic normal behavior modeling

## Phase 4 Implementation: Enterprise Deployment

### Deployment Targets

- **Kubernetes**: EKS, GKE, AKS
- **Multi-Tenancy**: Tenant isolation and data separation
- **High Availability**: Database replication, failover
- **Auto-Scaling**: Load-based service scaling
- **Disaster Recovery**: Backup and recovery procedures

## Debugging

### Frontend

```bash
# Enable debug logging
NEXT_PUBLIC_DEBUG=true npm run dev

# Use React DevTools extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
```

### Backend

```bash
# Set log level
LOG_LEVEL=debug uvicorn app:app --reload

# Enable profiling
python -m cProfile -o profile.stats app.py
```

### Databases

```bash
# PostgreSQL
psql postgresql://sentinelos:changeme@localhost:5432/sentinelos

# ClickHouse
curl http://localhost:8123/

# Neo4j Web Console
# Open http://localhost:7474

# Qdrant API
curl http://localhost:6333/docs
```

## Deployment

### Docker Build

```bash
# Build specific service
docker build -f infrastructure/docker/Dockerfile.investigation-engine -t sentinelos-investigation:latest .

# Build all services
docker-compose build
```

### Kubernetes

```bash
# Create namespace
kubectl create namespace sentinelos

# Apply manifests
kubectl apply -f infrastructure/k8s/

# Check status
kubectl get pods -n sentinelos
```

## Monitoring & Observability

### Metrics

- Application metrics: Prometheus at `/metrics`
- Database metrics: Native database monitoring
- Request tracing: OpenTelemetry integration

### Logs

- Structured logging with JSON format
- Centralized log aggregation (ELK stack planned)
- Real-time log streaming

### Alerting

- System health checks
- Investigation timeout alerts
- Resource utilization warnings

## Contributing Guidelines

1. Create feature branch: `git checkout -b feature/description`
2. Make atomic commits with clear messages
3. Write tests for new features
4. Run type-check and lint: `npm run type-check && npm run lint`
5. Create pull request with description
6. Ensure CI passes
7. Request review from maintainers

## Performance Optimization

### Frontend

- Code splitting with dynamic imports
- Image optimization
- CSS-in-JS optimization
- State management optimization (Zustand)

### Backend

- Database query optimization
- Connection pooling
- Caching strategies
- Async processing

### Infrastructure

- Kubernetes resource limits
- Database sharding
- Redis clustering
- Load balancing

## Security Considerations

- Never commit secrets (use .env files)
- Sanitize user inputs
- Use parameterized queries
- Implement RBAC for API access
- Enable TLS for all communications
- Regular security audits

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Neo4j Cypher Guide](https://neo4j.com/docs/cypher-manual/)
- [ClickHouse Docs](https://clickhouse.com/docs)
- [LangGraph Docs](https://github.com/langchain-ai/langgraph)
- [Kubernetes Docs](https://kubernetes.io/docs/)

## Support

- Create issues for bugs
- Discuss features in discussions
- Check existing issues before creating new ones
- Follow code of conduct

---

Happy building! 🚀
