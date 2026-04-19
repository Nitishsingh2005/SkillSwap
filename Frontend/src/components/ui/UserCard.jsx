import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SkillTag } from './SkillTag';
import { StarRating } from './StarRating';

export const UserCard = ({
  user,
  actionButton,
  className
}) => {
  const avatarUrl = user?.avatar 
    ? `${import.meta.env.VITE_API_URL}${user.avatar}` 
    : null;

  const offeredSkills = user?.skillsOffered || [];
  const wantedSkills = user?.skillsWanted || [];

  return (
    <div className={cn("bg-surface-2 border border-border rounded-xl p-5 hover:shadow-md transition-shadow duration-300", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-surface" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-border flex items-center justify-center text-ink-muted text-xl font-bold">
              {user?.name?.charAt(0) || '?'}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-1.5 border-b border-transparent">
              <h3 className="text-lg font-bold text-ink tracking-tight">{user?.name || 'Unknown'}</h3>
              {/* Optional verified badge placeholder */}
              {user?.isVerified && <ShieldCheck className="w-4 h-4 text-green" />}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={user?.rating || user?.avgRating || 0} max={5} interactive={false} />
              <span className="text-xs text-ink-muted">({user?.reviewCount || 0} reviews)</span>
            </div>
          </div>
        </div>
        
        {actionButton && (
          <div className="ml-2">
            {actionButton}
          </div>
        )}
      </div>

      <div className="space-y-3 mt-4">
        {offeredSkills.length > 0 && (
          <div>
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold block mb-1.5">Teaches</span>
            <div className="flex flex-wrap gap-1.5">
              {offeredSkills.map(skill => (
                <SkillTag key={skill} skill={skill} type="offered" />
              ))}
            </div>
          </div>
        )}
        
        {wantedSkills.length > 0 && (
          <div>
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold block mb-1.5">Learns</span>
            <div className="flex flex-wrap gap-1.5">
              {wantedSkills.map(skill => (
                <SkillTag key={skill} skill={skill} type="wanted" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
