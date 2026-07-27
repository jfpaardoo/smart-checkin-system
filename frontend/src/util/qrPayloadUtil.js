/**
 * Utility helper to parse and validate QR code payloads and TOTP manual inputs.
 * Supports raw 6-digit TOTP tokens, JSON payload objects, and dynamic formation binding.
 *
 * @param {string|object} rawInput - Raw QR string, JSON, or numeric token input
 * @param {Array} activeFormations - List of available active formations for fallback binding
 * @returns {object} { token, action, formationId }
 */
export function parseQrPayload(rawInput, activeFormations = []) {
  let token = rawInput;
  let action = null;
  let formationId = null;

  if (typeof rawInput === 'object' && rawInput !== null) {
    token = rawInput.token ?? '';
    action = rawInput.action ?? null;
    formationId = rawInput.formationId ?? null;
  } else if (typeof rawInput === 'string' && rawInput.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawInput);
      if (typeof parsed === 'object' && parsed !== null) {
        token = parsed.token ?? token;
        action = parsed.action ?? action;
        formationId = parsed.formationId ?? formationId;
      }
    } catch (err) {
      console.debug('Failed to parse JSON QR payload:', err);
    }
  }

  if (!action && !formationId && Array.isArray(activeFormations) && activeFormations.length > 0) {
    action = 'formation';
    formationId = activeFormations[0].id;
  }

  const cleanToken = typeof token === 'string' || typeof token === 'number' ? String(token).trim() : '';

  return {
    token: cleanToken,
    action: action || 'checkin',
    formationId: formationId || null
  };
}

export default parseQrPayload;
