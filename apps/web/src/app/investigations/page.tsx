'use client';

import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { useInvestigations } from '@/hooks';
import { useAppStore } from '@/store/app-store';
import { Investigation } from '@sentinelos/schema';

/**
 * Investigations Dashboard
 * Displays ongoing and completed security investigations
 */
export default function InvestigationsPage() {
  const { data: investigations, loading, error } = useInvestigations({
    autoFetch: true,
  });

  // Get selected investigation from store
  const selectedInvestigationId = useAppStore((state) => state.selectedInvestigationId);
  const setSelectedInvestigation = useAppStore((state) => state.setSelectedInvestigation);
  const setDateRange = useAppStore((state) => state.setDateRange);

  const selectedInv = investigations.find(
    (inv) => inv.investigation_id === selectedInvestigationId
  ) || (investigations.length > 0 ? investigations[0] : null);

  // Set initial selection
  useEffect(() => {
    if (investigations.length > 0 && !selectedInvestigationId) {
      setSelectedInvestigation(investigations[0].investigation_id);
    }
  }, [investigations, selectedInvestigationId, setSelectedInvestigation]);

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>Error loading investigations: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Investigations</h1>
        {loading && <span className="loading loading-spinner loading-md"></span>}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Investigation List */}
        <div className="col-span-1">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body p-4">
              <h2 className="card-title text-lg mb-4">
                Investigations ({investigations.length})
              </h2>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {investigations.map((inv) => (
                  <button
                    key={inv.investigation_id}
                    onClick={() => setSelectedInvestigation(inv.investigation_id)}
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
                            : inv.status === 'in_progress'
                              ? 'badge-info'
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

              {investigations.length === 0 && (
                <div className="text-center py-8 opacity-50">
                  <p>No investigations yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Investigation Details */}
        <div className="col-span-2 space-y-4">
          {selectedInv ? (
            <>
              {/* Summary Card */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <h2 className="card-title">Investigation Summary</h2>
                    <span className="text-xs opacity-50">
                      {format(selectedInv.updated_at, 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>

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
          ) : (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <p className="opacity-50">Select an investigation to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
