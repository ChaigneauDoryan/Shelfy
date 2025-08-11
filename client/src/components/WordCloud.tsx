'use client'

import React from 'react';

interface WordCloudProps {
  data: { name: string; count: number }[];
  title: string;
}

// Fonction pour déterminer la taille de la police en fonction du nombre de lectures
const getFontSize = (count: number, maxCount: number) => {
  if (maxCount === 0) return '1rem'; // 16px
  const minSize = 0.875; // 14px
  const maxSize = 2.25; // 36px
  const size = minSize + (maxSize - minSize) * (count / maxCount);
  return `${size}rem`;
};

export default function WordCloud({ data, title }: WordCloudProps) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-500">Pas encore de données.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(item => item.count));

  return (
    <div>
      <h3 className="font-semibold mb-4 text-lg">{title}</h3>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {data.map(item => (
          <span 
            key={item.name}
            style={{ fontSize: getFontSize(item.count, maxCount) }}
            className="font-bold text-gray-700 hover:text-blue-600 transition-colors duration-200"
          >
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}
