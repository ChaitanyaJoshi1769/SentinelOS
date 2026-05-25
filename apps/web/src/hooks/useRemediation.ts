'use client';

import { useEffect, useState, useCallback } from 'react';
import { RemediationAction, ApprovalRequest } from '@sentinelos/schema';
import axios from 'axios';

interface UseRemediationOptions {
  actionType?: string;
  status?: string;
  autoFetch?: boolean;
}

export function useRemediation(options: UseRemediationOptions = {}) {
  const { actionType, status, autoFetch = true } = options;

  const [actions, setActions] = useState<RemediationAction[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (actionType) params.append('actionType', actionType);
      if (status) params.append('status', status);

      const response = await axios.get('/api/remediation', { params });

      if (response.data.success) {
        setActions(response.data.data.actions);
        setApprovals(response.data.data.approvals);
      } else {
        setError(response.data.error || 'Failed to fetch remediation data');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch remediation data'
      );
    } finally {
      setLoading(false);
    }
  }, [actionType, status]);

  const approveAction = useCallback(
    async (requestId: string, notes?: string) => {
      try {
        const response = await axios.post('/api/remediation/approve', {
          request_id: requestId,
          approver: 'Current User',
          notes,
        });

        if (response.data.success) {
          // Update approvals list
          setApprovals((prev) =>
            prev.map((a) =>
              a.request_id === requestId
                ? { ...a, status: 'approved' as const, approval_notes: notes }
                : a
            )
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to approve action'
        );
      }
    },
    []
  );

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  return {
    actions,
    approvals,
    loading,
    error,
    refetch: fetch,
    approveAction,
  };
}
