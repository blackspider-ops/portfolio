'use client';

import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'push' | 'blog' | 'deploy' | 'project';
  title: string;
  href?: string;
  timestamp: string;
}

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

const typeIcons: Record<ActivityItem['type'], string> = {
  push: '⚡',
  blog: '📝',
  deploy: '🚀',
  project: '🔧',
};

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-surface border border-muted/20 rounded-lg p-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted mb-4">ACTIVITY LOG</h3>
        <p className="text-muted text-sm font-mono">// No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-muted/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted">ACTIVITY LOG</h3>
      </div>
      
      <ul className="space-y-2">
        {activities.slice(0, 5).map((activity) => (
          <li key={activity.id} className="text-sm flex items-start gap-2">
            <span className="text-xs mt-0.5">{typeIcons[activity.type]}</span>
            {activity.href ? (
              <Link 
                href={activity.href} 
                className="text-text hover:text-blue transition-colors line-clamp-1"
                target={activity.href.startsWith('http') ? '_blank' : undefined}
                rel={activity.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {activity.title}
              </Link>
            ) : (
              <span className="text-text line-clamp-1">{activity.title}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
