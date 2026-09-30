import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Helper function to calculate duration between two dates in minutes.
 * @param {string|Date} checkIn - The check-in date
 * @param {string|Date} checkOut - The check-out date
 * @returns {string} Duration formatted as 'X min'
 */
export function calculateDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "-";
  const start = dayjs.utc(checkIn).local();
  const end = dayjs.utc(checkOut).local();
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
  return dayjs.utc(date).local().format('YYYY-MM-DD HH:mm:ss');
}

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
