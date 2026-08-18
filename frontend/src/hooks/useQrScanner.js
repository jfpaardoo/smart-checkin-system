import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Emite una vibración háptica suave y un chime de confirmación
 */
function triggerHapticAndAudio() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch (error_) {
    console.debug('Haptic feedback not supported', error_);
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch (error_) {
    console.debug('Audio chime failed', error_);
  }
}

function formatCameraLabel(device, index) {
  const l = (device.label || '').toLowerCase();
  if (l.includes('back') || l.includes('trasera') || l.includes('rear') || l.includes('environment')) {
    if (l.includes('ultra') || l.includes('wide') || l.includes('gran')) return `Cámara Trasera (Gran Angular)`;
    if (l.includes('tele') || l.includes('zoom')) return `Cámara Trasera (Teleobjetivo)`;
    if (l.includes('macro')) return `Cámara Trasera (Macro)`;
    return `Cámara Trasera Principal`;
  }
  if (l.includes('front') || l.includes('delantera') || l.includes('user') || l.includes('selfie')) {
    return `Cámara Frontal`;
  }
  return device.label || `Cámara ${index + 1}`;
}

export function useQrScanner(elementId, isScanningEnabled, onScanSuccess) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const html5QrcodeRef = useRef(null);
  const scannedRef = useRef(false);
  const isOperatingRef = useRef(false);

  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);

  // Parada segura del escáner y liberación de pistas de vídeo
  const stopScannerSafely = useCallback(async (scanner, containerId) => {
    if (scanner) {
      try {
        const isScanning = typeof scanner.isScanning === 'boolean' 
          ? scanner.isScanning 
          : (typeof scanner.getState === 'function' && scanner.getState() === 2);
        if (isScanning) {
          await scanner.stop();
        }
      } catch (error_) {
        console.debug('Safe scanner stop exception:', error_);
      }
    }

    try {
      if (containerId) {
        const el = document.getElementById(containerId);
        if (el) {
          const videos = el.querySelectorAll('video');
          videos.forEach(v => {
            v.onabort = null;
            v.onerror = null;
            v.onpause = null;
            if (v.srcObject && typeof v.srcObject.getTracks === 'function') {
              v.srcObject.getTracks().forEach(t => {
                try { t.stop(); } catch (error_) { /* ignore */ }
              });
              v.srcObject = null;
            }
          });
        }
      }
    } catch (error_) {
      console.debug('DOM stream teardown ignored:', error_);
    }
  }, []);

  // Iniciar instancia de escaneo con resolución en cascada
  const executeStart = useCallback(async (scanner, scanConfig, onSuccess) => {
    // 1. Si el usuario seleccionó un dispositivo concreto por ID
    if (selectedCameraId) {
      try {
        await scanner.start(selectedCameraId, scanConfig, onSuccess, () => {});
        return;
      } catch (error_) {
        console.warn('Selected device start failed, falling back to facingMode:', error_);
      }
    }

    // 2. Intentar con facingMode deseado (preferido por iOS/Android para evitar pantallas negras)
    try {
      await scanner.start({ facingMode }, scanConfig, onSuccess, () => {});
      return;
    } catch (error_) {
      console.debug('Requested facingMode unavailable:', error_);
    }

    // 3. Fallback a facingMode opuesto
    const alternateFacing = facingMode === 'environment' ? 'user' : 'environment';
    try {
      await scanner.start({ facingMode: alternateFacing }, scanConfig, onSuccess, () => {});
      return;
    } catch (error_) {
      console.debug('Alternate facingMode unavailable:', error_);
    }

    // 4. Fallback final a primer dispositivo disponible
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length > 0) {
      await scanner.start(devices[0].id, scanConfig, onSuccess, () => {});
    } else {
      throw new Error('No camera hardware found');
    }
  }, [facingMode, selectedCameraId]);

  // Ciclo de vida del escáner
  useEffect(() => {
    if (!isScanningEnabled || !elementId) {
      setIsScannerReady(false);
      stopScannerSafely(html5QrcodeRef.current, elementId);
      return;
    }

    let cancelled = false;
    scannedRef.current = false;

    const handleSuccess = (decodedText) => {
      if (scannedRef.current || cancelled) return;
      scannedRef.current = true;
      triggerHapticAndAudio();
      setIsScannerReady(false);
      stopScannerSafely(html5QrcodeRef.current, elementId);
      onScanSuccessRef.current?.(decodedText);
    };

    const startScanner = async () => {
      if (cancelled || isOperatingRef.current) return;
      const container = document.getElementById(elementId);
      if (!container) return;

      isOperatingRef.current = true;

      try {
        if (html5QrcodeRef.current) {
          await stopScannerSafely(html5QrcodeRef.current, elementId);
          html5QrcodeRef.current = null;
        }
        if (cancelled) return;

        const html5Qrcode = new Html5Qrcode(elementId, {
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false
        });
        html5QrcodeRef.current = html5Qrcode;

        const scanConfig = { 
          fps: 8, 
          qrbox: { width: 250, height: 250 }
        };

        await executeStart(html5Qrcode, scanConfig, handleSuccess);
        
        if (!cancelled) {
          setIsScannerReady(true);

          // Actualizar lista de cámaras sin forzar reinicios
          Html5Qrcode.getCameras().then(devices => {
            if (!cancelled && devices && devices.length > 0) {
              setCameras(devices.map((d, index) => ({
                value: d.id,
                label: formatCameraLabel(d, index)
              })));
            }
          }).catch(error_ => {
            console.debug('Camera enumeration deferred:', error_);
          });
        }
      } catch (error_) {
        if (!cancelled) {
          console.warn('Camera failed to start:', error_);
          setIsScannerReady(false);
        }
      } finally {
        isOperatingRef.current = false;
      }
    };

    const timerId = setTimeout(startScanner, 120);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      setIsScannerReady(false);
      stopScannerSafely(html5QrcodeRef.current, elementId);
    };
  }, [isScanningEnabled, facingMode, selectedCameraId, elementId, scannerKey, stopScannerSafely, executeStart]);

  const resetScannerState = useCallback(() => {
    scannedRef.current = false;
    setScannerKey(k => k + 1);
  }, []);

  const toggleCamera = useCallback(() => {
    setSelectedCameraId(null);
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    setScannerKey(k => k + 1);
  }, []);

  const handleSelectCamera = useCallback((camId) => {
    setSelectedCameraId(camId);
    setScannerKey(k => k + 1);
  }, []);

  return {
    cameras,
    selectedCameraId,
    setSelectedCameraId: handleSelectCamera,
    isScannerReady,
    resetScannerState,
    toggleCamera,
    facingMode,
    stopScannerSafely: () => stopScannerSafely(html5QrcodeRef.current, elementId)
  };
}
