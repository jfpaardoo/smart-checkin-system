import moment from 'moment';

/**
 * Formats duration given in total minutes to a localized human-readable string (e.g., '2h 15min' or '45 min').
 *
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}min`;
  }
  if (hrs > 0) {
    return `${hrs}h`;
  }
  return `${mins} min`;
}

/**
 * Formats a Date object or ISO timestamp to localized date & time.
 *
 * @param {string|Date} dateInput - ISO string or Date instance
 * @param {string} formatPattern - Moment format pattern (default: 'DD/MM/YYYY HH:mm')
 * @returns {string} Formatted date string
 */
export function formatDateTime(dateInput, formatPattern = 'DD/MM/YYYY HH:mm') {
  if (!dateInput) return '-';
  return moment(dateInput).format(formatPattern);
}

/**
 * Returns formatted relative time from now (e.g. 'hace 5 minutos').
 *
 * @param {string|Date} dateInput
 * @returns {string} Relative time string
 */
export function formatFromNow(dateInput) {
  if (!dateInput) return '-';
  return moment(dateInput).fromNow();
}
