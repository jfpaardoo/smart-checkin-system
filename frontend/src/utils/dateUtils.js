import moment from 'moment';

/**
 * Helper function to calculate duration between two dates in minutes.
 * @param {string|Date} checkIn - The check-in date
 * @param {string|Date} checkOut - The check-out date
 * @returns {string} Duration formatted as 'X min'
 */
export function calculateDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "-";
  const start = moment.utc(checkIn).local();
  const end = moment.utc(checkOut).local();
  const diffMs = end.diff(start);
  if (diffMs <= 0) return "0 min";
  const mins = Math.floor(diffMs / 60000);
  return `${mins} min`;
}

/**
 * Format a date string or Date object to local string.
 * @param {string|Date} date - The date to format
 * @returns {string} Localized date string
 */
export function formatDate(date) {
  if (!date) return "-";
  return moment.utc(date).local().format('YYYY-MM-DD HH:mm:ss');
}
