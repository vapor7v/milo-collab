import React from 'react';

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  background?: 'default' | 'gradient';
}

const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(({ className, background = 'default', ...props }, ref) => {
  const backgroundClasses = {
    default: 'bg-background text-foreground',
    gradient: 'bg-primary-50 dark:bg-primary-900/20 text-foreground'
  };

  return (
    <div
      className={`min-h-screen w-full ${backgroundClasses[background]} ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Layout.displayName = 'Layout';

const Container = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  return (
    <div
      className={`container mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Container.displayName = 'Container';

export { Layout, Container };
