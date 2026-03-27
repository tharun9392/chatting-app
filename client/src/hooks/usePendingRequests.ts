import { useEffect, useState } from 'react';

export type ChatRequest = {
  _id: string;
  sender: { username: string };
  recipient: string;
  status: string;
  createdAt: string;
};

const API_URL = 'http://localhost:5002/api';

export function usePendingRequests(userId: string | undefined) {
  const [pendingRequests, setPendingRequests] = useState<ChatRequest[]>([]);

  useEffect(() => {
    if (!userId) {
      setPendingRequests([]);
      return;
    }
    
    const abortController = new AbortController();

    // Fetch pending requests from the API
    const fetchRequestsData = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      fetch(`${API_URL}/chats/requests/received`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: abortController.signal
      })
        .then(res => {
          if (res.status === 401) return; // Silent catch for 401
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then(data => {
          if (!abortController.signal.aborted && data) {
            setPendingRequests(data.requests || []);
          }
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          console.error('Error fetching requests:', err);
        });
    };

    fetchRequestsData();

    // Poll for new requests every 10 seconds
    const interval = setInterval(() => {
      fetchRequestsData();
    }, 10000);

    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, [userId]);

  return pendingRequests;
}
