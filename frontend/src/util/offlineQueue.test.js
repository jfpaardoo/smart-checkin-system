import {
  saveOfflineCheckin,
  getPendingCheckins,
  removePendingCheckin,
  syncOfflineCheckins,
  formatLocalISO
} from './offlineQueue';

describe('offlineQueue utility', () => {
  let mockStore = [];
  let nextId = 1;

  beforeEach(() => {
    mockStore = [];
    nextId = 1;

    // In-memory IndexedDB mock
    const mockDb = {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn((entry) => {
            const item = { ...entry, id: nextId++ };
            mockStore.push(item);
            const req = {};
            setTimeout(() => req.onsuccess && req.onsuccess({ target: { result: item.id } }), 0);
            return req;
          }),
          getAll: vi.fn(() => {
            const req = { result: [...mockStore] };
            setTimeout(() => req.onsuccess && req.onsuccess({ target: { result: req.result } }), 0);
            return req;
          }),
          delete: vi.fn((id) => {
            mockStore = mockStore.filter((item) => item.id !== id);
            const req = {};
            setTimeout(() => req.onsuccess && req.onsuccess({ target: { result: undefined } }), 0);
            return req;
          })
        }))
      }))
    };

    window.indexedDB = {
      open: vi.fn(() => {
        const req = { result: mockDb };
        setTimeout(() => req.onsuccess && req.onsuccess({ target: { result: mockDb } }), 0);
        return req;
      })
    };

    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('formatLocalISO', () => {
    it('formats a date to YYYY-MM-DDTHH:mm:ss without timezone shift', () => {
      const date = new Date(2026, 10, 8, 15, 30, 45); // Month is 0-indexed (10 = Nov)
      const formatted = formatLocalISO(date);
      expect(formatted).toBe('2026-11-08T15:30:45');
    });

    it('pads single-digit months, days, hours, minutes, and seconds with zero', () => {
      const date = new Date(2026, 0, 5, 8, 9, 3); // Jan 5, 2026, 08:09:03
      const formatted = formatLocalISO(date);
      expect(formatted).toBe('2026-01-05T08:09:03');
    });

    it('handles invalid dates gracefully without throwing', () => {
      const invalid = formatLocalISO('invalid-date-string');
      expect(typeof invalid).toBe('string');
      expect(invalid).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('saveOfflineCheckin and getPendingCheckins', () => {
    it('saves check-in with generated offlineEventId and queuedAt', async () => {
      const payload = { token: 'qr-token-123', userLat: 40.4168, userLng: -3.7038 };
      const saved = await saveOfflineCheckin(payload);

      expect(saved).toBe(true);
      const pending = await getPendingCheckins();
      expect(pending).toHaveLength(1);
      expect(pending[0].token).toBe('qr-token-123');
      expect(pending[0].offlineEventId).toBeDefined();
      expect(pending[0].queuedAt).toBeDefined();
    });

    it('preserves existing offlineEventId when provided', async () => {
      const payload = {
        token: 'qr-token-456',
        offlineEventId: 'custom-uuid-999'
      };
      await saveOfflineCheckin(payload);

      const pending = await getPendingCheckins();
      expect(pending[0].offlineEventId).toBe('custom-uuid-999');
    });

    it('removes pending check-in by id', async () => {
      await saveOfflineCheckin({ token: 'first' });
      await saveOfflineCheckin({ token: 'second' });

      let pending = await getPendingCheckins();
      expect(pending).toHaveLength(2);

      await removePendingCheckin(pending[0].id);

      pending = await getPendingCheckins();
      expect(pending).toHaveLength(1);
      expect(pending[0].token).toBe('second');
    });
  });

  describe('syncOfflineCheckins', () => {
    it('skips sync when device is offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      const api = { post: vi.fn() };
      const toast = { success: vi.fn(), error: vi.fn() };

      await syncOfflineCheckins(api, toast);
      expect(api.post).not.toHaveBeenCalled();
    });

    it('synchronizes batch successfully and clears pending items', async () => {
      await saveOfflineCheckin({ token: 'batch-token-1', userLat: 40.0, userLng: -3.0 });
      await saveOfflineCheckin({ token: 'batch-token-2', userLat: 40.0, userLng: -3.0 });

      const api = {
        post: vi.fn().mockResolvedValue({ status: 200, data: { count: 2 } })
      };
      const toast = { success: vi.fn(), error: vi.fn() };

      await syncOfflineCheckins(api, toast);

      expect(api.post).toHaveBeenCalledWith(
        '/checkins/offline-batch',
        expect.arrayContaining([
          expect.objectContaining({ qrHash: 'batch-token-1' }),
          expect.objectContaining({ qrHash: 'batch-token-2' })
        ])
      );

      const remaining = await getPendingCheckins();
      expect(remaining).toHaveLength(0);
      expect(toast.success).toHaveBeenCalled();
    });

    it('falls back to single sync when batch returns error 400', async () => {
      await saveOfflineCheckin({ token: 'invalid-token' });

      const api = {
        post: vi
          .fn()
          .mockRejectedValueOnce({
            response: { status: 400, data: { message: 'Token expired' } }
          })
          .mockRejectedValueOnce({
            response: { status: 400, data: { message: 'Token expired' } }
          })
      };
      const toast = { success: vi.fn(), error: vi.fn() };

      await syncOfflineCheckins(api, toast);

      expect(api.post).toHaveBeenCalledWith('/checkins/offline-batch', expect.any(Array));
      expect(api.post).toHaveBeenCalledWith('/checkins/qr-fichaje', expect.any(Object));
      expect(toast.error).toHaveBeenCalled();
    });
  });
});

