import { useState, useEffect, useCallback } from 'react';
import { postRequest, onPush } from '../vscodeApi';
import { Ticket } from '../types';

interface Result {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTicketList(): Result {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postRequest<Ticket[]>('getTicketList');
      setTickets(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    // Listen for push notifications (e.g. after a ticket is saved from Detail panel)
    const unsub = onPush((type) => {
      if (type === 'ticketSaved' || type === 'folderChanged') {
        fetch();
      }
    });
    return unsub;
  }, [fetch]);

  return { tickets, loading, error, refresh: fetch };
}
