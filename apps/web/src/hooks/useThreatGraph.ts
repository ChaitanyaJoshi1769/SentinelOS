'use client';

import { useEffect, useState, useCallback } from 'react';
import { ThreatGraph } from '@sentinelos/schema';
import axios from 'axios';

interface UseThreatGraphOptions {
  nodeType?: string;
  autoFetch?: boolean;
}

export function useThreatGraph(options: UseThreatGraphOptions = {}) {
  const { nodeType, autoFetch = true } = options;

  const [graph, setGraph] = useState<ThreatGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (nodeType) params.append('nodeType', nodeType);

      const response = await axios.get('/api/threat-graph', { params });

      if (response.data.success) {
        setGraph(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch threat graph');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch threat graph'
      );
    } finally {
      setLoading(false);
    }
  }, [nodeType]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  return {
    graph,
    loading,
    error,
    refetch: fetch,
  };
}
