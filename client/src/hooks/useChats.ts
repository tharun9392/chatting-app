import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';

const API_URL = 'http://localhost:5002/api';

export interface User {
  _id: string;
  username: string;
  displayName: string;
  profilePic?: string;
  lastSeen?: string;
}

export interface Message {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
  encrypted?: boolean;
}

export interface Chat {
  _id: string;
  participants: User[];
  lastActivity: string;
  messages: Message[];
}

export const useChats = () => {
  const { token } = useAuth();
  const { addNotification } = useNotification();
  const { socket, isConnected, isAuthenticated } = useSocket();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChats = useCallback(async (cancelToken?: any) => {
    if (!token) {
      setChats([]);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: cancelToken
      });
      
      setChats(response.data.chats);
    } catch (error: any) {
      if (axios.isCancel(error)) return;
      console.error('Error fetching chats:', error);
      addNotification('Failed to load chats', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, addNotification]);

  useEffect(() => {
    const source = axios.CancelToken.source();
    fetchChats(source.token);
    
    return () => source.cancel('Component unmounted or token changed');
  }, [fetchChats]);

  useEffect(() => {
    if (!socket || !isConnected || !isAuthenticated) return;

    socket.on('receive_message', (data) => {
      // Refresh chats when a new message is received to update the last message snippet
      fetchChats();
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket, isConnected, isAuthenticated, fetchChats]);

  return { chats, isLoading, fetchChats };
};
