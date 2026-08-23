/**
 * Offline check-in queue management using browser IndexedDB.
 * Enables seamless PWA operation in low/no connectivity environments (warehouses, logistics hubs).
 */

const DB_NAME = 'SmartCheckinOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_checkins';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineCheckin(checkinPayload) {
  try {
    const db = await openDB();
    if (!db) return false;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry = {
        ...checkinPayload,
        queuedAt: new Date().toISOString()
      };
      const req = store.add(entry);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save checkin to offline queue:', err);
    return false;
  }
}

export async function getPendingCheckins() {
  try {
    const db = await openDB();
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to read offline checkins:', err);
    return [];
  }
}

export async function removePendingCheckin(id) {
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete offline checkin:', err);
  }
}

let isSyncing = false;

function handleSyncError(postErr, toast, t) {
  const status = postErr?.response?.status;
  if (status !== 400 && status !== 409) return;

  const defaultMsg = t ? t('checkin.invalidOrExpiredQr', 'Código QR no válido o expirado') : 'Código QR no válido o expirado';
  const serverMsg = postErr.response?.data?.message || 
    (typeof postErr.response?.data === 'string' ? postErr.response.data : defaultMsg);
  
  if (toast) {
    const errorTemplate = t 
      ? t('checkin.offlineSyncRejected', 'Sincronización: Fichaje rechazado por el servidor ({{msg}})', { msg: serverMsg })
      : `Sincronización: Fichaje rechazado por el servidor (${serverMsg})`;
    toast.error(errorTemplate);
  }
}

async function syncSingleCheckin(api, item, toast, t) {
  const { id, queuedAt, ...payload } = item;
  try {
    const res = await api.post('/checkins/qr-fichaje', payload);
    if (res.status === 200 || res.status === 201) {
      await removePendingCheckin(id);
      return true;
    }
  } catch (postErr) {
    const status = postErr?.response?.status;
    if (status === 400 || status === 409) {
      await removePendingCheckin(id);
      handleSyncError(postErr, toast, t);
    }
  }
  return false;
}

function notifySyncResult(syncedCount, toast, t) {
  if (syncedCount > 0 && toast) {
    const msg = t 
      ? t('checkin.offlineSynced', `Se han sincronizado ${syncedCount} fichajes pendientes`) 
      : `Se han sincronizado ${syncedCount} fichajes pendientes`;
    toast.success(msg);
  }
}

export async function syncOfflineCheckins(api, toast, t) {
  if (isSyncing || typeof navigator === 'undefined' || !navigator.onLine) {
    return;
  }

  isSyncing = true;
  try {
    const pending = await getPendingCheckins();
    if (!pending || pending.length === 0) return;

    let syncedCount = 0;
    for (const item of pending) {
      const isSuccess = await syncSingleCheckin(api, item, toast, t);
      if (isSuccess) syncedCount++;
    }

    notifySyncResult(syncedCount, toast, t);
  } finally {
    isSyncing = false;
  }
}

/**
 * Initialize automated background sync when online
 */
export function initOfflineSync(api, toast, t) {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    syncOfflineCheckins(api, toast, t);
  };

  window.addEventListener('online', handleOnline);
  // Also attempt sync on initial load if online
  if (navigator.onLine) {
    setTimeout(() => syncOfflineCheckins(api, toast, t), 2000);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
