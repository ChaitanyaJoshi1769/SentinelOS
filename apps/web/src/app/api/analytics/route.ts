import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/analytics
 * Fetch security analytics and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30d';

    // Calculate number of days
    const days =
      dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;

    // Generate mock metrics
    const mockMetrics = [];
    for (let i = days; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      mockMetrics.push({
        date: date.toISOString().split('T')[0],
        alerts_total: Math.floor(Math.random() * 50) + 20,
        alerts_critical: Math.floor(Math.random() * 5) + 1,
        alerts_high: Math.floor(Math.random() * 15) + 3,
        investigations_completed: Math.floor(Math.random() * 10) + 2,
        avg_investigation_time: Math.floor(Math.random() * 120) + 20,
        remediation_success_rate: Math.random() * 0.3 + 0.7,
      });
    }

    // Mock threat intelligence
    const mockThreats = [
      {
        threat_actor: 'APT28 (Fancy Bear)',
        incidents: 12,
        last_seen: Date.now() - 86400000,
        tactics: ['T1566.002', 'T1566.001', 'T1087.004'],
      },
      {
        threat_actor: 'Wizard Spider',
        incidents: 8,
        last_seen: Date.now() - 172800000,
        tactics: ['T1083', 'T1213.003', 'T1059.001'],
      },
      {
        threat_actor: 'Scattered Spider',
        incidents: 5,
        last_seen: Date.now() - 259200000,
        tactics: ['T1110.003', 'T1078.003', 'T1021.001'],
      },
    ];

    // Calculate KPIs
    const totalAlerts = mockMetrics.reduce(
      (sum, m) => sum + m.alerts_total,
      0
    );
    const avgInvestigationTime = Math.round(
      mockMetrics.reduce((sum, m) => sum + m.avg_investigation_time, 0) /
        mockMetrics.length
    );
    const avgRemediationRate = Math.round(
      (mockMetrics.reduce(
        (sum, m) => sum + m.remediation_success_rate,
        0
      ) /
        mockMetrics.length) *
        100
    );

    return NextResponse.json({
      success: true,
      data: {
        metrics: mockMetrics,
        threats: mockThreats,
        kpis: {
          total_alerts: totalAlerts,
          avg_investigation_time: avgInvestigationTime,
          remediation_success_rate: avgRemediationRate,
          critical_alerts: mockMetrics.reduce(
            (sum, m) => sum + m.alerts_critical,
            0
          ),
        },
      },
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
 * POST /api/analytics/export
 * Export analytics report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.format) {
      return NextResponse.json(
        {
          success: false,
          error: 'format is required (pdf, csv, json)',
        },
        { status: 400 }
      );
    }

    // Mock report generation
    const report = {
      report_id: `report_${Date.now()}`,
      format: body.format,
      generated_at: new Date().toISOString(),
      date_range: body.date_range || '30d',
      url: `/reports/report_${Date.now()}.${body.format}`,
    };

    return NextResponse.json({
      success: true,
      data: report,
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
