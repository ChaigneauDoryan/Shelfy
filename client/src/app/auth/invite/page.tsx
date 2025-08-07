
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState(''); // Pour afficher le nom du groupe

  useEffect(() => {
    const handleInvitation = async () => {
      const token = searchParams.get('token');
      const groupId = searchParams.get('groupId');

      if (!token || !groupId) {
        setError('Lien d\'invitation invalide ou incomplet.');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Rediriger vers la connexion/inscription si l'utilisateur n'est pas connecté
        router.push(`/auth/login?redirectTo=/auth/invite?token=${token}&groupId=${groupId}`);
        return;
      }

      // Récupérer le nom du groupe (pour l'affichage)
      const { data: groupData, error: groupError } = await supabase
        .from('groups') // Supposons une table 'groups' avec id et name
        .select('name')
        .eq('id', groupId)
        .single();

      if (groupData) {
        setGroupName(groupData.name);
      }

      // Appeler l'API backend pour accepter l'invitation
      try {
        const response = await fetch(`/api/groups/accept-invitation?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Ajoutez ici le token d'authentification si nécessaire (ex: Bearer token)
            // 'Authorization': `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Échec de l\'acceptation de l\'invitation.');
        }

        setMessage(`Vous avez rejoint le groupe ${groupName || 'avec succès'} !`);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    handleInvitation();
  }, [router, searchParams, supabase, groupName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Chargement de l'invitation...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Veuillez patienter pendant que nous traitons votre invitation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>{error ? 'Erreur' : 'Invitation'}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-green-600">{message}</p>
          )}
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Retour au tableau de bord
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
