import { cn } from '@/lib/utils';
import { Award } from 'lucide-react';

interface DonorBadgeProps {
  badge: 'none' | 'bronze' | 'silver' | 'gold';
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showPoints?: boolean;
}

const badgeConfig = {
  none: {
    label: 'New Member',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-muted',
  },
  bronze: {
    label: 'Bronze Donor',
    color: 'text-bronze',
    bg: 'bg-bronze/10',
    border: 'border-bronze/30',
  },
  silver: {
    label: 'Silver Donor',
    color: 'text-silver',
    bg: 'bg-silver/10',
    border: 'border-silver/30',
  },
  gold: {
    label: 'Gold Donor',
    color: 'text-gold',
    bg: 'bg-gold/10',
    border: 'border-gold/30',
  },
};

const sizeConfig = {
  sm: {
    container: 'px-2 py-1 gap-1',
    icon: 'h-3.5 w-3.5',
    text: 'text-xs',
  },
  md: {
    container: 'px-3 py-1.5 gap-1.5',
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
  lg: {
    container: 'px-4 py-2 gap-2',
    icon: 'h-5 w-5',
    text: 'text-base',
  },
};

export function DonorBadge({ badge, points, size = 'md', showPoints = true }: DonorBadgeProps) {
  const config = badgeConfig[badge];
  const sizes = sizeConfig[size];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.bg,
        config.border,
        sizes.container
      )}
    >
      <Award className={cn(sizes.icon, config.color)} />
      <span className={cn(sizes.text, config.color)}>{config.label}</span>
      {showPoints && (
        <span className={cn(sizes.text, "text-muted-foreground")}>
          • {points} pts
        </span>
      )}
    </div>
  );
}

export function getBadgeFromPoints(points: number): 'none' | 'bronze' | 'silver' | 'gold' {
  if (points >= 50) return 'gold';
  if (points >= 30) return 'silver';
  if (points >= 10) return 'bronze';
  return 'none';
}

export function getNextBadgeInfo(points: number) {
  if (points >= 50) return { next: null, pointsNeeded: 0 };
  if (points >= 30) return { next: 'gold' as const, pointsNeeded: 50 - points };
  if (points >= 10) return { next: 'silver' as const, pointsNeeded: 30 - points };
  return { next: 'bronze' as const, pointsNeeded: 10 - points };
}
