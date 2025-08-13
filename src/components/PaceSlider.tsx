'use client'

import { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";

const PACE_LEVELS = {
  occasional: { label: 'Occasionnel', value: 'occasional' },
  regular: { label: 'Régulier', value: 'regular' },
  passionate: { label: 'Passionné', value: 'passionate' },
};

type PaceValue = 'occasional' | 'regular' | 'passionate';

interface PaceSliderProps {
  initialPace: PaceValue;
  onPaceChange: (pace: PaceValue) => void;
}

export default function PaceSlider({ initialPace, onPaceChange }: PaceSliderProps) {
  const initialLevel = initialPace ? Object.keys(PACE_LEVELS).indexOf(initialPace) + 1 : 1;
  const [level, setLevel] = useState<number>(Number(initialLevel));

  const handleValueChange = (newLevel: number[]) => {
    const value = newLevel[0];
    const paceKey = Object.keys(PACE_LEVELS)[value - 1] as PaceValue;
    setLevel(value);
    onPaceChange(paceKey);
  };

  useEffect(() => {
    const newLevel = initialPace ? Object.keys(PACE_LEVELS).indexOf(initialPace) + 1 : 1;
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
        <span>{PACE_LEVELS.occasional.label}</span>
        <span>{PACE_LEVELS.regular.label}</span>
        <span>{PACE_LEVELS.passionate.label}</span>
      </div>
    </div>
  );
}
