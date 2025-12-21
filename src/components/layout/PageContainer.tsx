import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('w-full max-w-6xl mx-auto px-4 pb-24 pt-6 xs:px-5 sm:px-6 md:px-8 lg:px-10 md:pb-12', className)}>
      {children}
    </div>
  );
}
