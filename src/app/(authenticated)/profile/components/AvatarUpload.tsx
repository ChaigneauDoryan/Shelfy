'use client'

import { useState, useRef } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession } from 'next-auth/react'

interface AvatarUploadProps {
  userId: string;
  initialAvatarUrl: string | undefined | null;
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

  // Déterminer la taille du côté du carré à partir du crop
  // On prend la plus petite dimension pour s'assurer que le cercle rentre
  const cropPixelWidth = crop.width * scaleX;
  const cropPixelHeight = crop.height * scaleY;
  const size = Math.min(cropPixelWidth, cropPixelHeight); // Le diamètre du cercle

  canvas.width = Math.floor(size * pixelRatio);
  canvas.height = Math.floor(size * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  // Clear the canvas to ensure transparency
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculer les coordonnées source pour centrer le carré dans le crop
  const sourceX = crop.x * scaleX + (cropPixelWidth - size) / 2;
  const sourceY = crop.y * scaleY + (cropPixelHeight - size) / 2;

  // Appliquer un masque circulaire
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, false);
  ctx.clip();

  // Dessine la partie carrée de l'image sur le canvas circulaire
  ctx.drawImage(
    image,
    sourceX, // Point de départ X sur l'image source
    sourceY, // Point de départ Y sur l'image source
    size, // Largeur à prendre sur l'image source (carré)
    size, // Hauteur à prendre sur l'image source (carré)
    0, // Point de destination X sur le canvas
    0, // Point de destination Y sur le canvas
    size, // Largeur de destination sur le canvas
    size // Hauteur de destination sur le canvas
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
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null);
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
    if (!session?.user?.id) return; // S'assurer que l'utilisateur est connecté

    if (imgRef.current && crop?.width && crop?.height) {
      setUploading(true);
      setIsModalOpen(false);

      try {
        const croppedImageBlob = await getCroppedImg(imgRef.current, crop, scale);
        // Generate a more unique file name to prevent caching issues
        const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const fileName = `${session.user.id}-${Date.now()}-${uniqueId}.png`;

        // Appel à notre API d'upload Vercel Blob
        const response = await fetch(`/api/avatar/upload?filename=${fileName}`,
          {
            method: 'POST',
            body: croppedImageBlob,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to upload image to Vercel Blob');
        }

        const { url: publicUrl } = await response.json();
        
        setAvatarUrl(publicUrl);
        onUpload(publicUrl);

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Échec du téléversement.';
        alert('Erreur: ' + message);
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
