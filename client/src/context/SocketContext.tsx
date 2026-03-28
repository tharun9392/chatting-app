import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  reauthenticate: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = 'http://127.0.0.1:5002';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated: userIsAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to manually trigger re-authentication
  const reauthenticate = useCallback(() => {
    if (socket && isConnected && token) {
      console.log('Socket: Manually triggering authentication...');
      socket.emit('authenticate', { token });
    }
  }, [socket, isConnected, token]);

  // Initialize socket connection
  useEffect(() => {
    console.log('Socket: Initializing connection to', SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      console.log('Socket: Connected to server');
      setIsConnected(true);
      // Trigger authentication immediately on connect if we have a token
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        newSocket.emit('authenticate', { token: storedToken });
      }
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket: Disconnected from server (Reason:', reason, ')');
      setIsConnected(false);
      setIsAuthenticated(false);
    });
    
    newSocket.on('authenticated', (data) => {
      console.log('Socket: Successfully authenticated for user:', data.userId);
      setIsAuthenticated(true);
    });
    
    newSocket.on('authentication_error', (error) => {
      console.error('Socket: Authentication failed:', error.message);
      setIsAuthenticated(false);
    });
    
    setSocket(newSocket);
    
    return () => {
      console.log('Socket: Cleaning up connection');
      newSocket.disconnect();
    };
  }, []);

  // Sync authentication state when AuthContext state changes
  useEffect(() => {
    if (socket && isConnected && userIsAuthenticated && token && !isAuthenticated) {
      reauthenticate();
    } else if (socket && isAuthenticated && !userIsAuthenticated) {
      console.log('Socket: User logged out, clearing state');
      setIsAuthenticated(false);
      socket.disconnect();
      setTimeout(() => socket.connect(), 500);
    }
  }, [socket, isConnected, token, userIsAuthenticated, isAuthenticated, reauthenticate]);

  // Periodic check to ensure we stay authenticated if connected
  useEffect(() => {
    const authCheckInterval = setInterval(() => {
      if (socket && isConnected && userIsAuthenticated && !isAuthenticated) {
        console.log('Socket: Watchdog detected connected but unauthenticated state, retrying...');
        reauthenticate();
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(authCheckInterval);
  }, [socket, isConnected, userIsAuthenticated, isAuthenticated, reauthenticate]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isAuthenticated, reauthenticate }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 