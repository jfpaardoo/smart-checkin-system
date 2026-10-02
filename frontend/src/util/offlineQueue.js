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
        // Generate a stable UUID at queue time for server-side idempotency on retry
        offlineEventId: checkinPayload.offlineEventId || crypto.randomUUID(),
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

async function syncBatchCheckins(api, pending, toast, t) {
  const batchRequests = pending.map(item => {
    let offlineTimestamp = null;
    if (item.queuedAt) {
      // Remove timezone suffix if present for Java LocalDateTime parsing compatibility
      offlineTimestamp = item.queuedAt.split('.')[0];
    } else {
      offlineTimestamp = new Date().toISOString().split('.')[0];
    }

    // Ensure each item has a stable offlineEventId for server-side idempotency.
    // We store it in IndexedDB when first queuing so retries send the same UUID.
    const offlineEventId = item.offlineEventId || crypto.randomUUID();

    return {
      userLat: item.userLat != null ? item.userLat : 0.0,
      userLng: item.userLng != null ? item.userLng : 0.0,
      signature: item.signature || null,
      offlineTimestamp,
      qrHash: item.token || item.qrHash || '',
      offlineEventId,
      // checkInType is intentionally omitted — the server derives it from user state
    };
  });

  try {
    const res = await api.post('/checkins/offline-batch', batchRequests);
    if (res.status === 200 || res.status === 201) {
      await Promise.all(pending.map(item => removePendingCheckin(item.id)));
      return pending.length;
    }
  } catch (batchErr) {
    const status = batchErr?.response?.status;
    if (status === 400 || status === 409) {
      // Validation rejected: fall back to single item sync to isolate invalid items
      handleSyncError(batchErr, toast, t);
    } else {
      console.warn('[OfflineQueue] Batch sync failed, falling back to sequential sync:', batchErr);
    }
  }
  return null;
}

export async function syncOfflineCheckins(api, toast, t) {
  if (isSyncing || typeof navigator === 'undefined' || !navigator.onLine) {
    return;
  }

  isSyncing = true;
  try {
    const pending = await getPendingCheckins();
    if (!pending || pending.length === 0) return;

    // Attempt atomic batch sync first
    const batchSynced = await syncBatchCheckins(api, pending, toast, t);
    if (batchSynced !== null) {
      notifySyncResult(batchSynced, toast, t);
      return;
    }

    // Fallback: sequential sync for remaining/individual items
    const remainingPending = await getPendingCheckins();
    const syncedCount = await remainingPending.reduce(async (prevPromise, item) => {
      const count = await prevPromise;
      const isSuccess = await syncSingleCheckin(api, item, toast, t);
      return isSuccess ? count + 1 : count;
    }, Promise.resolve(0));

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
    void syncOfflineCheckins(api, toast, t).catch(err => {
      console.error('[OfflineQueue] Sync failed:', err);
    });
  };

  window.addEventListener('online', handleOnline);
  // Also attempt sync on initial load if online
  if (navigator.onLine) {
    setTimeout(() => {
      void syncOfflineCheckins(api, toast, t).catch(err => {
        console.error('[OfflineQueue] Sync failed:', err);
      });
    }, 2000);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
