import {
  bufferToBase64URL,
  base64URLToBuffer,
  isWebAuthnSupported,
  detectDeviceType
} from './webauthnUtil';

describe('webauthnUtil', () => {
  describe('bufferToBase64URL and base64URLToBuffer', () => {
    it('should return empty string / empty buffer for falsy values', () => {
      expect(bufferToBase64URL(null)).toBe('');
      expect(bufferToBase64URL(undefined)).toBe('');
      expect(base64URLToBuffer(null)).toEqual(new Uint8Array(0));
      expect(base64URLToBuffer('')).toEqual(new Uint8Array(0));
    });

    it('should correctly round-trip binary data to Base64URL and back', () => {
      const originalBytes = new Uint8Array([72, 101, 108, 108, 111, 32, 87, 101, 98, 65, 117, 116, 104, 110]); // "Hello WebAuthn"

      const base64URL = bufferToBase64URL(originalBytes);
      expect(base64URL).not.toContain('+');
      expect(base64URL).not.toContain('/');
      expect(base64URL).not.toContain('=');

      const recoveredBuffer = base64URLToBuffer(base64URL);
      expect(recoveredBuffer).toEqual(originalBytes);
    });
  });

  describe('isWebAuthnSupported', () => {
    it('should return boolean depending on window.PublicKeyCredential availability', () => {
      const supported = isWebAuthnSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('detectDeviceType', () => {
    it('should detect device type string', () => {
      const deviceType = detectDeviceType();
      expect(typeof deviceType).toBe('string');
      expect(deviceType.length).toBeGreaterThan(0);
    });
  });
});
