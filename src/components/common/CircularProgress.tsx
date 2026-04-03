import React from 'react';
import { ProgressStatus } from './ProgressBar';

export interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  status?: ProgressStatus;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  className?: string;
  label?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 48,
  strokeWidth = 4,
  status = 'idle',
  variant,
  showPercentage = true,
  className = '',
  label,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedProgress / 100) * circumference;

  const statusVariant = variant || (status === 'completed' ? 'success' : status === 'error' ? 'error' : 'default');

  const colorVars = {
    default: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
  };

  const color = colorVars[statusVariant];

  const renderCenter = () => {
    if (showPercentage) {
      return (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          fill="var(--color-text-primary)"
          style={{ fontSize: size * 0.2 }}
          className="font-medium"
        >
          {Math.round(clampedProgress)}%
        </text>
      );
    }
    return null;
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-progress-track)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {label ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-text-primary text-xs font-medium">{label}</span>
        </div>
      ) : (
        renderCenter()
      )}
    </div>
  );
};

export default CircularProgress;
