import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="page-header-title mb-2 text-3xl font-bold">{title}</h1>
      {description && <p className="page-header-description text-lg">{description}</p>}
    </header>
  );
}
