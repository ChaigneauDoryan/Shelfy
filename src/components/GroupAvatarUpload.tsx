'use client'

import { useState, useEffect } from 'react'
import { FaUpload, FaSpinner } from 'react-icons/fa'

interface GroupAvatarUploadProps {
  onUpload: (url: string) => void;
  existingAvatarUrl?: string | null;
  groupName?: string; // Add groupName prop
}

// Helper function to generate a color based on the text
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

// Helper function to generate a data URL for a text avatar
const generateAvatarFromText = (text: string, size = 128) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background color
  const bgColor = stringToColor(text);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = '#FFFFFF'; // White text
  ctx.font = `bold ${size / 2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.charAt(0).toUpperCase(), size / 2, size / 2);

  return canvas.toDataURL();
};

export default function GroupAvatarUpload({ onUpload, existingAvatarUrl, groupName }: GroupAvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(existingAvatarUrl || null);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (existingAvatarUrl) {
      setAvatarUrl(existingAvatarUrl);
    } else if (groupName) {
      setGeneratedAvatarUrl(generateAvatarFromText(groupName));
    }
  }, [existingAvatarUrl, groupName]);

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image à télécharger.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const fileName = `group-${Date.now()}-${uniqueId}.${fileExt}`;

      // Appel à notre API d'upload Vercel Blob
      const response = await fetch(`/api/avatar/upload?filename=${fileName}`,
        {
          method: 'POST',
          body: file,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image to Vercel Blob');
      }

      const { url: publicUrl } = await response.json();

      setAvatarUrl(publicUrl);
      onUpload(publicUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  const displayAvatar = avatarUrl || generatedAvatarUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        {displayAvatar ? (
          <img src={displayAvatar} alt="Avatar du groupe" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500">Avatar</span>
        )}
      </div>
      <div>
        <label htmlFor="group-avatar-upload" className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg inline-flex items-center">
          {uploading ? <FaSpinner className="animate-spin mr-2" /> : <FaUpload className="mr-2" />}
          <span>{uploading ? 'Chargement...' : 'Choisir une image'}</span>
        </label>
        <input
          id="group-avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  );
}