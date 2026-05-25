# SentinelOS Setup Guide

Quick start guide to get SentinelOS running locally.

## Prerequisites

Ensure you have the following installed:

```bash
# Check versions
node --version        # v18+
npm --version         # v9+
docker --version      # 20.10+
docker-compose --version  # 2.0+
python --version      # 3.11+
git --version         # 2.30+
```

## Quick Start (5 minutes)

### 1. Clone Repository

```bash
git clone https://github.com/ChaitanyaJoshi1769/SentinelOS.git
cd SentinelOS
```

### 2. Start Infrastructure

```bash
# Start all databases and services
docker-compose up -d

# Verify all services are healthy
docker-compose ps
```

Expected output:
```
✓ postgres         - healthy
✓ clickhouse       - healthy
✓ neo4j            - healthy
✓ redis            - healthy
✓ kafka            - healthy
✓ zookeeper        - healthy
✓ qdrant           - healthy
✓ investigation-engine - healthy
```

### 3. Install Frontend Dependencies

```bash
cd apps/web
npm install
npm run dev
```

Visit: **http://localhost:3000**

### 4. Investigation Engine

The investigation engine runs in Docker Compose automatically.

Access API: **http://localhost:8001**
API Docs: **http://localhost:8001/docs** (when Swagger is added)

## Full Setup (Development)

### Step 1: Repository Setup

```bash
git clone https://github.com/ChaitanyaJoshi1769/SentinelOS.git
cd SentinelOS

# Install root dependencies
npm install

# Install all workspace dependencies
npm install
```

### Step 2: Environment Configuration

Create `.env.local` in the root:

```env
# Database
DATABASE_URL=postgresql://sentinelos:changeme@localhost:5432/sentinelos
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=9000
NEO4J_URI=bolt://localhost:7687
NEO4J_AUTH=neo4j/changeme
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092

# APIs
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Step 3: Start Infrastructure

```bash
# Start all services
docker-compose up -d

# Monitor logs
docker-compose logs -f

# Health check
docker-compose ps

# View logs for specific service
docker-compose logs investigation-engine
```

### Step 4: Development Environment

**Terminal 1 - Frontend:**
```bash
cd apps/web
npm install
npm run dev
```
Access: http://localhost:3000

**Terminal 2 - Investigation Engine:**
```bash
cd apps/investigation-engine
pip install -r requirements.txt
python app.py
```
Access: http://localhost:8001

**Terminal 3 - Telemetry Ingest (optional):**
```bash
cd apps/telemetry-ingest
npm install
npm run dev
```

### Step 5: Database Setup

Initialize databases:

```bash
# PostgreSQL - Create tables
npm run db:migrate

# Neo4j - Create indexes
docker-compose exec neo4j cypher-shell

# Create indexes
CREATE INDEX entity_id_index FOR (n:ThreatEntity) ON (n.entity_id);
CREATE INDEX entity_type_index FOR (n:ThreatEntity) ON (n.entity_type);
```

## Verification

### Frontend

Visit http://localhost:3000
- Should see dashboard with widgets
- All buttons should be clickable
- No console errors

### Investigation Engine

```bash
# Health check
curl http://localhost:8001/health

# Expected response:
# {"status":"healthy","version":"0.1.0","timestamp":"..."}
```

### Database Connections

**PostgreSQL:**
```bash
psql postgresql://sentinelos:changeme@localhost:5432/sentinelos
```

**ClickHouse:**
```bash
curl http://localhost:8123/ping
```

**Neo4j:**
```bash
# Visit http://localhost:7474
# Login: neo4j / changeme
```

**Redis:**
```bash
redis-cli -h localhost -p 6379 ping
# Expected: PONG
```

**Kafka:**
```bash
docker-compose exec kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

## Common Issues

### Port Already in Use

If a port is already taken:

```bash
# Find process using port (macOS/Linux)
lsof -i :3000
lsof -i :8001

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Docker Issues

```bash
# Clean up
docker-compose down -v

# Remove images and rebuild
docker-compose down -v
docker-compose rm -f
docker-compose up -d --build
```

### Database Connection Failed

```bash
# Check if database is ready
docker-compose logs postgres

# Wait for healthy status
docker-compose ps

# Restart service
docker-compose restart postgres
```

### Out of Memory

If Docker reports memory issues:

```bash
# Increase Docker memory
# Docker Desktop → Preferences → Resources → Memory

# Or use more conservative compose file
docker-compose -f docker-compose.minimal.yml up -d
```

## Development Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Build for production
npm run build

# Clean everything
npm run clean
```

## Stopping Services

```bash
# Stop all services (keep data)
docker-compose stop

# Stop and remove containers (keep data)
docker-compose down

# Stop and remove everything (delete data)
docker-compose down -v
```

## Next Steps

1. **Read Architecture**: See `docs/ARCHITECTURE.md`
2. **Development Guide**: See `DEVELOPMENT.md`
3. **Create Investigation**: Visit http://localhost:3000/investigations
4. **Explore Graph**: Visit http://localhost:3000/graph
5. **Check Analytics**: Visit http://localhost:3000/analytics

## FAQ

**Q: How do I change database passwords?**
A: Edit `docker-compose.yml` and regenerate containers:
```bash
docker-compose down -v
docker-compose up -d
```

**Q: How do I add Anthropic/OpenAI keys?**
A: Set in `.env.local`:
```env
ANTHROPIC_API_KEY=sk-xxx
OPENAI_API_KEY=sk-xxx
```

**Q: How do I debug the investigation engine?**
A: Enable debug logging in `apps/investigation-engine/app.py`:
```python
logging.basicConfig(level=logging.DEBUG)
```

**Q: How do I use production endpoints?**
A: Modify `NEXT_PUBLIC_API_URL` in `.env.local`

**Q: Can I use this in Kubernetes?**
A: Yes! See `infrastructure/k8s/` for manifests

## Getting Help

- Check `DEVELOPMENT.md` for detailed guides
- See `docs/ARCHITECTURE.md` for system design
- Open issues on GitHub
- Check existing issues for solutions

## Next: Deploy to Production

Once verified locally, see deployment guides in `infrastructure/`:
- **Terraform**: `infrastructure/terraform/`
- **Kubernetes**: `infrastructure/k8s/`
- **Docker Hub**: Push images and deploy

---

**You're ready to go!** 🚀

Start building autonomous AI-native cybersecurity operations.
