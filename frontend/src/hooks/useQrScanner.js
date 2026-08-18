import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Emite una vibración háptica suave y un chime de confirmación
 */
function triggerHapticAndAudio() {
  // 1. Vibración háptica en móviles
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch (e) {
    console.debug('Haptic feedback not supported', e);
  }

  // 2. Chime de confirmación auditivo
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // Nota A6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch (e) {
    console.debug('Audio chime failed', e);
  }
}

function findBestBackCamera(devices) {
  if (!devices || devices.length === 0) return null;
  // 1. Buscar cámara trasera principal (evitar gran angular / teleobjetivo si hay lente estándar 0 / main)
  const mainBack = devices.find(d => {
    const l = (d.label || '').toLowerCase();
    return (l.includes('back') || l.includes('trasera') || l.includes('rear') || l.includes('environment'))
      && (l.includes('0') || l.includes('main') || l.includes('principal') || (!l.includes('wide') && !l.includes('ultra') && !l.includes('tele')));
  });
  if (mainBack) return mainBack;

  // 2. Cualquier cámara trasera disponible
  const anyBack = devices.find(d => {
    const l = (d.label || '').toLowerCase();
    return l.includes('back') || l.includes('trasera') || l.includes('rear') || l.includes('environment') || l.includes('0');
  });
  if (anyBack) return anyBack;

  // 3. Fallback al primer dispositivo encontrado (ordenador / webcam)
  return devices[0];
}

function formatCameraLabel(device, index) {
  const l = (device.label || '').toLowerCase();
  if (l.includes('back') || l.includes('trasera') || l.includes('rear')) {
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

  // Enumerar cámaras una sola vez al montar y fijar la trasera por defecto
  useEffect(() => {
    let isMounted = true;
    Html5Qrcode.getCameras()
      .then(devices => {
        if (isMounted && devices && devices.length > 0) {
          const mapped = devices.map((d, index) => ({
            value: d.id,
            label: formatCameraLabel(d, index)
          }));
          setCameras(mapped);

          const bestBack = findBestBackCamera(devices);
          if (bestBack) {
            setSelectedCameraId(bestBack.id);
          }
        }
      })
      .catch(err => {
        console.debug('No camera devices enumerated on mount (permissions pending):', err);
      });
    return () => { isMounted = false; };
  }, []);

  // Parada segura del escáner y liberación de recursos de vídeo
  const stopScannerSafely = useCallback(async (scanner, containerId) => {
    if (scanner) {
      try {
        const state = typeof scanner.getState === 'function' ? scanner.getState() : (scanner.isScanning ? 2 : 1);
        if (state === 2 || state === 3) {
          await scanner.stop();
        }
      } catch (err) {
        console.debug('Safe scanner stop suppressed exception:', err);
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
                try { t.stop(); } catch (e) { /* ignore */ }
              });
              v.srcObject = null;
            }
          });
        }
      }
    } catch { /* ignore */ }
  }, []);

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
        // Detener instancia previa si existía
        if (html5QrcodeRef.current) {
          await stopScannerSafely(html5QrcodeRef.current, elementId);
          html5QrcodeRef.current = null;
        }
        if (cancelled) return;

        const html5Qrcode = new Html5Qrcode(elementId);
        html5QrcodeRef.current = html5Qrcode;

        const scanConfig = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 }
        };

        let targetCamera = selectedCameraId;
        if (!targetCamera) {
          // Si no tenemos ID aún, intentar descubrirlo antes de arrancar
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              const bestBack = findBestBackCamera(devices);
              targetCamera = bestBack ? bestBack.id : devices[0].id;
            }
          } catch { /* ignore */ }
        }

        const cameraConfig = targetCamera ? targetCamera : { facingMode };

        await html5Qrcode.start(
          cameraConfig,
          scanConfig,
          handleSuccess,
          () => {} // Ignorar errores continuos de decodificación por frame
        );
        
        if (!cancelled) {
          setIsScannerReady(true);
          // Refrescar lista de etiquetas con nombres reales de hardware
          Html5Qrcode.getCameras().then(devices => {
            if (!cancelled && devices && devices.length > 0) {
              setCameras(devices.map((d, index) => ({
                value: d.id,
                label: formatCameraLabel(d, index)
              })));
            }
          }).catch(() => {});
        }
      } catch (err) {
        if (err?.name === 'AbortError') {
          // La operación de inicio fue interrumpida limpiamente por un cambio de estado
          return;
        }
        console.warn('Camera start attempt failed, attempting fallback:', err);
        if (!cancelled && !selectedCameraId) {
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0 && !cancelled) {
              const fallbackScanner = html5QrcodeRef.current || new Html5Qrcode(elementId);
              html5QrcodeRef.current = fallbackScanner;
              await fallbackScanner.start(
                devices[0].id,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                handleSuccess,
                () => {}
              );
              if (!cancelled) {
                setIsScannerReady(true);
              }
            }
          } catch (fallbackErr) {
            console.error('All camera start attempts failed:', fallbackErr);
          }
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
  }, [isScanningEnabled, facingMode, selectedCameraId, elementId, scannerKey, stopScannerSafely]);

  const resetScannerState = useCallback(() => {
    scannedRef.current = false;
    setScannerKey(k => k + 1);
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameras.length > 1 && selectedCameraId) {
      const currentIndex = cameras.findIndex(c => c.value === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setSelectedCameraId(cameras[nextIndex].value);
    } else {
      setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    }
    setScannerKey(k => k + 1);
  }, [cameras, selectedCameraId]);

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
