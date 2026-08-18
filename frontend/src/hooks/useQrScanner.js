import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';

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

export function useQrScanner(elementId, isScanningEnabled, onScanSuccess) {
  const { t } = useTranslation();
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const html5QrcodeRef = useRef(null);
  const scannedRef = useRef(false);

  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);

  // Stop scanner safely, clearing leftover DOM nodes
  const stopScannerSafely = useCallback(async (scanner, containerId) => {
    if (!scanner) return;
    try {
      if (typeof scanner.getState === 'function') {
        const state = scanner.getState();
        if (state === 2 || state === 3) {
          await scanner.stop();
        }
      } else if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.debug('Safe scanner stop suppressed exception', err);
    }
    try {
      if (containerId) {
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = '';
      }
    } catch { /* ignore */ }
  }, []);



  // Handle scanner lifecycle
  useEffect(() => {
    if (!isScanningEnabled || !elementId) {
      setIsScannerReady(false);
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
      if (cancelled) return;
      const container = document.getElementById(elementId);
      if (!container) return;

      const html5Qrcode = new Html5Qrcode(elementId);
      html5QrcodeRef.current = html5Qrcode;

      const cameraConfig = selectedCameraId 
        ? selectedCameraId
        : { facingMode };

      try {
        await html5Qrcode.start(
          cameraConfig,
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          handleSuccess,
          () => {} // Ignore continuous decode errors
        );
        if (!cancelled) {
          setIsScannerReady(true);
          Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length > 0 && !cancelled) {
              const camOptions = devices.map(d => ({
                value: d.id,
                label: d.label || `${t('common.camera', 'Cámara')} ${d.id}`
              }));
              setCameras(camOptions);
            }
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Primary camera config failed, falling back to facingMode:', err);
        if (!cancelled) {
          try {
            await html5Qrcode.start(
              { facingMode },
              { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
              handleSuccess,
              () => {}
            );
            if (!cancelled) {
              setIsScannerReady(true);
            }
          } catch (fallbackErr) {
            console.error('Fallback camera start failed:', fallbackErr);
          }
        }
      }
    };

    const timerId = setTimeout(startScanner, 100);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      setIsScannerReady(false);
      stopScannerSafely(html5QrcodeRef.current, elementId);
    };
  }, [isScanningEnabled, selectedCameraId, facingMode, elementId, scannerKey, stopScannerSafely, t]);

  const resetScannerState = useCallback(() => {
    scannedRef.current = false;
    setScannerKey(k => k + 1);
  }, []);

  const toggleCamera = useCallback(() => {
    setSelectedCameraId('');
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    setScannerKey(k => k + 1);
  }, []);

  return {
    cameras,
    selectedCameraId,
    setSelectedCameraId: (id) => {
      setSelectedCameraId(id);
      setScannerKey(k => k + 1);
    },
    isScannerReady,
    resetScannerState,
    toggleCamera,
    facingMode,
    hasMultipleCameras: cameras.length > 1 || typeof navigator !== 'undefined',
    stopScannerSafely: () => stopScannerSafely(html5QrcodeRef.current, elementId)
  };
}
