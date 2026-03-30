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

  const colorClasses = {
    default: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  const color = colorClasses[statusVariant];

  const renderCenter = () => {
    if (showPercentage) {
      return (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          className="fill-white text-xs font-medium"
          style={{ fontSize: size * 0.2 }}
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
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
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
          <span className="text-white text-xs font-medium">{label}</span>
        </div>
      ) : (
        renderCenter()
      )}
    </div>
  );
};

export default CircularProgress;
