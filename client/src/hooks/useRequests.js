
import { useCallback, useEffect, useState } from 'react';
import {
  getRequests,
  createRequest,
  updateRequestStatus,
} from '../services/requestService';

/**
 * Pass { enabled: false } to skip loading the list.
 * Useful when you only need sendRequest (e.g. on a single student profile page).
 */
export default function useRequests({ enabled = true } = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');

  // Load once (or whenever enabled flips true)
  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getRequests();
        if (!cancelled) {
          setRequests(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load requests.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [enabled]);

  // Manual refresh (sets loading=true so callers can show a spinner)
  const refreshRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendRequest = useCallback(async (requestData) => {
    const created = await createRequest(requestData);
    setRequests((prev) => [created, ...prev]);
    return created;
  }, []);

  const acceptRequest = useCallback(async (requestId) => {
    const updated = await updateRequestStatus(requestId, 'accepted');
    setRequests((prev) =>
      prev.map((r) =>
        String(r._id || r.id) === String(requestId)
          ? { ...r, ...updated, status: 'accepted' }
          : r
      )
    );
    return updated;
  }, []);

  const declineRequest = useCallback(async (requestId) => {
    const updated = await updateRequestStatus(requestId, 'declined');
    setRequests((prev) =>
      prev.map((r) =>
        String(r._id || r.id) === String(requestId)
          ? { ...r, ...updated, status: 'declined' }
          : r
      )
    );
    return updated;
  }, []);

  return {
    requests,
    loading,
    error,
    sendRequest,
    acceptRequest,
    declineRequest,
    refreshRequests,
  };
}
