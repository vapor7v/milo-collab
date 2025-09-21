import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-16 w-16 border-4',
  xl: 'h-32 w-32 border-4',
};

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: 'primary' | 'secondary';
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  fullScreen = false,
}) => {
  const sizeClass = sizeClasses[size];
  const variantClass = variant === 'primary' ? 'border-primary' : 'border-secondary';

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex justify-center items-center bg-background/80 backdrop-blur-sm animate-fade-in'
    : `flex justify-center items-center ${className} animate-fade-in`;

  return (
    <div className={containerClass}>
      <div
        className={`animate-spin rounded-full border-t-transparent border-solid ${sizeClass} ${variantClass}`}>
      </div>
    </div>
  );
};

export default LoadingSpinner;
