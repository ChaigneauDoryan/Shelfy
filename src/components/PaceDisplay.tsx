'use client'

import { FaHourglassHalf, FaUser, FaBolt } from 'react-icons/fa6';

const PACE_INFO = {
  occasional: { label: 'Occasionnel', Icon: FaHourglassHalf, color: 'text-blue-500' },
  regular: { label: 'Régulier', Icon: FaUser, color: 'text-green-500' },
  passionate: { label: 'Passionné', Icon: FaBolt, color: 'text-orange-500' },
};

interface PaceDisplayProps {
  pace: 'occasional' | 'regular' | 'passionate' | null;
}

export default function PaceDisplay({ pace }: PaceDisplayProps) {
  const currentPace = pace ? PACE_INFO[pace] : null;

  if (!currentPace) {
    return (
      <div>
        <h3 className="font-semibold mb-2">Rythme de Lecture</h3>
        <p className="text-sm text-gray-500">Pas encore de données.</p>
      </div>
    );
  }

  const { label, Icon, color } = currentPace;

  return (
    <div>
      <h3 className="font-semibold mb-4 text-lg">Rythme de Lecture</h3>
      <div className={`flex items-center gap-4 p-4 rounded-lg bg-gray-50`}>
        <Icon className={`w-10 h-10 ${color}`} />
        <div>
          <p className={`text-xl font-bold ${color}`}>{label}</p>
          <p className="text-sm text-gray-600">Basé sur votre activité des 30 derniers jours.</p>
        </div>
      </div>
    </div>
  );
}
