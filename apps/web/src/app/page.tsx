'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface AlertSummary {
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

interface SystemMetrics {
  investigationsActive: number
  eventsProcessed: number
  avgInvestigationTime: number
  automationCoverage: number
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState<AlertSummary>({
    critical: 3,
    high: 12,
    medium: 45,
    low: 128,
    info: 342,
  })

  const [metrics, setMetrics] = useState<SystemMetrics>({
    investigationsActive: 5,
    eventsProcessed: 1243567,
    avgInvestigationTime: 23,
    automationCoverage: 87,
  })

  const [recentAlerts, setRecentAlerts] = useState([
    {
      id: 'alert_1',
      title: 'Suspicious PowerShell Activity',
      entity: 'WIN-PROD-001',
      time: '2 minutes ago',
      severity: 'critical',
      status: 'investigating',
    },
    {
      id: 'alert_2',
      title: 'Lateral Movement Detected',
      entity: 'db-server-03',
      time: '5 minutes ago',
      severity: 'high',
      status: 'investigated',
    },
    {
      id: 'alert_3',
      title: 'Unusual DNS Query Pattern',
      entity: 'client-ws-142',
      time: '12 minutes ago',
      severity: 'medium',
      status: 'false_positive',
    },
  ])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-error'
      case 'high':
        return 'text-warning'
      case 'medium':
        return 'text-info'
      case 'low':
        return 'text-success'
      default:
        return 'text-base-content'
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'investigating':
        return 'badge-info'
      case 'investigated':
        return 'badge-success'
      case 'false_positive':
        return 'badge-ghost'
      default:
        return 'badge'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold text-base-content">Security Operations Dashboard</h2>
        <p className="text-base-content/60">Real-time threat landscape and investigation status</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base-content/70 text-sm font-semibold">Active Investigations</h3>
                <p className="text-3xl font-bold text-sentinel-400">{metrics.investigationsActive}</p>
              </div>
              <div className="badge badge-info">↑ 2</div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base-content/70 text-sm font-semibold">Events Processed (24h)</h3>
                <p className="text-3xl font-bold text-sentinel-400">{(metrics.eventsProcessed / 1000000).toFixed(1)}M</p>
              </div>
              <div className="badge badge-success">↑ 12%</div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base-content/70 text-sm font-semibold">Avg Investigation Time</h3>
                <p className="text-3xl font-bold text-sentinel-400">{metrics.avgInvestigationTime}m</p>
              </div>
              <div className="badge badge-success">↓ 5m</div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base-content/70 text-sm font-semibold">Automation Coverage</h3>
                <p className="text-3xl font-bold text-sentinel-400">{metrics.automationCoverage}%</p>
              </div>
              <div className="badge badge-success">↑ 3%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Summary and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Distribution */}
        <div className="lg:col-span-1">
          <div className="card bg-base-200 shadow">
            <div className="card-body">
              <h3 className="card-title text-lg">Alert Summary (24h)</h3>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-error rounded-full"></div>
                    <span className="text-sm">Critical</span>
                  </span>
                  <span className="font-bold text-error">{alerts.critical}</span>
                </div>
                <div className="progress progress-error w-full" style={{ height: '6px' }}>
                  <div className="progress-value" style={{ width: '15%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-warning rounded-full"></div>
                    <span className="text-sm">High</span>
                  </span>
                  <span className="font-bold text-warning">{alerts.high}</span>
                </div>
                <div className="progress progress-warning w-full" style={{ height: '6px' }}>
                  <div className="progress-value" style={{ width: '8%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-info rounded-full"></div>
                    <span className="text-sm">Medium</span>
                  </span>
                  <span className="font-bold text-info">{alerts.medium}</span>
                </div>
                <div className="progress progress-info w-full" style={{ height: '6px' }}>
                  <div className="progress-value" style={{ width: '32%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <span className="text-sm">Low</span>
                  </span>
                  <span className="font-bold text-success">{alerts.low}</span>
                </div>
                <div className="progress progress-success w-full" style={{ height: '6px' }}>
                  <div className="progress-value" style={{ width: '91%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-base-400 rounded-full"></div>
                    <span className="text-sm">Info</span>
                  </span>
                  <span className="font-bold">{alerts.info}</span>
                </div>
                <div className="progress w-full" style={{ height: '6px' }}>
                  <div className="progress-value" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="card-actions mt-6">
                <Link href="/investigations" className="btn btn-primary btn-sm w-full">
                  View All Alerts
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 shadow">
            <div className="card-body">
              <h3 className="card-title text-lg">Recent Alerts</h3>
              <div className="space-y-3 mt-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className={`card bg-base-100 card-threat-${alert.severity.toLowerCase()}`}>
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base-content">{alert.title}</h4>
                          <p className="text-sm text-base-content/60">{alert.entity}</p>
                          <p className="text-xs text-base-content/50 mt-1">{alert.time}</p>
                        </div>
                        <div className="flex gap-2">
                          <div className={`badge ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </div>
                          <div className={`badge ${getStatusBadgeClass(alert.status)}`}>
                            {alert.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card-actions mt-6">
                <Link href="/investigations" className="btn btn-primary btn-sm w-full">
                  Open Investigation Center
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Threat Graph & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <h3 className="card-title text-lg">Threat Intelligence</h3>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm font-semibold">Active Threat Actors: 3</p>
                <div className="flex gap-2 mt-2">
                  <span className="badge badge-sm">APT28</span>
                  <span className="badge badge-sm">Wizard Spider</span>
                  <span className="badge badge-sm">Scattered Spider</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Critical Vulnerabilities: 8</p>
                <p className="text-xs text-base-content/60 mt-1">Requires immediate patching</p>
              </div>
            </div>
            <div className="card-actions mt-6">
              <Link href="/graph" className="btn btn-primary btn-sm w-full">
                View Threat Graph
              </Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <h3 className="card-title text-lg">Quick Actions</h3>
            <div className="space-y-2 mt-4">
              <Link href="/investigations" className="btn btn-outline btn-sm w-full justify-start">
                → New Investigation
              </Link>
              <Link href="/remediation" className="btn btn-outline btn-sm w-full justify-start">
                → Execute Remediation
              </Link>
              <Link href="/graph" className="btn btn-outline btn-sm w-full justify-start">
                → Analyze Attack Path
              </Link>
              <Link href="/analytics" className="btn btn-outline btn-sm w-full justify-start">
                → View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
