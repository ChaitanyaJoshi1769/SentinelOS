import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/investigations
 * Fetch investigations with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Mock data - in production, this would query a database
    const mockInvestigations = [
      {
        investigation_id: 'inv_1',
        alert_id: 'alert_001',
        created_at: Date.now() - 3600000,
        updated_at: Date.now() - 300000,
        status: 'complete',
        confidence: 0.92,
        findings: [
          {
            title: 'Suspicious Process Creation',
            description: 'PowerShell execution from unusual parent process',
            severity: 'high',
            evidence: ['powershell.exe', 'explorer.exe parent'],
          },
          {
            title: 'Network Communication',
            description: 'Connection to known C2 infrastructure',
            severity: 'critical',
            evidence: ['192.168.1.100:443', 'TLS handshake detected'],
          },
        ],
        timeline: [
          {
            timestamp: Date.now() - 3600000,
            event_type: 'alert',
            entity_id: 'endpoint_1',
            description: 'Initial alert triggered',
            severity: 'high',
            source_system: 'detection_engine',
          },
        ],
        recommendations: [
          'Isolate endpoint from network immediately',
          'Reset credentials for affected user',
          'Block C2 infrastructure at firewall',
        ],
        ai_narrative:
          'Investigation revealed a confirmed compromise with high confidence (92%). Attacker executed suspicious PowerShell commands after gaining initial access via phishing.',
      },
      {
        investigation_id: 'inv_2',
        alert_id: 'alert_002',
        created_at: Date.now() - 7200000,
        updated_at: Date.now(),
        status: 'complete',
        confidence: 0.67,
        findings: [
          {
            title: 'Unusual Login Activity',
            description: 'Multiple failed login attempts followed by success',
            severity: 'medium',
            evidence: ['5 failed attempts', 'Different IP addresses'],
          },
        ],
        timeline: [],
        recommendations: [
          'Review user account for unauthorized activity',
          'Enable MFA for the user',
        ],
        ai_narrative:
          'Possible brute force attempt with eventual compromise. Medium confidence due to mixed indicators.',
      },
    ];

    // Filter by status if provided
    let results = mockInvestigations;
    if (status) {
      results = results.filter((inv) => inv.status === status);
    }

    // Apply limit
    results = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      total: mockInvestigations.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/investigations
 * Create a new investigation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.alert_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'alert_id is required',
        },
        { status: 400 }
      );
    }

    // Mock investigation creation
    const newInvestigation = {
      investigation_id: `inv_${Date.now()}`,
      alert_id: body.alert_id,
      created_at: Date.now(),
      updated_at: Date.now(),
      status: 'open',
      confidence: 0,
      findings: [],
      timeline: [],
      recommendations: [],
      ai_narrative: '',
    };

    return NextResponse.json(
      {
        success: true,
        data: newInvestigation,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
