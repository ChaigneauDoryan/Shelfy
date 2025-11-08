'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book } from "@prisma/client";

export default function DiscoverPage() {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/books/recommendations');
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations);
        } else {
          console.error('Failed to fetch recommendations');
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Découvrir</h1>
        <p className="text-gray-600">Des recommandations de livres basées sur vos goûts.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Recommandations pour vous</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement des recommandations...</p>
          ) : recommendations.length === 0 ? (
            <p>Nous n'avons pas encore assez d'informations pour vous recommander des livres. Continuez à lire !</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map(book => (
                <div key={book.id} className="flex flex-col items-center space-y-2">
                  <img src={book.cover_url || '/file.svg'} alt={book.title} className="w-32 h-48 object-cover" />
                  <h3 className="font-semibold text-center">{book.title}</h3>
                  <p className="text-sm text-muted-foreground text-center">{book.author}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}