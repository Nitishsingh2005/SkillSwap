import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

export const StarRating = ({ rating, max = 5, interactive = false, onChange, className }) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;
        
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(starValue)}
            className={cn(
              "focus:outline-none transition-transform",
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            )}
          >
            <Star 
              className={cn(
                "w-4 h-4",
                isFilled ? "text-yellow-400 fill-current" : "text-border"
              )} 
            />
          </button>
        );
      })}
    </div>
  );
};
