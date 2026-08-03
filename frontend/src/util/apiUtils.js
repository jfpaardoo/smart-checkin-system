/**
 * Parses Spring Boot validation error messages that come in the format "{field1=error1, field2=error2}"
 * or handles specific database constraints like duplicate keys.
 * 
 * @param {string} errorMsg The raw error message from the backend
 * @param {function} t The translation function (react-i18next)
 * @param {object} customTranslations Optional map for custom field translations
 * @returns {string} Formatted, human-readable error message
 */
export const parseApiError = (errorMsg, t, customTranslations = {}) => {
  if (!errorMsg) return t('common.unknownError', 'Ocurrió un error desconocido.');

  if (errorMsg.startsWith("{") && errorMsg.endsWith("}")) {
    return errorMsg
      .slice(1, -1)
      .split(",")
      .map(err => {
        const [field, msg] = err.split("=");
        if (!field || !msg) return err;
        
        const cleanField = field.trim();
        // Use custom translation if provided, else try generic fallback
        const translatedField = customTranslations[cleanField] || cleanField;
        
        return `${translatedField}: ${msg.trim()}`;
      })
      .join("\n");
  }

  // Common Database Constraints
  if (errorMsg.includes("duplicate key value")) {
    if (errorMsg.includes("personal_code") || errorMsg.includes("personalCode")) {
      return t('users.duplicatePersonalCode', 'El código personal ya está en uso.');
    } else if (errorMsg.includes("username")) {
      return t('users.duplicateUsername', 'El nombre de usuario ya está en uso.');
    }
    return t('common.duplicateConflict', 'Error de conflicto: El registro ya existe.');
  }

  return errorMsg;
};
