import React from 'react';

// Simplified as branding is now in the sidebar to match Flim.ai layout
const Logo = () => (
  <div className="absolute top-6 left-24 z-30 pointer-events-none">
    <h1 className="text-white font-bold text-xl leading-tight tracking-tight">L'ami Charrette</h1>
    <div className="flex items-center gap-2 mt-1">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Interactive Studio</p>
    </div>
  </div>
);

export default Logo;