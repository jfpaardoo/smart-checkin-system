import api from '../services/api';

/**
 * Convierte un ArrayBuffer o Uint8Array a cadena Base64URL
 */
export function bufferToBase64URL(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCodePoint(bytes[i]);
  }
  return btoa(str)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/={1,2}$/, '');
}

/**
 * Convierte una cadena Base64URL a Uint8Array
 */
export function base64URLToBuffer(base64URL) {
  if (!base64URL) return new Uint8Array(0);
  let base64 = base64URL.replaceAll('-', '+').replaceAll('_', '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.codePointAt(i);
  }
  return bytes;
}

/**
 * Comprueba si el navegador actual soporta WebAuthn / Passkeys
 */
export function isWebAuthnSupported() {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * Detecta de forma amigable el tipo de dispositivo/sistema operativo
 */
export function detectDeviceType() {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows Hello';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'Apple Face ID / Touch ID';
  if (/Macintosh/i.test(ua)) return 'Apple Touch ID';
  if (/Android/i.test(ua)) return 'Android Biometrics';
  if (/Linux/i.test(ua)) return 'Linux Security Key';
  return 'Llave de Acceso FIDO2';
}

/**
 * Inicia el proceso de registro de una nueva Passkey vinculada a la cuenta
 */
export async function registerPasskey(nickname) {
  if (!isWebAuthnSupported()) {
    throw new Error('Tu navegador no soporta el estándar WebAuthn / Passkeys.');
  }

  // 1. Obtener opciones de desafío desde el backend
  const optionsRes = await api.post('/auth/webauthn/register/options');
  const options = optionsRes.data;

  // 2. Resolver Relying Party ID válido para el origen actual
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const rpId = (options.rp?.id && options.rp.id !== 'localhost') ? options.rp.id : currentHostname;

  // 3. Transformar opciones a formato nativo binario
  const publicKeyCredentialCreationOptions = {
    challenge: base64URLToBuffer(options.challenge),
    rp: {
      name: options.rp?.name || 'Distribution Academy',
      id: rpId,
    },
    user: {
      id: base64URLToBuffer(options.user.id),
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams || [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
      { type: 'public-key', alg: -8 },
    ],
    authenticatorSelection: {
      residentKey: options.authenticatorSelection?.residentKey || 'preferred',
      userVerification: options.authenticatorSelection?.userVerification || 'preferred',
      requireResidentKey: Boolean(options.authenticatorSelection?.requireResidentKey),
    },
    timeout: options.timeout || 60000,
    attestation: options.attestation || 'none',
    excludeCredentials: (options.excludeCredentials || []).map((cred) => ({
      type: cred.type,
      id: base64URLToBuffer(cred.id),
    })),
  };

  // 4. Invocar al autenticador nativo del dispositivo (TouchID/FaceID/Windows Hello)
  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  });

  if (!credential) {
    throw new Error('No se generó ninguna credencial en el dispositivo.');
  }

  const rawPublicKey = credential.response.getPublicKey
    ? bufferToBase64URL(credential.response.getPublicKey())
    : '';

  // 5. Preparar payload para verificación
  const payload = {
    id: credential.id,
    rawId: bufferToBase64URL(credential.rawId),
    type: credential.type,
    nickname: nickname || `Llave (${detectDeviceType()})`,
    deviceType: detectDeviceType(),
    response: {
      clientDataJSON: bufferToBase64URL(credential.response.clientDataJSON),
      attestationObject: bufferToBase64URL(credential.response.attestationObject),
      publicKey: rawPublicKey,
    },
  };

  // 6. Enviar al backend para validación y persistencia
  const verifyRes = await api.post('/auth/webauthn/register/verify', payload);
  return verifyRes.data;
}

/**
 * Inicia el proceso de autenticación con Passkey (Passwordless Login)
 */
export async function loginWithPasskey(usernameOrNull) {
  if (!isWebAuthnSupported()) {
    throw new Error('Tu navegador no soporta el estándar WebAuthn / Passkeys.');
  }

  // 1. Obtener opciones de desafío para login
  const optionsRes = await api.post('/auth/webauthn/login/options', {
    username: usernameOrNull || '',
  });
  const options = optionsRes.data;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const rpId = (options.rpId && options.rpId !== 'localhost') ? options.rpId : currentHostname;

  // 2. Transformar opciones a formato nativo binario
  const publicKeyCredentialRequestOptions = {
    challenge: base64URLToBuffer(options.challenge),
    timeout: options.timeout || 60000,
    rpId: rpId,
    userVerification: options.userVerification || 'preferred',
    allowCredentials: (options.allowCredentials || []).map((cred) => ({
      type: cred.type,
      id: base64URLToBuffer(cred.id),
    })),
  };

  // 3. Invocar al autenticador del dispositivo
  const assertion = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  });

  if (!assertion) {
    throw new Error('No se completó la verificación biométrica.');
  }

  // 4. Preparar payload de aserción
  const payload = {
    id: assertion.id,
    rawId: bufferToBase64URL(assertion.rawId),
    type: assertion.type,
    response: {
      clientDataJSON: bufferToBase64URL(assertion.response.clientDataJSON),
      authenticatorData: bufferToBase64URL(assertion.response.authenticatorData),
      signature: bufferToBase64URL(assertion.response.signature),
      userHandle: assertion.response.userHandle
        ? bufferToBase64URL(assertion.response.userHandle)
        : '',
    },
  };

  // 5. Validar con el backend y recibir token JWT
  const verifyRes = await api.post('/auth/webauthn/login/verify', payload);
  return verifyRes.data;
}
