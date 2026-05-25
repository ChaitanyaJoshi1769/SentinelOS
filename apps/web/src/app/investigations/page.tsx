'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export interface Investigation {
  investigation_id: string;
  alert_id: string;
  created_at: number;
  updated_at: number;
  status: string;
  confidence: number;
  findings: Finding[];
  timeline: TimelineEvent[];
  recommendations: string[];
  ai_narrative: string;
}

export interface Finding {
  title: string;
  description: string;
  severity: string;
  evidence: string[];
}

export interface TimelineEvent {
  timestamp: number;
  event_type: string;
  entity_id: string;
  description: string;
  severity: string;
  source_system: string;
}

/**
 * Investigations Dashboard
 * Displays ongoing and completed security investigations
 */
export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInv, setSelectedInv] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch investigations from API
    fetchInvestigations();
  }, []);

  const fetchInvestigations = async () => {
    try {
      // Mock data for now
      const mockInvestigations: Investigation[] = [
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
            {
              timestamp: Date.now() - 3540000,
              event_type: 'process_creation',
              entity_id: 'endpoint_1',
              description: 'Suspicious PowerShell process created',
              severity: 'high',
              source_system: 'crowdstrike',
            },
            {
              timestamp: Date.now() - 3480000,
              event_type: 'network_connection',
              entity_id: 'endpoint_1',
              description: 'Outbound connection to C2 server',
              severity: 'critical',
              source_system: 'firewall',
            },
          ],
          recommendations: [
            'Isolate endpoint from network immediately',
            'Reset credentials for affected user',
            'Block C2 infrastructure at firewall',
            'Collect forensic evidence',
            'Monitor for lateral movement',
          ],
          ai_narrative:
            'Investigation revealed a confirmed compromise with high confidence (92%). Attacker executed suspicious PowerShell commands after gaining initial access via phishing. Network connection to known C2 server confirms command execution capability.',
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

      setInvestigations(mockInvestigations);
      if (mockInvestigations.length > 0) {
        setSelectedInv(mockInvestigations[0]);
      }
    } catch (error) {
      console.error('Failed to fetch investigations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading investigations...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Security Investigations</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Investigation List */}
        <div className="col-span-1">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body p-4">
              <h2 className="card-title text-lg mb-4">Investigations</h2>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {investigations.map((inv) => (
                  <button
                    key={inv.investigation_id}
                    onClick={() => setSelectedInv(inv)}
                    className={`w-full text-left p-3 rounded border-l-4 transition ${
                      selectedInv?.investigation_id === inv.investigation_id
                        ? 'bg-primary text-primary-content border-primary'
                        : 'bg-base-100 border-gray-300 hover:bg-base-200'
                    }`}
                  >
                    <div className="font-semibold text-sm">{inv.alert_id}</div>
                    <div className="text-xs opacity-75">
                      {format(inv.created_at, 'MMM dd HH:mm')}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span
                        className={`badge badge-sm ${
                          inv.status === 'complete'
                            ? 'badge-success'
                            : 'badge-warning'
                        }`}
                      >
                        {inv.status}
                      </span>
                      <span className="text-xs">
                        {(inv.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Investigation Details */}
        <div className="col-span-2 space-y-4">
          {selectedInv && (
            <>
              {/* Summary Card */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">Investigation Summary</h2>

                  <div className="grid grid-cols-3 gap-4 my-4">
                    <div>
                      <div className="text-sm opacity-75">Status</div>
                      <div className="text-lg font-semibold capitalize">
                        {selectedInv.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm opacity-75">Confidence</div>
                      <div className="text-lg font-semibold">
                        {(selectedInv.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm opacity-75">Findings</div>
                      <div className="text-lg font-semibold">
                        {selectedInv.findings.length}
                      </div>
                    </div>
                  </div>

                  <div className="divider my-2"></div>

                  <p className="text-sm whitespace-pre-wrap">
                    {selectedInv.ai_narrative}
                  </p>
                </div>
              </div>

              {/* Findings */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">Findings</h2>

                  <div className="space-y-3">
                    {selectedInv.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        className={`border-l-4 p-3 ${
                          finding.severity === 'critical'
                            ? 'border-error bg-error/10'
                            : finding.severity === 'high'
                              ? 'border-warning bg-warning/10'
                              : 'border-info bg-info/10'
                        }`}
                      >
                        <div className="font-semibold text-sm">
                          {finding.title}
                        </div>
                        <div className="text-sm opacity-75 my-1">
                          {finding.description}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {finding.evidence.map((ev, i) => (
                            <span key={i} className="badge badge-sm">
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {selectedInv.timeline.length > 0 && (
                <div className="card bg-base-200 shadow-lg">
                  <div className="card-body">
                    <h2 className="card-title">Timeline</h2>

                    <div className="space-y-2">
                      {selectedInv.timeline.map((event, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 text-sm"
                        >
                          <div className="text-xs opacity-50 min-w-fit">
                            {format(event.timestamp, 'HH:mm:ss')}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-xs uppercase opacity-75">
                              {event.event_type}
                            </div>
                            <div>{event.description}</div>
                            <div className="text-xs opacity-50 mt-1">
                              {event.source_system}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">Recommendations</h2>

                  <ul className="list-disc list-inside space-y-2">
                    {selectedInv.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm">
                        {rec}
                      </li>
                    ))}
                  </ul>

                  <div className="card-actions mt-4">
                    <button className="btn btn-primary btn-sm">
                      Execute Remediation
                    </button>
                    <button className="btn btn-outline btn-sm">
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
