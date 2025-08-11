'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input' // Pour le slider de zoom

interface AvatarUploadProps {
  userId: string;
  initialAvatarUrl: string | null;
  onUpload: (url: string) => void;
}

// Fonction pour centrer le crop initial
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  )
}

// Fonction pour recadrer l'image
function getCroppedImg(image: HTMLImageElement, crop: Crop, scale = 1): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const sourceWidth = crop.width * scaleX;
  const sourceHeight = crop.height * scaleY;

  // Dessine uniquement la partie recadrée de l'image sur le canvas
  ctx.drawImage(
    image,
    cropX, // Point de départ X sur l'image source
    cropY, // Point de départ Y sur l'image source
    sourceWidth, // Largeur à prendre sur l'image source
    sourceHeight, // Hauteur à prendre sur l'image source
    0, // Point de destination X sur le canvas
    0, // Point de destination Y sur le canvas
    crop.width * scaleX, // Largeur de destination sur le canvas
    crop.height * scaleY // Hauteur de destination sur le canvas
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

export default function AvatarUpload({ userId, initialAvatarUrl, onUpload }: AvatarUploadProps) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) // Réinitialiser le crop
      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
      setIsModalOpen(true);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }

  const handleCrop = async () => {
    if (imgRef.current && crop?.width && crop?.height) {
      setUploading(true);
      setIsModalOpen(false);

      try {
        const croppedImageBlob = await getCroppedImg(imgRef.current, crop, scale);
        const filePath = `${userId}/${Date.now()}.png`;

        if (avatarUrl) {
          const oldFileName = avatarUrl.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('avatars').remove([`${userId}/${oldFileName}`]);
          }
        }

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, croppedImageBlob);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        
        setAvatarUrl(publicUrl);
        onUpload(publicUrl);

      } catch (error: any) {
        alert('Erreur: ' + error.message);
      } finally {
        setUploading(false);
        setSrc(null);
        setScale(1);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <img 
        src={avatarUrl || `https://via.placeholder.com/150`} 
        alt="Avatar" 
        className="w-32 h-32 rounded-full object-cover bg-gray-200"
      />
      <div>
        <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
          {uploading ? 'Chargement...' : 'Changer l\'avatar'}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          disabled={uploading}
          className="hidden"
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recadrer votre avatar</DialogTitle>
          </DialogHeader>
          {src && (
            <div className="flex flex-col items-center space-y-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                circularCrop
                aspect={1}
              >
                <img 
                  ref={imgRef} 
                  src={src} 
                  alt="Source" 
                  style={{ transform: `scale(${scale})` }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
              <div className="w-full space-y-2">
                  <label htmlFor="zoom-slider" className="text-sm">Zoom</label>
                  <Input 
                    id="zoom-slider"
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full"
                  />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setSrc(null); }}>Annuler</Button>
            <Button onClick={handleCrop}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}