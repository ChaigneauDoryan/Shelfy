'use client'

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';

// Fonction pour agréger les données par période
const aggregateData = (data: any[], period: 'week' | 'month' | 'year') => {
  if (!data) return [];

  const aggregated = data.reduce((acc, item) => {
    const date = new Date(item.finished_date);
    let key = '';

    if (period === 'week') {
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      key = weekStart.toISOString().split('T')[0];
    } else if (period === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else { // year
      key = date.getFullYear().toString();
    }

    if (!acc[key]) {
      acc[key] = { date: key, livres: 0 };
    }
    acc[key].livres += item.books_count;
    return acc;
  }, {} as { [key: string]: { date: string; livres: number } });

  return (Object.values(aggregated) as { date: string; livres: number }[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export default function ReadingActivityChart() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc('get_reading_activity', { p_user_id: user.id });
        if (error) {
          console.error('Error fetching reading activity:', error);
        } else {
          setRawData(data || []);
        }
      }
      setLoading(false);
    };
    fetchActivity();
  }, [supabase]);

  const chartData = aggregateData(rawData, period);

  if (loading) {
    return <div>Chargement du graphique...</div>;
  }

  return (
    <div>
      <div className="flex justify-end space-x-2 mb-4">
        <button onClick={() => setPeriod('week')} className={`px-3 py-1 rounded ${period === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Semaine</button>
        <button onClick={() => setPeriod('month')} className={`px-3 py-1 rounded ${period === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Mois</button>
        <button onClick={() => setPeriod('year')} className={`px-3 py-1 rounded ${period === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Année</button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="livres" fill="#8884d8" name="Livres Lus" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
