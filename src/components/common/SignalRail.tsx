import React from 'react';

interface SignalRailProps {
  status?: 'delivered' | 'processing' | 'failed' | 'idle' | 'online' | 'degraded' | 'offline';
  bars?: number;
  className?: string;
  label?: string;
  size?: 'xs'| 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const SignalRail: React.FC<SignalRailProps> = ({
  status = 'online',
  bars = 5,
  className = '',
  label,
  size = 'md',
  animated = true,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'delivered':
      case 'online':
        return {
          bar: 'bg-emerald-500 dark:bg-emerald-400',
          dot: 'bg-emerald-500',
          ring: 'border-emerald-500/30',
          text: 'text-emerald-700 dark:text-emerald-400'
        };
      case 'degraded':
        return {
          bar: 'bg-amber-500 dark:bg-amber-400',
          dot: 'bg-amber-500',
          ring: 'border-amber-500/30',
          text: 'text-amber-700 dark:text-amber-400'
        };
      case 'offline':
      case 'failed':
        return {
          bar: 'bg-destructive dark:bg-destructive',
          dot: 'bg-destructive',
          ring: 'border-destructive/30',
          text: 'text-destructive dark:text-destructive'
        };
      case 'processing':
        return {
          bar: 'bg-primary dark:bg-primary',
          dot: 'bg-primary',
          ring: 'border-primary/30',
          text: 'text-primary dark:text-primary'
        };
      case 'failed':
        return {
          bar: 'bg-destructive dark:bg-destructive',
          dot: 'bg-destructive',
          ring: 'border-destructive/30',
          text: 'text-destructive dark:text-destructive'
        };
      case 'idle':
      default:
        return {
          bar: 'bg-muted-foreground/40',
          dot: 'bg-muted-foreground',
          ring: 'border-muted-foreground/20',
          text: 'text-muted-foreground'
        };
    }
  };

  const colors = getStatusColor();
  const heights = [35, 50, 68, 85, 100]; // stepped heights like telecom signal bars & kente rhythm

  const getContainerHeight = () => {
    if (size === 'xs') return 'h-3';
    if (size === 'sm') return 'h-3.5';
    if (size === 'lg') return 'h-6';
    return 'h-4.5';
  };

  const getBarWidth = () => {
    if (size === 'xs') return 'w-[2.5px]';
    if (size === 'sm') return 'w-1';
    if (size === 'lg') return 'w-1.5';
    return 'w-1.25';
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`flex items-end gap-1 ${getContainerHeight()}`} title={`SDH Signal: ${status}`}>
        {Array.from({ length: bars }).map((_, i) => {
          const heightPercent = heights[i % heights.length];
          const isPulsing = animated && status === 'processing';
          const animationClass = isPulsing ? `animate-signal-${(i % 5) + 1}` : '';

          return (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${getBarWidth()} ${colors.bar} ${animationClass}`}
              style={{
                height: `${heightPercent}%`,
              }}
            />
          );
        })}
      </div>
      {label && (
        <span className={`text-xs font-medium tracking-tight tabular-nums ${colors.text}`}>
          {label}
        </span>
      )}
    </div>
  );
};
