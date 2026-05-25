"""
SentinelOS Investigation Engine
Autonomous AI-driven security investigation service using LangGraph
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import json
import logging
from typing import AsyncGenerator
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SentinelOS Investigation Engine",
    description="Autonomous AI-driven security investigation platform",
    version="0.1.0"
)

# ============================================================================
# Data Models
# ============================================================================

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class Alert(BaseModel):
    alert_id: str
    timestamp: int
    title: str
    description: str
    severity: str
    detection_rule_id: str
    entity_ids: List[str]
    metadata: Dict[str, Any]

class InvestigationRequest(BaseModel):
    alert_id: str
    priority: str = "normal"
    max_depth: int = 5
    auto_remediate: bool = False

class InvestigationResult(BaseModel):
    investigation_id: str
    alert_id: str
    status: str
    confidence: float
    findings: List[Dict[str, Any]]
    attack_chain: Optional[Dict[str, Any]]
    recommendations: List[str]
    timeline: List[Dict[str, Any]]
    remediation_actions: Optional[List[Dict[str, Any]]]
    ai_narrative: str

class AgentState(BaseModel):
    investigation_id: str
    current_agent: str
    status: str
    progress: Dict[str, Any]
    findings: List[str]

# ============================================================================
# Investigation Engine Implementation
# ============================================================================

class InvestigationEngine:
    """Core investigation engine with AI orchestration"""

    def __init__(self):
        self.investigations = {}
        self.anthropic_client = None
        try:
            from anthropic import Anthropic
            self.anthropic_client = Anthropic()
            logger.info("Anthropic client initialized")
        except ImportError:
            logger.warning("Anthropic client not available")

    async def investigate_alert(
        self,
        alert: Alert,
        auto_remediate: bool = False
    ) -> AsyncGenerator[str, None]:
        """
        Main investigation flow - yields investigation updates as they occur
        """
        investigation_id = f"inv_{alert.alert_id}_{datetime.now().timestamp()}"

        # Initialize investigation
        self.investigations[investigation_id] = {
            "alert_id": alert.alert_id,
            "status": "investigating",
            "findings": [],
            "evidence": [],
            "timeline": [],
            "created_at": datetime.now().isoformat(),
            "agents_completed": []
        }

        try:
            # Step 1: Triage Agent - Initial assessment
            yield f"data: {json.dumps({'status': 'triage_agent_started', 'investigation_id': investigation_id})}\n\n"

            triage_result = await self._triage_alert(alert)
            self.investigations[investigation_id]["triage"] = triage_result
            yield f"data: {json.dumps({'status': 'triage_complete', 'result': triage_result})}\n\n"

            # Step 2: Investigation Agent - Gather evidence
            yield f"data: {json.dumps({'status': 'investigation_agent_started'})}\n\n"

            investigation_result = await self._gather_evidence(alert, triage_result)
            self.investigations[investigation_id]["evidence"] = investigation_result
            yield f"data: {json.dumps({'status': 'evidence_gathered', 'count': len(investigation_result)})}\n\n"

            # Step 3: Graph Analyzer - Attack path analysis
            yield f"data: {json.dumps({'status': 'graph_analyzer_started'})}\n\n"

            attack_chain = await self._analyze_attack_paths(alert.entity_ids, triage_result)
            self.investigations[investigation_id]["attack_chain"] = attack_chain
            yield f"data: {json.dumps({'status': 'attack_chain_identified'})}\n\n"

            # Step 4: Threat Intelligence Agent - Attribution
            yield f"data: {json.dumps({'status': 'threat_intel_agent_started'})}\n\n"

            threat_intel = await self._correlate_threat_intel(alert.metadata)
            self.investigations[investigation_id]["threat_intel"] = threat_intel
            yield f"data: {json.dumps({'status': 'threat_intel_complete'})}\n\n"

            # Step 5: Generate final narrative and recommendations
            yield f"data: {json.dumps({'status': 'generating_narrative'})}\n\n"

            final_result = await self._generate_investigation_narrative(
                investigation_id,
                alert,
                triage_result,
                investigation_result,
                attack_chain,
                threat_intel
            )

            self.investigations[investigation_id]["status"] = "complete"
            self.investigations[investigation_id]["result"] = final_result

            # Step 6: Remediation planning if enabled
            if auto_remediate:
                yield f"data: {json.dumps({'status': 'remediation_planning'})}\n\n"
                remediation_actions = await self._plan_remediation(final_result, alert)
                self.investigations[investigation_id]["remediation"] = remediation_actions
                yield f"data: {json.dumps({'status': 'remediation_planned'})}\n\n"

            # Final result
            yield f"data: {json.dumps({'status': 'investigation_complete', 'result': final_result})}\n\n"

        except Exception as e:
            logger.error(f"Investigation failed: {e}")
            self.investigations[investigation_id]["status"] = "failed"
            self.investigations[investigation_id]["error"] = str(e)
            yield f"data: {json.dumps({'status': 'investigation_failed', 'error': str(e)})}\n\n"

    async def _triage_alert(self, alert: Alert) -> Dict[str, Any]:
        """Triage Agent: Initial alert assessment"""

        # In production, would use Claude with structured prompts
        prompt = f"""
        Analyze this security alert for initial triage:

        Title: {alert.title}
        Description: {alert.description}
        Severity: {alert.severity}

        Assess:
        1. Is this a real threat? (confidence 0-1)
        2. What is the likely attack technique?
        3. What entities are at risk?
        4. Priority level (critical/high/medium/low)

        Return structured assessment.
        """

        logger.info(f"Triaging alert {alert.alert_id}")

        # Placeholder - would use Claude API
        return {
            "is_real_threat": alert.severity in ["critical", "high"],
            "confidence": 0.85 if alert.severity == "critical" else 0.6,
            "attack_techniques": ["T1078.001"],  # Valid Account: Default Accounts
            "at_risk_entities": alert.entity_ids,
            "priority": alert.severity,
            "rationale": f"Alert severity {alert.severity} indicates potential threat"
        }

    async def _gather_evidence(self, alert: Alert, triage: Dict) -> List[Dict]:
        """Investigation Agent: Gather evidence from telemetry"""

        logger.info(f"Gathering evidence for alert {alert.alert_id}")

        # Placeholder - would query telemetry systems
        evidence = [
            {
                "timestamp": alert.timestamp,
                "event_type": "process_creation",
                "entity": alert.entity_ids[0] if alert.entity_ids else "unknown",
                "description": "Suspicious process execution detected",
                "severity": "high"
            },
            {
                "timestamp": alert.timestamp + 5000,
                "event_type": "network_connection",
                "entity": alert.entity_ids[0] if alert.entity_ids else "unknown",
                "description": "Connection to known C2 server",
                "severity": "critical"
            }
        ]

        return evidence

    async def _analyze_attack_paths(self, entity_ids: List[str], triage: Dict) -> Dict:
        """Graph Analyzer: Analyze attack paths and lateral movement"""

        logger.info(f"Analyzing attack paths for entities: {entity_ids}")

        # Placeholder - would query threat graph
        return {
            "primary_path": {
                "hops": 3,
                "entities": entity_ids + ["secondary_entity"],
                "techniques": ["T1078", "T1570", "T1021"],
                "estimated_impact": "High"
            },
            "lateral_movement": True,
            "blast_radius": {
                "affected_systems": 5,
                "critical_assets": 2,
                "data_exposure_risk": "High"
            }
        }

    async def _correlate_threat_intel(self, metadata: Dict) -> Dict:
        """Threat Intelligence Agent: Correlate with known threats"""

        logger.info("Correlating threat intelligence")

        # Placeholder - would query threat intel feeds
        return {
            "known_indicators": ["192.168.1.100", "malware.exe"],
            "related_campaigns": ["APT28"],
            "threat_actor": "APT28",
            "confidence": 0.75,
            "mitre_techniques": ["T1078.001", "T1570", "T1021.006"]
        }

    async def _generate_investigation_narrative(
        self,
        investigation_id: str,
        alert: Alert,
        triage: Dict,
        evidence: List[Dict],
        attack_chain: Dict,
        threat_intel: Dict
    ) -> Dict:
        """Generate comprehensive investigation narrative using AI"""

        logger.info(f"Generating narrative for {investigation_id}")

        # Would use Claude to generate narrative
        narrative = f"""
        Investigation Summary:

        Alert: {alert.title}
        Severity: {alert.severity}
        Confidence: {triage['confidence']}

        Key Findings:
        - {len(evidence)} pieces of evidence collected
        - Attack path with {attack_chain['primary_path']['hops']} hops
        - Potential attribution: {threat_intel.get('threat_actor', 'Unknown')}

        Attack Chain:
        The adversary gained initial access and established persistence,
        then moved laterally across {attack_chain['blast_radius']['affected_systems']} systems.

        Recommendations:
        1. Isolate affected endpoints immediately
        2. Revoke compromised credentials
        3. Hunt for lateral movement indicators
        4. Review access logs for data exfiltration
        """

        return {
            "investigation_id": investigation_id,
            "alert_id": alert.alert_id,
            "status": "complete",
            "confidence": triage["confidence"],
            "findings": [
                {
                    "type": "malicious_activity",
                    "description": evidence[0]["description"],
                    "severity": "critical"
                },
                {
                    "type": "lateral_movement",
                    "description": f"Attack chain with {attack_chain['primary_path']['hops']} hops detected",
                    "severity": "high"
                }
            ],
            "attack_chain": attack_chain,
            "recommendations": [
                "Isolate affected endpoints",
                "Revoke compromised credentials",
                "Hunt for lateral movement",
                "Review access logs"
            ],
            "timeline": evidence,
            "ai_narrative": narrative.strip()
        }

    async def _plan_remediation(self, investigation: Dict, alert: Alert) -> List[Dict]:
        """Remediation Planner: Generate remediation actions"""

        logger.info("Planning remediation actions")

        actions = [
            {
                "action_id": f"rem_isolate_{alert.alert_id}",
                "type": "isolate_endpoint",
                "target": alert.entity_ids[0] if alert.entity_ids else "unknown",
                "confidence": 0.95,
                "approval_required": True
            },
            {
                "action_id": f"rem_revoke_{alert.alert_id}",
                "type": "revoke_session",
                "target": "user@domain.com",
                "confidence": 0.85,
                "approval_required": True
            }
        ]

        return actions

    async def get_investigation(self, investigation_id: str) -> Optional[Dict]:
        """Retrieve investigation details"""
        return self.investigations.get(investigation_id)

# ============================================================================
# API Endpoints
# ============================================================================

engine = InvestigationEngine()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/investigations/create")
async def create_investigation(request: InvestigationRequest, background_tasks: BackgroundTasks):
    """Create a new investigation"""

    try:
        # Placeholder - would fetch actual alert from database
        alert = Alert(
            alert_id=request.alert_id,
            timestamp=int(datetime.now().timestamp() * 1000),
            title="Security Alert",
            description="Suspicious activity detected",
            severity="high",
            detection_rule_id="rule_123",
            entity_ids=["endpoint_1"],
            metadata={}
        )

        return {
            "status": "investigation_started",
            "alert_id": request.alert_id
        }
    except Exception as e:
        logger.error(f"Failed to create investigation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/investigations/{investigation_id}/stream")
async def stream_investigation(investigation_id: str):
    """Stream investigation progress"""

    async def investigate_generator():
        # Simulate investigation stream
        yield f"data: {json.dumps({'status': 'starting'})}\n\n"

        import asyncio
        for i in range(5):
            await asyncio.sleep(1)
            yield f"data: {json.dumps({'status': f'step_{i}', 'progress': (i+1)*20})}\n\n"

        yield f"data: {json.dumps({'status': 'complete'})}\n\n"

    return StreamingResponse(
        investigate_generator(),
        media_type="text/event-stream"
    )

@app.get("/investigations/{investigation_id}")
async def get_investigation(investigation_id: str):
    """Get investigation details"""

    investigation = await engine.get_investigation(investigation_id)
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")

    return investigation

@app.get("/investigations")
async def list_investigations(limit: int = 100, offset: int = 0):
    """List investigations"""

    invs = list(engine.investigations.values())
    return {
        "total": len(invs),
        "limit": limit,
        "offset": offset,
        "investigations": invs[offset:offset+limit]
    }

@app.post("/agents/execute")
async def execute_agent(agent_type: str, task: Dict):
    """Execute a specific agent"""

    logger.info(f"Executing {agent_type} agent")

    return {
        "agent_type": agent_type,
        "status": "executing",
        "task_id": task.get("task_id", "unknown")
    }

@app.get("/agents/status")
async def get_agents_status():
    """Get status of all agents"""

    return {
        "agents": [
            {"agent_type": "triage_agent", "status": "idle"},
            {"agent_type": "investigation_agent", "status": "idle"},
            {"agent_type": "graph_analyzer_agent", "status": "idle"},
            {"agent_type": "threat_intel_agent", "status": "idle"},
            {"agent_type": "remediation_planner_agent", "status": "idle"}
        ]
    }

@app.get("/")
async def root():
    """Root endpoint"""

    return {
        "service": "SentinelOS Investigation Engine",
        "version": "0.1.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "create_investigation": "POST /investigations/create",
            "stream_investigation": "GET /investigations/{investigation_id}/stream",
            "get_investigation": "GET /investigations/{investigation_id}",
            "list_investigations": "GET /investigations",
            "execute_agent": "POST /agents/execute",
            "agents_status": "GET /agents/status"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
