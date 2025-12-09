'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { FaUsers, FaBookOpen, FaTrash, FaPencilAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { generateAvatarFromText } from '@/lib/avatar-utils';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    invitation_code?: string;
    user_role?: string;
    members_count?: number;
    is_archived?: boolean; // Ajout du champ
  };
  currentUserId: string;
  onGroupChange: () => void;
}

export default function GroupCard({ group, currentUserId, onGroupChange }: GroupCardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
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
      if (status !== 'authenticated') throw new Error("Non authentifié");

      const response = await fetch(`/api/groups/${group.id}/regenerate-code`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error("Échec de la régénération");

      const data = await response.json();
      setCurrentInvitationCode(data.invitation_code);
      toast({ title: 'Succès', description: "Le code d'invitation a été régénéré." });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast({ title: 'Erreur', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      if (status !== 'authenticated') {
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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la suppression du groupe.');
      }

      toast({
        title: "Succès",
        description: "Groupe supprimé avec succès !",
      });
      onGroupChange();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression du groupe : ${errorMessage}`,
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
      if (status !== 'authenticated') {
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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec pour quitter le groupe.');
      }

      toast({
        title: "Succès",
        description: "Vous avez quitté le groupe avec succès !",
      });
      onGroupChange();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast({
        title: "Erreur",
        description: `Erreur lors de la sortie du groupe : ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirmModal(false);
    }
  };

  const isAdmin = group.user_role === 'ADMIN';
  const avatarSrc = group.avatar_url || (group.name ? generateAvatarFromText(group.name, 64) : undefined);

  if (group.is_archived) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Card className="overflow-hidden shadow-lg flex flex-col bg-gray-100 opacity-60 cursor-not-allowed">
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                  Archivé
                </div>
                <CardHeader className="flex flex-row items-center space-x-4 p-4">
                  <Image 
                    src={avatarSrc || 'https://via.placeholder.com/64'} 
                    alt={group.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300" 
                  />
                  <div className="flex-grow">
                    <CardTitle className="text-xl font-semibold text-gray-500">{group.name}</CardTitle>
                    <p className="text-sm text-gray-400 flex items-center"><FaUsers className="mr-1" /> {group.members_count || 0} membre{((group.members_count || 0) > 1 || (group.members_count || 0) === 0) ? 's' : ''}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                  <p className="text-gray-500 mb-3 line-clamp-2">{group.description || 'Aucune description.'}</p>
                </CardContent>
                <div className="p-4 pt-0 flex space-x-2">
                  <Button className="w-full" disabled>Voir le groupe</Button>
                </div>
              </Card>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ce groupe est archivé car vous avez dépassé la limite de votre plan gratuit. <br /> Passez au plan Premium pour le réactiver.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card key={group.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col">
      <CardHeader className="flex flex-row items-center space-x-4 p-4">
        <Image 
          src={avatarSrc || 'https://via.placeholder.com/64'} 
          alt={group.name}
          width={64}
          height={64}
          className="w-16 h-16 rounded-full object-cover border-2 border-blue-500" 
        />
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
            <div className="flex flex-col gap-2 w-full">
              <span className="font-mono text-lg tracking-widest text-gray-800 block">{currentInvitationCode}</span>
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
        <Link href={`/groups/${group.id}`} className="flex-1">
          <Button className="w-full bg-green-500 hover:bg-green-600 text-sm px-3 py-2">Voir le groupe</Button>
        </Link>
        {!(isAdmin && group.adminCount === 1 && group.memberCount === 1) && (
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