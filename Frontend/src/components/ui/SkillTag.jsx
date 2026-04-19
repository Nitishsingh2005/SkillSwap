import React from 'react';
import { cn } from '../../utils/cn';

export const SkillTag = ({ skill, type = 'offered', className }) => {
  const isOffered = type === 'offered';
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
        isOffered 
          ? "bg-accent text-white shadow-sm" 
          : "bg-transparent border border-border text-ink-muted hover:text-ink hover:border-ink-muted",
        className
      )}
    >
      {skill}
    </span>
  );
};
