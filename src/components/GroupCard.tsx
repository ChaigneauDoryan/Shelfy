
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { FaUsers, FaBookOpen, FaTrash, FaPencilAlt } from 'react-icons/fa';
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
    invitation_code?: string;
    user_role?: string; // Nouveau: rôle de l'utilisateur dans ce groupe
    members_count?: number; // Ajouté: nombre de membres du groupe
  };
  currentUserId: string; // L'ID de l'utilisateur actuellement connecté
  onGroupChange: () => void; // Nouvelle prop pour rafraîchir les groupes
}

export default function GroupCard({ group, currentUserId, onGroupChange }: GroupCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [currentInvitationCode, setCurrentInvitationCode] = useState(group.invitation_code);
  const { toast } = useToast();

  const handleCopyCode = () => {
    if (!currentInvitationCode) return;
    navigator.clipboard.writeText(currentInvitationCode);
    toast({ title: 'Copié !', description: "Le code d'invitation a été copié dans le presse-papiers." });
  };

  const handleRegenerateCode = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Non authentifié");

      const response = await fetch(`/api/groups/${group.id}/regenerate-code`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error("Échec de la régénération");

      const data = await response.json();
      setCurrentInvitationCode(data.invitation_code);
      toast({ title: 'Succès', description: "Le code d'invitation a été régénéré." });

    } catch (error) {
      toast({ title: 'Erreur', description: "Impossible de régénérer le code.", variant: 'destructive' });
    }
  };

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
      onGroupChange(); // Appeler la fonction de rafraîchissement
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

  const handleLeaveConfirm = async () => {
    setIsLeaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour quitter un groupe.",
          variant: "destructive",
        });
        setIsLeaving(false);
        setShowLeaveConfirmModal(false);
        return;
      }

      const response = await fetch(`/api/groups/${group.id}/leave`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec pour quitter le groupe.');
      }

      toast({
        title: "Succès",
        description: "Vous avez quitté le groupe avec succès !",
      });
      onGroupChange(); // Appeler la fonction de rafraîchissement
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Erreur lors de la sortie du groupe : ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirmModal(false);
    }
  };

  const isAdmin = group.user_role === 'admin';

  return (
    <Card key={group.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col">
      <CardHeader className="flex flex-row items-center space-x-4 p-4">
        <img src={group.avatar_url || `https://via.placeholder.com/150/33FF57/FFFFFF?text=${group.name.substring(0, 2)}`} alt={group.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500" />
        <div className="flex-grow">
          <CardTitle className="text-xl font-semibold text-gray-900">{group.name}</CardTitle>
          <p className="text-sm text-gray-500 flex items-center"><FaUsers className="mr-1" /> {group.members_count || 0} membre{((group.members_count || 0) > 1 || (group.members_count || 0) === 0) ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/groups/${group.id}/edit`)}
            >
              <FaPencilAlt />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowConfirmModal(true)}
              disabled={isDeleting}
            >
              <FaTrash />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-gray-700 mb-3 line-clamp-2">{group.description || 'Aucune description.'}</p>
        {isAdmin && currentInvitationCode && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Code d'invitation :</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg tracking-widest text-gray-800">{currentInvitationCode}</span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost" onClick={handleCopyCode}>Copier</Button>
                <Button size="sm" variant="outline" onClick={handleRegenerateCode}>Régénérer</Button>
              </div>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-600 flex items-center mt-4"><FaBookOpen className="mr-1" /> Lecture actuelle: <span className="font-medium ml-1">Non défini</span></p>
      </CardContent>
      <div className="p-4 pt-0 flex space-x-2">
        <Button className="flex-1 bg-green-500 hover:bg-green-600 text-sm px-3 py-2">Voir le groupe</Button>
        {!isAdmin && (
          <Button
            variant="outline"
            className="flex-1 text-sm px-3 py-2"
            onClick={() => setShowLeaveConfirmModal(true)}
            disabled={isLeaving}
          >
            Quitter le groupe
          </Button>
        )}
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

      <ConfirmModal
        isOpen={showLeaveConfirmModal}
        onClose={() => setShowLeaveConfirmModal(false)}
        onConfirm={handleLeaveConfirm}
        title="Confirmer la sortie du groupe"
        message={`Êtes-vous sûr de vouloir quitter le groupe "${group.name}" ? Vous devrez être réinvité pour le rejoindre.`}
        confirmText="Quitter"
        cancelText="Annuler"
        isConfirming={isLeaving}
      />
    </Card>
  );
}

