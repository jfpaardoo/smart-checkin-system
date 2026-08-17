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

      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') || 
        d.label.toLowerCase().includes('trasera') ||
        d.label.toLowerCase().includes('environment') ||
        d.label.toLowerCase().includes('externa')
      );

      return backCamera ? backCamera.id : devices[0].id;
    } catch (err) {
      console.debug('Initial getCameras before permission (will retry on start):', err);
      return null;
    }
  }, [t]);

  // Fetch cameras once
  useEffect(() => {
    let isMounted = true;
    loadAvailableCameras().then(defaultCameraId => {
      if (defaultCameraId && isMounted) {
        setSelectedCameraId(defaultCameraId);
      }
    });
    return () => { isMounted = false; };
  }, [loadAvailableCameras]);

  // Handle scanner lifecycle
  useEffect(() => {
    if (!isScanningEnabled || !elementId) return;

    let cancelled = false;
    scannedRef.current = false;

    const handleSuccess = (decodedText) => {
      if (scannedRef.current || cancelled) return;
      scannedRef.current = true;
      triggerHapticAndAudio();
      stopScannerSafely(html5QrcodeRef.current, elementId);
      onScanSuccessRef.current?.(decodedText);
    };

    const startScanner = async () => {
      if (cancelled) return;
      const container = document.getElementById(elementId);
      if (!container) return;

      const html5Qrcode = new Html5Qrcode(elementId);
      html5QrcodeRef.current = html5Qrcode;

      // Use selected camera ID if available, otherwise default to back camera (facingMode: environment)
      // This immediately triggers the browser permission modal on Android/Samsung without blocking on getCameras()
      const cameraConfig = selectedCameraId || { facingMode: 'environment' };

      try {
        await html5Qrcode.start(
          cameraConfig,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleSuccess,
          () => {} // Ignore continuous decode errors
        );
        if (!cancelled) {
          setIsScannerReady(true);
          await loadAvailableCameras();
        }
      } catch (err) {
        console.error('Error starting scanner:', err);
      }
    };

    const timerId = setTimeout(startScanner, 100);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      setIsScannerReady(false);
      stopScannerSafely(html5QrcodeRef.current, elementId);
    };
  }, [isScanningEnabled, selectedCameraId, elementId, stopScannerSafely, loadAvailableCameras]);

  const resetScannerState = useCallback(() => {
    scannedRef.current = false;
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
