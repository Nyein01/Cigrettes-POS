import React, { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2',
    left: 'right-[-4px] top-1/2 -translate-y-1/2',
    right: 'left-[-4px] top-1/2 -translate-y-1/2',
  };

  return (
    <div className={`group relative flex items-center justify-center ${className}`}>
      {children}
      <div className={`absolute ${positionClasses[position]} w-max max-w-[200px] bg-slate-800 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] pointer-events-none text-center leading-tight border border-slate-700/50 backdrop-blur-sm select-none`}>
        {content}
        <div className={`absolute w-2 h-2 bg-slate-800 rotate-45 ${arrowClasses[position]}`}></div>
      </div>
    </div>
  );
};