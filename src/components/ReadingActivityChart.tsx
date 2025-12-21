'use client'

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSession } from 'next-auth/react';
import type { ReadingActivityPoint } from '@/types/domain';
import { cn } from '@/lib/utils';

// Fonction pour agréger les données par période
type SeriesPoint = { date: string; livres: number };

type Period = 'week' | 'month' | 'year';

const aggregateData = (data: ReadingActivityPoint[], period: Period) => {
  if (!data) return [];

  const aggregated = data.reduce<Record<string, SeriesPoint>>((acc, item) => {
    if (!item.finished_at) {
      return acc;
    }
    const date = new Date(item.finished_at);
    let key = '';

    if (period === 'week') {
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      key = weekStart.toISOString().split('T')[0];
    } else if (period === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else { // year
      key = date.getFullYear().toString();
    }

    const existing = acc[key];
    acc[key] = {
      date: key,
      livres: (existing?.livres ?? 0) + item.books_count,
    };
    return acc;
  }, {});

  return Object.values(aggregated).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export default function ReadingActivityChart() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [rawData, setRawData] = useState<ReadingActivityPoint[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [isCompact, setIsCompact] = useState(false);

  const fetchActivity = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch('/api/profile/reading-activity');
      if (!response.ok) {
        throw new Error('Failed to fetch reading activity');
      }
      const data: ReadingActivityPoint[] = await response.json();
      setRawData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reading activity:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const chartData = aggregateData(rawData, period);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => setIsCompact(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading || status === 'loading') {
    return <div>Chargement du graphique...</div>;
  }

  if (!userId) {
    return <div>Veuillez vous connecter pour voir votre activité.</div>;
  }

  const hasData = chartData.length > 0;

  const periodButtonClasses = (target: Period) =>
    `px-3 py-1 rounded-full text-sm transition-colors ${
      period === target ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">Livres terminés</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPeriod('week')} className={periodButtonClasses('week')}>Semaine</button>
          <button onClick={() => setPeriod('month')} className={periodButtonClasses('month')}>Mois</button>
          <button onClick={() => setPeriod('year')} className={periodButtonClasses('year')}>Année</button>
        </div>
      </div>
      {!hasData && <p className="text-sm text-muted-foreground">Pas encore de données pour cette période.</p>}
      {hasData && (
        <>
          <div className="sm:hidden">
            <ul className="space-y-2">
              {chartData.map((point) => (
                <li key={point.date} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                  <span className="font-medium">{point.date}</span>
                  <span className="text-muted-foreground">{point.livres} livre(s)</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={cn('hidden sm:block', isCompact ? 'opacity-50' : 'opacity-100')}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="livres" fill="#6366f1" name="Livres Lus" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
