
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { FaUsers, FaBookOpen, FaTrash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/hooks/use-toast';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    created_by: string; // L'ID de l'utilisateur qui a créé le groupe
    members_count?: number; // Nouveau: nombre de membres
    pending_invitations_count?: number; // Nouveau: nombre d'invitations en attente
  };
  currentUserId: string; // L'ID de l'utilisateur actuellement connecté
}

export default function GroupCard({ group, currentUserId }: GroupCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast } = useToast();

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour supprimer un groupe.",
          variant: "destructive",
        });
        setIsDeleting(false);
        setShowConfirmModal(false);
        return;
      }

      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la suppression du groupe.');
      }

      toast({
        title: "Succès",
        description: "Groupe supprimé avec succès !",
      });
      router.refresh(); // Rafraîchir la page pour refléter la suppression
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression du groupe : ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  const isCreator = group.created_by === currentUserId;

  return (
    <Card key={group.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col">
      <CardHeader className="flex flex-row items-center space-x-4 p-4">
        <img src={group.avatar_url || `https://via.placeholder.com/150/33FF57/FFFFFF?text=${group.name.substring(0, 2)}`} alt={group.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500" />
        <div className="flex-grow">
          <CardTitle className="text-xl font-semibold text-gray-900">{group.name}</CardTitle>
          <p className="text-sm text-gray-500 flex items-center"><FaUsers className="mr-1" /> {group.members_count || 0} membre{((group.members_count || 0) > 1 || (group.members_count || 0) === 0) ? 's' : ''}</p>
          {group.pending_invitations_count && group.pending_invitations_count > 0 && (
            <p className="text-xs text-yellow-600 flex items-center mt-1">
              <FaUsers className="mr-1" /> {group.pending_invitations_count} invitation{group.pending_invitations_count > 1 ? 's' : ''} en attente
            </p>
          )}
        </div>
        {isCreator && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowConfirmModal(true)}
            disabled={isDeleting}
            className="ml-auto"
          >
            <FaTrash />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-gray-700 mb-3 line-clamp-2">{group.description || 'Aucune description.'}</p>
        <p className="text-sm text-gray-600 flex items-center"><FaBookOpen className="mr-1" /> Lecture actuelle: <span className="font-medium ml-1">Non défini</span></p>
      </CardContent>
      <div className="p-4 pt-0">
        <Button className="w-full bg-green-500 hover:bg-green-600">Voir le groupe</Button>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le groupe "${group.name}" ? Cette action est irréversible et supprimera également tous les membres et données associées à ce groupe.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isConfirming={isDeleting}
      />
    </Card>
  );
}

