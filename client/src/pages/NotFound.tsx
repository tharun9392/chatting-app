import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-extrabold text-gray-400 dark:text-gray-600">404</h1>
        <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">Page Not Found</h2>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 