'use client';

import { useEffect, useState, useCallback } from 'react';
import { Investigation } from '@sentinelos/schema';
import axios from 'axios';

interface UseInvestigationsOptions {
  status?: string;
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
}

export function useInvestigations(options: UseInvestigationsOptions = {}) {
  const {
    status,
    limit = 50,
    offset = 0,
    autoFetch = true,
  } = options;

  const [data, setData] = useState<Investigation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      const response = await axios.get('/api/investigations', { params });

      if (response.data.success) {
        setData(response.data.data);
        setTotal(response.data.total);
      } else {
        setError(response.data.error || 'Failed to fetch investigations');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch investigations'
      );
    } finally {
      setLoading(false);
    }
  }, [status, limit, offset]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  return {
    data,
    total,
    loading,
    error,
    refetch: fetch,
  };
}
