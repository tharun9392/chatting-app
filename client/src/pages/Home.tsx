import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#111b21] p-8 text-center">
      <div className="max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-light text-gray-700 dark:text-gray-300 mb-4">
          SecureChat for Web
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Send and receive end-to-end encrypted messages without keeping your phone online.
          Use SecureChat on up to 4 linked devices and 1 phone at the same time.
        </p>
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            End-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
