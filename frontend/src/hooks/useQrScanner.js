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

  const loadAvailableCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) return null;

      const camOptions = devices.map(d => ({
        value: d.id,
        label: d.label || `${t('common.camera', 'Cámara')} ${d.id}`
      }));
      setCameras(camOptions);
      return devices[0].id;
    } catch (err) {
      console.debug('Initial getCameras before permission:', err);
      return null;
    }
  }, [t]);

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

      // Prefer generic { facingMode: 'environment' } if no explicit camera chosen
      // This avoids multi-lens black screen bugs on iOS and Samsung devices
      const cameraConfig = selectedCameraId 
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: 'environment' };

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
          await loadAvailableCameras();
        }
      } catch (err) {
        console.error('Error starting scanner, falling back to facingMode:', err);
        if (!cancelled && selectedCameraId) {
          // Fallback if specific deviceId fails
          try {
            await html5Qrcode.start(
              { facingMode: 'environment' },
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

    const timerId = setTimeout(startScanner, 120);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      setIsScannerReady(false);
      stopScannerSafely(html5QrcodeRef.current, elementId);
    };
  }, [isScanningEnabled, selectedCameraId, elementId, scannerKey, stopScannerSafely, loadAvailableCameras]);

  const resetScannerState = useCallback(() => {
    scannedRef.current = false;
    setScannerKey(k => k + 1);
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.value === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].value);
  }, [cameras, selectedCameraId]);

  return {
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    isScannerReady,
    resetScannerState,
    toggleCamera,
    hasMultipleCameras: cameras.length > 1,
    stopScannerSafely: () => stopScannerSafely(html5QrcodeRef.current, elementId)
  };
}
