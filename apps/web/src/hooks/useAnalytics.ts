'use client';

import { useEffect, useState, useCallback } from 'react';
import { SecurityMetric, ThreatActor } from '@sentinelos/schema';
import axios from 'axios';

interface UseAnalyticsOptions {
  dateRange?: '7d' | '30d' | '90d';
  autoFetch?: boolean;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { dateRange = '30d', autoFetch = true } = options;

  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [threats, setThreats] = useState<ThreatActor[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('dateRange', dateRange);

      const response = await axios.get('/api/analytics', { params });

      if (response.data.success) {
        setMetrics(response.data.data.metrics);
        setThreats(response.data.data.threats);
        setKpis(response.data.data.kpis);
      } else {
        setError(response.data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  return {
    metrics,
    threats,
    kpis,
    loading,
    error,
    refetch: fetch,
  };
}
