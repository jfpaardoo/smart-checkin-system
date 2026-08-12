import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';

export function useQrScanner(elementId, isScanningEnabled, onScanSuccess) {
  const { t } = useTranslation();
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScannerReady, setIsScannerReady] = useState(false);
  const html5QrcodeRef = useRef(null);
  const scannedRef = useRef(false);
  // Store callback in a ref so the effect doesn't re-run when the callback changes
  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);

  // Stop scanner safely, clearing leftover DOM nodes to prevent removeChild errors
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
    // Clear any leftover library DOM nodes so React doesn't choke on removeChild
    try {
      if (containerId) {
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = '';
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch cameras once
  useEffect(() => {
    let isMounted = true;
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0 && isMounted) {
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
        
        setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      console.error('Error fetching cameras', err);
    });
    return () => { isMounted = false; };
  }, [t]);

  // Handle scanner lifecycle — NO dependency on onScanSuccess (uses ref)
  useEffect(() => {
    if (!isScanningEnabled || !selectedCameraId || !elementId) return;

    let cancelled = false;
    scannedRef.current = false;

    const handleSuccess = (decodedText) => {
      if (scannedRef.current || cancelled) return;
      scannedRef.current = true;
      stopScannerSafely(html5QrcodeRef.current, elementId);
      onScanSuccessRef.current?.(decodedText);
    };

    // Small delay to let React commit the container div to the real DOM
    const timerId = setTimeout(() => {
      if (cancelled) return;
      const container = document.getElementById(elementId);
      if (!container) return;

      const html5Qrcode = new Html5Qrcode(elementId);
      html5QrcodeRef.current = html5Qrcode;

      html5Qrcode.start(
        selectedCameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleSuccess,
        () => {} // Ignore continuous decode errors
      ).then(() => {
        if (!cancelled) setIsScannerReady(true);
      }).catch(err => {
        console.error('Error starting scanner:', err);
      });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      setIsScannerReady(false);
      stopScannerSafely(html5QrcodeRef.current, elementId);
    };
  }, [isScanningEnabled, selectedCameraId, elementId, stopScannerSafely]);

  const resetScannerState = useCallback(() => {
    scannedRef.current = false;
  }, []);

  return {
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    isScannerReady,
    resetScannerState,
    stopScannerSafely: () => stopScannerSafely(html5QrcodeRef.current, elementId)
  };
}
