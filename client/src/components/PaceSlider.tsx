'use client'

import { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";

const PACE_LEVELS = {
  1: { label: '🐢 Occasionnel', value: 'occasional' },
  2: { label: '🐇 Régulier', value: 'regular' },
  3: { label: '🐆 Passionné', value: 'passionate' },
};

type PaceValue = 'occasional' | 'regular' | 'passionate';

interface PaceSliderProps {
  initialPace: PaceValue;
  onPaceChange: (pace: PaceValue) => void;
}

export default function PaceSlider({ initialPace, onPaceChange }: PaceSliderProps) {
  const initialLevel = Object.keys(PACE_LEVELS).find(key => PACE_LEVELS[key as any].value === initialPace) || 1;
  const [level, setLevel] = useState<number>(Number(initialLevel));

  const handleValueChange = (newLevel: number[]) => {
    const value = newLevel[0];
    setLevel(value);
    onPaceChange(PACE_LEVELS[value as keyof typeof PACE_LEVELS].value as PaceValue);
  };

  useEffect(() => {
    const newLevel = Object.keys(PACE_LEVELS).find(key => PACE_LEVELS[key as any].value === initialPace) || 1;
    setLevel(Number(newLevel));
  }, [initialPace]);

  return (
    <div className="w-full px-2">
      <Slider
        min={1}
        max={3}
        step={1}
        value={[level]}
        onValueChange={handleValueChange}
      />
      <div className="flex justify-between text-center mt-2 text-sm text-gray-600">
        <span>{PACE_LEVELS[1].label}</span>
        <span>{PACE_LEVELS[2].label}</span>
        <span>{PACE_LEVELS[3].label}</span>
      </div>
    </div>
  );
}
