'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export interface SecurityMetric {
  date: string;
  alerts_total: number;
  alerts_critical: number;
  alerts_high: number;
  investigations_completed: number;
  avg_investigation_time: number;
  remediation_success_rate: number;
}

export interface ThreatTrend {
  threat_actor: string;
  incidents: number;
  last_seen: number;
  tactics: string[];
}

export interface TopAlert {
  alert_id: string;
  title: string;
  count: number;
  severity: string;
  trend: number;
}

/**
 * Security Analytics Dashboard
 * Displays metrics, trends, and KPIs
 */
export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [threats, setThreats] = useState<ThreatTrend[]>([]);
  const [topAlerts, setTopAlerts] = useState<TopAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      // Generate mock metrics for the selected date range
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const mockMetrics: SecurityMetric[] = [];

      for (let i = days; i > 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        mockMetrics.push({
          date: format(date, 'MMM dd'),
          alerts_total: Math.floor(Math.random() * 50) + 20,
          alerts_critical: Math.floor(Math.random() * 5) + 1,
          alerts_high: Math.floor(Math.random() * 15) + 3,
          investigations_completed: Math.floor(Math.random() * 10) + 2,
          avg_investigation_time: Math.floor(Math.random() * 120) + 20,
          remediation_success_rate: Math.random() * 0.3 + 0.7,
        });
      }

      const mockThreats: ThreatTrend[] = [
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
        {
          threat_actor: 'Emotet',
          incidents: 3,
          last_seen: Date.now() - 604800000,
          tactics: ['T1566.001', 'T1204.002', 'T1059.001'],
        },
      ];

      const mockTopAlerts: TopAlert[] = [
        {
          alert_id: 'alert_1',
          title: 'Suspicious PowerShell Activity',
          count: 142,
          severity: 'high',
          trend: 12,
        },
        {
          alert_id: 'alert_2',
          title: 'Lateral Movement Detected',
          count: 98,
          severity: 'critical',
          trend: 8,
        },
        {
          alert_id: 'alert_3',
          title: 'Unusual Network Connection',
          count: 87,
          severity: 'medium',
          trend: -3,
        },
        {
          alert_id: 'alert_4',
          title: 'File Access Anomaly',
          count: 76,
          severity: 'medium',
          trend: 5,
        },
        {
          alert_id: 'alert_5',
          title: 'Privilege Escalation Attempt',
          count: 54,
          severity: 'high',
          trend: 15,
        },
      ];

      setMetrics(mockMetrics);
      setThreats(mockThreats);
      setTopAlerts(mockTopAlerts);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPI = (
    field: keyof SecurityMetric,
    operation: 'avg' | 'sum' | 'max' = 'avg'
  ): number => {
    if (metrics.length === 0) return 0;

    const values = metrics.map((m) => {
      const val = m[field];
      return typeof val === 'number' ? val : 0;
    });

    if (operation === 'sum') {
      return values.reduce((a, b) => a + b, 0);
    } else if (operation === 'max') {
      return Math.max(...values);
    } else {
      return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }
  };

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  const avgInvestigationTime = calculateKPI('avg_investigation_time');
  const totalAlerts = calculateKPI('alerts_total', 'sum');
  const criticalAlerts = calculateKPI('alerts_critical', 'sum');
  const avgRemediationRate = Math.round(
    calculateKPI('remediation_success_rate') * 100
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('7d')}
            className={`btn btn-sm ${dateRange === '7d' ? 'btn-primary' : 'btn-outline'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`btn btn-sm ${dateRange === '30d' ? 'btn-primary' : 'btn-outline'}`}
          >
            30 Days
          </button>
          <button
            onClick={() => setDateRange('90d')}
            className={`btn btn-sm ${dateRange === '90d' ? 'btn-primary' : 'btn-outline'}`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="text-base-content/70 text-sm font-semibold">Total Alerts</h3>
            <p className="text-3xl font-bold text-sentinel-400">{totalAlerts}</p>
            <p className="text-xs opacity-75 mt-1">
              {Math.round(totalAlerts / metrics.length)} per day avg
            </p>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="text-base-content/70 text-sm font-semibold">
              Critical Alerts
            </h3>
            <p className="text-3xl font-bold text-error">{criticalAlerts}</p>
            <p className="text-xs opacity-75 mt-1">
              {((criticalAlerts / totalAlerts) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="text-base-content/70 text-sm font-semibold">
              Avg Investigation Time
            </h3>
            <p className="text-3xl font-bold text-sentinel-400">
              {avgInvestigationTime}m
            </p>
            <p className="text-xs opacity-75 mt-1">Minutes to resolution</p>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="text-base-content/70 text-sm font-semibold">
              Remediation Success
            </h3>
            <p className="text-3xl font-bold text-success">{avgRemediationRate}%</p>
            <p className="text-xs opacity-75 mt-1">Success rate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Trend */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg">Alert Trends</h2>

              <div className="mt-4 space-y-4">
                {/* Simple bar chart representation */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Daily Alert Volume</h3>
                  <div className="space-y-2">
                    {metrics.slice(-14).map((metric, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-16 text-xs opacity-75">{metric.date}</span>
                        <div className="flex-1 bg-base-100 rounded h-6 flex items-center">
                          <div
                            className="bg-sentinel-400 h-6 rounded flex items-center justify-end pr-2"
                            style={{
                              width: `${(metric.alerts_total / 60) * 100}%`,
                            }}
                          >
                            {metric.alerts_total > 30 && (
                              <span className="text-xs font-semibold text-base-100">
                                {metric.alerts_total}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="w-8 text-xs text-right">
                          {metric.alerts_total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Severity Distribution */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg">Severity Distribution</h2>

            <div className="space-y-3 mt-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Critical</span>
                  <span className="text-sm font-semibold text-error">
                    {criticalAlerts}
                  </span>
                </div>
                <progress
                  className="progress progress-error w-full"
                  value={criticalAlerts}
                  max={totalAlerts}
                ></progress>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">High</span>
                  <span className="text-sm font-semibold text-warning">
                    {calculateKPI('alerts_high', 'sum')}
                  </span>
                </div>
                <progress
                  className="progress progress-warning w-full"
                  value={calculateKPI('alerts_high', 'sum')}
                  max={totalAlerts}
                ></progress>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Medium</span>
                  <span className="text-sm font-semibold text-info">
                    {totalAlerts -
                      criticalAlerts -
                      calculateKPI('alerts_high', 'sum')}
                  </span>
                </div>
                <progress
                  className="progress progress-info w-full"
                  value={
                    totalAlerts -
                    criticalAlerts -
                    calculateKPI('alerts_high', 'sum')
                  }
                  max={totalAlerts}
                ></progress>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Alerts */}
      <div className="card bg-base-200 shadow-lg mt-6">
        <div className="card-body">
          <h2 className="card-title">Top Alert Types</h2>

          <div className="overflow-x-auto mt-4">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Alert Type</th>
                  <th>Count</th>
                  <th>Severity</th>
                  <th>Trend (7d)</th>
                </tr>
              </thead>
              <tbody>
                {topAlerts.map((alert) => (
                  <tr key={alert.alert_id}>
                    <td className="text-sm">{alert.title}</td>
                    <td className="font-semibold">{alert.count}</td>
                    <td>
                      <span
                        className={`badge badge-${
                          alert.severity === 'critical'
                            ? 'error'
                            : alert.severity === 'high'
                              ? 'warning'
                              : 'info'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span
                          className={alert.trend > 0 ? 'text-error' : 'text-success'}
                        >
                          {alert.trend > 0 ? '↑' : '↓'}
                        </span>
                        <span className="text-sm">{Math.abs(alert.trend)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Threat Landscape */}
      <div className="card bg-base-200 shadow-lg mt-6">
        <div className="card-body">
          <h2 className="card-title">Threat Landscape</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {threats.map((threat) => (
              <div key={threat.threat_actor} className="card bg-base-100">
                <div className="card-body p-4">
                  <h3 className="font-semibold">{threat.threat_actor}</h3>

                  <div className="space-y-2 mt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-75">Incidents</span>
                      <span className="font-semibold">{threat.incidents}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="opacity-75">Last Seen</span>
                      <span className="text-xs">
                        {Math.floor(
                          (Date.now() - threat.last_seen) / (1000 * 60 * 60)
                        )}{' '}
                        hours ago
                      </span>
                    </div>

                    <div>
                      <span className="opacity-75 text-xs">Tactics (MITRE)</span>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {threat.tactics.map((tactic) => (
                          <span key={tactic} className="badge badge-sm">
                            {tactic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
