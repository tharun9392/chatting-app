import React from 'react';
import { 
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements
} from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import AdminChat from './pages/AdminChat';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import CallOverlay from './components/CallOverlay';

// Create router
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat/:chatId" element={
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/chat/:chatId" element={
        <ProtectedRoute requiredRole="admin">
          <AdminChat />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    } as any,
  }
);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <ToastContainer />
          <SocketProvider>
            <CallProvider>
              <CallOverlay />
              <RouterProvider 
                router={router} 
                future={{
                  v7_startTransition: true,
                }}
              />
            </CallProvider>
          </SocketProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
