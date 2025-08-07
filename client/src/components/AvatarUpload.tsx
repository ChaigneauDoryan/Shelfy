
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface AvatarUploadProps {
  userId: string;
  initialAvatarUrl: string;
  onUpload: (url: string) => void;
}

export default function AvatarUpload({ userId, initialAvatarUrl, onUpload }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
  }, [initialAvatarUrl]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image à téléverser.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      onUpload(publicUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Avatar" width={128} height={128} className="object-cover" />
        ) : (
          <span className="text-gray-500">Pas d'avatar</span>
        )}
      </div>
      <div>
        <Button asChild variant="outline">
          <label htmlFor="avatar-upload" className="cursor-pointer">
            {uploading ? 'Téléversement...' : 'Changer d\'avatar'}
          </label>
        </Button>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  );
}
