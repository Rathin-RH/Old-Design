'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Camera, AlertCircle, ArrowLeft } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { useKioskStore } from '@/lib/store';
import { PrintService } from '@/lib/printService';
import { playSound } from '@/lib/utils';

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQRCode, setManualQRCode] = useState('');
  const { setCurrentJob, setError, updateLastActivity } = useKioskStore();
  const scannerRef = useRef<HTMLDivElement>(null);

  // Check camera permissions before starting
  const checkCameraPermissions = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately - we just wanted to check permissions
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.error('Camera permission check failed:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('permission-denied');
        return false;
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('no-camera');
        return false;
      } else {
        setCameraError('unknown');
        return false;
      }
    }
  };

  const startScanning = async () => {
    setCameraError(null);
    setError(null);
    
    // First check permissions
    const hasPermission = await checkCameraPermissions();
    if (!hasPermission) {
      setIsScanning(false);
      return;
    }

    // Set scanning state first so the element renders
    setIsScanning(true);

    // Wait for the element to be available in the DOM
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Check if element exists
      const element = document.getElementById('qr-reader');
      if (!element) {
        throw new Error('QR reader element not found in DOM');
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      setScanner(html5QrCode);

      // Try environment camera first (back camera)
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            playSound('scan');
            updateLastActivity();
            
            // Stop scanning
            await html5QrCode.stop();
            setIsScanning(false);
            
            // Process the QR code
            await handleQRCode(decodedText);
          },
          (errorMessage) => {
            // Silent error handling for continuous scanning
          }
        );
      } catch (envError: any) {
        // If environment camera fails, try user camera (front camera)
        console.log('Environment camera failed, trying user camera...', envError);
        try {
          await html5QrCode.start(
            { facingMode: 'user' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              playSound('scan');
              updateLastActivity();
              
              await html5QrCode.stop();
              setIsScanning(false);
              await handleQRCode(decodedText);
            },
            () => {}
          );
        } catch (userError: any) {
          // If both fail, try without specifying facing mode
          console.log('User camera failed, trying default...', userError);
          await html5QrCode.start(
            { facingMode: { exact: 'environment' } },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              playSound('scan');
              updateLastActivity();
              await html5QrCode.stop();
              setIsScanning(false);
              await handleQRCode(decodedText);
            },
            () => {}
          );
        }
      }
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      setIsScanning(false);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
        setCameraError('permission-denied');
        toast.error('Camera access denied');
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.message?.includes('camera')) {
        setCameraError('no-camera');
        toast.error('No camera found');
        setError('No camera device found. Please connect a camera or use manual input.');
      } else {
        setCameraError('unknown');
        toast.error('Failed to access camera');
        setError('Failed to access camera. Please try again or use manual input.');
      }
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      try {
        await scanner.stop();
        setIsScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  const handleQRCode = async (qrData: string) => {
    try {
      const job = await PrintService.fetchPrintJob(qrData);
      
      if (!job) {
        setError('QR code not found or print job already completed');
        playSound('error');
        toast.error('QR code not available - job may already be completed');
        return;
      }

      if (job.paymentStatus !== 'completed') {
        setError('Payment not completed for this job');
        playSound('error');
        toast.error('Payment pending');
        return;
      }

      playSound('success');
      toast.success('QR code verified! Preparing to print...');
      setCurrentJob(job);
      setShowManualInput(false);
      setManualQRCode('');
    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Failed to process QR code. Please try again.');
      playSound('error');
      toast.error('System error');
    }
  };

  const handleManualSubmit = () => {
    if (manualQRCode.trim()) {
      handleQRCode(manualQRCode.trim());
    }
  };

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.stop().catch(console.error);
      }
    };
  }, [scanner]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
    >
      <div className="text-center mb-8">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block mb-4"
        >
          <QrCode className="w-16 h-16 text-[#1e3a8a]" />
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Scan Your QR Code
        </h2>
        <p className="text-gray-600">
          Position the QR code within the frame
        </p>
      </div>

      {/* Camera Error Message */}
      {cameraError && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {cameraError === 'permission-denied' && (
                <>
                  <h3 className="font-semibold text-red-800 mb-2">Camera Permission Denied</h3>
                  <p className="text-sm text-red-700 mb-3">
                    Please allow camera access in your browser settings to scan QR codes.
                  </p>
                  <div className="text-xs text-red-600 space-y-1 mb-3">
                    <p><strong>Chrome/Edge:</strong> Click the camera icon in the address bar → Allow</p>
                    <p><strong>Firefox:</strong> Click the lock icon → Permissions → Camera → Allow</p>
                    <p><strong>Safari:</strong> Safari → Settings → Websites → Camera → Allow</p>
                  </div>
                </>
              )}
              {cameraError === 'no-camera' && (
                <>
                  <h3 className="font-semibold text-red-800 mb-2">No Camera Found</h3>
                  <p className="text-sm text-red-700 mb-3">
                    No camera device was detected. Please connect a camera or use manual input.
                  </p>
                </>
              )}
              {cameraError === 'unknown' && (
                <>
                  <h3 className="font-semibold text-red-800 mb-2">Camera Error</h3>
                  <p className="text-sm text-red-700 mb-3">
                    Unable to access camera. Please check your camera settings or use manual input.
                  </p>
                </>
              )}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCameraError(null);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Try Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowManualInput(true)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Enter Manually
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Manual QR Code Input */}
      {showManualInput && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800">Enter QR Code Manually</h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShowManualInput(false);
                setManualQRCode('');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualQRCode}
              onChange={(e) => setManualQRCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualSubmit();
                }
              }}
              placeholder="Paste or type QR code data here"
              className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
              autoFocus
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleManualSubmit}
              disabled={!manualQRCode.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              Submit
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Scanner Area */}
      <div className="relative">
        {!isScanning && !showManualInput ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="aspect-square max-w-md mx-auto bg-gray-100 rounded-2xl flex items-center justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startScanning}
              className="flex flex-col items-center gap-4 p-8"
            >
              <div className="bg-[#1e3a8a] hover:bg-[#2563eb] p-6 rounded-full transition-colors">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-700">
                Start Camera
              </span>
            </motion.button>
          </motion.div>
        ) : isScanning ? (
          <div className="relative">
            <div
              id="qr-reader"
              ref={scannerRef}
              className="rounded-2xl overflow-hidden"
            />
            
            {/* Scanning Animation Overlay */}
            <motion.div
              animate={{ y: [0, 200, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-[#1e3a8a] shadow-lg shadow-[#1e3a8a]/50"
              style={{ top: 0 }}
            />

            {/* Corner Brackets */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Left */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[#1e3a8a] rounded-tl-xl" />
              {/* Top Right */}
              <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[#1e3a8a] rounded-tr-xl" />
              {/* Bottom Left */}
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[#1e3a8a] rounded-bl-xl" />
              {/* Bottom Right */}
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[#1e3a8a] rounded-br-xl" />
            </div>

            {/* Stop Button */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopScanning}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-full shadow-lg"
              >
                Stop Scanning
              </motion.button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Instructions */}
      {!showManualInput && (
        <div className="mt-8 space-y-2">
          {isScanning ? (
            <>
              <p className="text-center text-sm text-gray-600">
                📱 Hold your phone steady with the QR code in view
              </p>
              <p className="text-center text-sm text-gray-600">
                ✨ The code will be scanned automatically
              </p>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-gray-600">
                Click "Start Camera" to begin scanning
              </p>
              {cameraError && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowManualInput(true)}
                  className="w-full mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  Or Enter QR Code Manually
                </motion.button>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

