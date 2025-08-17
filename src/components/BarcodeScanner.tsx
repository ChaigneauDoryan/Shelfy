'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { SwitchCamera } from 'lucide-react'; // Import d'une icône pour le bouton

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  
  // États pour gérer les caméras
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  
  // Références pour le lecteur et les contrôles
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  // Fonction pour arrêter proprement le scanner
  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
  };

  // Initialisation et découverte des caméras
  useEffect(() => {
    const initializeScanner = async () => {
      // Vérification initiale du support navigateur
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Votre navigateur ne supporte pas l'accès à la caméra.");
        return;
      }

      try {
        // Demander la permission et lister les appareils
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Libérer le stream initial

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setError("Aucun appareil photo trouvé.");
          return;
        }
        setVideoDevices(devices);

        // Sélectionner la caméra arrière par défaut
        const rearCamera = devices.find(device => 
          /back|rear|environment/i.test(device.label)
        );
        setSelectedDeviceId(rearCamera?.deviceId || devices[0].deviceId);

      } catch (err: any) {
        console.error("Erreur d'initialisation:", err);
        if (err.name === 'NotAllowedError') {
          setError("Accès à la caméra refusé. Veuillez autoriser l'accès.");
        } else {
          setError(`Erreur de caméra: ${err.message}`);
        }
      }
    };

    initializeScanner();

    // Nettoyage au démontage du composant
    return () => {
      stopScanner();
    };
  }, []);

  // Démarrage/Redémarrage du scanner quand le deviceId change
  useEffect(() => {
    if (!selectedDeviceId || !isScanning) {
      return;
    }

    // Arrêter le scanner précédent avant d'en démarrer un nouveau
    stopScanner(); 

    const startScanner = async () => {
      if (!videoRef.current) return;

      try {
        const reader = new BrowserMultiFormatReader();
        codeReaderRef.current = reader;

        const controls = await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const decodedText = result.getText();
              if (decodedText) {
                setIsScanning(false); // Arrêter le scan après une détection réussie
                onScan(decodedText);
                // Pas besoin de `stopScanner` ici, le cleanup du composant s'en chargera
              }
            }
            if (err && err.name !== 'NotFoundException') {
              // On peut choisir d'ignorer les erreurs "NotFoundException" qui sont fréquentes
               console.warn('Erreur de lecture du code-barres:', err);
            }
          }
        );
        controlsRef.current = controls;
      } catch (err: any) {
        console.error(`Erreur avec la caméra ${selectedDeviceId}:`, err);
        setError(`Impossible de démarrer le scanner. ${err.message}`);
      }
    };

    startScanner();

    // La fonction de nettoyage de ce `useEffect` n'est pas nécessaire
    // car `stopScanner` est appelé au début de l'effet et au démontage global.

  }, [selectedDeviceId, isScanning, onScan]);


  const handleCameraSwitch = () => {
    if (videoDevices.length < 2) return; // Pas de caméra à changer

    const currentIndex = videoDevices.findIndex(
      device => device.deviceId === selectedDeviceId
    );
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setSelectedDeviceId(videoDevices[nextIndex].deviceId);
  };

  const handleClose = () => {
    setIsScanning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-xl max-w-md w-full mx-4 text-center">
        <h2 className="text-xl font-bold mb-3">Scanner le code-barres</h2>
        
        <div className="relative w-full aspect-video bg-gray-200 rounded-md overflow-hidden">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/3 border-4 border-red-500 border-dashed rounded-lg" />
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {videoDevices.length > 1 && (
            <Button 
              onClick={handleCameraSwitch}
              variant="secondary"
              className="w-full flex items-center gap-2"
            >
              <SwitchCamera className="w-5 h-5" />
              Changer de caméra
            </Button>
          )}
          <Button 
            onClick={handleClose} 
            className="w-full"
            variant="outline"
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
