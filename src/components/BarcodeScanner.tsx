'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const checkMediaSupport = () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Votre navigateur ne supporte pas l'accès à la caméra. Veuillez utiliser un navigateur moderne et vérifier que vous êtes en HTTPS.");
        return false;
      }
      return true;
    };

    const requestCameraPermission = async () => {
      try {
        // Demander explicitement l'accès à la caméra arrière
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' } // Force la caméra arrière si possible
          } 
        });
        // Arrêter le stream temporaire, ZXing va créer le sien
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (err: any) {
        console.error('Erreur permission caméra:', err);
        if (err.name === 'NotAllowedError') {
          setError("Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra et recharger la page.");
        } else if (err.name === 'NotFoundError') {
          setError("Aucun appareil photo trouvé sur votre appareil.");
        } else if (err.name === 'NotReadableError') {
          setError("La caméra est utilisée par une autre application. Veuillez fermer les autres applications utilisant la caméra.");
        } else {
          setError(`Impossible d'accéder à la caméra: ${err.message}`);
        }
        return false;
      }
    };

    const findBestCamera = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          return undefined;
        }

        // Rechercher explicitement la caméra arrière
        const rearCamera = videoInputDevices.find(device => {
          const label = device.label.toLowerCase();
          return label.includes('back') || 
                 label.includes('rear') || 
                 label.includes('environment') ||
                 label.includes('arrière') ||
                 // Parfois les caméras arrière ont des indices plus élevés
                 (label.includes('camera') && label.includes('1'));
        });

        if (rearCamera) {
          console.log('Caméra arrière trouvée:', rearCamera.label);
          return rearCamera.deviceId;
        }

        // Si pas de caméra arrière explicite, prendre la dernière de la liste
        // (souvent la caméra arrière sur mobile)
        if (videoInputDevices.length > 1) {
          const lastCamera = videoInputDevices[videoInputDevices.length - 1];
          console.log('Utilisation de la dernière caméra:', lastCamera.label);
          return lastCamera.deviceId;
        }

        // Sinon utiliser la première disponible
        return videoInputDevices[0].deviceId;
      } catch (enumError) {
        console.warn('Impossible d\'énumérer les appareils, utilisation de la caméra par défaut');
        return undefined;
      }
    };

    const startScanner = async () => {
      if (typeof window === 'undefined') {
        setError("Le scanner n'est pas disponible sur le serveur.");
        return;
      }

      // Vérifier le support des media devices
      if (!checkMediaSupport()) {
        return;
      }

      // Demander l'accès à la caméra
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return;
      }

      try {
        const reader = new BrowserMultiFormatReader();
        codeReaderRef.current = reader;

        // Configuration pour améliorer la détection
        const hints = new Map();
        hints.set(2, true); // TRY_HARDER
        hints.set(3, [
          'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_39', 'CODE_128'
        ]); // POSSIBLE_FORMATS pour les ISBN
        reader.hints = hints;

        // Trouver la meilleure caméra (arrière si possible)
        const deviceId = await findBestCamera();

        console.log('Démarrage du scanner avec deviceId:', deviceId);

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (result && isScanning) {
              const decodedText = result.getText();
              console.log('Code-barres détecté:', decodedText);
              
              if (decodedText && decodedText.length > 0) {
                setIsScanning(false);
                onScan(decodedText);
                // Délai pour éviter les scans multiples
                setTimeout(() => {
                  stopScanner();
                  setIsScanning(true);
                }, 500);
              }
            }
            
            // Log des tentatives de scan pour debug
            if (err) {
              if (err.name === 'NotFoundException') {
                // Normal, continue à chercher
              } else {
                console.warn('Erreur de scan:', err.name, err.message);
              }
            }
          }
        );

        controlsRef.current = controls;
        console.log('Scanner démarré avec succès');

      } catch (err: any) {
        console.error('Erreur scanner:', err);
        setError(`Erreur lors du démarrage du scanner: ${err.message}`);
      }
    };

    const stopScanner = () => {
      try {
        if (controlsRef.current) {
          controlsRef.current.stop();
          controlsRef.current = null;
        }
        if (codeReaderRef.current) {
          codeReaderRef.current = null;
        }
      } catch (err) {
        console.warn('Erreur lors de l\'arrêt du scanner:', err);
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      setIsScanning(false);
      stopScanner();
    };
  }, []); // Dépendances vides pour éviter les re-renders

  const handleClose = () => {
    setIsScanning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-2">Scanner le code-barres ISBN</h2>
        
        <div className="relative">
          <video 
            ref={videoRef} 
            className="w-full h-auto rounded border"
            autoPlay
            playsInline
            muted
          />
          
          {/* Overlay de visée */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-red-500 border-dashed w-3/4 h-20 rounded"></div>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!error && isScanning && (
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              Positionnez le code-barres dans le cadre
            </p>
            <p className="text-xs text-gray-500 mt-1">
              💡 Assurez-vous que le code-barres soit bien éclairé et net
            </p>
          </div>
        )}

        <Button 
          onClick={handleClose} 
          className="mt-4 w-full"
          variant="outline"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}