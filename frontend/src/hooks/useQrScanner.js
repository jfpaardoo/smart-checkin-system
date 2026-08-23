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

function formatCameraList(devices) {
  const labelsSeen = {};
  return devices.map((d, index) => {
    let baseLabel = formatCameraLabel(d, index);
    if (labelsSeen[baseLabel]) {
      labelsSeen[baseLabel]++;
      baseLabel = `${baseLabel} (${labelsSeen[baseLabel]})`;
    } else {
      labelsSeen[baseLabel] = 1;
    }
    return {
      value: d.deviceId,
      label: baseLabel
    };
  });
}

export function useQrScanner(elementId, isScanningEnabled, onScanSuccess) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(() => {
    try {
      return localStorage.getItem('da_preferred_camera') || null;
    } catch {
      return null;
    }
  });
  const [facingMode, setFacingMode] = useState('environment');
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const html5QrcodeRef = useRef(null);
  const scanLockRef = useRef(false);

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
            }
            try {
              v.srcObject = null;
            } catch {}
          });
        }
      }
    } catch (error_) {
      console.debug('DOM stream teardown ignored:', error_);
    }
  }, []);

  // Enumerar dispositivos de vídeo de forma pasiva y auto-seleccionar por defecto
  const refreshCameraListSafely = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const formatted = formatCameraList(devices.map((d, index) => ({
          deviceId: d.id,
          label: d.label || formatCameraLabel(d, index)
        })));
        setCameras(formatted);

        // Auto-seleccionar por defecto si no está seleccionada o si el ID actual no existe
        setSelectedCameraId(currentId => {
          if (currentId && formatted.some(c => c.value === currentId)) {
            return currentId;
          }
          let saved = null;
          try {
            saved = localStorage.getItem('da_preferred_camera');
          } catch {}
          if (saved && formatted.some(c => c.value === saved)) {
            return saved;
          }

          // Priorizar cámara trasera principal
          const backCam = formatted.find(c => 
            c.label.toLowerCase().includes('principal') || 
            c.label.toLowerCase().includes('trasera') || 
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
          );
          const autoChosen = backCam ? backCam.value : formatted[0].value;
          try {
            localStorage.setItem('da_preferred_camera', autoChosen);
          } catch {}
          return autoChosen;
        });
      }
    } catch (err) {
      console.debug('Safe device enumeration deferred:', err);
    }
  }, []);

  // Carga inicial pasiva de dispositivos
  useEffect(() => {
    refreshCameraListSafely();
  }, [refreshCameraListSafely]);

  // Asegurar atributos playsinline y autoplay para WebKit / iOS Safari
  const enforceVideoPlaybackOnIOS = useCallback((containerId) => {
    try {
      const container = document.getElementById(containerId);
      if (container) {
        const video = container.querySelector('video');
        if (video) {
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          video.setAttribute('muted', 'true');
          video.muted = true;
          video.playsInline = true;
          video.autoplay = true;
          if (video.paused) {
            video.play().catch(e => console.debug('Video auto-play resume:', e));
          }
        }
      }
    } catch (e) {
      console.debug('Playsinline enforcement ignored:', e);
    }
  }, []);

  // Iniciar instancia de escaneo
  const executeStart = useCallback(async (scanner, baseConfig, onSuccess) => {
    const errorCallback = () => {};

    // 1. Si el usuario seleccionó un dispositivo concreto por ID
    if (selectedCameraId) {
      try {
        await scanner.start(selectedCameraId, baseConfig, onSuccess, errorCallback);
        return;
      } catch (error_) {
        console.warn('Selected device start failed, falling back:', error_);
      }
    }

    // 2. Intentar con facingMode deseado (preferido por móviles iOS/Android)
    try {
      await scanner.start({ facingMode }, baseConfig, onSuccess, errorCallback);
      return;
    } catch (error_) {
      console.debug('Requested facingMode unavailable:', error_);
    }

    // 3. Fallback a facingMode opuesto
    const alternateFacing = facingMode === 'environment' ? 'user' : 'environment';
    try {
      await scanner.start({ facingMode: alternateFacing }, baseConfig, onSuccess, errorCallback);
      return;
    } catch (error_) {
      console.debug('Alternate facingMode unavailable:', error_);
    }

    // 4. Fallback final usando getCameras
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        await scanner.start(devices[0].id, baseConfig, onSuccess, errorCallback);
        return;
      }
    } catch (err) {
      console.debug('Final fallback getCameras failed:', err);
    }

    throw new Error('No camera hardware found');
  }, [facingMode, selectedCameraId]);

  // Ciclo de vida del escáner
  useEffect(() => {
    if (!isScanningEnabled || !elementId) {
      setIsScannerReady(false);
      stopScannerSafely(html5QrcodeRef.current, elementId);
      return;
    }

    let cancelled = false;
    scanLockRef.current = false;

    const handleSuccess = (decodedText) => {
      if (scanLockRef.current || cancelled) return;
      scanLockRef.current = true;
      triggerHapticAndAudio();
      onScanSuccessRef.current?.(decodedText);
    };

    const startScanner = async () => {
      if (cancelled) return;
      const container = document.getElementById(elementId);
      if (!container) return;

      try {
        if (html5QrcodeRef.current) {
          await stopScannerSafely(html5QrcodeRef.current, elementId);
          html5QrcodeRef.current = null;
        }
        if (cancelled) return;

        const html5Qrcode = new Html5Qrcode(elementId);
        html5QrcodeRef.current = html5Qrcode;

        const scanConfig = { 
          fps: 15,
          aspectRatio: 1.0
        };

        await executeStart(html5Qrcode, scanConfig, handleSuccess);
        
        if (!cancelled) {
          enforceVideoPlaybackOnIOS(elementId);
          setIsScannerReady(true);
          refreshCameraListSafely();
        } else {
          await stopScannerSafely(html5Qrcode, elementId);
        }
      } catch (error_) {
        if (!cancelled) {
          const isAbort = error_?.name === 'AbortError' || String(error_?.message || '').includes('interrupted');
          if (isAbort) {
            console.debug('Camera stream play interrupted cleanly:', error_);
          } else {
            console.warn('Camera failed to start:', error_);
          }
          setIsScannerReady(false);
        }
      }
    };

    const timerId = setTimeout(startScanner, 80);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      setIsScannerReady(false);
      stopScannerSafely(html5QrcodeRef.current, elementId);
    };
  }, [isScanningEnabled, facingMode, selectedCameraId, elementId, scannerKey, stopScannerSafely, executeStart, enforceVideoPlaybackOnIOS, refreshCameraListSafely]);

  // Reanuda la detección de QR inmediatamente
  const resumeScanning = useCallback(() => {
    scanLockRef.current = false;
  }, []);

  const resetScannerState = useCallback(async () => {
    scanLockRef.current = false;
    if (html5QrcodeRef.current) {
      await stopScannerSafely(html5QrcodeRef.current, elementId);
      html5QrcodeRef.current = null;
    }
    setScannerKey(k => k + 1);
  }, [stopScannerSafely, elementId]);

  const toggleCamera = useCallback(() => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    
    // Buscar la cámara correspondiente en la lista
    if (cameras && cameras.length > 0) {
      const match = cameras.find(c => 
        nextFacing === 'user' 
          ? (c.label.toLowerCase().includes('front') || c.label.toLowerCase().includes('delantera') || c.label.toLowerCase().includes('user') || c.label.toLowerCase().includes('selfie'))
          : (c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('trasera') || c.label.toLowerCase().includes('rear') || c.label.toLowerCase().includes('environment'))
      );
      if (match) {
        setSelectedCameraId(match.value);
        try { localStorage.setItem('da_preferred_camera', match.value); } catch {}
      } else {
        const otherCam = cameras.find(c => c.value !== selectedCameraId);
        if (otherCam) {
          setSelectedCameraId(otherCam.value);
          try { localStorage.setItem('da_preferred_camera', otherCam.value); } catch {}
        }
      }
    }
    
    setScannerKey(k => k + 1);
  }, [facingMode, cameras, selectedCameraId]);

  const handleSelectCamera = useCallback((camId) => {
    if (!camId) return;

    // Sincronizar facingMode si la cámara elegida es claramente frontal o trasera
    const foundCam = cameras.find(c => c.value === camId);
    if (foundCam) {
      const label = foundCam.label.toLowerCase();
      if (label.includes('front') || label.includes('delantera') || label.includes('user') || label.includes('selfie')) {
        setFacingMode('user');
      } else if (label.includes('back') || label.includes('trasera') || label.includes('rear') || label.includes('environment')) {
        setFacingMode('environment');
      }
    }

    setSelectedCameraId(camId);
    try {
      localStorage.setItem('da_preferred_camera', camId);
    } catch {}
    setScannerKey(k => k + 1);
  }, [cameras]);

  return {
    cameras,
    selectedCameraId,
    setSelectedCameraId: handleSelectCamera,
    isScannerReady,
    resumeScanning,
    resetScannerState,
    toggleCamera,
    facingMode,
    stopScannerSafely: () => stopScannerSafely(html5QrcodeRef.current, elementId)
  };
}
