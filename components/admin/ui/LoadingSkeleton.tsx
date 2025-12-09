import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 5 }) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-xl mb-3" />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
