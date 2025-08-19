'use client';

import { ConfirmModal } from './ui/ConfirmModal';
import { Book } from '@/app/(dashboard)/library/page';

interface ArchiveConfirmModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookToArchiveId: string | null;
  books: Book[];
}

export function ArchiveConfirmModalWrapper({
  isOpen,
  onClose,
  onConfirm,
  bookToArchiveId,
  books,
}: ArchiveConfirmModalWrapperProps) {
  const bookToArchive = books.find(b => b.id === bookToArchiveId);
  const isCurrentlyArchived = bookToArchive?.is_archived || false;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={isCurrentlyArchived ? "Confirmer le désarchivage" : "Confirmer l'archivage"}
      message={isCurrentlyArchived 
        ? "Êtes-vous sûr de vouloir désarchiver ce livre ?" 
        : "Êtes-vous sûr de vouloir archiver ce livre ? Il sera masqué de la vue par défaut."
      }
    />
  );
}
