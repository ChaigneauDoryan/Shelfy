'use client'

import React, { useState, useEffect } from 'react';

interface WordCloudProps {
  data: { name: string; count: number }[];
  title: string;
}

export default function WordCloud({ data, title }: WordCloudProps) {
  const [wordStyles, setWordStyles] = useState<{ [key: string]: React.CSSProperties }>({});
  const [reorderedData, setReorderedData] = useState(data);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Reorder data to place the most important word in the middle
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    const mostImportant = sortedData.shift();
    if (mostImportant) {
      const middleIndex = Math.floor(sortedData.length / 2);
      sortedData.splice(middleIndex, 0, mostImportant);
    }
    setReorderedData(sortedData);

    const maxCount = Math.max(...data.map(item => item.count));
    const newStyles: { [key: string]: React.CSSProperties } = {};

    sortedData.forEach((item, index) => {
      const minSize = 0.875; // 14px
      const maxSize = 2.25;  // 36px
      const size = maxCount > 0 ? minSize + (maxSize - minSize) * (item.count / maxCount) : minSize;
      
      const randomY = Math.floor(Math.random() * 20 - 10);
      const randomX = Math.floor(Math.random() * 10 - 5);

      newStyles[`${item.name}-${index}`] = {
        fontSize: `${size}rem`,
        display: 'inline-block',
        transform: `translate(${randomX}px, ${randomY}px)`,
        padding: '4px 8px',
        lineHeight: '1.2',
      };
    });

    setWordStyles(newStyles);
  }, [data]);

  if (!reorderedData || reorderedData.length === 0) {
    return (
      <div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-500">Pas encore de données.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold mb-4 text-lg">{title}</h3>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 p-4 rounded-lg bg-gray-50" style={{ minHeight: '150px' }}>
        {reorderedData.map((item, index) => (
          <span 
            key={`${item.name}-${index}`}
            style={wordStyles[`${item.name}-${index}`]}
            className="font-bold text-gray-700 hover:text-blue-600 transition-all duration-300 ease-in-out hover:scale-110"
          >
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}
