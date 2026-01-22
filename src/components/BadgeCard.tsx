'use client'

import { FaBook, FaStar, FaShoePrints, FaBookReader, FaCalendarCheck, FaCompass } from 'react-icons/fa';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mapping des noms d'icônes aux composants d'icônes réels
const iconMap: { [key: string]: React.ElementType } = {
  FaBook,
  FaStar,
  FaShoePrints,
  FaBookReader,
  FaCalendarCheck,
  FaCompass,
};

interface BadgeCardProps {
  badge: {
    name: string;
    description: string;
    icon_name: string;
    unlocked_at: string;
  };
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  const IconComponent = iconMap[badge.icon_name] || FaStar; // FaStar comme icône par défaut
  const unlockedDate = badge.unlocked_at ? new Date(badge.unlocked_at) : null;
  const unlockedDateLabel =
    unlockedDate && !Number.isNaN(unlockedDate.getTime())
      ? unlockedDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'inconnue';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-gray-50 text-center space-y-2 transition-transform hover:scale-105">
            <IconComponent className="w-10 h-10 text-yellow-500" />
            <p className="font-semibold text-gray-800">{badge.name}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold">{badge.description}</p>
          <p className="text-sm text-gray-500">Débloqué le {unlockedDateLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
