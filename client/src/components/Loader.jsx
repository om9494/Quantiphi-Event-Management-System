import React from 'react';

// Simple centered spinner — used as page-level loading indicator
const Loader = ({ message = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

export default Loader;
