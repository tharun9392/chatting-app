import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect to home if already authenticated
  useEffect(() => {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-dark-900 text-slate-800 dark:text-slate-200 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-pulse-slow font-sans" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="z-10 relative text-center mb-8 animate-fade-in">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <img src="/logo123.png" alt="Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-blue-500 tracking-tight">SecureChat</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">Create an account to get started</p>
      </div>
      
      <div className="z-10 w-full animate-slide-up">
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register; 