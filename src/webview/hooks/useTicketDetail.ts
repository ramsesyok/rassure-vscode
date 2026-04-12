import { useState, useEffect, useCallback } from 'react';
import { postRequest } from '../vscodeApi';
import { Ticket } from '../types';

interface Result {
  ticket: Ticket | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTicketDetail(id: string): Result {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postRequest<Ticket>('getTicketDetail', { id });
      setTicket(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ticket, loading, error, refresh: fetch };
}
