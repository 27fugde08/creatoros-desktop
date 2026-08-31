import React from "react";

export const SkeletonFallback: React.FC = () => {
  return (
    <div className="w-full h-full animate-pulse p-4">
      {/* Header Skeleton */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="h-10 w-10 bg-slate-800 rounded-lg"></div>
        <div className="h-8 w-48 bg-slate-800 rounded-md"></div>
      </div>
      
      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="h-32 bg-slate-800 rounded-xl w-full"></div>
          <div className="h-12 bg-slate-800 rounded-lg w-3/4"></div>
          <div className="h-12 bg-slate-800 rounded-lg w-full"></div>
          <div className="h-24 bg-slate-800 rounded-xl w-full mt-8"></div>
        </div>
        
        <div className="lg:col-span-7 space-y-4">
          <div className="h-16 bg-slate-800 rounded-xl w-full"></div>
          <div className="aspect-video bg-slate-800 rounded-2xl w-full"></div>
          <div className="h-20 bg-slate-800 rounded-xl w-full"></div>
          <div className="h-20 bg-slate-800 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  );
};
